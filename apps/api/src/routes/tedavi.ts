import type { FastifyInstance } from "fastify";
import { eq, desc, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { tedavi } from "../db/schema/tedavi.js";
import { tahlil } from "../db/schema/tahlil.js";
import { stok, stokHareket } from "../db/schema/stok.js";
import { users } from "../db/schema/users.js";
import { randevu } from "../db/schema/randevu.js";
import { odeme } from "../db/schema/odeme.js";
import { requireAuth, requireRole, getUser } from "../middleware/auth.js";
import { createAuditLog } from "../middleware/audit.js";
import { createTreatment } from "../services/treatment.service.js";

export async function tedaviRoutes(app: FastifyInstance) {
  // POST /api/tedavi — Yeni tedavi kaydi (treatment.service.ts ile)
  app.post("/api/tedavi", { preHandler: requireRole("egitmen") }, async (request, reply) => {
    const { sub } = getUser(request);
    const body = request.body as {
      danisanId: string;
      treatmentType: string;
      treatmentDate?: string;
      sessionNumber?: number;
      complaints?: string[];
      findings?: string;
      vitalSigns?: { bloodPressure?: string; pulse?: number };
      appliedTreatment?: string;
      recommendations?: string;
      nextSessionDate?: string;
      bodyArea?: string;
      randevuId?: string;
      protokolId?: string;
      usedItems?: Array<{ stokId: string; quantity: number }>;
    };

    const result = await createTreatment({
      egitmenId: sub,
      danisanId: body.danisanId,
      treatmentType: body.treatmentType,
      treatmentDate: body.treatmentDate ? new Date(body.treatmentDate) : undefined,
      sessionNumber: body.sessionNumber,
      complaints: body.complaints,
      findings: body.findings,
      vitalSigns: body.vitalSigns,
      appliedTreatment: body.appliedTreatment,
      recommendations: body.recommendations,
      nextSessionDate: body.nextSessionDate ? new Date(body.nextSessionDate) : undefined,
      bodyArea: body.bodyArea,
      randevuId: body.randevuId,
      protokolId: body.protokolId,
      usedItems: body.usedItems,
    });

    await createAuditLog({
      userId: sub,
      action: "create",
      tableName: "tedavi",
      recordId: result.tedavi.id,
      description: `Tedavi: ${body.treatmentType} | Stok: ${body.usedItems?.length ?? 0} kalem | Uyarilar: ${result.warnings.length}`,
      request,
    });

    return reply.status(201).send({
      success: true,
      data: result.tedavi,
      odeme: result.odeme,
      warnings: result.warnings.length > 0 ? result.warnings : undefined,
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

  // DELETE /api/tedavi/:id - Tedavi sil (stok iade + odeme iptal)
  app.delete("/api/tedavi/:id", { preHandler: requireRole("egitmen") }, async (request, reply) => {
    const { sub } = getUser(request);
    const { id } = request.params as { id: string };

    const [existing] = await db.select().from(tedavi).where(eq(tedavi.id, id)).limit(1);
    if (!existing) return reply.status(404).send({ success: false, error: "Tedavi bulunamadi" });
    if (existing.egitmenId !== sub)
      return reply.status(403).send({ success: false, error: "Bu tedaviyi silme yetkiniz yok" });

    // Stok iade: bu tedaviye ait cikis hareketlerini bul ve geri ekle
    const hareketler = await db
      .select()
      .from(stokHareket)
      .where(and(eq(stokHareket.tedaviId, id), eq(stokHareket.type, "cikis")));

    for (const hareket of hareketler) {
      const [stokItem] = await db.select().from(stok).where(eq(stok.id, hareket.stokId)).limit(1);
      if (stokItem) {
        await db
          .update(stok)
          .set({ quantity: stokItem.quantity + hareket.quantity, updatedAt: new Date() })
          .where(eq(stok.id, hareket.stokId));
        // Iade hareketi kaydet
        await db.insert(stokHareket).values({
          stokId: hareket.stokId,
          userId: sub,
          type: "giris",
          quantity: hareket.quantity,
          reason: `Tedavi silindi - stok iade`,
          tedaviId: id,
        });
      }
    }

    // Iliskili odeme kayitlarini iptal et
    const [iliskiliOdeme] = await db.select().from(odeme).where(eq(odeme.tedaviId, id)).limit(1);
    if (iliskiliOdeme && iliskiliOdeme.status === "pending") {
      await db.delete(odeme).where(eq(odeme.id, iliskiliOdeme.id));
    }

    await db.delete(tedavi).where(eq(tedavi.id, id));
    await createAuditLog({
      userId: sub,
      action: "delete",
      tableName: "tedavi",
      recordId: id,
      description: `Tedavi silindi. Stok iade: ${hareketler.length} kalem`,
      request,
    });
    return reply.send({ success: true, message: "Tedavi silindi, stok iade edildi" });
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
