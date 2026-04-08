import type { FastifyInstance } from "fastify";
import { eq, and, gte, lte, desc, inArray, lt, gt } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { randevu } from "../db/schema/randevu.js";
import { users } from "../db/schema/users.js";
import { musaitlik } from "../db/schema/musaitlik.js";
import { bildirim } from "../db/schema/bildirim.js";
import { requireAuth, getUser } from "../middleware/auth.js";
import { createAuditLog } from "../middleware/audit.js";

const createAppointmentSchema = z.object({
  egitmenId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  duration: z.number().min(15).max(180).default(60),
  treatmentType: z.string().optional(),
  complaints: z.string().optional(),
  notes: z.string().optional(),
});

// Valid state transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  requested: ["confirmed", "cancelled"],
  confirmed: ["reminded", "arrived", "cancelled", "ertelendi"],
  reminded: ["arrived", "cancelled", "no_show", "ertelendi"],
  arrived: ["treated"],
  treated: ["completed"],
  completed: [],
  cancelled: [],
  no_show: [],
  ertelendi: ["confirmed", "cancelled"],
};

// Durum degisikligi bildirim mesajlari
const STATUS_NOTIFICATIONS: Record<string, { title: string; body: string; type: string }> = {
  confirmed: {
    title: "Randevunuz Onaylandi",
    body: "Randevunuz egitmen tarafindan onaylandi.",
    type: "randevu_onay",
  },
  cancelled: {
    title: "Randevunuz Iptal Edildi",
    body: "Randevunuz iptal edildi.",
    type: "randevu_iptal",
  },
  reminded: {
    title: "Randevu Hatirlatmasi",
    body: "Yaklasan randevunuz var.",
    type: "randevu_hatirlatma",
  },
  arrived: {
    title: "Randevu: Geldiniz",
    body: "Randevunuz icin kaydiniz alindi.",
    type: "randevu_onay",
  },
  treated: {
    title: "Tedavi Tamamlandi",
    body: "Tedaviniz basariyla tamamlandi.",
    type: "tedavi_ozeti",
  },
  completed: { title: "Randevu Tamamlandi", body: "Randevunuz tamamlandi.", type: "randevu_onay" },
  no_show: {
    title: "Randevu: Katilim Yok",
    body: "Randevunuza katilmadiniz.",
    type: "randevu_iptal",
  },
  ertelendi: { title: "Randevunuz Ertelendi", body: "Randevunuz ertelendi.", type: "randevu_onay" },
};

