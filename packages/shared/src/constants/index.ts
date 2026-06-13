// ShifaHub Constants

export const APP_NAME = "ShifaHub";
export const APP_VERSION = "0.0.1";

// GETAT Treatment Types (Turkish labels)
export const TREATMENT_LABELS: Record<string, string> = {
  hacamat_kuru: "Kuru Hacamat",
  hacamat_yas: "Yas Hacamat",
  solucan: "Solucan (Hirudoterapi)",
  sujok: "Sujok Terapi",
  refleksoloji: "Refleksoloji",
  akupunktur: "Akupunktur",
  fitoterapi: "Fitoterapi",
  aromaterapi: "Aromaterapi",
  osteopati: "Osteopati",
  kayropraktik: "Kayropraktik",
  diger: "Diger",
} as const;

// User Role Labels
export const ROLE_LABELS: Record<string, string> = {
  danisan: "Danisan",
  egitmen: "Egitmen",
  admin: "Admin",
  tabip: "Sorumlu Tabip",
} as const;

// Appointment Status Labels
export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  requested: "Talep Edildi",
  confirmed: "Onaylandi",
  reminded: "Hatirlatildi",
  arrived: "Geldi",
  treated: "Tedavi Edildi",
  completed: "Tamamlandi",
  cancelled: "Iptal Edildi",
  no_show: "Gelmedi",
} as const;

// Hijri months
export const HIJRI_MONTHS: string[] = [
  "Muharrem",
  "Safer",
  "Rebiulevvel",
  "Rebiulahir",
  "Cemaziyelevvel",
  "Cemaziyelahir",
  "Receb",
  "Saban",
  "Ramazan",
  "Sevval",
  "Zilkade",
  "Zilhicce",
];

// Hacamat sunnah days (Hijri)
export const SUNNAH_DAYS = [17, 19, 21] as const;

// KVKK data retention periods (years)
export const KVKK_RETENTION = {
  healthData: 30,
  communicationLogs: 5,
  systemLogs: 2,
  auditLogs: 10,
} as const;

// API rate limits
export const RATE_LIMITS = {
  auth: { max: 10, timeWindow: "15 minutes" },
  api: { max: 100, timeWindow: "1 minute" },
  upload: { max: 20, timeWindow: "1 minute" },
} as const;
