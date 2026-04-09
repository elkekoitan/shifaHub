/**
 * Treatment Service — ShifaHub
 * Tedavi business logic: kontrendikasyon, stok, odeme, bildirim
 */

import { eq, desc, and, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { tedavi } from "../db/schema/tedavi.js";
import { stok, stokHareket } from "../db/schema/stok.js";
import { danisan } from "../db/schema/danisan.js";
import { odeme } from "../db/schema/odeme.js";
import { users } from "../db/schema/users.js";
import { ValidationError, ForbiddenError } from "../lib/errors.js";
import { createNotification } from "./notification.service.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateTreatmentInput {
  egitmenId: string;
  danisanId: string;
  treatmentType: string;
  treatmentDate?: Date;
  sessionNumber?: number;
  complaints?: string[];
  findings?: string;
  vitalSigns?: { bloodPressure?: string; pulse?: number };
  appliedTreatment?: string;
  recommendations?: string;
  nextSessionDate?: Date;
  bodyArea?: string;
  randevuId?: string;
  protokolId?: string;
  usedItems?: Array<{ stokId: string; quantity: number }>;
}

// ─── Kontrendikasyon Kurallari ────────────────────────────────────────────────

const BLOOD_TREATMENT_TYPES = ["hacamat_yas", "solucan", "hacamat_kuru"];
const INVASIVE_TREATMENT_TYPES = ["hacamat_yas", "solucan", "akupunktur"];
const BLOOD_THINNER_DRUGS = ["sulandirici", "warfarin", "aspirin", "klopidogrel", "heparin"];
const BLEEDING_KEYWORDS = ["kanama", "hemofili", "koagulopati", "trombo"];

export function checkContraindications(
  treatmentType: string,
  danisanProfil: {
    pregnancyStatus?: boolean | null;
    chronicDiseases?: string[] | null;
    currentMedications?: string[] | null;
  },
): string[] {
  const warnings: string[] = [];

  const diseases = (danisanProfil.chronicDiseases ?? []) as string[];
  const meds = (danisanProfil.currentMedications ?? []) as string[];
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

  return warnings;
}

// ─── Stok Kontrolu ve Dusme ──────────────────────────────────────────────────

export async function validateAndDeductStock(
  usedItems: Array<{ stokId: string; quantity: number }>,
  egitmenId: string,
  tedaviId: string,
  treatmentType: string,
  sessionNumber: number,
): Promise<{ totalCost: number; criticalAlerts: string[] }> {
  let totalCost = 0;
  const criticalAlerts: string[] = [];

  for (const item of usedItems) {
    const [stokItem] = await db.select().from(stok).where(eq(stok.id, item.stokId)).limit(1);

    if (!stokItem) {
      throw new ValidationError(`Stok kalemi bulunamadi: ${item.stokId}`);
    }
    if (stokItem.quantity < item.quantity) {
      throw new ValidationError(
        `Yetersiz stok: ${stokItem.name} (mevcut: ${stokItem.quantity}, istenen: ${item.quantity})`,
      );
    }

    const newQty = stokItem.quantity - item.quantity;

    // Stok guncelle
    await db
      .update(stok)
      .set({ quantity: newQty, updatedAt: new Date() })
      .where(eq(stok.id, item.stokId));

    // Hareket kaydi
    await db.insert(stokHareket).values({
      stokId: item.stokId,
      userId: egitmenId,
      type: "cikis",
      quantity: item.quantity,
      reason: `Tedavi: ${treatmentType} (Seans ${sessionNumber})`,
      tedaviId,
    });

    // Maliyet hesapla
    if (stokItem.unitPrice) {
      totalCost += Number(stokItem.unitPrice) * item.quantity;
    }

    // Kritik stok kontrolu
    if (newQty <= (stokItem.minimumLevel ?? 5)) {
      criticalAlerts.push(stokItem.name);
      await createNotification(
        egitmenId,
        "sistem",
        `Kritik Stok: ${stokItem.name}`,
        `${stokItem.name} stoku kritik seviyede: ${newQty} ${stokItem.unit || "adet"} kaldi.`,
        "/egitmen/stok",
      );
    }
  }

  return { totalCost, criticalAlerts };
}

// ─── Ana Servis Fonksiyonu ────────────────────────────────────────────────────

