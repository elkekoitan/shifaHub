import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireRole, getUser } from "../middleware/auth.js";
import { createAuditLog } from "../middleware/audit.js";
import {
  createStock,
  updateStock,
  deleteStock,
  recordStockMovement,
  listAllStock,
  getCriticalStock,
  listStockMovements,
} from "../services/stock.service.js";

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const createStockSchema = z.object({
  name: z.string().min(1, "Urun adi zorunlu"),
  category: z.enum(["kupa", "suluk", "sarf", "bitkisel", "igne", "diger"]),
  quantity: z.number().min(0, "Miktar negatif olamaz"),
  unit: z.string().default("adet"),
  minimumLevel: z.number().min(0).optional(),
  unitPrice: z.number().min(0).optional(),
  expiryDate: z.string().optional(),
});

const stockMovementSchema = z.object({
  type: z.enum(["giris", "cikis"]),
  quantity: z.number().min(1, "Miktar en az 1 olmali"),
  reason: z.string().optional(),
  tedaviId: z.string().uuid().optional(),
});

export async function stokRoutes(app: FastifyInstance) {
  // ─── GET /api/stok — Stok listesi ────────────────────────────────────────
  app.get("/api/stok", { preHandler: requireRole("egitmen", "admin") }, async (_request, reply) => {
    const items = await listAllStock();
    return reply.send({ success: true, data: items });
  });

  // ─── POST /api/stok — Yeni stok kalemi ───────────────────────────────────
  app.post("/api/stok", { preHandler: requireRole("egitmen", "admin") }, async (request, reply) => {
    const { sub } = getUser(request);
    const body = createStockSchema.parse(request.body);

    const created = await createStock(body);

    await createAuditLog({
      userId: sub,
      action: "create",
      tableName: "stok",
      recordId: created.id,
      description: `Stok eklendi: ${body.name} (${body.quantity} ${body.unit})`,
      request,
    });

    return reply.status(201).send({ success: true, data: created });
  });

  // ─── PUT /api/stok/:id — Stok guncelle ───────────────────────────────────
  app.put(
    "/api/stok/:id",
    { preHandler: requireRole("egitmen", "admin") },
    async (request, reply) => {
      const { sub } = getUser(request);
      const { id } = request.params as { id: string };
      const body = createStockSchema.partial().parse(request.body);

      const updated = await updateStock(id, body);

      await createAuditLog({
        userId: sub,
        action: "update",
        tableName: "stok",
        recordId: id,
        description: `Stok guncellendi`,
        request,
      });

      return reply.send({ success: true, data: updated });
    },
  );

  // ─── POST /api/stok/:id/hareket — Stok giris/cikis ──────────────────────
  app.post(
    "/api/stok/:id/hareket",
    { preHandler: requireRole("egitmen", "admin") },
    async (request, reply) => {
      const { sub } = getUser(request);
      const { id } = request.params as { id: string };
      const body = stockMovementSchema.parse(request.body);

      const result = await recordStockMovement({
        stokId: id,
        userId: sub,
        type: body.type,
        quantity: body.quantity,
        reason: body.reason,
        tedaviId: body.tedaviId,
      });

      await createAuditLog({
        userId: sub,
        action: body.type === "giris" ? "create" : "update",
        tableName: "stok_hareket",
        recordId: result.hareket?.id ?? id,
        description: `Stok ${body.type}: ${body.quantity} adet`,
        request,
      });

      return reply.send({ success: true, data: result });
    },
  );

  // ─── GET /api/stok/kritik — Kritik stoklar ───────────────────────────────
  app.get(
    "/api/stok/kritik",
    { preHandler: requireRole("egitmen", "admin") },
    async (_request, reply) => {
      const critical = await getCriticalStock();
      return reply.send({ success: true, data: critical });
    },
  );

  // ─── GET /api/stok/:id/hareketler — Hareket gecmisi ──────────────────────
  app.get(
    "/api/stok/:id/hareketler",
    { preHandler: requireRole("egitmen", "admin") },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const hareketler = await listStockMovements(id);
      return reply.send({ success: true, data: hareketler });
    },
  );

  // ─── DELETE /api/stok/:id — Stok sil ─────────────────────────────────────
  app.delete(
    "/api/stok/:id",
    { preHandler: requireRole("egitmen", "admin") },
    async (request, reply) => {
      const { sub } = getUser(request);
      const { id } = request.params as { id: string };

      await deleteStock(id);

      await createAuditLog({
        userId: sub,
        action: "delete",
        tableName: "stok",
        recordId: id,
        description: "Stok kalemi silindi",
        request,
      });

      return reply.send({ success: true, message: "Stok kalemi silindi" });
    },
  );
}
