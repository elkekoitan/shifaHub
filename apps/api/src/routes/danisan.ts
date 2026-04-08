import type { FastifyInstance } from "fastify";
import { eq, desc, ilike, or, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { danisan } from "../db/schema/danisan.js";
import { users } from "../db/schema/users.js";
import { egitmen } from "../db/schema/egitmen.js";
import { tedavi } from "../db/schema/tedavi.js";
import { tahlil } from "../db/schema/tahlil.js";
import { randevu } from "../db/schema/randevu.js";
import { requireAuth, requireRole, getUser } from "../middleware/auth.js";
import { createAuditLog } from "../middleware/audit.js";

export async function danisanRoutes(app: FastifyInstance) {
  // GET /api/danisan/me
  app.get("/api/danisan/me", { preHandler: requireRole("danisan") }, async (request, reply) => {
    const { sub } = getUser(request);
    const [profile] = await db.select().from(danisan).where(eq(danisan.userId, sub)).limit(1);
    if (!profile) return reply.status(404).send({ success: false, error: "Profil bulunamadi" });
    return reply.send({ success: true, data: profile });
  });

  // PUT /api/danisan/me
  app.put("/api/danisan/me", { preHandler: requireRole("danisan") }, async (request, reply) => {
    const { sub } = getUser(request);
    const body = request.body as Partial<typeof danisan.$inferInsert>;

    const [existing] = await db.select().from(danisan).where(eq(danisan.userId, sub)).limit(1);

    if (!existing) {
      const [created] = await db
        .insert(danisan)
        .values({ ...body, userId: sub })
        .returning();
      if (!created)
        return reply.status(500).send({ success: false, error: "Profil olusturulamadi" });
      await createAuditLog({
        userId: sub,
        action: "create",
        tableName: "danisan",
        recordId: created.id,
        request,
      });
      return reply.status(201).send({ success: true, data: created });
    }

    const [updated] = await db
      .update(danisan)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(danisan.userId, sub))
      .returning();
    await createAuditLog({
      userId: sub,
      action: "update",
      tableName: "danisan",
      recordId: existing.id,
      request,
    });
    return reply.send({ success: true, data: updated });
  });

  // GET /api/danisan/list - Egitmen/admin icin danisan listesi
  app.get(
    "/api/danisan/list",
    { preHandler: requireRole("egitmen", "admin") },
    async (request, reply) => {
      const query = request.query as { search?: string };

      let results;
      if (query.search) {
        const term = `%${query.search}%`;
        results = await db
          .select({
            id: danisan.id,
            userId: danisan.userId,
            firstName: users.firstName,
            lastName: users.lastName,
            phone: users.phone,
            city: danisan.city,
            gender: danisan.gender,
            bloodType: danisan.bloodType,
            chronicDiseases: danisan.chronicDiseases,
            mainComplaints: danisan.mainComplaints,
            createdAt: danisan.createdAt,
          })
          .from(danisan)
          .innerJoin(users, eq(danisan.userId, users.id))
          .where(
            or(
              ilike(users.firstName, term),
              ilike(users.lastName, term),
              ilike(danisan.city, term),
            ),
          );
      } else {
        results = await db
          .select({
            id: danisan.id,
            userId: danisan.userId,
            firstName: users.firstName,
            lastName: users.lastName,
            phone: users.phone,
            city: danisan.city,
            gender: danisan.gender,
            bloodType: danisan.bloodType,
            chronicDiseases: danisan.chronicDiseases,
            mainComplaints: danisan.mainComplaints,
            createdAt: danisan.createdAt,
          })
          .from(danisan)
          .innerJoin(users, eq(danisan.userId, users.id))
          .orderBy(desc(danisan.createdAt))
          .limit(50);
      }

      return reply.send({ success: true, data: results });
    },
  );

  // GET /api/danisan/:userId/full - Egitmen icin tam danisan detay (profil + tedavi + tahlil + randevu)
  app.get(
    "/api/danisan/:userId/full",
    { preHandler: requireRole("egitmen", "admin") },
    async (request, reply) => {
      const { sub, role } = getUser(request);
      const { userId } = request.params as { userId: string };

      // Egitmen ise: bu danisanla iliskisi var mi kontrol et
      if (role === "egitmen") {
        const [hasTedavi] = await db
          .select({ id: tedavi.id })
          .from(tedavi)
          .where(and(eq(tedavi.egitmenId, sub), eq(tedavi.danisanId, userId)))
          .limit(1);
        if (!hasTedavi) {
          const [hasRandevu] = await db
            .select({ id: randevu.id })
            .from(randevu)
            .where(and(eq(randevu.egitmenId, sub), eq(randevu.danisanId, userId)))
            .limit(1);
          if (!hasRandevu) {
            return reply
              .status(403)
              .send({ success: false, error: "Bu danisanin detaylarini goruntuleme yetkiniz yok" });
          }
        }
      }

      // Kullanici bilgileri
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user) return reply.status(404).send({ success: false, error: "Kullanici bulunamadi" });

      // Danisan profili
      const [profil] = await db.select().from(danisan).where(eq(danisan.userId, userId)).limit(1);

      // Tedavi gecmisi
      const tedaviler = await db
        .select()
        .from(tedavi)
        .where(eq(tedavi.danisanId, userId))
        .orderBy(desc(tedavi.treatmentDate))
        .limit(20);

      // Tahlil sonuclari
      const tahliller = await db
        .select()
        .from(tahlil)
        .where(eq(tahlil.danisanId, userId))
        .orderBy(desc(tahlil.testDate))
        .limit(20);

      // Randevular
      const randevular = await db
        .select()
        .from(randevu)
        .where(eq(randevu.danisanId, userId))
        .orderBy(desc(randevu.scheduledAt))
        .limit(20);

      await createAuditLog({
        userId: (request as any).user?.sub,
        action: "read",
        tableName: "danisan",
        recordId: userId,
        description: "Danisan tam detay goruntulendi",
        request,
      });

      return reply.send({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
          },
          profil,
          tedaviler,
          tahliller,
          randevular,
        },
      });
    },
  );

  // GET /api/egitmen/search - Herkesin erisebilecegi egitmen arama
  app.get("/api/egitmen/search", { preHandler: requireAuth() }, async (request, reply) => {
    const query = request.query as { city?: string; specialty?: string };

    const all = await db
      .select({
        id: egitmen.id,
        userId: egitmen.userId,
        firstName: users.firstName,
        lastName: users.lastName,
        specialties: egitmen.specialties,
        clinicName: egitmen.clinicName,
        clinicCity: egitmen.clinicCity,
        defaultSessionDuration: egitmen.defaultSessionDuration,
        bio: egitmen.bio,
      })
      .from(egitmen)
      .innerJoin(users, eq(egitmen.userId, users.id))
      .where(eq(egitmen.approvalStatus, "approved"));

    let results = all;
    if (query.city) {
      results = results.filter((e) =>
        e.clinicCity?.toLowerCase().includes(query.city!.toLowerCase()),
      );
    }
    if (query.specialty) {
      results = results.filter((e) => (e.specialties as string[])?.includes(query.specialty!));
    }

    return reply.send({ success: true, data: results });
  });
}
