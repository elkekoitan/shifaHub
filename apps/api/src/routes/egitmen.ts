import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { egitmen } from "../db/schema/egitmen.js";
import { randevu } from "../db/schema/randevu.js";
import { tedavi } from "../db/schema/tedavi.js";
import { users } from "../db/schema/users.js";
import { danisan } from "../db/schema/danisan.js";
import { requireRole, getUser } from "../middleware/auth.js";
import { createAuditLog } from "../middleware/audit.js";

export async function egitmenRoutes(app: FastifyInstance) {
  // GET /api/egitmen/me
  app.get("/api/egitmen/me", { preHandler: requireRole("egitmen") }, async (request, reply) => {
    const { sub } = getUser(request);
    const [profile] = await db.select().from(egitmen).where(eq(egitmen.userId, sub)).limit(1);
    if (!profile) return reply.status(404).send({ success: false, error: "Profil bulunamadi" });
    return reply.send({ success: true, data: profile });
  });

  // PUT /api/egitmen/me
  app.put("/api/egitmen/me", { preHandler: requireRole("egitmen") }, async (request, reply) => {
    const { sub } = getUser(request);
    const body = request.body as Partial<typeof egitmen.$inferInsert>;

    const [existing] = await db.select().from(egitmen).where(eq(egitmen.userId, sub)).limit(1);

    if (!existing) {
      const [created] = await db.insert(egitmen).values({ ...body, userId: sub, approvalStatus: "pending" }).returning();
      if (!created) return reply.status(500).send({ success: false, error: "Profil olusturulamadi" });
      await createAuditLog({ userId: sub, action: "create", tableName: "egitmen", recordId: created.id, request });
      return reply.status(201).send({ success: true, data: created, message: "Profiliniz olusturuldu. Admin onayi bekleniyor." });
    }

    const [updated] = await db.update(egitmen).set({ ...body, updatedAt: new Date() }).where(eq(egitmen.userId, sub)).returning();
    await createAuditLog({ userId: sub, action: "update", tableName: "egitmen", recordId: existing.id, request });
    return reply.send({ success: true, data: updated });
  });

  // GET /api/egitmen/danisanlar - Randevu ve tedavi iliskisinden otomatik cikarim
  app.get("/api/egitmen/danisanlar", { preHandler: requireRole("egitmen") }, async (request, reply) => {
    const { sub } = getUser(request);

    // Randevu + tedavi tablolarindan unique danisanId'leri bul
    const randevuDanisanlar = await db
      .selectDistinct({ danisanId: randevu.danisanId })
      .from(randevu)
      .where(eq(randevu.egitmenId, sub));

    const tedaviDanisanlar = await db
      .selectDistinct({ danisanId: tedavi.danisanId })
      .from(tedavi)
      .where(eq(tedavi.egitmenId, sub));

    // Unique ID'leri birlesrir
    const allIds = new Set<string>();
    randevuDanisanlar.forEach((r) => allIds.add(r.danisanId));
    tedaviDanisanlar.forEach((t) => allIds.add(t.danisanId));

    if (allIds.size === 0) {
      return reply.send({ success: true, data: [], count: 0 });
    }

    // Her danisan icin bilgileri cek
    const results = [];
    for (const danisanUserId of allIds) {
      const [user] = await db.select({ firstName: users.firstName, lastName: users.lastName, email: users.email, phone: users.phone }).from(users).where(eq(users.id, danisanUserId)).limit(1);
      const [profil] = await db.select({ city: danisan.city, mainComplaints: danisan.mainComplaints, chronicDiseases: danisan.chronicDiseases }).from(danisan).where(eq(danisan.userId, danisanUserId)).limit(1);

      if (user) {
        results.push({
          userId: danisanUserId,
          ...user,
          ...profil,
        });
      }
    }

    return reply.send({ success: true, data: results, count: results.length });
  });
}
