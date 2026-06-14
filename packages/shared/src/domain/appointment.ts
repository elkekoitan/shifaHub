// Randevu (appointment) domain — saf is-mantigi. DB/RLS yoktur; yalnizca state
// machine + Hicri tarih hesabi. tRPC randevu routeri buradan import eder (tek kaynak).

import { HIJRI_MONTHS, SUNNAH_DAYS } from "../constants";

/** Gecerli randevu durumlari (zod enum + DB icin tuple). */
export const APPOINTMENT_STATUS_VALUES = [
  "requested",
  "confirmed",
  "reminded",
  "arrived",
  "treated",
  "completed",
  "cancelled",
  "no_show",
  "ertelendi",
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUS_VALUES)[number];

/**
 * State machine — gecerli durum gecisleri. Bos dizi = terminal durum.
 * `requested → confirmed/cancelled`, `confirmed → reminded/arrived/cancelled/ertelendi`, vb.
 */
export const VALID_TRANSITIONS: Record<AppointmentStatus, readonly AppointmentStatus[]> = {
  requested: ["confirmed", "cancelled"],
  confirmed: ["reminded", "arrived", "cancelled", "ertelendi"],
  reminded: ["arrived", "cancelled", "no_show", "ertelendi"],
  arrived: ["treated"],
  treated: ["completed"],
  completed: [],
  cancelled: [],
  no_show: [],
  ertelendi: ["confirmed", "cancelled"],
};

/** `from` durumundan `to` durumuna gecis state machine'e gore gecerli mi? */
export function canTransition(from: AppointmentStatus, to: AppointmentStatus): boolean {
  return (VALID_TRANSITIONS[from] ?? []).includes(to);
}

/** Terminal (cikis olmayan) durum mu? */
export function isTerminalStatus(status: AppointmentStatus): boolean {
  return (VALID_TRANSITIONS[status] ?? []).length === 0;
}

export interface HijriInfo {
  hijriDate: string;
  isSunnahDay: boolean;
}

/**
 * Verilen tarihin Hicri (Umm al-Qura) karsiligini ve hacamat sunnet gunu
 * (ayin 17/19/21) olup olmadigini hesaplar. `Intl.DateTimeFormat` islamic-umalqura
 * takvimi, UTC. Cikti: `"17 Receb 1447"` formati.
 */
export function computeHijri(date: Date): HijriInfo {
  const parts = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).formatToParts(date);

  const get = (type: string): number => {
    const part = parts.find((p) => p.type === type);
    return part ? Number.parseInt(part.value, 10) : 0;
  };

  const day = get("day");
  const monthIndex = get("month") - 1;
  const year = get("year");
  const monthName = HIJRI_MONTHS[monthIndex] ?? "";

  return {
    hijriDate: `${day} ${monthName} ${year}`.trim(),
    isSunnahDay: (SUNNAH_DAYS as readonly number[]).includes(day),
  };
}
