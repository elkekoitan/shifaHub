import { describe, it, expect } from "vitest";
import {
  APPOINTMENT_STATUS_VALUES,
  VALID_TRANSITIONS,
  canTransition,
  isTerminalStatus,
  computeHijri,
  type AppointmentStatus,
} from "../src/domain/appointment";

describe("randevu state machine", () => {
  it("her durum icin gecis tablosu tanimli", () => {
    for (const status of APPOINTMENT_STATUS_VALUES) {
      expect(VALID_TRANSITIONS[status]).toBeDefined();
    }
  });

  it("gecerli gecisler kabul edilir", () => {
    expect(canTransition("requested", "confirmed")).toBe(true);
    expect(canTransition("requested", "cancelled")).toBe(true);
    expect(canTransition("confirmed", "arrived")).toBe(true);
    expect(canTransition("confirmed", "ertelendi")).toBe(true);
    expect(canTransition("reminded", "no_show")).toBe(true);
    expect(canTransition("arrived", "treated")).toBe(true);
    expect(canTransition("treated", "completed")).toBe(true);
    expect(canTransition("ertelendi", "confirmed")).toBe(true);
  });

  it("gecersiz gecisler reddedilir", () => {
    // Terminal durumlardan cikis yok
    expect(canTransition("completed", "requested")).toBe(false);
    expect(canTransition("cancelled", "confirmed")).toBe(false);
    expect(canTransition("no_show", "arrived")).toBe(false);
    // Adim atlama yasak
    expect(canTransition("requested", "arrived")).toBe(false);
    expect(canTransition("requested", "treated")).toBe(false);
    expect(canTransition("confirmed", "completed")).toBe(false);
    expect(canTransition("arrived", "completed")).toBe(false);
    // Geri donus yasak
    expect(canTransition("arrived", "requested")).toBe(false);
    expect(canTransition("treated", "arrived")).toBe(false);
  });

  it("ayni duruma gecis (no-op) reddedilir", () => {
    expect(canTransition("confirmed", "confirmed")).toBe(false);
    expect(canTransition("requested", "requested")).toBe(false);
  });

  it("bilinmeyen kaynak durumu guvenli sekilde false doner", () => {
    expect(canTransition("" as AppointmentStatus, "confirmed")).toBe(false);
    expect(canTransition("garip_durum" as AppointmentStatus, "confirmed")).toBe(false);
  });

  it("terminal durumlar dogru tespit edilir", () => {
    expect(isTerminalStatus("completed")).toBe(true);
    expect(isTerminalStatus("cancelled")).toBe(true);
    expect(isTerminalStatus("no_show")).toBe(true);
    expect(isTerminalStatus("requested")).toBe(false);
    expect(isTerminalStatus("confirmed")).toBe(false);
    expect(isTerminalStatus("ertelendi")).toBe(false);
  });

  it("mutlu yol bastan sona yurunebilir", () => {
    const path: AppointmentStatus[] = ["requested", "confirmed", "arrived", "treated", "completed"];
    for (let i = 0; i < path.length - 1; i++) {
      expect(canTransition(path[i]!, path[i + 1]!)).toBe(true);
    }
    expect(isTerminalStatus(path[path.length - 1]!)).toBe(true);
  });
});

describe("computeHijri (Umm al-Qura)", () => {
  // Cikti `Intl.DateTimeFormat` islamic-umalqura'dan kilitlendi (regresyon capasi).
  const at = (iso: string) => new Date(`${iso}T12:00:00Z`);

  it("bilinen tarihler dogru Hicri stringe cevrilir", () => {
    expect(computeHijri(at("2026-07-02")).hijriDate).toBe("17 Muharrem 1448");
    expect(computeHijri(at("2026-07-03")).hijriDate).toBe("18 Muharrem 1448");
    expect(computeHijri(at("2026-01-15")).hijriDate).toBe("26 Receb 1447");
    expect(computeHijri(at("2026-06-14")).hijriDate).toBe("28 Zilhicce 1447");
  });

  it("sunnet gunleri (17/19/21) dogru isaretlenir", () => {
    expect(computeHijri(at("2026-07-02")).isSunnahDay).toBe(true); // 17
    expect(computeHijri(at("2026-07-04")).isSunnahDay).toBe(true); // 19
    expect(computeHijri(at("2026-07-06")).isSunnahDay).toBe(true); // 21
  });

  it("sunnet disi gunler isaretlenmez", () => {
    expect(computeHijri(at("2026-07-03")).isSunnahDay).toBe(false); // 18
    expect(computeHijri(at("2026-07-05")).isSunnahDay).toBe(false); // 20
    expect(computeHijri(at("2026-01-15")).isSunnahDay).toBe(false); // 26
  });

  it("hijriDate formati `<gun> <ay-adi> <yil>`", () => {
    expect(computeHijri(at("2026-07-02")).hijriDate).toMatch(/^\d{1,2} \S+ \d{4}$/);
  });
});
