import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { stok, stokHareket } from "../db/schema/stok.js";
import { requireRole, getUser } from "../middleware/auth.js";
import { createAuditLog } from "../middleware/audit.js";

export async function stokRoutes(app: FastifyInstance) {
  // GET /api/stok - Stok listesi
  app.get("/api/stok", { preHandler: requireRole("egitmen", "admin") }, async (_request, reply) => {
    const items = await db.select().from(stok).where(eq(stok.isActive, true));
    return reply.send({ success: true, data: items });
  });

  // POST /api/stok - Yeni stok kalemi ekle
  app.post("/api/stok", { preHandler: requireRole("egitmen", "admin") }, async (request, reply) => {
    const { sub } = getUser(request);
    const body = request.body as typeof stok.$inferInsert;

    const [created] = await db.insert(stok).values(body).returning();
    if (!created) {
      return reply.status(500).send({ success: false, error: "Stok olusturulamadi" });
    }

    await createAuditLog({
      userId: sub,
      action: "create",
      tableName: "stok",
      recordId: created.id,
      description: `Stok eklendi: ${body.name}`,
      request,
    });

    return reply.status(201).send({ success: true, data: created });
  });

  // POST /api/stok/:id/hareket - Stok giris/cikis
  app.post(
    "/api/stok/:id/hareket",
    { preHandler: requireRole("egitmen", "admin") },
    async (request, reply) => {
      const { sub } = getUser(request);
      const { id } = request.params as { id: string };
      const { type, quantity, reason, tedaviId } = request.body as {
        type: "giris" | "cikis";
        quantity: number;
        reason?: string;
        tedaviId?: string;
      };

      const [item] = await db.select().from(stok).where(eq(stok.id, id)).limit(1);
      if (!item) {
        return reply.status(404).send({ success: false, error: "Stok kalemi bulunamadi" });
      }

      const newQty = type === "giris" ? item.quantity + quantity : item.quantity - quantity;
      if (newQty < 0) {
        return reply.status(400).send({ success: false, error: "Yetersiz stok" });
      }

      await db.update(stok).set({ quantity: newQty, updatedAt: new Date() }).where(eq(stok.id, id));

      const [hareket] = await db
        .insert(stokHareket)
        .values({ stokId: id, userId: sub, type, quantity, reason, tedaviId })
        .returning();

      // Minimum seviye kontrolu
      if (newQty <= (item.minimumLevel ?? 5)) {
        // TODO: Notification Agent -> stok kritik uyari
        app.log.warn({ stokId: id, name: item.name, quantity: newQty }, "Stok kritik seviyede!");
      }

      return reply.send({ success: true, data: { stok: { ...item, quantity: newQty }, hareket } });
    },
  );

  // GET /api/stok/kritik - Kritik seviyedeki stoklar
  app.get(
    "/api/stok/kritik",
    { preHandler: requireRole("egitmen", "admin") },
    async (_request, reply) => {
      const items = await db.select().from(stok).where(eq(stok.isActive, true));
      const critical = items.filter((i) => i.quantity <= (i.minimumLevel ?? 5));
      return reply.send({ success: true, data: critical });
    },
  );
}