export async function randevuRoutes(app: FastifyInstance) {
  // POST /api/randevu - Yeni randevu olustur
  app.post("/api/randevu", { preHandler: requireAuth() }, async (request, reply) => {
    const { sub, role } = getUser(request);
    const body = createAppointmentSchema.parse(request.body);

    const scheduledDate = new Date(body.scheduledAt);
    const endDate = new Date(scheduledDate.getTime() + body.duration * 60 * 1000);

    // Gecmis tarih kontrolu
    if (scheduledDate <= new Date()) {
      return reply
        .status(400)
        .send({ success: false, error: "Gecmis bir tarihe randevu olusturulamaz" });
    }

    // Catisma kontrolu (dogru overlap algilama)
    // Mevcut randevu cakisiyor: mevcutBaslangic < yeniBitis VE mevcutBitis > yeniBaslangic
    const conflicts = await db
      .select()
      .from(randevu)
      .where(
        and(
          eq(randevu.egitmenId, body.egitmenId),
          lt(randevu.scheduledAt, endDate),
          gt(randevu.endAt, scheduledDate),
        ),
      );

    const activeConflicts = conflicts.filter((c) => !["cancelled", "no_show"].includes(c.status));

    if (activeConflicts.length > 0) {
      return reply.status(409).send({
        success: false,
        error: "Bu zaman diliminde zaten bir randevu var",
      });
    }

    const [created] = await db
      .insert(randevu)
      .values({
        danisanId: role === "danisan" ? sub : (request.body as any).danisanId || sub,
        egitmenId: body.egitmenId,
        scheduledAt: scheduledDate,
        duration: body.duration,
        endAt: endDate,
        treatmentType: body.treatmentType,
        complaints: body.complaints,
        notes: body.notes,
        status: "requested",
      })
      .returning();

    if (!created) {
      return reply.status(500).send({ success: false, error: "Randevu olusturulamadi" });
    }

    await createAuditLog({
      userId: sub,
      action: "create",
      tableName: "randevu",
      recordId: created.id,
      description: `Yeni randevu: ${scheduledDate.toISOString()}`,
      request,
    });

    // Bildirimler
    await db.insert(bildirim).values({
      userId: body.egitmenId,
      type: "randevu_onay",
      title: "Yeni Randevu Talebi",
      body: `${scheduledDate.toLocaleDateString("tr-TR")} tarihinde yeni randevu talebi var.`,
      actionUrl: "/egitmen/randevu",
    });
    await db.insert(bildirim).values({
      userId: role === "danisan" ? sub : (body as any).danisanId || sub,
      type: "randevu_onay",
      title: "Randevu Talebiniz Olusturuldu",
      body: `${scheduledDate.toLocaleDateString("tr-TR")} tarihli randevu talebiniz alindi.`,
      actionUrl: "/danisan/randevu",
    });

    return reply.status(201).send({ success: true, data: created });
  });

  // GET /api/randevu - Randevulari listele
  app.get("/api/randevu", { preHandler: requireAuth() }, async (request, reply) => {
    const { sub, role } = getUser(request);
    const query = request.query as { from?: string; to?: string; status?: string };

    const conditions = [];

    if (role === "danisan") {
      conditions.push(eq(randevu.danisanId, sub));
    } else if (role === "egitmen") {
      conditions.push(eq(randevu.egitmenId, sub));
    }

    if (query.status) {
      conditions.push(eq(randevu.status, query.status as any));
    }

    const results = await db
      .select()
      .from(randevu)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(randevu.scheduledAt))
      .limit(100);

    // Danisan ve egitmen adlarini ekle
    const userIds = [...new Set(results.flatMap((r) => [r.danisanId, r.egitmenId]))];
    const userMap = new Map<string, { firstName: string; lastName: string }>();
    if (userIds.length > 0) {
      const userRecords = await db
        .select({ id: users.id, firstName: users.firstName, lastName: users.lastName })
        .from(users)
        .where(inArray(users.id, userIds));
      for (const u of userRecords) {
        userMap.set(u.id, { firstName: u.firstName, lastName: u.lastName });
      }
    }

    const enriched = results.map((r) => ({
      ...r,
      danisanFirstName: userMap.get(r.danisanId)?.firstName ?? "",
      danisanLastName: userMap.get(r.danisanId)?.lastName ?? "",
      egitmenFirstName: userMap.get(r.egitmenId)?.firstName ?? "",
      egitmenLastName: userMap.get(r.egitmenId)?.lastName ?? "",
    }));

    return reply.send({ success: true, data: enriched });
  });

  // PATCH /api/randevu/:id/status - Randevu durumunu guncelle
  app.patch("/api/randevu/:id/status", { preHandler: requireAuth() }, async (request, reply) => {
    const { sub, role } = getUser(request);
    const { id } = request.params as { id: string };
    const { status, cancelReason } = request.body as { status: string; cancelReason?: string };

    const [existing] = await db.select().from(randevu).where(eq(randevu.id, id)).limit(1);

    if (!existing) {
      return reply.status(404).send({ success: false, error: "Randevu bulunamadi" });
    }

    // Yetki kontrolu: sadece ilgili danisan, egitmen veya admin degistirebilir
    if (role === "danisan" && existing.danisanId !== sub) {
      return reply
        .status(403)
        .send({ success: false, error: "Bu randevuyu degistirme yetkiniz yok" });
    }
    if (role === "egitmen" && existing.egitmenId !== sub) {
      return reply
        .status(403)
        .send({ success: false, error: "Bu randevuyu degistirme yetkiniz yok" });
    }

    // Danisan sadece iptal edebilir
    if (role === "danisan" && status !== "cancelled") {
      return reply
        .status(403)
        .send({ success: false, error: "Danisan sadece randevu iptal edebilir" });
    }

    // State machine kontrolu
    const allowedTransitions = VALID_TRANSITIONS[existing.status] || [];
    if (!allowedTransitions.includes(status)) {
      return reply.status(400).send({
        success: false,
        error: `"${existing.status}" durumundan "${status}" durumuna gecilemez`,
      });
    }

    // Iptal politikasi: 24 saat icerideyse uyari
    let cancelWarning: string | undefined;
    if (status === "cancelled" && existing.scheduledAt) {
      const hoursUntil = (existing.scheduledAt.getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursUntil < 24 && hoursUntil > 0) {
        cancelWarning = "UYARI: Randevuya 24 saatten az kalmis. Geç iptal olarak kaydedildi.";
      }
    }

    const [updated] = await db
      .update(randevu)
      .set({
        status: status as any,
        statusChangedAt: new Date(),
        updatedAt: new Date(),
        ...(status === "cancelled" && {
          cancelledBy: sub,
          cancelReason: cancelReason || undefined,
        }),
      })
      .where(eq(randevu.id, id))
      .returning();

    // Durum degisikligi bildirimi gonder
    const notifConfig = STATUS_NOTIFICATIONS[status];
    if (notifConfig) {
      // Danisana bildirim
      await db.insert(bildirim).values({
        userId: existing.danisanId,
        type: notifConfig.type as any,
        title: notifConfig.title,
        body: notifConfig.body,
        actionUrl: "/danisan/randevu",
      });
      // Egitmene de bildirim (iptal/ertelendi ise)
      if (["cancelled", "ertelendi", "no_show"].includes(status)) {
        await db.insert(bildirim).values({
          userId: existing.egitmenId,
          type: notifConfig.type as any,
          title: notifConfig.title,
          body: notifConfig.body,
          actionUrl: "/egitmen/randevu",
        });
      }
    }

    await createAuditLog({
      userId: sub,
      action: "update",
      tableName: "randevu",
      recordId: id,
      description: `Randevu durumu: ${existing.status} -> ${status}${cancelWarning ? " (gec iptal)" : ""}`,
      request,
    });

    return reply.send({ success: true, data: updated, warning: cancelWarning });
  });

  // GET /api/randevu/musaitlik/:egitmenId - Egitmen musaitlik bilgisi
  app.get("/api/randevu/musaitlik/:egitmenId", async (request, reply) => {
    const { egitmenId } = request.params as { egitmenId: string };

    const slots = await db
      .select()
      .from(musaitlik)
      .where(and(eq(musaitlik.egitmenId, egitmenId), eq(musaitlik.isActive, true)));

    // Mevcut randevulari da don (bos slot hesabi icin frontend kullanir)
    const now = new Date();
    const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const existingAppointments = await db
      .select({
        scheduledAt: randevu.scheduledAt,
        endAt: randevu.endAt,
        duration: randevu.duration,
      })
      .from(randevu)
      .where(
        and(
          eq(randevu.egitmenId, egitmenId),
          gte(randevu.scheduledAt, now),
          lte(randevu.scheduledAt, twoWeeksLater),
        ),
      );

    const busySlots = existingAppointments
      .filter((a) => a.scheduledAt)
      .map((a) => ({
        start: a.scheduledAt.toISOString(),
        end: a.endAt
          ? a.endAt.toISOString()
          : new Date(a.scheduledAt.getTime() + (a.duration || 60) * 60000).toISOString(),
      }));

    return reply.send({ success: true, data: { slots, busySlots } });
  });
}
