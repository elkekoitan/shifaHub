import type { FastifyInstance } from "fastify";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { randevu } from "../db/schema/randevu.js";
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
  confirmed: ["reminded", "arrived", "cancelled"],
  reminded: ["arrived", "cancelled", "no_show"],
  arrived: ["treated"],
  treated: ["completed"],
  completed: [],
  cancelled: [],
  no_show: [],
};

export async function randevuRoutes(app: FastifyInstance) {
  // POST /api/randevu - Yeni randevu olustur
  app.post("/api/randevu", { preHandler: requireAuth() }, async (request, reply) => {
    const { sub, role } = getUser(request);
    const body = createAppointmentSchema.parse(request.body);

    // Catisma kontrolu
    const scheduledDate = new Date(body.scheduledAt);
    const endDate = new Date(scheduledDate.getTime() + body.duration * 60 * 1000);

    const conflicts = await db
      .select()
      .from(randevu)
      .where(
        and(
          eq(randevu.egitmenId, body.egitmenId),
          gte(randevu.scheduledAt, scheduledDate),
          lte(randevu.scheduledAt, endDate),
        ),
      );

    const activeConflicts = conflicts.filter(
      (c) => !["cancelled", "no_show"].includes(c.status),
    );

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
    // Egitmene bildirim
    await db.insert(bildirim).values({
      userId: body.egitmenId,
      type: "randevu_onay",
      title: "Yeni Randevu Talebi",
      body: `${scheduledDate.toLocaleDateString("tr-TR")} tarihinde yeni randevu talebi var.`,
      actionUrl: "/egitmen/randevu",
    });
    // Danisana bildirim
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

    let conditions = [];

    if (role === "danisan") {
      conditions.push(eq(randevu.danisanId, sub));
    } else if (role === "egitmen") {
      conditions.push(eq(randevu.egitmenId, sub));
    }
    // admin tum randevulari gorebilir

    if (query.status) {
      conditions.push(eq(randevu.status, query.status as any));
    }

    const results = await db
      .select()
      .from(randevu)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(randevu.scheduledAt))
      .limit(50);

    return reply.send({ success: true, data: results });
  });

  // PATCH /api/randevu/:id/status - Randevu durumunu guncelle
  app.patch(
    "/api/randevu/:id/status",
    { preHandler: requireAuth() },
    async (request, reply) => {
      const { sub } = getUser(request);
      const { id } = request.params as { id: string };
      const { status } = request.body as { status: string };

      const [existing] = await db.select().from(randevu).where(eq(randevu.id, id)).limit(1);

      if (!existing) {
        return reply.status(404).send({ success: false, error: "Randevu bulunamadi" });
      }

      // State machine kontrolu
      const allowedTransitions = VALID_TRANSITIONS[existing.status] || [];
      if (!allowedTransitions.includes(status)) {
        return reply.status(400).send({
          success: false,
          error: `"${existing.status}" durumundan "${status}" durumuna gecilemez`,
        });
      }

      const [updated] = await db
        .update(randevu)
        .set({
          status: status as any,
          statusChangedAt: new Date(),
          updatedAt: new Date(),
          ...(status === "cancelled" && { cancelledBy: sub }),
        })
        .where(eq(randevu.id, id))
        .returning();

      await createAuditLog({
        userId: sub,
        action: "update",
        tableName: "randevu",
        recordId: id,
        description: `Randevu durumu: ${existing.status} -> ${status}`,
        request,
      });

      return reply.send({ success: true, data: updated });
    },
  );

  // GET /api/randevu/musaitlik/:egitmenId - Egitmen musaitlik bilgisi
  app.get("/api/randevu/musaitlik/:egitmenId", async (request, reply) => {
    const { egitmenId } = request.params as { egitmenId: string };

    const slots = await db
      .select()
      .from(musaitlik)
      .where(and(eq(musaitlik.egitmenId, egitmenId), eq(musaitlik.isActive, true)));

    return reply.send({ success: true, data: slots });
  });
}
