import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { egitmen } from "../db/schema/egitmen.js";
import { users } from "../db/schema/users.js";
import { requireRole, getUser } from "../middleware/auth.js";
import { createAuditLog } from "../middleware/audit.js";

export async function adminRoutes(app: FastifyInstance) {
  // GET /api/admin/egitmen/pending - Onay bekleyen egitmenler
  app.get(
    "/api/admin/egitmen/pending",
    { preHandler: requireRole("admin") },
    async (_request, reply) => {
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
    },
  );

  // POST /api/admin/egitmen/:id/approve - Egitmeni onayla
  app.post(
    "/api/admin/egitmen/:id/approve",
    { preHandler: requireRole("admin") },
    async (request, reply) => {
      const { sub } = getUser(request);
      const { id } = request.params as { id: string };

      const [updated] = await db
        .update(egitmen)
        .set({
          approvalStatus: "approved",
          approvedBy: sub,
          approvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(egitmen.id, id))
        .returning();

      if (!updated) {
        return reply.status(404).send({ success: false, error: "Egitmen bulunamadi" });
      }

      await createAuditLog({
        userId: sub,
        action: "update",
        tableName: "egitmen",
        recordId: id,
        newValues: { approvalStatus: "approved" },
        description: "Egitmen onaylandi",
        request,
      });

      return reply.send({ success: true, data: updated, message: "Egitmen onaylandi" });
    },
  );

  // POST /api/admin/egitmen/:id/reject - Egitmeni reddet
  app.post(
    "/api/admin/egitmen/:id/reject",
    { preHandler: requireRole("admin") },
    async (request, reply) => {
      const { sub } = getUser(request);
      const { id } = request.params as { id: string };
      const { reason } = request.body as { reason: string };

      const [updated] = await db
        .update(egitmen)
        .set({
          approvalStatus: "rejected",
          rejectionReason: reason,
          updatedAt: new Date(),
        })
        .where(eq(egitmen.id, id))
        .returning();

      if (!updated) {
        return reply.status(404).send({ success: false, error: "Egitmen bulunamadi" });
      }

      await createAuditLog({
        userId: sub,
        action: "update",
        tableName: "egitmen",
        recordId: id,
        newValues: { approvalStatus: "rejected", rejectionReason: reason },
        description: `Egitmen reddedildi: ${reason}`,
        request,
      });

      return reply.send({ success: true, data: updated, message: "Egitmen reddedildi" });
    },
  );

  // GET /api/admin/stats - Admin dashboard istatistikleri
  app.get(
    "/api/admin/stats",
    { preHandler: requireRole("admin") },
    async (_request, reply) => {
      // TODO: Implement proper count queries

      return reply.send({
        success: true,
        data: {
          message: "Admin dashboard - istatistikler yakinda eklenecek",
        },
      });
    },
  );
}
