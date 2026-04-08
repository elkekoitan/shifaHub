import type { FastifyInstance } from "fastify";
import { eq, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { protokol } from "../db/schema/protokol.js";
import { requireRole, getUser } from "../middleware/auth.js";
import { createAuditLog } from "../middleware/audit.js";

export async function protokolRoutes(app: FastifyInstance) {
  // POST /api/protokol - Yeni protokol olustur
  app.post("/api/protokol", { preHandler: requireRole("egitmen") }, async (request, reply) => {
    const { sub } = getUser(request);
    const body = request.body as typeof protokol.$inferInsert;

    const [created] = await db
      .insert(protokol)
      .values({ ...body, egitmenId: sub })
      .returning();

    if (!created) {
      return reply.status(500).send({ success: false, error: "Protokol olusturulamadi" });
    }

    await createAuditLog({
      userId: sub, action: "create", tableName: "protokol",
      recordId: created.id, description: `Protokol olusturuldu: ${body.title}`, request,
    });

    return reply.status(201).send({ success: true, data: created });
  });

  // GET /api/protokol/danisan/:danisanId - Danisanin protokolleri
  app.get("/api/protokol/danisan/:danisanId", { preHandler: requireRole("egitmen", "admin") }, async (request, reply) => {
    const { danisanId } = request.params as { danisanId: string };

    const results = await db
      .select()
      .from(protokol)
      .where(eq(protokol.danisanId, danisanId))
      .orderBy(desc(protokol.createdAt));

    return reply.send({ success: true, data: results });
  });

  // PUT /api/protokol/:id - Protokol guncelle
  app.put("/api/protokol/:id", { preHandler: requireRole("egitmen") }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as Partial<typeof protokol.$inferInsert>;

    const [updated] = await db
      .update(protokol)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(protokol.id, id))
      .returning();

    if (!updated) {
      return reply.status(404).send({ success: false, error: "Protokol bulunamadi" });
    }

    return reply.send({ success: true, data: updated });
  });

  // GET /api/protokol/:id - Tek protokol
  app.get("/api/protokol/:id", { preHandler: requireRole("egitmen", "admin", "danisan") }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const [result] = await db.select().from(protokol).where(eq(protokol.id, id)).limit(1);
    if (!result) return reply.status(404).send({ success: false, error: "Protokol bulunamadi" });
    return reply.send({ success: true, data: result });
  });
}
