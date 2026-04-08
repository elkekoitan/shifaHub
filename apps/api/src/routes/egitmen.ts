import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { egitmen } from "../db/schema/egitmen.js";
import { users } from "../db/schema/users.js";
import { requireAuth, requireRole, getUser } from "../middleware/auth.js";
import { createAuditLog } from "../middleware/audit.js";

export async function egitmenRoutes(app: FastifyInstance) {
  // GET /api/egitmen/me - Egitmen kendi profilini goruntule
  app.get("/api/egitmen/me", { preHandler: requireRole("egitmen") }, async (request, reply) => {
    const { sub } = getUser(request);

    const [profile] = await db
      .select()
      .from(egitmen)
      .where(eq(egitmen.userId, sub))
      .limit(1);

    if (!profile) {
      return reply.status(404).send({ success: false, error: "Egitmen profili bulunamadi" });
    }

    return reply.send({ success: true, data: profile });
  });

  // PUT /api/egitmen/me - Egitmen profilini olustur/guncelle
  app.put("/api/egitmen/me", { preHandler: requireRole("egitmen") }, async (request, reply) => {
    const { sub } = getUser(request);
    const body = request.body as Partial<typeof egitmen.$inferInsert>;

    let [profile] = await db
      .select()
      .from(egitmen)
      .where(eq(egitmen.userId, sub))
      .limit(1);

    if (!profile) {
      const [created] = await db
        .insert(egitmen)
        .values({ ...body, userId: sub, approvalStatus: "pending" })
        .returning();

      await createAuditLog({
        userId: sub,
        action: "create",
        tableName: "egitmen",
        recordId: created.id,
        description: "Egitmen profili olusturuldu - onay bekliyor",
        request,
      });

      return reply.status(201).send({
        success: true,
        data: created,
        message: "Profiliniz olusturuldu. Admin onayı bekleniyor.",
      });
    }

    const [updated] = await db
      .update(egitmen)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(egitmen.userId, sub))
      .returning();

    await createAuditLog({
      userId: sub,
      action: "update",
      tableName: "egitmen",
      recordId: profile.id,
      request,
    });

    return reply.send({ success: true, data: updated });
  });

  // GET /api/egitmen/danisanlar - Egitmenin danisan listesi
  app.get(
    "/api/egitmen/danisanlar",
    { preHandler: requireRole("egitmen") },
    async (request, reply) => {
      // TODO: Egitmen-danisan iliskisi tablosu olusturulacak
      return reply.send({ success: true, data: [], message: "Henuz danisan atanmamis" });
    },
  );
}
