import { describe, it, expect } from "vitest";
import { BASE_PRICES, checkContraindications, type DanisanProfil } from "../src/domain/treatment";

const EMPTY: DanisanProfil = {};

describe("checkContraindications", () => {
  it("bos profil + risksiz tedavi => uyari yok", () => {
    expect(checkContraindications("sujok", EMPTY)).toEqual([]);
    expect(checkContraindications("refleksoloji", { allergies: [] })).toEqual([]);
  });

  it("hamilelik + kanli tedavi => uyari", () => {
    const w = checkContraindications("hacamat_yas", { pregnancyStatus: true });
    expect(w.some((x) => x.includes("Hamilelik"))).toBe(true);
  });

  it("hamilelik + kansiz tedavi => hamilelik uyarisi yok", () => {
    const w = checkContraindications("sujok", { pregnancyStatus: true });
    expect(w.some((x) => x.includes("Hamilelik"))).toBe(false);
  });

  it("kanama bozuklugu + invaziv tedavi => uyari (anahtar kelime, buyuk/kucuk harf duyarsiz)", () => {
    const w = checkContraindications("akupunktur", {
      chronicDiseases: ["Kronik KANAMA bozuklugu"],
    });
    expect(w.some((x) => x.includes("Kanama bozuklugu"))).toBe(true);
  });

  it("kanama bozuklugu + invaziv olmayan tedavi => kanama uyarisi yok", () => {
    const w = checkContraindications("sujok", { chronicDiseases: ["kanama egilimi"] });
    expect(w.some((x) => x.includes("invaziv tedaviler riskli"))).toBe(false);
  });

  it("hemofili => tedavi tipinden bagimsiz uyari", () => {
    const w = checkContraindications("sujok", { chronicDiseases: ["Hemofili A"] });
    expect(w.some((x) => x.includes("Hemofili tanisi"))).toBe(true);
  });

  it("kan sulandirici ilac => uyari (kismi eslesme)", () => {
    const w = checkContraindications("sujok", { currentMedications: ["Aspirin 100mg"] });
    expect(w.some((x) => x.includes("Kan sulandirici"))).toBe(true);
  });

  it("kan sulandirici alerjisi + invaziv => alerji uyarisi", () => {
    const w = checkContraindications("hacamat_yas", { allergies: ["warfarin"] });
    expect(w.some((x) => x.includes("Alerji tespit edildi"))).toBe(true);
  });

  it("herhangi bir alerji => bilgilendirme satiri", () => {
    const w = checkContraindications("sujok", { allergies: ["polen", "fistik"] });
    const info = w.find((x) => x.startsWith("BILGI: Danisanin alerjileri"));
    expect(info).toBeDefined();
    expect(info).toContain("polen");
    expect(info).toContain("fistik");
  });

  it("diyabet + kanli tedavi => uyari", () => {
    const w = checkContraindications("hacamat_kuru", { chronicDiseases: ["Tip 2 Diyabet"] });
    expect(w.some((x) => x.includes("Diyabet"))).toBe(true);
  });

  it("hipertansiyon => bilgilendirme", () => {
    const w = checkContraindications("sujok", { chronicDiseases: ["Hipertansiyon"] });
    expect(w.some((x) => x.includes("Hipertansiyon"))).toBe(true);
  });

  it("coklu risk faktoru => birden cok uyari birikir", () => {
    const profil: DanisanProfil = {
      pregnancyStatus: true,
      chronicDiseases: ["hemofili", "diyabet"],
      currentMedications: ["warfarin"],
      allergies: ["aspirin"],
    };
    const w = checkContraindications("hacamat_yas", profil);
    // Hamilelik + hemofili + kan sulandirici + alerji(invaziv) + alerji-bilgi + diyabet
    expect(w.length).toBeGreaterThanOrEqual(5);
    expect(w.some((x) => x.includes("Hamilelik"))).toBe(true);
    expect(w.some((x) => x.includes("Hemofili"))).toBe(true);
    expect(w.some((x) => x.includes("Kan sulandirici"))).toBe(true);
    expect(w.some((x) => x.includes("Diyabet"))).toBe(true);
  });

  it("null alanlar guvenli sekilde ele alinir (cokme yok)", () => {
    const profil: DanisanProfil = {
      pregnancyStatus: null,
      chronicDiseases: null,
      currentMedications: null,
      allergies: null,
    };
    expect(() => checkContraindications("hacamat_yas", profil)).not.toThrow();
    expect(checkContraindications("hacamat_yas", profil)).toEqual([]);
  });
});

describe("BASE_PRICES", () => {
  it("bilinen tedavi tiplerinin fiyati tanimli ve pozitif", () => {
    for (const t of ["hacamat_kuru", "hacamat_yas", "solucan", "akupunktur"]) {
      expect(BASE_PRICES[t]).toBeGreaterThan(0);
    }
  });

  it("yas hacamat kuru hacamattan pahalidir", () => {
    expect(BASE_PRICES.hacamat_yas).toBeGreaterThan(BASE_PRICES.hacamat_kuru!);
  });
});
