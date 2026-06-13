import { TRPCError } from "@trpc/server";
import { desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { bildirim, danisan, odeme, stok, stokHareket, tedavi, users } from "@shifahub/db";
import { router, protectedProcedure, egitmenProcedure } from "../trpc";

// ─── Girdi Semalari ────────────────────────────────────────────────────────────

const complaintSchema = z.object({
  priority: z.number().int().min(1),
  description: z.string().min(1, "Sikayet aciklamasi zorunlu"),
  bodyArea: z.string().optional(),
});

const vitalSignsSchema = z.object({
  bloodPressure: z.string().optional(),
  pulse: z.number().optional(),
  temperature: z.number().optional(),
  weight: z.number().optional(),
});

const usedItemSchema = z.object({
  stokId: z.string().uuid(),
  quantity: z.number().int().min(1, "Miktar en az 1 olmali"),
});

const createTedaviSchema = z.object({
  danisanId: z.string().uuid("Gecersiz danisan ID"),
  treatmentType: z.string().min(1, "Tedavi tipi zorunlu"),
  treatmentDate: z.coerce.date().optional(),
  sessionNumber: z.number().int().min(1).optional(),
  complaints: z.array(complaintSchema).optional(),
  findings: z.string().optional(),
  vitalSigns: vitalSignsSchema.optional(),
  appliedTreatment: z.string().optional(),
  recommendations: z.string().optional(),
  nextSessionDate: z.coerce.date().optional(),
  bodyArea: z.string().optional(),
  randevuId: z.string().uuid().optional(),
  protokolId: z.string().uuid().optional(),
  usedItems: z.array(usedItemSchema).optional(),
});

// ─── Kontrendikasyon Kurallari ────────────────────────────────────────────────
// Eski treatment.service.ts -> checkContraindications birebir port.

const BLOOD_TREATMENT_TYPES = ["hacamat_yas", "solucan", "hacamat_kuru"];
const INVASIVE_TREATMENT_TYPES = ["hacamat_yas", "solucan", "akupunktur"];
const BLOOD_THINNER_DRUGS = ["sulandirici", "warfarin", "aspirin", "klopidogrel", "heparin"];
const BLEEDING_KEYWORDS = ["kanama", "hemofili", "koagulopati", "trombo"];

interface DanisanProfil {
  pregnancyStatus?: boolean | null;
  chronicDiseases?: string[] | null;
  currentMedications?: string[] | null;
  allergies?: string[] | null;
}

function checkContraindications(treatmentType: string, danisanProfil: DanisanProfil): string[] {
  const warnings: string[] = [];

  const diseases = danisanProfil.chronicDiseases ?? [];
  const meds = danisanProfil.currentMedications ?? [];
  const allergies = danisanProfil.allergies ?? [];
  const isPregnant = danisanProfil.pregnancyStatus;

  // Hamilelik uyarisi
  if (isPregnant && BLOOD_TREATMENT_TYPES.includes(treatmentType)) {
    warnings.push("UYARI: Hamilelik durumunda bu tedavi tipi uygulanmamali");
  }

  // Kanama bozuklugu
  if (
    diseases.some((d) => BLEEDING_KEYWORDS.some((k) => d.toLowerCase().includes(k))) &&
    INVASIVE_TREATMENT_TYPES.includes(treatmentType)
  ) {
    warnings.push("UYARI: Kanama bozuklugu - invaziv tedaviler riskli");
  }

  // Hemofili
  if (diseases.some((d) => d.toLowerCase().includes("hemofili"))) {
    warnings.push("UYARI: Hemofili tanisi - invaziv tedavilerden kacinilmali");
  }

  // Kan sulandirici
  if (meds.some((m) => BLOOD_THINNER_DRUGS.some((k) => m.toLowerCase().includes(k)))) {
    warnings.push("UYARI: Kan sulandirici ilac kullanimi - kanama riski yuksek");
  }

  // Alerji kontrolu — kan sulandirici alerjisi + invaziv tedavi
  if (
    allergies.some((a) => BLOOD_THINNER_DRUGS.some((k) => a.toLowerCase().includes(k))) &&
    INVASIVE_TREATMENT_TYPES.includes(treatmentType)
  ) {
    warnings.push(
      `UYARI: Alerji tespit edildi (${allergies.join(", ")}) — invaziv tedavi oncesi dikkat`,
    );
  }

  // Genel alerji uyarisi — herhangi bir alerji varsa bilgilendir
  if (allergies.length > 0) {
    warnings.push(`BILGI: Danisanin alerjileri: ${allergies.join(", ")}`);
  }

  // Diyabet + hacamat uyarisi
  if (
    diseases.some((d) => d.toLowerCase().includes("diyabet")) &&
    BLOOD_TREATMENT_TYPES.includes(treatmentType)
  ) {
    warnings.push("UYARI: Diyabet — yara iyilesmesi yavastir, dikkatli olunmali");
  }

  // Hipertansiyon uyarisi
  if (diseases.some((d) => d.toLowerCase().includes("hipertansiyon"))) {
    warnings.push("BILGI: Hipertansiyon — tansiyon olcumu tedavi oncesi yapilmali");
  }

  return warnings;
}

// ─── Otomatik Odeme Baz Fiyatlari ──────────────────────────────────────────────

const BASE_PRICES: Record<string, number> = {
  hacamat_kuru: 300,
  hacamat_yas: 400,
  solucan: 500,
  sujok: 250,
  refleksoloji: 200,
  akupunktur: 350,
  fitoterapi: 200,
  ozon: 450,
  kupa: 250,
};

// ─── Router ────────────────────────────────────────────────────────────────────

export const tedaviRouter = router({
  /**
   * Yeni tedavi kaydi. Kontrendikasyon kontrolu, stok dusumu (kritik stok
   * uyarisi), otomatik odeme ve danisan bildirimi ile birlikte.
   * RLS transaction icinde calistigi icin tum adimlar atomiktir.
   */
  create: egitmenProcedure.input(createTedaviSchema).mutation(async ({ ctx, input }) => {
    const egitmenId = ctx.user.id;
    const {
      danisanId,
      treatmentType,
      treatmentDate = new Date(),
      sessionNumber = 1,
      complaints = [],
      findings,
      vitalSigns,
      appliedTreatment,
      recommendations,
      nextSessionDate,
      bodyArea,
      randevuId,
      protokolId,
      usedItems = [],
    } = input;

    // 1. Stok on-kontrol (miktarlar yeterli mi?)
    if (usedItems.length > 0) {
      for (const item of usedItems) {
        const [stokItem] = await ctx.db
          .select()
          .from(stok)
          .where(eq(stok.id, item.stokId))
          .limit(1);
        if (!stokItem) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Stok kalemi bulunamadi: ${item.stokId}`,
          });
        }
        if (stokItem.quantity < item.quantity) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Yetersiz stok: ${stokItem.name} (mevcut: ${stokItem.quantity}, istenen: ${item.quantity})`,
          });
        }
      }
    }

    // 2. Kontrendikasyon kontrolu
    const warnings: string[] = [];
    const [danisanProfil] = await ctx.db
      .select()
      .from(danisan)
      .where(eq(danisan.userId, danisanId))
      .limit(1);

    if (danisanProfil) {
      warnings.push(...checkContraindications(treatmentType, danisanProfil));
    }

    // 3. Tedavi kaydi olustur
    const [created] = await ctx.db
      .insert(tedavi)
      .values({
        egitmenId,
        danisanId,
        treatmentType,
        treatmentDate,
        sessionNumber,
        complaints,
        findings,
        vitalSigns,
        appliedTreatment,
        recommendations,
        nextSessionDate,
        bodyArea,
        randevuId,
        protokolId,
        contraindications: warnings,
      })
      .returning();

    if (!created) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Tedavi kaydi olusturulamadi",
      });
    }

    // 4. Stok dusumu + kritik stok uyarisi (eski validateAndDeductStock port)
    let totalCost = 0;
    for (const item of usedItems) {
      const [stokItem] = await ctx.db.select().from(stok).where(eq(stok.id, item.stokId)).limit(1);

      if (!stokItem) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Stok kalemi bulunamadi: ${item.stokId}`,
        });
      }
      if (stokItem.quantity < item.quantity) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Yetersiz stok: ${stokItem.name} (mevcut: ${stokItem.quantity}, istenen: ${item.quantity})`,
        });
      }

      const newQty = stokItem.quantity - item.quantity;

      // Stok guncelle
      await ctx.db.update(stok).set({ quantity: newQty }).where(eq(stok.id, item.stokId));

      // Hareket kaydi
      await ctx.db.insert(stokHareket).values({
        stokId: item.stokId,
        userId: egitmenId,
        type: "cikis",
        quantity: item.quantity,
        reason: `Tedavi: ${treatmentType} (Seans ${sessionNumber})`,
        tedaviId: created.id,
      });

      // Maliyet hesapla
      if (stokItem.unitPrice) {
        totalCost += Number(stokItem.unitPrice) * item.quantity;
      }

      // Kritik stok kontrolu -> egitmene bildirim
      if (newQty <= (stokItem.minimumLevel ?? 5)) {
        warnings.push(`Kritik stok: ${stokItem.name} (${newQty} ${stokItem.unit} kaldi)`);
        await ctx.db.insert(bildirim).values({
          userId: egitmenId,
          type: "sistem",
          title: `Kritik Stok: ${stokItem.name}`,
          body: `${stokItem.name} stoku kritik seviyede: ${newQty} ${stokItem.unit} kaldi.`,
          actionUrl: "/egitmen/stok",
        });
      }
    }

    // 5. Otomatik odeme kaydi — baz fiyat + stok maliyeti
    const basePrice = BASE_PRICES[treatmentType] ?? 200;
    const finalAmount = basePrice + totalCost;

    const [createdOdeme] = await ctx.db
      .insert(odeme)
      .values({
        danisanId,
        egitmenId,
        tedaviId: created.id,
        amount: finalAmount.toFixed(2),
        status: "pending",
        description: `${treatmentType} - Seans ${sessionNumber}`,
      })
      .returning();

    // 6. Danisana bildirim
    await ctx.db.insert(bildirim).values({
      userId: danisanId,
      type: "tedavi_ozeti",
      title: "Tedavi Kaydi Olusturuldu",
      body: `${treatmentType} seansiniz kaydedildi. Seans ${sessionNumber}.`,
      actionUrl: "/danisan/tedavi",
    });

    return {
      tedavi: created,
      odeme: createdOdeme,
      warnings,
    };
  }),

  /**
   * Bir danisanin tedavi gecmisi (egitmen adlariyla zenginlestirilmis).
   * RLS, cagiranin gormeye yetkili oldugu satirlari otomatik filtreler.
   */
  list: protectedProcedure
    .input(z.object({ danisanId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const results = await ctx.db
        .select()
        .from(tedavi)
        .where(eq(tedavi.danisanId, input.danisanId))
        .orderBy(desc(tedavi.treatmentDate));

      // Egitmen adlarini ekle
      const egitmenIds = [...new Set(results.map((t) => t.egitmenId))];
      const egitmenMap = new Map<string, { firstName: string; lastName: string }>();

      if (egitmenIds.length > 0) {
        const egitmenRecords = await ctx.db
          .select({ id: users.id, firstName: users.firstName, lastName: users.lastName })
          .from(users)
          .where(inArray(users.id, egitmenIds));

        for (const e of egitmenRecords) {
          egitmenMap.set(e.id, { firstName: e.firstName, lastName: e.lastName });
        }
      }

      return results.map((t) => ({
        ...t,
        egitmenFirstName: egitmenMap.get(t.egitmenId)?.firstName ?? "",
        egitmenLastName: egitmenMap.get(t.egitmenId)?.lastName ?? "",
      }));
    }),

  /**
   * Bir danisanin son tedavisi (geri bildirim formu icin).
   */
  getLast: protectedProcedure
    .input(z.object({ danisanId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [last] = await ctx.db
        .select()
        .from(tedavi)
        .where(eq(tedavi.danisanId, input.danisanId))
        .orderBy(desc(tedavi.treatmentDate))
        .limit(1);
      return last ?? null;
    }),

  /**
   * Tek tedavi kaydi.
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [result] = await ctx.db.select().from(tedavi).where(eq(tedavi.id, input.id)).limit(1);
      if (!result) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tedavi bulunamadi" });
      }
      return result;
    }),
});
