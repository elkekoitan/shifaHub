import type { FastifyInstance } from "fastify";
import { eq, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { komplikasyon } from "../db/schema/komplikasyon.js";
import { bildirim } from "../db/schema/bildirim.js";
import { users } from "../db/schema/users.js";
import { requireRole, getUser } from "../middleware/auth.js";
import { createAuditLog } from "../middleware/audit.js";

export async function acilRoutes(app: FastifyInstance) {
  // POST /api/acil - Komplikasyon raporu
  app.post("/api/acil", { preHandler: requireRole("egitmen") }, async (request, reply) => {
    const { sub } = getUser(request);
    const body = request.body as typeof komplikasyon.$inferInsert;

    const [created] = await db
      .insert(komplikasyon)
      .values({ ...body, egitmenId: sub })
      .returning();

    if (!created) {
      return reply.status(500).send({ success: false, error: "Rapor olusturulamadi" });
    }

    // Severity bazli bildirim zinciri
    const severity = parseInt(created.severity);
    if (severity >= 3) {
      // Admin'lere bildirim gonder
      const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
      for (const admin of admins) {
        await db.insert(bildirim).values({
          userId: admin.id,
          type: "sistem",
          title: `Komplikasyon Raporu (Seviye ${severity})`,
          body: `Yuksek seviyeli komplikasyon rapor edildi: ${created.type || "Belirtilmemis"}`,
          actionUrl: "/admin/sistem",
        });
      }
      app.log.warn({ komplikasyonId: created.id, severity }, "Yuksek seviyeli komplikasyon!");
    }
    if (severity >= 4) {
      // Egitmene de uyari bildirimi
      await db.insert(bildirim).values({
        userId: sub,
        type: "sistem",
        title: `KRITIK: Komplikasyon Seviye ${severity}`,
        body: `Kritik seviyede komplikasyon kaydedildi. Sorumlu tabip bilgilendirildi.`,
      });
      app.log.error(
        { komplikasyonId: created.id, severity },
        "Kritik komplikasyon - admin bildirim!",
      );
    }

    await createAuditLog({
      userId: sub,
      action: "create",
      tableName: "komplikasyon",
      recordId: created.id,
      description: `Komplikasyon raporu: seviye ${severity}`,
      request,
    });

    return reply.status(201).send({ success: true, data: created });
  });

  // GET /api/acil - Komplikasyon listesi
  app.get(
    "/api/acil",
    { preHandler: requireRole("egitmen", "admin", "tabip") },
    async (request, reply) => {
      const { sub, role } = getUser(request);

      const conditions = role === "egitmen" ? eq(komplikasyon.egitmenId, sub) : undefined;

      const results = await db
        .select()
        .from(komplikasyon)
        .where(conditions)
        .orderBy(desc(komplikasyon.createdAt))
        .limit(50);

      return reply.send({ success: true, data: results });
    },
  );

  // PATCH /api/acil/:id/followup - Takip notu ekle
  app.patch(
    "/api/acil/:id/followup",
    { preHandler: requireRole("egitmen", "tabip") },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { period, note } = request.body as { period: "24h" | "48h" | "1w"; note: string };

      const updateField =
        period === "24h"
          ? { followUp24h: note }
          : period === "48h"
            ? { followUp48h: note }
            : { followUp1w: note };

      const [updated] = await db
        .update(komplikasyon)
        .set({ ...updateField, updatedAt: new Date() })
        .where(eq(komplikasyon.id, id))
        .returning();

      if (!updated) {
        return reply.status(404).send({ success: false, error: "Komplikasyon bulunamadi" });
      }

      return reply.send({ success: true, data: updated });
    },
  );

  // PATCH /api/acil/:id/resolve - Komplikasyonu coz
  app.patch(
    "/api/acil/:id/resolve",
    { preHandler: requireRole("egitmen", "tabip") },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { resolution } = request.body as { resolution: string };

      const [updated] = await db
        .update(komplikasyon)
        .set({ status: "resolved", resolution, resolvedAt: new Date(), updatedAt: new Date() })
        .where(eq(komplikasyon.id, id))
        .returning();

      if (!updated) {
        return reply.status(404).send({ success: false, error: "Komplikasyon bulunamadi" });
      }

      return reply.send({ success: true, data: updated });
    },
  );
}
