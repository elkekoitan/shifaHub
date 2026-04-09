import type { FastifyInstance } from "fastify";
import { eq, and, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { randevu } from "../db/schema/randevu.js";
import { musaitlik } from "../db/schema/musaitlik.js";
import { requireAuth, getUser } from "../middleware/auth.js";
import { createAuditLog } from "../middleware/audit.js";
import {
  createAppointment,
  updateAppointmentStatus,
  listAppointments,
} from "../services/appointment.service.js";

const createAppointmentSchema = z.object({
  egitmenId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  duration: z.number().min(15).max(180).default(60),
  treatmentType: z.string().optional(),
  complaints: z.string().optional(),
  notes: z.string().optional(),
  // Admin araciligiyla olusturma
  danisanId: z.string().uuid().optional(),
});

export async function randevuRoutes(app: FastifyInstance) {
  // ─── POST /api/randevu — Yeni randevu olustur ────────────────────────────

  app.post("/api/randevu", { preHandler: requireAuth() }, async (request, reply) => {
    const { sub, role } = getUser(request);
    const body = createAppointmentSchema.parse(request.body);

    const danisanId = role === "danisan" ? sub : (body.danisanId ?? sub);

    const created = await createAppointment({
      danisanId,
      egitmenId: body.egitmenId,
      scheduledAt: new Date(body.scheduledAt),
      duration: body.duration,
      treatmentType: body.treatmentType,
      complaints: body.complaints,
      notes: body.notes,
    });

    await createAuditLog({
      userId: sub,
      action: "create",
      tableName: "randevu",
      recordId: created.id,
      description: `Yeni randevu: ${body.scheduledAt}`,
      request,
    });

    return reply.status(201).send({ success: true, data: created });
  });

  // ─── GET /api/randevu — Randevulari listele ──────────────────────────────

  app.get("/api/randevu", { preHandler: requireAuth() }, async (request, reply) => {
    const { sub, role } = getUser(request);
    const query = request.query as { status?: string; from?: string; to?: string; limit?: string };

    const appointments = await listAppointments({
      userId: sub,
      role,
      status: query.status,
      from: query.from,
      to: query.to,
      limit: query.limit ? parseInt(query.limit, 10) : 100,
    });

    return reply.send({ success: true, data: appointments });
  });

  // ─── PATCH /api/randevu/:id/status — Durum guncelle ─────────────────────

  app.patch("/api/randevu/:id/status", { preHandler: requireAuth() }, async (request, reply) => {
    const { sub, role } = getUser(request);
    const { id } = request.params as { id: string };
    const { status, cancelReason } = request.body as { status: string; cancelReason?: string };

    const { updated, cancelWarning } = await updateAppointmentStatus({
      randevuId: id,
      newStatus: status,
      cancelReason,
      actorId: sub,
      actorRole: role,
    });

    await createAuditLog({
      userId: sub,
      action: "update",
      tableName: "randevu",
      recordId: id,
      description: `Randevu durumu: -> ${status}${cancelWarning ? " (gec iptal)" : ""}`,
      request,
    });

    return reply.send({ success: true, data: updated, warning: cancelWarning });
  });

  // ─── GET /api/randevu/:id — Tekil randevu detay ──────────────────────────

  app.get("/api/randevu/:id", { preHandler: requireAuth() }, async (request, reply) => {
    const { sub, role } = getUser(request);
    const { id } = request.params as { id: string };

    const [item] = await db.select().from(randevu).where(eq(randevu.id, id)).limit(1);

    if (!item) {
      return reply.status(404).send({ success: false, error: "Randevu bulunamadi" });
    }

    // Yetki: admin hepini gorebilir
    if (role === "danisan" && item.danisanId !== sub) {
      return reply.status(403).send({ success: false, error: "Yetkisiz erisim" });
    }
    if (role === "egitmen" && item.egitmenId !== sub) {
      return reply.status(403).send({ success: false, error: "Yetkisiz erisim" });
    }

    return reply.send({ success: true, data: item });
  });

  // ─── GET /api/randevu/musaitlik/:egitmenId — Musaitlik ───────────────────

  app.get("/api/randevu/musaitlik/:egitmenId", async (request, reply) => {
    const { egitmenId } = request.params as { egitmenId: string };

    const slots = await db
      .select()
      .from(musaitlik)
      .where(and(eq(musaitlik.egitmenId, egitmenId), eq(musaitlik.isActive, true)));

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
        start: a.scheduledAt!.toISOString(),
        end: a.endAt
          ? a.endAt.toISOString()
          : new Date(a.scheduledAt!.getTime() + (a.duration || 60) * 60000).toISOString(),
      }));

    return reply.send({ success: true, data: { slots, busySlots } });
  });
}
