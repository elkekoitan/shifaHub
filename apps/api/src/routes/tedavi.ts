import type { FastifyInstance } from "fastify";
import { eq, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { tedavi } from "../db/schema/tedavi.js";
import { tahlil } from "../db/schema/tahlil.js";
import { requireAuth, requireRole, getUser } from "../middleware/auth.js";
import { createAuditLog } from "../middleware/audit.js";

export async function tedaviRoutes(app: FastifyInstance) {
  // POST /api/tedavi - Yeni tedavi kaydi
  app.post("/api/tedavi", { preHandler: requireRole("egitmen") }, async (request, reply) => {
    const { sub } = getUser(request);
    const body = request.body as typeof tedavi.$inferInsert;

    const [created] = await db
      .insert(tedavi)
      .values({
        ...body,
        egitmenId: sub,
        treatmentDate: body.treatmentDate || new Date(),
      })
      .returning();

    if (!created) {
      return reply.status(500).send({ success: false, error: "Tedavi kaydi olusturulamadi" });
    }

    await createAuditLog({
      userId: sub,
      action: "create",
      tableName: "tedavi",
      recordId: created.id,
      description: `Tedavi kaydi: ${body.treatmentType} - danisan: ${body.danisanId}`,
      request,
    });

    return reply.status(201).send({ success: true, data: created });
  });

  // GET /api/tedavi/danisan/:danisanId - Danisan tedavi gecmisi
  app.get(
    "/api/tedavi/danisan/:danisanId",
    { preHandler: requireAuth() },
    async (request, reply) => {
      const { sub, role } = getUser(request);
      const { danisanId } = request.params as { danisanId: string };

      // Danisan sadece kendi tedavilerini gorebilir
      if (role === "danisan" && danisanId !== sub) {
        return reply.status(403).send({ success: false, error: "Erisim yetkisi yok" });
      }

      const results = await db
        .select()
        .from(tedavi)
        .where(eq(tedavi.danisanId, danisanId))
        .orderBy(desc(tedavi.treatmentDate));

      await createAuditLog({
        userId: sub,
        action: "read",
        tableName: "tedavi",
        description: `Tedavi gecmisi goruntulendi: ${danisanId}`,
        request,
      });

      return reply.send({ success: true, data: results });
    },
  );

  // GET /api/tedavi/:id - Tek tedavi detayi
  app.get("/api/tedavi/:id", { preHandler: requireAuth() }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const [result] = await db.select().from(tedavi).where(eq(tedavi.id, id)).limit(1);

    if (!result) {
      return reply.status(404).send({ success: false, error: "Tedavi kaydi bulunamadi" });
    }

    return reply.send({ success: true, data: result });
  });

  // POST /api/tahlil - Yeni tahlil kaydi
  app.post("/api/tahlil", { preHandler: requireAuth() }, async (request, reply) => {
    const { sub } = getUser(request);
    const body = request.body as typeof tahlil.$inferInsert;

    const [created] = await db
      .insert(tahlil)
      .values({
        ...body,
        danisanId: body.danisanId || sub,
      })
      .returning();

    if (!created) {
      return reply.status(500).send({ success: false, error: "Tahlil kaydi olusturulamadi" });
    }

    await createAuditLog({
      userId: sub,
      action: "create",
      tableName: "tahlil",
      recordId: created.id,
      description: `Tahlil kaydi: ${body.testType}`,
      request,
    });

    return reply.status(201).send({ success: true, data: created });
  });

  // GET /api/tahlil/danisan/:danisanId - Danisan tahlil gecmisi
  app.get(
    "/api/tahlil/danisan/:danisanId",
    { preHandler: requireAuth() },
    async (request, reply) => {
      const { danisanId } = request.params as { danisanId: string };

      const results = await db
        .select()
        .from(tahlil)
        .where(eq(tahlil.danisanId, danisanId))
        .orderBy(desc(tahlil.testDate));

      return reply.send({ success: true, data: results });
    },
  );
}
