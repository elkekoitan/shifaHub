import type { FastifyInstance } from "fastify";
import { eq, desc, and, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { odeme } from "../db/schema/odeme.js";
import { requireRole, getUser } from "../middleware/auth.js";
import { createAuditLog } from "../middleware/audit.js";

export async function odemeRoutes(app: FastifyInstance) {
  // POST /api/odeme - Odeme kaydi olustur
  app.post("/api/odeme", { preHandler: requireRole("egitmen") }, async (request, reply) => {
    const { sub } = getUser(request);
    const body = request.body as typeof odeme.$inferInsert;

    const [created] = await db
      .insert(odeme)
      .values({
        ...body,
        egitmenId: sub,
        paidAt: body.status === "paid" ? new Date() : undefined,
      })
      .returning();

    if (!created) {
      return reply.status(500).send({ success: false, error: "Odeme olusturulamadi" });
    }

    await createAuditLog({
      userId: sub,
      action: "create",
      tableName: "odeme",
      recordId: created.id,
      description: `Odeme kaydi: ${body.amount} TL`,
      request,
    });

    return reply.status(201).send({ success: true, data: created });
  });

  // GET /api/odeme - Odeme listesi
  app.get("/api/odeme", { preHandler: requireRole("egitmen", "admin") }, async (request, reply) => {
    const { sub, role } = getUser(request);
    const query = request.query as { danisanId?: string };

    const conditions = [];
    if (role === "egitmen") conditions.push(eq(odeme.egitmenId, sub));
    if (query.danisanId) conditions.push(eq(odeme.danisanId, query.danisanId));

    const results = await db
      .select()
      .from(odeme)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(odeme.createdAt))
      .limit(50);

    return reply.send({ success: true, data: results });
  });

  // GET /api/odeme/gunluk-kasa - Gunluk kasa raporu
  app.get(
    "/api/odeme/gunluk-kasa",
    { preHandler: requireRole("egitmen", "admin") },
    async (request, reply) => {
      const { sub, role } = getUser(request);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const conditions = [sql`${odeme.createdAt} >= ${today}`];
      if (role === "egitmen") conditions.push(eq(odeme.egitmenId, sub));

      const payments = await db
        .select()
        .from(odeme)
        .where(and(...conditions));

      const summary = {
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        byMethod: { nakit: 0, kart: 0, havale: 0, eft: 0 },
        count: payments.length,
      };

      for (const p of payments) {
        const amount = Number(p.amount) || 0;
        const paid = Number(p.paidAmount) || 0;
        summary.totalAmount += amount;
        summary.paidAmount += paid;
        if (p.status === "pending" || p.status === "partial") {
          summary.pendingAmount += amount - paid;
        }
        if (p.method && p.method in summary.byMethod) {
          summary.byMethod[p.method as keyof typeof summary.byMethod] += paid;
        }
      }

      return reply.send({ success: true, data: summary });
    },
  );

  // PATCH /api/odeme/:id - Odeme guncelle
  app.patch(
    "/api/odeme/:id",
    { preHandler: requireRole("egitmen") },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as Partial<typeof odeme.$inferInsert>;

      const [updated] = await db
        .update(odeme)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(odeme.id, id))
        .returning();

      if (!updated) {
        return reply.status(404).send({ success: false, error: "Odeme bulunamadi" });
      }

      return reply.send({ success: true, data: updated });
    },
  );
}
