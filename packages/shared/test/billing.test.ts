import { describe, it, expect } from "vitest";
import { PAYMENT_STATUS_VALUES, deriveStatus } from "../src/domain/billing";

describe("odeme deriveStatus", () => {
  it("acik 'free' her zaman korunur", () => {
    expect(deriveStatus(0, 0, "free")).toBe("free");
    expect(deriveStatus(400, 400, "free")).toBe("free");
    expect(deriveStatus(400, 0, "free")).toBe("free");
  });

  it("tam odeme 'paid' verir", () => {
    expect(deriveStatus(400, 400)).toBe("paid");
    expect(deriveStatus(400, 500)).toBe("paid"); // fazla odeme de paid
    expect(deriveStatus(0.01, 0.01)).toBe("paid");
  });

  it("kismi odeme 'partial' verir", () => {
    expect(deriveStatus(400, 100)).toBe("partial");
    expect(deriveStatus(400, 399.99)).toBe("partial");
  });

  it("odeme yoksa 'pending' verir", () => {
    expect(deriveStatus(400, 0)).toBe("pending");
  });

  it("tutar 0 + odeme 0 => pending (paid degil)", () => {
    // amount=0 paid kosulundan dislanir (amount > 0 sarti) → explicit yoksa pending
    expect(deriveStatus(0, 0)).toBe("pending");
  });

  it("acik status pending/partial/paid uzerine yazilmaz (turetme oncelikli)", () => {
    // Tam odeme acikca 'pending' verilse de paid kazanir
    expect(deriveStatus(400, 400, "pending")).toBe("paid");
    // Kismi odeme acikca 'paid' verilse de partial kazanir
    expect(deriveStatus(400, 100, "paid")).toBe("partial");
  });

  it("acik status yalniz turetme belirsizken (pending dalinda) kullanilir", () => {
    expect(deriveStatus(0, 0, "partial")).toBe("partial");
    expect(deriveStatus(400, 0, "partial")).toBe("partial");
  });

  it("donen deger her zaman gecerli bir enum uyesi", () => {
    const cases: Array<[number, number]> = [
      [0, 0],
      [400, 400],
      [400, 100],
      [400, 0],
      [100, 200],
    ];
    for (const [a, p] of cases) {
      expect(PAYMENT_STATUS_VALUES).toContain(deriveStatus(a, p));
    }
  });
});
