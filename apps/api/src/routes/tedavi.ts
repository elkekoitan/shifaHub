import type { FastifyInstance } from "fastify";
import { eq, desc, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { tedavi } from "../db/schema/tedavi.js";
import { tahlil } from "../db/schema/tahlil.js";
import { stok, stokHareket } from "../db/schema/stok.js";
import { bildirim } from "../db/schema/bildirim.js";
import { danisan } from "../db/schema/danisan.js";
import { users } from "../db/schema/users.js";
import { randevu } from "../db/schema/randevu.js";
import { odeme } from "../db/schema/odeme.js";
import { requireAuth, requireRole, getUser } from "../middleware/auth.js";
import { createAuditLog } from "../middleware/audit.js";

export async function tedaviRoutes(app: FastifyInstance) {
  // POST /api/tedavi - Yeni tedavi kaydi + stok dusme + bildirim
  app.post("/api/tedavi", { preHandler: requireRole("egitmen") }, async (request, reply) => {
    const { sub } = getUser(request);
    const body = request.body as typeof tedavi.$inferInsert & {
      usedItems?: Array<{ stokId: string; quantity: number }>;
    };

    const treatmentDate = body.treatmentDate
      ? new Date(body.treatmentDate as unknown as string)
      : new Date();
    const nextSessionDate = body.nextSessionDate
      ? new Date(body.nextSessionDate as unknown as string)
      : undefined;

    // 1. Stok yeterliligi kontrolu
    if (body.usedItems && body.usedItems.length > 0) {
      for (const item of body.usedItems) {
        const [stokItem] = await db.select().from(stok).where(eq(stok.id, item.stokId)).limit(1);
        if (!stokItem) {
          return reply
            .status(400)
            .send({ success: false, error: `Stok kalemi bulunamadi: ${item.stokId}` });
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
      const [danisanProfil] = await db
        .select()
        .from(danisan)
        .where(eq(danisan.userId, body.danisanId as string))
        .limit(1);
      if (danisanProfil) {
        const diseases = (danisanProfil.chronicDiseases || []) as string[];
        const meds = (danisanProfil.currentMedications || []) as string[];
        const isPregnant = danisanProfil.pregnancyStatus;

        if (isPregnant && ["hacamat_yas", "solucan"].includes(body.treatmentType)) {
          warnings.push("UYARI: Hamilelik durumunda bu tedavi tipi uygulanmamali");
        }
        if (
          diseases.some((d) => d.toLowerCase().includes("kanama")) &&
          ["hacamat_yas", "solucan"].includes(body.treatmentType)
        ) {
          warnings.push("UYARI: Kanama bozuklugu - kan aldirma tedavileri riskli");
        }
        if (diseases.some((d) => d.toLowerCase().includes("hemofili"))) {
          warnings.push("UYARI: Hemofili tanisi - invaziv tedavilerden kacinilmali");
        }
        if (
          meds.some(
            (m) =>
              m.toLowerCase().includes("sulandirici") ||
              m.toLowerCase().includes("warfarin") ||
              m.toLowerCase().includes("aspirin"),
          )
        ) {
          warnings.push("UYARI: Kan sulandirici ilac kullanimi - kanama riski yuksek");
        }
      }
    }

    // 3. Tedavi kaydi olustur
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
          await db
            .update(stok)
            .set({ quantity: newQty, updatedAt: new Date() })
            .where(eq(stok.id, item.stokId));
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

    // 5. Otomatik odeme kaydi olustur
    let createdOdeme = null;
    if (body.danisanId) {
      // Stok maliyetlerini hesapla
      let totalCost = 0;
      if (body.usedItems && body.usedItems.length > 0) {
        for (const item of body.usedItems) {
          const [stokItem] = await db.select().from(stok).where(eq(stok.id, item.stokId)).limit(1);
          if (stokItem && stokItem.unitPrice) {
            totalCost += Number(stokItem.unitPrice) * item.quantity;
          }
        }
      }

      const [odemeSonuc] = await db
        .insert(odeme)
        .values({
          danisanId: body.danisanId as string,
          egitmenId: sub,
          tedaviId: created.id,
          amount: totalCost.toFixed(2),
          status: "pending",
          description: `${body.treatmentType || "Tedavi"} - Seans ${body.sessionNumber || 1}`,
        })
        .returning();
      createdOdeme = odemeSonuc;
    }

    // 6. Danisana bildirim gonder
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
      description: `Tedavi: ${body.treatmentType} | Stok dusme: ${body.usedItems?.length || 0} kalem | Odeme: ${createdOdeme ? "olusturuldu" : "yok"}`,
      request,
    });

    return reply
      .status(201)
      .send({
        success: true,
        data: created,
        odeme: createdOdeme,
        warnings: warnings.length > 0 ? warnings : undefined,
      });
  });

  // GET /api/tedavi/danisan/:danisanId
  app.get(
    "/api/tedavi/danisan/:danisanId",
    { preHandler: requireAuth() },
    async (request, reply) => {
      const { sub, role } = getUser(request);
      const { danisanId } = request.params as { danisanId: string };
      if (role === "danisan" && danisanId !== sub) {
        return reply.status(403).send({ success: false, error: "Erisim yetkisi yok" });
      }
      // Egitmen ise: bu danisanla iliskisi var mi kontrol et
      if (role === "egitmen") {
        const [hasTedavi] = await db
          .select({ id: tedavi.id })
          .from(tedavi)
          .where(and(eq(tedavi.egitmenId, sub), eq(tedavi.danisanId, danisanId)))
          .limit(1);
        if (!hasTedavi) {
          const [hasRandevu] = await db
            .select({ id: randevu.id })
            .from(randevu)
            .where(and(eq(randevu.egitmenId, sub), eq(randevu.danisanId, danisanId)))
            .limit(1);
          if (!hasRandevu) {
            return reply
              .status(403)
              .send({ success: false, error: "Bu danisanin tedavi gecmisine erisim yetkiniz yok" });
          }
        }
      }
      const results = await db
        .select()
        .from(tedavi)
        .where(eq(tedavi.danisanId, danisanId))
        .orderBy(desc(tedavi.treatmentDate));

      // Egitmen adlarini ekle
      const egitmenIds = [...new Set(results.map((r) => r.egitmenId))];
      const egitmenMap = new Map<string, { firstName: string; lastName: string }>();
      for (const eid of egitmenIds) {
        const [u] = await db
          .select({ firstName: users.firstName, lastName: users.lastName })
          .from(users)
          .where(eq(users.id, eid))
          .limit(1);
        if (u) egitmenMap.set(eid, u);
      }
      const enriched = results.map((r) => ({
        ...r,
        egitmenFirstName: egitmenMap.get(r.egitmenId)?.firstName ?? "",
        egitmenLastName: egitmenMap.get(r.egitmenId)?.lastName ?? "",
      }));

      return reply.send({ success: true, data: enriched });
    },
  );

  // GET /api/tedavi/danisan/:danisanId/last - Son tedavi (geri bildirim icin)
  app.get(
    "/api/tedavi/danisan/:danisanId/last",
    { preHandler: requireAuth() },
    async (request, reply) => {
      const { danisanId } = request.params as { danisanId: string };
      const [last] = await db
        .select()
        .from(tedavi)
        .where(eq(tedavi.danisanId, danisanId))
        .orderBy(desc(tedavi.treatmentDate))
        .limit(1);
      return reply.send({ success: true, data: last || null });
    },
  );

  // PUT /api/tedavi/:id - Tedavi guncelle
  app.put("/api/tedavi/:id", { preHandler: requireRole("egitmen") }, async (request, reply) => {
    const { sub } = getUser(request);
    const { id } = request.params as { id: string };
    const body = request.body as Partial<typeof tedavi.$inferInsert>;

    const [existing] = await db.select().from(tedavi).where(eq(tedavi.id, id)).limit(1);
    if (!existing) return reply.status(404).send({ success: false, error: "Tedavi bulunamadi" });
    if (existing.egitmenId !== sub)
      return reply
        .status(403)
        .send({ success: false, error: "Bu tedaviyi guncelleme yetkiniz yok" });

    const [updated] = await db
      .update(tedavi)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(tedavi.id, id))
      .returning();
    await createAuditLog({
      userId: sub,
      action: "update",
      tableName: "tedavi",
      recordId: id,
      description: "Tedavi guncellendi",
      request,
    });
    return reply.send({ success: true, data: updated });
  });

  // DELETE /api/tedavi/:id - Tedavi sil
  app.delete("/api/tedavi/:id", { preHandler: requireRole("egitmen") }, async (request, reply) => {
    const { sub } = getUser(request);
    const { id } = request.params as { id: string };

    const [existing] = await db.select().from(tedavi).where(eq(tedavi.id, id)).limit(1);
    if (!existing) return reply.status(404).send({ success: false, error: "Tedavi bulunamadi" });
    if (existing.egitmenId !== sub)
      return reply.status(403).send({ success: false, error: "Bu tedaviyi silme yetkiniz yok" });

    await db.delete(tedavi).where(eq(tedavi.id, id));
    await createAuditLog({
      userId: sub,
      action: "delete",
      tableName: "tedavi",
      recordId: id,
      description: "Tedavi silindi",
      request,
    });
    return reply.send({ success: true, message: "Tedavi silindi" });
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

    const [created] = await db
      .insert(tahlil)
      .values({ ...body, danisanId: body.danisanId || sub, testDate })
      .returning();
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

    await createAuditLog({
      userId: sub,
      action: "create",
      tableName: "tahlil",
      recordId: created.id,
      request,
    });
    return reply.status(201).send({ success: true, data: created });
  });

  // GET /api/tahlil/danisan/:danisanId
  app.get(
    "/api/tahlil/danisan/:danisanId",
    { preHandler: requireAuth() },
    async (request, reply) => {
      const { danisanId } = request.params as { danisanId: string };
      const results = await db
        .select()
        .from(tahlil)
        .where(eq(tahlil.danisanId, danisanId))
        .orderBy(desc(tahlil.testDate));
      return reply.send({ success: true, data: results });
    },
  );
}
