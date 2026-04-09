// ShifaHub Design Tokens
// Merkezi tasarim sabitleri — tum componentlerde kullanilir

import type { LucideIcon } from "lucide-react";

// Severity renkleri (komplikasyon, oncelik)
export const SEVERITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "1": {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-800 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
  },
  "2": {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-800 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
  },
  "3": {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-800 dark:text-orange-300",
    border: "border-orange-200 dark:border-orange-800",
  },
  "4": {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-800 dark:text-red-300",
    border: "border-red-200 dark:border-red-800",
  },
  "5": {
    bg: "bg-red-200 dark:bg-red-900/50",
    text: "text-red-900 dark:text-red-200",
    border: "border-red-300 dark:border-red-700",
  },
};

// Randevu durum renkleri ve etiketleri
export const APPOINTMENT_STATUS = {
  requested: {
    label: "Onay Bekliyor",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-800 dark:text-amber-300",
  },
  confirmed: {
    label: "Onaylandi",
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-800 dark:text-green-300",
  },
  reminded: {
    label: "Hatirlatildi",
    bg: "bg-sky-100 dark:bg-sky-900/30",
    text: "text-sky-800 dark:text-sky-300",
  },
  arrived: {
    label: "Geldi",
    bg: "bg-indigo-100 dark:bg-indigo-900/30",
    text: "text-indigo-800 dark:text-indigo-300",
  },
  treated: {
    label: "Tedavi Edildi",
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-800 dark:text-purple-300",
  },
  completed: {
    label: "Tamamlandi",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-800 dark:text-blue-300",
  },
  cancelled: {
    label: "Iptal",
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-800 dark:text-red-300",
  },
  no_show: {
    label: "Gelmedi",
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-800 dark:text-gray-300",
  },
  ertelendi: {
    label: "Ertelendi",
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-800 dark:text-orange-300",
  },
} as const;

// Odeme durum renkleri
export const PAYMENT_STATUS = {
  paid: {
    label: "Odendi",
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-800 dark:text-green-300",
  },
  pending: {
    label: "Beklemede",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-800 dark:text-amber-300",
  },
  partial: {
    label: "Kismi",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-800 dark:text-blue-300",
  },
  free: {
    label: "Ucretsiz",
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-800 dark:text-gray-300",
  },
} as const;

// Protokol durum
export const PROTOCOL_STATUS = {
  active: {
    label: "Aktif",
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-800 dark:text-green-300",
  },
  completed: {
    label: "Tamamlandi",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-800 dark:text-blue-300",
  },
  paused: {
    label: "Duraklatildi",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-800 dark:text-amber-300",
  },
  cancelled: {
    label: "Iptal",
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-800 dark:text-red-300",
  },
  draft: {
    label: "Taslak",
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-800 dark:text-gray-300",
  },
} as const;

// Tedavi turleri
export const TREATMENT_TYPES = [
  { value: "hacamat_kuru", label: "Kuru Hacamat" },
  { value: "hacamat_yas", label: "Yas Hacamat" },
  { value: "solucan", label: "Solucan (Hirudoterapi)" },
  { value: "sujok", label: "Sujok Terapi" },
  { value: "refleksoloji", label: "Refleksoloji" },
  { value: "akupunktur", label: "Akupunktur" },
  { value: "fitoterapi", label: "Fitoterapi" },
] as const;

export const TREATMENT_LABELS: Record<string, string> = Object.fromEntries(
  TREATMENT_TYPES.map((t) => [t.value, t.label]),
);

// Stok kategorileri
export const STOCK_CATEGORIES = [
  { value: "kupa", label: "Kupalar" },
  { value: "suluk", label: "Tibbi Sulukler" },
  { value: "sarf", label: "Sarf Malzeme" },
  { value: "bitkisel", label: "Bitkisel Urunler" },
  { value: "igne", label: "Akupunktur Igneleri" },
  { value: "diger", label: "Diger" },
] as const;

// Vucut bolgeleri
export const BODY_AREAS = [
  "Bas",
  "Boyun",
  "Omuz",
  "Sirt (ust)",
  "Sirt (alt)",
  "Bel",
  "Gogus",
  "Karin",
  "Kol (sag)",
  "Kol (sol)",
  "Bacak (sag)",
  "Bacak (sol)",
  "Ayak",
  "El",
] as const;

// Oncelik etiketleri
export const PRIORITY_OPTIONS = [
  { value: "1", label: "1 - Acil" },
  { value: "2", label: "2 - Yuksek" },
  { value: "3", label: "3 - Normal" },
  { value: "4", label: "4 - Takip" },
] as const;

// Seans araliklari
export const SESSION_INTERVALS = [
  { value: "haftalik", label: "Haftalik" },
  { value: "2_haftalik", label: "2 Haftalik" },
  { value: "aylik", label: "Aylik" },
] as const;

// Odeme yontemleri
export const PAYMENT_METHODS = [
  { value: "nakit", label: "Nakit" },
  { value: "kart", label: "Kredi/Banka Karti" },
  { value: "havale", label: "Havale" },
  { value: "eft", label: "EFT" },
] as const;

// Navigasyon item tipi
export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  group?: string;
}
