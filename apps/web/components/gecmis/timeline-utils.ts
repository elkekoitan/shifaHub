import { TREATMENT_LABELS, APPOINTMENT_STATUS_LABELS } from "@shifahub/shared";
import type { BadgeTone } from "@/components/ui/status-badge";

/** Zaman tüneli olay türü. */
export type TimelineKind = "randevu" | "tedavi" | "tahlil" | "odeme" | "protokol";

export interface TimelineItem {
  id: string;
  kind: TimelineKind;
  /** Sıralama için epoch ms. */
  ts: number;
  title: string;
  subtitle?: string;
  status?: { label: string; tone: BadgeTone };
  /** Danışan görünümünde ilgili sayfaya bağlantı (eğitmen detayında yoktur). */
  href?: string;
}

const toTs = (v: unknown): number => {
  if (!v) return 0;
  const d = new Date(v as string);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
};

const money = (v: unknown) =>
  `${Number(v ?? 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;

// ─── Durum -> rozet eşlemeleri ────────────────────────────────────────────────
const RANDEVU_TONE: Record<string, BadgeTone> = {
  requested: "warning",
  confirmed: "info",
  reminded: "warning",
  arrived: "info",
  treated: "success",
  completed: "success",
  cancelled: "danger",
  no_show: "neutral",
  ertelendi: "warning",
};

const ODEME_TONE: Record<string, BadgeTone> = {
  paid: "success",
  pending: "warning",
  partial: "info",
  free: "neutral",
};
const ODEME_LABEL: Record<string, string> = {
  paid: "Ödendi",
  pending: "Bekliyor",
  partial: "Kısmi",
  free: "Ücretsiz",
};

const PROTOKOL_TONE: Record<string, BadgeTone> = {
  pending: "warning",
  in_progress: "info",
  completed: "success",
};
const PROTOKOL_LABEL: Record<string, string> = {
  pending: "Bekliyor",
  in_progress: "Sürüyor",
  completed: "Tamamlandı",
};

// ─── Girdi satır tipleri (yalnız kullanılan alanlar) ──────────────────────────
type RandevuRow = {
  id: string;
  scheduledAt?: string | Date | null;
  status?: string | null;
  treatmentType?: string | null;
  egitmenFirstName?: string | null;
  egitmenLastName?: string | null;
};
type TedaviRow = {
  id: string;
  treatmentDate?: string | Date | null;
  treatmentType?: string | null;
  sessionNumber?: number | null;
  egitmenFirstName?: string | null;
  egitmenLastName?: string | null;
};
type TahlilRow = {
  id: string;
  testType?: string | null;
  testDate?: string | Date | null;
  labName?: string | null;
};
type OdemeRow = {
  id: string;
  amount?: string | number | null;
  status?: string | null;
  description?: string | null;
  createdAt?: string | Date | null;
  paidAt?: string | Date | null;
};
type ProtokolRow = {
  id: string;
  title?: string | null;
  status?: string | null;
  createdAt?: string | Date | null;
};

export interface TimelineSources {
  randevu?: RandevuRow[];
  tedavi?: TedaviRow[];
  tahlil?: TahlilRow[];
  odeme?: OdemeRow[];
  protokol?: ProtokolRow[];
}

/**
 * Beş alanın list sonuçlarını tek bir tarih-DESC zaman tüneline birleştirir.
 * `linkBase` verilirse (örn. "/danisan") her öğe ilgili sayfaya bağlanır;
 * eğitmen detayında verilmez (bağlantısız).
 */
export function buildTimeline(src: TimelineSources, linkBase?: string): TimelineItem[] {
  const items: TimelineItem[] = [];
  const egitmenAd = (f?: string | null, l?: string | null) =>
    `${f ?? ""} ${l ?? ""}`.trim() || "Eğitmen";

  for (const r of src.randevu ?? []) {
    items.push({
      id: `randevu-${r.id}`,
      kind: "randevu",
      ts: toTs(r.scheduledAt),
      title: r.treatmentType ? (TREATMENT_LABELS[r.treatmentType] ?? r.treatmentType) : "Randevu",
      subtitle: egitmenAd(r.egitmenFirstName, r.egitmenLastName),
      status: r.status
        ? {
            label: APPOINTMENT_STATUS_LABELS[r.status] ?? r.status,
            tone: RANDEVU_TONE[r.status] ?? "neutral",
          }
        : undefined,
      href: linkBase ? `${linkBase}/randevu` : undefined,
    });
  }

  for (const t of src.tedavi ?? []) {
    items.push({
      id: `tedavi-${t.id}`,
      kind: "tedavi",
      ts: toTs(t.treatmentDate),
      title: t.treatmentType ? (TREATMENT_LABELS[t.treatmentType] ?? t.treatmentType) : "Tedavi",
      subtitle: `Seans ${t.sessionNumber ?? 1} · ${egitmenAd(t.egitmenFirstName, t.egitmenLastName)}`,
      href: linkBase ? `${linkBase}/tedavi` : undefined,
    });
  }

  for (const t of src.tahlil ?? []) {
    items.push({
      id: `tahlil-${t.id}`,
      kind: "tahlil",
      ts: toTs(t.testDate),
      title: t.testType || "Tahlil",
      subtitle: t.labName ?? "Laboratuvar",
      href: linkBase ? `${linkBase}/tahlil` : undefined,
    });
  }

  for (const o of src.odeme ?? []) {
    items.push({
      id: `odeme-${o.id}`,
      kind: "odeme",
      ts: toTs(o.paidAt ?? o.createdAt),
      title: o.description || "Ödeme",
      subtitle: money(o.amount),
      status: o.status
        ? { label: ODEME_LABEL[o.status] ?? o.status, tone: ODEME_TONE[o.status] ?? "neutral" }
        : undefined,
      href: linkBase ? `${linkBase}/odeme` : undefined,
    });
  }

  for (const p of src.protokol ?? []) {
    items.push({
      id: `protokol-${p.id}`,
      kind: "protokol",
      ts: toTs(p.createdAt),
      title: p.title || "Tedavi protokolü",
      status: p.status
        ? {
            label: PROTOKOL_LABEL[p.status] ?? p.status,
            tone: PROTOKOL_TONE[p.status] ?? "neutral",
          }
        : undefined,
      href: linkBase ? `${linkBase}/protokol` : undefined,
    });
  }

  return items.sort((a, b) => b.ts - a.ts);
}

export const KIND_LABEL: Record<TimelineKind, string> = {
  randevu: "Randevu",
  tedavi: "Tedavi",
  tahlil: "Tahlil",
  odeme: "Ödeme",
  protokol: "Protokol",
};

export const formatTs = (ts: number): string =>
  ts > 0
    ? new Date(ts).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
    : "";
