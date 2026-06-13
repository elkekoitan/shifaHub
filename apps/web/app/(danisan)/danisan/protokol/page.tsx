"use client";

import {
  ClipboardList,
  CalendarDays,
  AlertTriangle,
  ListChecks,
  Activity,
  CheckCircle2,
  PauseCircle,
  Clock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, type BadgeTone } from "@/components/ui/status-badge";

const dtf = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const PROTOKOL_STATUS_LABELS: Record<string, string> = {
  active: "Aktif",
  completed: "Tamamlandı",
  paused: "Duraklatıldı",
};
const PROTOKOL_STATUS_TONE: Record<string, BadgeTone> = {
  active: "success",
  completed: "primary",
  paused: "warning",
};
const PROTOKOL_STATUS_ICON: Record<string, LucideIcon> = {
  active: Activity,
  completed: CheckCircle2,
  paused: PauseCircle,
};

const COMPLAINT_STATUS_LABELS: Record<string, string> = {
  pending: "Bekliyor",
  in_progress: "Devam ediyor",
  completed: "Tamamlandı",
};
const COMPLAINT_STATUS_TONE: Record<string, BadgeTone> = {
  pending: "neutral",
  in_progress: "info",
  completed: "success",
};
const COMPLAINT_STATUS_ICON: Record<string, LucideIcon> = {
  pending: Clock,
  in_progress: Activity,
  completed: CheckCircle2,
};

const PRIORITY_LABELS: Record<number, string> = {
  1: "Acil",
  2: "Yüksek",
  3: "Normal",
  4: "Takip",
};
const PRIORITY_TONE: Record<number, BadgeTone> = {
  1: "danger",
  2: "warning",
  3: "primary",
  4: "neutral",
};

function initialsOf(first?: string | null, last?: string | null) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "ŞH";
}

export default function DanisanProtokolPage() {
  const user = useAuthStore((s) => s.user);
  const protokolList = trpc.protokol.list.useQuery(
    { danisanId: user?.id ?? "" },
    { enabled: Boolean(user?.id) },
  );

  const list = protokolList.data ?? [];

  return (
    <div className="px-5 pt-6">
      <header className="mb-6">
        <h1 className="font-headline text-xl font-semibold text-foreground">Tedavi protokolleri</h1>
        <p className="mt-1 text-sm text-text-2">
          Eğitmeniniz tarafından hazırlanan tedavi planları.
        </p>
      </header>

      {protokolList.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full rounded-[var(--radius-lg)]" />
          <Skeleton className="h-32 w-full rounded-[var(--radius-lg)]" />
        </div>
      ) : protokolList.isError ? (
        <div className="flex items-center gap-2 rounded-[var(--radius)] border border-destructive-border bg-destructive-bg p-4 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
          Protokoller yüklenemedi.
        </div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-border bg-card p-8 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-muted">
            <ClipboardList className="size-5 text-text-3" aria-hidden />
          </span>
          <p className="text-sm font-medium text-foreground">Henüz tedavi protokolünüz yok</p>
          <p className="text-xs text-text-3">Eğitmeniniz plan oluşturduğunda burada görünür.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((p) => {
            const status = p.status ?? "active";
            return (
              <li
                key={p.id}
                className="rounded-[var(--radius-lg)] border border-border bg-card p-4 shadow-[var(--shadow-sm)]"
              >
                <div className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-accent text-primary">
                    <ClipboardList className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{p.title ?? "Tedavi protokolü"}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-text-2">
                      <CalendarDays className="size-3.5" aria-hidden />
                      {p.createdAt ? dtf.format(new Date(p.createdAt)) : ""}
                    </p>
                    {p.egitmenFirstName ? (
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-text-3">
                        <span className="flex size-5 items-center justify-center rounded-full bg-muted text-[9px] font-semibold text-text-2">
                          {initialsOf(p.egitmenFirstName, p.egitmenLastName)}
                        </span>
                        {p.egitmenFirstName} {p.egitmenLastName}
                      </p>
                    ) : null}
                  </div>
                  <StatusBadge
                    tone={PROTOKOL_STATUS_TONE[status] ?? "neutral"}
                    icon={PROTOKOL_STATUS_ICON[status]}
                    className="shrink-0"
                  >
                    {PROTOKOL_STATUS_LABELS[status] ?? status}
                  </StatusBadge>
                </div>

                {(p.complaints ?? []).length > 0 ? (
                  <div className="mt-3 space-y-2">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                      <ListChecks className="size-3.5 text-text-3" aria-hidden />
                      Şikayetler ve tedavi adımları
                    </p>
                    {(p.complaints ?? []).map((c, i) => (
                      <div
                        key={i}
                        className="rounded-[var(--radius-sm)] border border-border bg-muted px-3 py-2 text-xs text-text-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="min-w-0 truncate font-medium text-foreground">
                            {c.description}
                          </span>
                          <StatusBadge
                            tone={PRIORITY_TONE[c.priority] ?? "neutral"}
                            className="shrink-0"
                          >
                            {PRIORITY_LABELS[c.priority] ?? `Öncelik ${c.priority}`}
                          </StatusBadge>
                        </div>
                        <p className="mt-1.5 text-text-3">
                          {c.treatmentMethod}
                          {c.estimatedSessions ? ` · ${c.estimatedSessions} seans` : ""}
                          {c.sessionInterval ? ` · ${c.sessionInterval}` : ""}
                        </p>
                        <div className="mt-1.5">
                          <StatusBadge
                            tone={COMPLAINT_STATUS_TONE[c.status] ?? "neutral"}
                            icon={COMPLAINT_STATUS_ICON[c.status]}
                          >
                            {COMPLAINT_STATUS_LABELS[c.status] ?? c.status}
                          </StatusBadge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {p.notes ? <p className="mt-3 text-sm text-text-2">{p.notes}</p> : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
