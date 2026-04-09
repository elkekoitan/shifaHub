import type { FastifyInstance } from "fastify";
import { eq, desc, and, gte } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { odeme } from "../db/schema/odeme.js";
import { requireRole, requireAuth, getUser } from "../middleware/auth.js";
import { createAuditLog } from "../middleware/audit.js";

const createOdemeSchema = z.object({
  danisanId: z.string().uuid("Gecersiz danisan ID"),
  amount: z.union([z.string(), z.number()]).transform(Number),
  paidAmount: z.union([z.string(), z.number()]).transform(Number).optional().default(0),
  method: z.enum(["nakit", "kart", "havale", "eft"]).optional().default("nakit"),
  status: z.enum(["paid", "pending", "partial", "free"]).optional(),
  description: z.string().optional(),
  tedaviId: z.string().uuid().optional(),
});

export async function odemeRoutes(app: FastifyInstance) {
  // POST /api/odeme — Odeme kaydi olustur (Zod validasyonlu)
  app.post("/api/odeme", { preHandler: requireRole("egitmen") }, async (request, reply) => {
    const { sub } = getUser(request);
    const body = createOdemeSchema.parse(request.body);

    // Validasyon: paidAmount <= amount
    const amount = body.amount;
    const paidAmount = body.paidAmount ?? 0;
    if (paidAmount > amount) {
      return reply
        .status(400)
        .send({ success: false, error: "Odenen tutar toplam tutardan buyuk olamaz" });
    }

    // Status otomatik belirleme
    let status = body.status || "pending";
    if (paidAmount > 0 && paidAmount < amount) status = "partial";
    if (paidAmount >= amount && amount > 0) status = "paid";

    const [created] = await db
      .insert(odeme)
      .values({
        danisanId: body.danisanId,
        egitmenId: sub,
        tedaviId: body.tedaviId,
        amount: amount.toFixed(2),
        paidAmount: paidAmount.toFixed(2),
        method: body.method,
        status: status as "paid" | "pending" | "partial" | "free",
        description: body.description,
        paidAt: status === "paid" ? new Date() : undefined,
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
      description: `Odeme kaydi: ${body.amount} TL (${status})`,
      request,
    });

    return reply.status(201).send({ success: true, data: created });
  });

  // GET /api/odeme - Odeme listesi (danisan da kendi odemelerini gorebilir)
  app.get("/api/odeme", { preHandler: requireAuth() }, async (request, reply) => {
    const { sub, role } = getUser(request);
    const query = request.query as { danisanId?: string };

    const conditions = [];
    if (role === "egitmen") conditions.push(eq(odeme.egitmenId, sub));
    if (role === "danisan") conditions.push(eq(odeme.danisanId, sub));
    if (query.danisanId && role !== "danisan")
      conditions.push(eq(odeme.danisanId, query.danisanId));

    const results = await db
      .select()
      .from(odeme)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(odeme.createdAt))
      .limit(100);

    return reply.send({ success: true, data: results });
  });

  // GET /api/odeme/gunluk-kasa - Gunluk kasa raporu (duzeltilmis hesaplama)
  app.get(
    "/api/odeme/gunluk-kasa",
    { preHandler: requireRole("egitmen", "admin") },
    async (request, reply) => {
      const { sub, role } = getUser(request);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const conditions = [gte(odeme.createdAt, today)];
      if (role === "egitmen") conditions.push(eq(odeme.egitmenId, sub));

      const payments = await db
        .select()
        .from(odeme)
        .where(and(...conditions));

      const summary = {
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        freeAmount: 0,
        byMethod: { nakit: 0, kart: 0, havale: 0, eft: 0 },
        byStatus: { paid: 0, pending: 0, partial: 0, free: 0 },
        count: payments.length,
      };

      for (const p of payments) {
        const amount = Number(p.amount) || 0;
        const paid = Number(p.paidAmount) || 0;

        summary.totalAmount += amount;
        summary.paidAmount += paid;

        if (p.status === "free") {
          summary.freeAmount += amount;
        } else if (p.status === "pending") {
          summary.pendingAmount += amount;
        } else if (p.status === "partial") {
          summary.pendingAmount += amount - paid;
        }

        // Status dagilimi
        if (p.status && p.status in summary.byStatus) {
          summary.byStatus[p.status as keyof typeof summary.byStatus]++;
        }

        // Odeme yontemi bazinda (sadece gercekten odenmis tutar)
        if (p.method && p.method in summary.byMethod && paid > 0) {
          summary.byMethod[p.method as keyof typeof summary.byMethod] += paid;
        }
      }

      return reply.send({ success: true, data: summary });
    },
  );

  // PATCH /api/odeme/:id - Odeme guncelle (validasyonlu)
  app.patch("/api/odeme/:id", { preHandler: requireRole("egitmen") }, async (request, reply) => {
    const { sub } = getUser(request);
    const { id } = request.params as { id: string };
    const body = request.body as Partial<typeof odeme.$inferInsert>;

    const [existing] = await db.select().from(odeme).where(eq(odeme.id, id)).limit(1);
    if (!existing) return reply.status(404).send({ success: false, error: "Odeme bulunamadi" });

    // Yetki kontrolu
    if (existing.egitmenId !== sub) {
      return reply
        .status(403)
        .send({ success: false, error: "Bu odemeyi guncelleme yetkiniz yok" });
    }

    // paidAmount validasyonu
    const newAmount = body.amount ? Number(body.amount) : Number(existing.amount);
    const newPaid = body.paidAmount ? Number(body.paidAmount) : Number(existing.paidAmount);
    if (newPaid > newAmount) {
      return reply
        .status(400)
        .send({ success: false, error: "Odenen tutar toplam tutardan buyuk olamaz" });
    }

    // Status otomatik guncelle
    let newStatus = body.status || existing.status;
    if (newPaid > 0 && newPaid < newAmount) newStatus = "partial";
    if (newPaid >= newAmount && newAmount > 0) newStatus = "paid";

    const [updated] = await db
      .update(odeme)
      .set({
        ...body,
        status: newStatus as any,
        paidAt: newStatus === "paid" ? new Date() : existing.paidAt,
        updatedAt: new Date(),
      })
      .where(eq(odeme.id, id))
      .returning();

    await createAuditLog({
      userId: sub,
      action: "update",
      tableName: "odeme",
      recordId: id,
      description: `Odeme guncellendi: ${existing.status} -> ${newStatus}`,
      request,
    });

    return reply.send({ success: true, data: updated });
  });
}