export async function createTreatment(input: CreateTreatmentInput) {
  const {
    egitmenId,
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

  // 1. Stok on-kontrol (miktarlar yeterliyse)
  if (usedItems.length > 0) {
    for (const item of usedItems) {
      const [stokItem] = await db.select().from(stok).where(eq(stok.id, item.stokId)).limit(1);
      if (!stokItem) throw new ValidationError(`Stok kalemi bulunamadi: ${item.stokId}`);
      if (stokItem.quantity < item.quantity) {
        throw new ValidationError(
          `Yetersiz stok: ${stokItem.name} (mevcut: ${stokItem.quantity}, istenen: ${item.quantity})`,
        );
      }
    }
  }

  // 2. Kontrendikasyon kontrolu
  const warnings: string[] = [];
  const [danisanProfil] = await db
    .select()
    .from(danisan)
    .where(eq(danisan.userId, danisanId))
    .limit(1);

  if (danisanProfil) {
    const contraWarnings = checkContraindications(treatmentType, danisanProfil);
    warnings.push(...contraWarnings);
  }

  // 3. Tedavi kaydi olustur
  const [created] = await db
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
    })
    .returning();

  if (!created) {
    throw new Error("Tedavi kaydi olusturulamadi");
  }

  // 4. Stok dusme (atomik degil ama kabul edilebilir - gecici)
  let totalCost = 0;
  if (usedItems.length > 0) {
    const stockResult = await validateAndDeductStock(
      usedItems,
      egitmenId,
      created.id,
      treatmentType,
      sessionNumber,
    );
    totalCost = stockResult.totalCost;
  }

  // 5. Otomatik odeme kaydi
  const [createdOdeme] = await db
    .insert(odeme)
    .values({
      danisanId,
      egitmenId,
      tedaviId: created.id,
      amount: totalCost.toFixed(2),
      status: "pending",
      description: `${treatmentType} - Seans ${sessionNumber}`,
    })
    .returning();

  // 6. Danisana bildirim
  await createNotification(
    danisanId,
    "tedavi_ozeti",
    "Tedavi Kaydi Olusturuldu",
    `${treatmentType} seansiniz kaydedildi. Seans ${sessionNumber}.`,
    "/danisan/tedavi",
  );

  return {
    tedavi: created,
    odeme: createdOdeme,
    warnings,
  };
}

// ─── Okuma Servisleri ─────────────────────────────────────────────────────────

export async function getTreatmentsByDanisan(
  danisanId: string,
  actorId: string,
  actorRole: string,
) {
  // Yetki kontrolu
  if (actorRole === "danisan" && danisanId !== actorId) {
    throw new ForbiddenError("Erisim yetkisi yok");
  }

  if (actorRole === "egitmen") {
    // Egitmen bu danisanla iliskili mi?
    const [hasTedavi] = await db
      .select({ id: tedavi.id })
      .from(tedavi)
      .where(and(eq(tedavi.danisanId, danisanId), eq(tedavi.egitmenId, actorId)))
      .limit(1);

    if (!hasTedavi) {
      throw new ForbiddenError("Bu danisanin tedavilerine erisim yetkiniz yok");
    }
  }

  const results = await db
    .select()
    .from(tedavi)
    .where(eq(tedavi.danisanId, danisanId))
    .orderBy(desc(tedavi.treatmentDate));

  // Egitmen adlarini ekle
  const egitmenIds = [...new Set(results.map((t) => t.egitmenId))];
  const egitmenMap = new Map<string, { firstName: string; lastName: string }>();

  if (egitmenIds.length > 0) {
    const egitmenRecords = await db
      .select({ id: users.id, firstName: users.firstName, lastName: users.lastName })
      .from(users)
      .where(
        egitmenIds.length === 1 ? eq(users.id, egitmenIds[0]!) : inArray(users.id, egitmenIds),
      );

    for (const e of egitmenRecords) {
      egitmenMap.set(e.id, { firstName: e.firstName, lastName: e.lastName });
    }
  }

  return results.map((t) => ({
    ...t,
    egitmenFirstName: egitmenMap.get(t.egitmenId)?.firstName ?? "",
    egitmenLastName: egitmenMap.get(t.egitmenId)?.lastName ?? "",
  }));
}
