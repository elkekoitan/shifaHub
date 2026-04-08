import type { FastifyInstance } from "fastify";
import { eq, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { tedavi } from "../db/schema/tedavi.js";
import { tahlil } from "../db/schema/tahlil.js";
import { stok, stokHareket } from "../db/schema/stok.js";
import { bildirim } from "../db/schema/bildirim.js";
import { danisan } from "../db/schema/danisan.js";
import { requireAuth, requireRole, getUser } from "../middleware/auth.js";
import { createAuditLog } from "../middleware/audit.js";

export async function tedaviRoutes(app: FastifyInstance) {
  // POST /api/tedavi - Yeni tedavi kaydi + stok dusme + bildirim
  app.post("/api/tedavi", { preHandler: requireRole("egitmen") }, async (request, reply) => {
    const { sub } = getUser(request);
    const body = request.body as typeof tedavi.$inferInsert & {
      usedItems?: Array<{ stokId: string; quantity: number }>;
    };

    const treatmentDate = body.treatmentDate ? new Date(body.treatmentDate as unknown as string) : new Date();
    const nextSessionDate = body.nextSessionDate ? new Date(body.nextSessionDate as unknown as string) : undefined;

    // 1. Stok yeterliligi kontrolu
    if (body.usedItems && body.usedItems.length > 0) {
      for (const item of body.usedItems) {
        const [stokItem] = await db.select().from(stok).where(eq(stok.id, item.stokId)).limit(1);
        if (!stokItem) {
          return reply.status(400).send({ success: false, error: `Stok kalemi bulunamadi: ${item.stokId}` });
        }
        if (stokItem.quantity < item.quantity) {
          return reply.status(400).send({
            success: false,
            error: `Yetersiz stok: ${stokItem.name} (mevcut: ${stokItem.quantity}, istenen: ${item.quantity})`,
          });
        }
      }
    }

    // 2. Kontrendikasyon kontrolu
    const warnings: string[] = [];
    if (body.danisanId && body.treatmentType) {
      const [danisanProfil] = await db.select().from(danisan).where(eq(danisan.userId, body.danisanId as string)).limit(1);
      if (danisanProfil) {
        const diseases = (danisanProfil.chronicDiseases || []) as string[];
        const meds = (danisanProfil.currentMedications || []) as string[];
        const isPregnant = danisanProfil.pregnancyStatus;

        if (isPregnant && ["hacamat_yas", "solucan"].includes(body.treatmentType)) {
          warnings.push("UYARI: Hamilelik durumunda bu tedavi tipi uygulanmamali");
        }
        if (diseases.some(d => d.toLowerCase().includes("kanama")) && ["hacamat_yas", "solucan"].includes(body.treatmentType)) {
          warnings.push("UYARI: Kanama bozuklugu - kan aldirma tedavileri riskli");
        }
        if (diseases.some(d => d.toLowerCase().includes("hemofili"))) {
          warnings.push("UYARI: Hemofili tanisi - invaziv tedavilerden kacinilmali");
        }
        if (meds.some(m => m.toLowerCase().includes("sulandirici") || m.toLowerCase().includes("warfarin") || m.toLowerCase().includes("aspirin"))) {
          warnings.push("UYARI: Kan sulandirici ilac kullanimi - kanama riski yuksek");
        }
      }
    }

    // 3. Tedavi kaydi olustur
    const { usedItems: _usedItems, ...tedaviData } = body;
    const [created] = await db
      .insert(tedavi)
      .values({ ...tedaviData, egitmenId: sub, treatmentDate, nextSessionDate })
      .returning();

    if (!created) {
      return reply.status(500).send({ success: false, error: "Tedavi kaydi olusturulamadi" });
    }

    // 4. Stok dusme
    if (body.usedItems && body.usedItems.length > 0) {
      for (const item of body.usedItems) {
        const [stokItem] = await db.select().from(stok).where(eq(stok.id, item.stokId)).limit(1);
        if (stokItem) {
          const newQty = stokItem.quantity - item.quantity;
          await db.update(stok).set({ quantity: newQty, updatedAt: new Date() }).where(eq(stok.id, item.stokId));
          await db.insert(stokHareket).values({
            stokId: item.stokId,
            userId: sub,
            type: "cikis",
            quantity: item.quantity,
            reason: `Tedavi: ${body.treatmentType} (Seans ${body.sessionNumber || 1})`,
            tedaviId: created.id,
          });

          // Kritik stok uyarisi
          if (newQty <= (stokItem.minimumLevel ?? 5)) {
            await db.insert(bildirim).values({
              userId: sub,
              type: "sistem",
              title: `Kritik Stok: ${stokItem.name}`,
              body: `${stokItem.name} stoku kritik seviyede: ${newQty} ${stokItem.unit} kaldi.`,
            });
          }
        }
      }
    }

    // 5. Danisana bildirim gonder
    if (body.danisanId) {
      await db.insert(bildirim).values({
        userId: body.danisanId as string,
        type: "tedavi_ozeti",
        title: "Tedavi Kaydi Olusturuldu",
        body: `${body.treatmentType || "Tedavi"} seansiniz kaydedildi. Seans ${body.sessionNumber || 1}.`,
        actionUrl: "/danisan/tedavi",
      });
    }

    await createAuditLog({
      userId: sub,
      action: "create",
      tableName: "tedavi",
      recordId: created.id,
      description: `Tedavi: ${body.treatmentType} | Stok dusme: ${body.usedItems?.length || 0} kalem`,
      request,
    });

    return reply.status(201).send({ success: true, data: created, warnings: warnings.length > 0 ? warnings : undefined });
  });

  // GET /api/tedavi/danisan/:danisanId
  app.get("/api/tedavi/danisan/:danisanId", { preHandler: requireAuth() }, async (request, reply) => {
    const { sub, role } = getUser(request);
    const { danisanId } = request.params as { danisanId: string };
    if (role === "danisan" && danisanId !== sub) {
      return reply.status(403).send({ success: false, error: "Erisim yetkisi yok" });
    }
    const results = await db.select().from(tedavi).where(eq(tedavi.danisanId, danisanId)).orderBy(desc(tedavi.treatmentDate));
    return reply.send({ success: true, data: results });
  });

  // GET /api/tedavi/danisan/:danisanId/last - Son tedavi (geri bildirim icin)
  app.get("/api/tedavi/danisan/:danisanId/last", { preHandler: requireAuth() }, async (request, reply) => {
    const { danisanId } = request.params as { danisanId: string };
    const [last] = await db.select().from(tedavi).where(eq(tedavi.danisanId, danisanId)).orderBy(desc(tedavi.treatmentDate)).limit(1);
    return reply.send({ success: true, data: last || null });
  });

  // GET /api/tedavi/:id
  app.get("/api/tedavi/:id", { preHandler: requireAuth() }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const [result] = await db.select().from(tedavi).where(eq(tedavi.id, id)).limit(1);
    if (!result) return reply.status(404).send({ success: false, error: "Tedavi bulunamadi" });
    return reply.send({ success: true, data: result });
  });

  // POST /api/tahlil
  app.post("/api/tahlil", { preHandler: requireAuth() }, async (request, reply) => {
    const { sub } = getUser(request);
    const body = request.body as typeof tahlil.$inferInsert;
    const testDate = body.testDate ? new Date(body.testDate as unknown as string) : new Date();

    const [created] = await db.insert(tahlil).values({ ...body, danisanId: body.danisanId || sub, testDate }).returning();
    if (!created) return reply.status(500).send({ success: false, error: "Tahlil olusturulamadi" });

    // Danisana bildirim
    if (body.danisanId) {
      await db.insert(bildirim).values({
        userId: body.danisanId as string,
        type: "tahlil_sonucu",
        title: "Tahlil Sonucu Eklendi",
        body: `${body.testType} tahlil sonucunuz sisteme eklendi.`,
        actionUrl: "/danisan/tahlil",
      });
    }

    await createAuditLog({ userId: sub, action: "create", tableName: "tahlil", recordId: created.id, request });
    return reply.status(201).send({ success: true, data: created });
  });

  // GET /api/tahlil/danisan/:danisanId
  app.get("/api/tahlil/danisan/:danisanId", { preHandler: requireAuth() }, async (request, reply) => {
    const { danisanId } = request.params as { danisanId: string };
    const results = await db.select().from(tahlil).where(eq(tahlil.danisanId, danisanId)).orderBy(desc(tahlil.testDate));
    return reply.send({ success: true, data: results });
  });
}
