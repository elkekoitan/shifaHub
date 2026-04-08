import type { FastifyInstance } from "fastify";
import { eq, desc, sql, ne } from "drizzle-orm";
import { db } from "../db/index.js";
import { egitmen } from "../db/schema/egitmen.js";
import { users } from "../db/schema/users.js";
import { danisan } from "../db/schema/danisan.js";
import { randevu } from "../db/schema/randevu.js";
import { tedavi } from "../db/schema/tedavi.js";
import { auditLog } from "../db/schema/audit_log.js";
import { requireRole, getUser } from "../middleware/auth.js";
import { createAuditLog } from "../middleware/audit.js";

export async function adminRoutes(app: FastifyInstance) {
  // ==========================================
  // KULLANICI YONETIMI
  // ==========================================

  // GET /api/admin/users - Tum kullanicilar
  app.get("/api/admin/users", { preHandler: requireRole("admin") }, async (_request, reply) => {
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        isActive: users.isActive,
        isEmailVerified: users.isEmailVerified,
        isMfaEnabled: users.isMfaEnabled,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    return reply.send({ success: true, data: allUsers });
  });

  // PATCH /api/admin/users/:id/role - Rol degistir
  app.patch(
    "/api/admin/users/:id/role",
    { preHandler: requireRole("admin") },
    async (request, reply) => {
      const { sub } = getUser(request);
      const { id } = request.params as { id: string };
      const { role } = request.body as { role: string };

      if (!["danisan", "egitmen", "admin", "tabip"].includes(role)) {
        return reply.status(400).send({ success: false, error: "Gecersiz rol" });
      }

      const [updated] = await db
        .update(users)
        .set({ role: role as "danisan" | "egitmen" | "admin" | "tabip", updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();

      if (!updated) {
        return reply.status(404).send({ success: false, error: "Kullanici bulunamadi" });
      }

      await createAuditLog({
        userId: sub,
        action: "update",
        tableName: "users",
        recordId: id,
        description: `Rol degistirildi: ${role}`,
        request,
      });

      return reply.send({ success: true, data: updated, message: `Rol ${role} olarak degistirildi` });
    },
  );

  // PATCH /api/admin/users/:id/toggle-active - Aktif/Pasif
  app.patch(
    "/api/admin/users/:id/toggle-active",
    { preHandler: requireRole("admin") },
    async (request, reply) => {
      const { sub } = getUser(request);
      const { id } = request.params as { id: string };

      const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
      if (!user) {
        return reply.status(404).send({ success: false, error: "Kullanici bulunamadi" });
      }

      const newStatus = !user.isActive;
      const [updated] = await db
        .update(users)
        .set({ isActive: newStatus, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();

      await createAuditLog({
        userId: sub,
        action: "update",
        tableName: "users",
        recordId: id,
        description: `Kullanici ${newStatus ? "aktif" : "pasif"} yapildi`,
        request,
      });

      return reply.send({
        success: true,
        data: updated,
        message: `Kullanici ${newStatus ? "aktif" : "pasif"} yapildi`,
      });
    },
  );

  // DELETE /api/admin/users/:id - Kullanici sil
  app.delete(
    "/api/admin/users/:id",
    { preHandler: requireRole("admin") },
    async (request, reply) => {
      const { sub } = getUser(request);
      const { id } = request.params as { id: string };

      if (id === sub) {
        return reply.status(400).send({ success: false, error: "Kendinizi silemezsiniz" });
      }

      await db.delete(users).where(eq(users.id, id));

      await createAuditLog({
        userId: sub,
        action: "delete",
        tableName: "users",
        recordId: id,
        description: "Kullanici silindi",
        request,
      });

      return reply.send({ success: true, message: "Kullanici silindi" });
    },
  );

  // ==========================================
  // EGITMEN YONETIMI
  // ==========================================

  // GET /api/admin/egitmen/pending - Onay bekleyen
  app.get("/api/admin/egitmen/pending", { preHandler: requireRole("admin") }, async (_request, reply) => {
    const pending = await db
      .select({
        id: egitmen.id,
        userId: egitmen.userId,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        certificateNumber: egitmen.certificateNumber,
        certificateIssuer: egitmen.certificateIssuer,
        specialties: egitmen.specialties,
        clinicName: egitmen.clinicName,
        clinicCity: egitmen.clinicCity,
        createdAt: egitmen.createdAt,
      })
      .from(egitmen)
      .innerJoin(users, eq(egitmen.userId, users.id))
      .where(eq(egitmen.approvalStatus, "pending"));

    return reply.send({ success: true, data: pending });
  });

  // GET /api/admin/egitmen/all - Tum egitmenler (tum durumlar)
  app.get("/api/admin/egitmen/all", { preHandler: requireRole("admin") }, async (_request, reply) => {
    const all = await db
      .select({
        id: egitmen.id,
        userId: egitmen.userId,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        certificateNumber: egitmen.certificateNumber,
        specialties: egitmen.specialties,
        clinicName: egitmen.clinicName,
        clinicCity: egitmen.clinicCity,
        approvalStatus: egitmen.approvalStatus,
        rejectionReason: egitmen.rejectionReason,
        createdAt: egitmen.createdAt,
      })
      .from(egitmen)
      .innerJoin(users, eq(egitmen.userId, users.id))
      .orderBy(desc(egitmen.createdAt));

    return reply.send({ success: true, data: all });
  });

  // POST /api/admin/egitmen/:id/approve
  app.post("/api/admin/egitmen/:id/approve", { preHandler: requireRole("admin") }, async (request, reply) => {
    const { sub } = getUser(request);
    const { id } = request.params as { id: string };

    const [updated] = await db
      .update(egitmen)
      .set({ approvalStatus: "approved", approvedBy: sub, approvedAt: new Date(), updatedAt: new Date() })
      .where(eq(egitmen.id, id))
      .returning();

    if (!updated) return reply.status(404).send({ success: false, error: "Egitmen bulunamadi" });

    await createAuditLog({ userId: sub, action: "update", tableName: "egitmen", recordId: id, description: "Egitmen onaylandi", request });
    return reply.send({ success: true, data: updated, message: "Egitmen onaylandi" });
  });

  // POST /api/admin/egitmen/:id/reject
  app.post("/api/admin/egitmen/:id/reject", { preHandler: requireRole("admin") }, async (request, reply) => {
    const { sub } = getUser(request);
    const { id } = request.params as { id: string };
    const { reason } = request.body as { reason: string };

    const [updated] = await db
      .update(egitmen)
      .set({ approvalStatus: "rejected", rejectionReason: reason, updatedAt: new Date() })
      .where(eq(egitmen.id, id))
      .returning();

    if (!updated) return reply.status(404).send({ success: false, error: "Egitmen bulunamadi" });

    await createAuditLog({ userId: sub, action: "update", tableName: "egitmen", recordId: id, description: `Reddedildi: ${reason}`, request });
    return reply.send({ success: true, data: updated, message: "Egitmen reddedildi" });
  });

  // ==========================================
  // DANISAN YONETIMI
  // ==========================================

  // GET /api/admin/danisanlar - Tum danisanlar
  app.get("/api/admin/danisanlar", { preHandler: requireRole("admin") }, async (_request, reply) => {
    const all = await db
      .select({
        id: danisan.id,
        userId: danisan.userId,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
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
      .orderBy(desc(danisan.createdAt));

    return reply.send({ success: true, data: all });
  });

  // ==========================================
  // ISTATISTIKLER
  // ==========================================

  // GET /api/admin/stats
  app.get("/api/admin/stats", { preHandler: requireRole("admin") }, async (_request, reply) => {
    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [danisanCount] = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, "danisan"));
    const [egitmenCount] = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, "egitmen"));
    const [pendingCount] = await db.select({ count: sql<number>`count(*)` }).from(egitmen).where(eq(egitmen.approvalStatus, "pending"));
    const [randevuCount] = await db.select({ count: sql<number>`count(*)` }).from(randevu);
    const [tedaviCount] = await db.select({ count: sql<number>`count(*)` }).from(tedavi);

    return reply.send({
      success: true,
      data: {
        totalUsers: userCount?.count || 0,
        totalDanisan: danisanCount?.count || 0,
        totalEgitmen: egitmenCount?.count || 0,
        pendingEgitmen: pendingCount?.count || 0,
        totalRandevu: randevuCount?.count || 0,
        totalTedavi: tedaviCount?.count || 0,
      },
    });
  });

  // GET /api/admin/audit-log - Son erisim kayitlari
  app.get("/api/admin/audit-log", { preHandler: requireRole("admin") }, async (request, reply) => {
    const query = request.query as { limit?: string };
    const limit = parseInt(query.limit || "50", 10);

    const logs = await db
      .select()
      .from(auditLog)
      .orderBy(desc(auditLog.createdAt))
      .limit(limit);

    return reply.send({ success: true, data: logs });
  });
}
