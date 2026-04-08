import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { stok, stokHareket } from "../db/schema/stok.js";
import { bildirim } from "../db/schema/bildirim.js";
import { requireRole, getUser } from "../middleware/auth.js";
import { createAuditLog } from "../middleware/audit.js";

export async function stokRoutes(app: FastifyInstance) {
  // GET /api/stok - Stok listesi (son kullanma tarihi gecmisleri isaretle)
  app.get("/api/stok", { preHandler: requireRole("egitmen", "admin") }, async (_request, reply) => {
    const items = await db.select().from(stok).where(eq(stok.isActive, true));
    const now = new Date();

    // Son kullanma tarihi kontrolu
    const enriched = items.map((item) => ({
      ...item,
      isExpired: item.expiryDate ? new Date(item.expiryDate) < now : false,
      isExpiringSoon: item.expiryDate
        ? new Date(item.expiryDate) < new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) &&
          new Date(item.expiryDate) >= now
        : false,
      isCritical: item.quantity <= (item.minimumLevel ?? 5),
    }));

    return reply.send({ success: true, data: enriched });
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

  // PUT /api/stok/:id - Stok kalemi guncelle
  app.put(
    "/api/stok/:id",
    { preHandler: requireRole("egitmen", "admin") },
    async (request, reply) => {
      const { sub } = getUser(request);
      const { id } = request.params as { id: string };
      const body = request.body as Partial<typeof stok.$inferInsert>;

      const [existing] = await db.select().from(stok).where(eq(stok.id, id)).limit(1);
      if (!existing)
        return reply.status(404).send({ success: false, error: "Stok kalemi bulunamadi" });

      const [updated] = await db
        .update(stok)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(stok.id, id))
        .returning();
      await createAuditLog({
        userId: sub,
        action: "update",
        tableName: "stok",
        recordId: id,
        description: `Stok guncellendi: ${existing.name}`,
        request,
      });
      return reply.send({ success: true, data: updated });
    },
  );

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

      // Son kullanma tarihi gecmis urunlerden cikis yapilmasini engelle
      if (type === "cikis" && item.expiryDate && new Date(item.expiryDate) < new Date()) {
        return reply
          .status(400)
          .send({ success: false, error: `Son kullanma tarihi gecmis: ${item.name}` });
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

      // Minimum seviye kontrolu - proaktif bildirim olustur
      if (newQty <= (item.minimumLevel ?? 5)) {
        await db.insert(bildirim).values({
          userId: sub,
          type: "sistem",
          title: `Kritik Stok: ${item.name}`,
          body: `${item.name} stoku kritik seviyede: ${newQty} ${item.unit || "adet"} kaldi.`,
        });
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
      const now = new Date();
      const critical = items.filter(
        (i) =>
          i.quantity <= (i.minimumLevel ?? 5) || (i.expiryDate && new Date(i.expiryDate) < now),
      );
      return reply.send({ success: true, data: critical });
    },
  );

  // GET /api/stok/:id/hareketler - Stok hareket gecmisi
  app.get(
    "/api/stok/:id/hareketler",
    { preHandler: requireRole("egitmen", "admin") },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const hareketler = await db.select().from(stokHareket).where(eq(stokHareket.stokId, id));
      return reply.send({ success: true, data: hareketler });
    },
  );
}
