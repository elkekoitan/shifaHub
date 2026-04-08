import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { danisan } from "../db/schema/danisan.js";
import { users } from "../db/schema/users.js";
import { requireAuth, requireRole, getUser } from "../middleware/auth.js";
import { createAuditLog } from "../middleware/audit.js";

export async function danisanRoutes(app: FastifyInstance) {
  // GET /api/danisan/me - Danisan kendi profilini goruntule
  app.get("/api/danisan/me", { preHandler: requireRole("danisan") }, async (request, reply) => {
    const { sub } = getUser(request);

    const [profile] = await db
      .select()
      .from(danisan)
      .where(eq(danisan.userId, sub))
      .limit(1);

    if (!profile) {
      return reply.status(404).send({ success: false, error: "Danisan profili bulunamadi" });
    }

    await createAuditLog({
      userId: sub,
      action: "read",
      tableName: "danisan",
      recordId: profile.id,
      request,
    });

    return reply.send({ success: true, data: profile });
  });

  // PUT /api/danisan/me - Danisan profilini guncelle
  app.put("/api/danisan/me", { preHandler: requireRole("danisan") }, async (request, reply) => {
    const { sub } = getUser(request);
    const body = request.body as Partial<typeof danisan.$inferInsert>;

    let [profile] = await db
      .select()
      .from(danisan)
      .where(eq(danisan.userId, sub))
      .limit(1);

    if (!profile) {
      // Ilk profil olusturma
      const [created] = await db
        .insert(danisan)
        .values({ ...body, userId: sub })
        .returning();

      await createAuditLog({
        userId: sub,
        action: "create",
        tableName: "danisan",
        recordId: created.id,
        newValues: body as Record<string, unknown>,
        request,
      });

      return reply.status(201).send({ success: true, data: created });
    }

    // Profil guncelleme
    const [updated] = await db
      .update(danisan)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(danisan.userId, sub))
      .returning();

    await createAuditLog({
      userId: sub,
      action: "update",
      tableName: "danisan",
      recordId: profile.id,
      newValues: body as Record<string, unknown>,
      request,
    });

    return reply.send({ success: true, data: updated });
  });

  // GET /api/danisan/list - Egitmen icin danisan listesi
  app.get(
    "/api/danisan/list",
    { preHandler: requireRole("egitmen", "admin") },
    async (request, reply) => {
      const { sub } = getUser(request);
      const query = request.query as { search?: string; page?: string; limit?: string };

      const page = parseInt(query.page || "1", 10);
      const limit = parseInt(query.limit || "20", 10);
      const offset = (page - 1) * limit;

      const results = await db
        .select({
          id: danisan.id,
          userId: danisan.userId,
          firstName: users.firstName,
          lastName: users.lastName,
          phone: users.phone,
          city: danisan.city,
          mainComplaints: danisan.mainComplaints,
          createdAt: danisan.createdAt,
        })
        .from(danisan)
        .innerJoin(users, eq(danisan.userId, users.id))
        .limit(limit)
        .offset(offset);

      await createAuditLog({
        userId: sub,
        action: "read",
        tableName: "danisan",
        description: `Danisan listesi goruntulendi (sayfa: ${page})`,
        request,
      });

      return reply.send({
        success: true,
        data: results,
        page,
        pageSize: limit,
      });
    },
  );
}
