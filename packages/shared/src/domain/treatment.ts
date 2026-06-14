// Tedavi (treatment) domain — saf kontrendikasyon kurallari + baz fiyatlar.
// tRPC tedavi routeri buradan import eder (tek kaynak). Eski treatment.service.ts
// -> checkContraindications birebir korunmustur.

/** Kanli/kan iceren tedavi tipleri (hamilelik + diyabet uyarisi tetikler). */
export const BLOOD_TREATMENT_TYPES = ["hacamat_yas", "solucan", "hacamat_kuru"];
/** Invaziv tedavi tipleri (kanama/alerji uyarisi tetikler). */
export const INVASIVE_TREATMENT_TYPES = ["hacamat_yas", "solucan", "akupunktur"];
/** Kan sulandirici ilac/etken anahtar kelimeleri. */
export const BLOOD_THINNER_DRUGS = ["sulandirici", "warfarin", "aspirin", "klopidogrel", "heparin"];
/** Kanama bozuklugu tani anahtar kelimeleri. */
export const BLEEDING_KEYWORDS = ["kanama", "hemofili", "koagulopati", "trombo"];

/** Tedavi tipine gore otomatik odeme baz fiyatlari (TL). */
export const BASE_PRICES: Record<string, number> = {
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

export interface DanisanProfil {
  pregnancyStatus?: boolean | null;
  chronicDiseases?: string[] | null;
  currentMedications?: string[] | null;
  allergies?: string[] | null;
}

/**
 * Tedavi tipi + danisan profiline gore kontrendikasyon/bilgilendirme uyarilari
 * uretir. `UYARI:` riskli durumlar, `BILGI:` bilgilendirme. Bos dizi = engel yok.
 */
export function checkContraindications(
  treatmentType: string,
  danisanProfil: DanisanProfil,
): string[] {
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
