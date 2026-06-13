"use client";

import { ClipboardList, CalendarDays, AlertCircle, ListChecks } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";

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

const COMPLAINT_STATUS_LABELS: Record<string, string> = {
  pending: "Bekliyor",
  in_progress: "Devam ediyor",
  completed: "Tamamlandı",
};

const PRIORITY_LABELS: Record<number, string> = {
  1: "Acil",
  2: "Yüksek",
  3: "Normal",
  4: "Takip",
};

export default function DanisanProtokolPage() {
  const user = useAuthStore((s) => s.user);
  const protokolList = trpc.protokol.list.useQuery(
    { danisanId: user?.id ?? "" },
    { enabled: Boolean(user?.id) },
  );

  const list = protokolList.data ?? [];

  return (
    <div className="px-5 pt-6">
      <header className="mb-5">
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
        <div className="flex items-center gap-2 rounded-[var(--radius)] border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" aria-hidden />
          Protokoller yüklenemedi.
        </div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-border bg-card p-8 text-center">
          <ClipboardList className="size-7 text-text-3" aria-hidden />
          <p className="text-sm text-text-2">Henüz bir tedavi protokolünüz yok.</p>
          <p className="text-xs text-text-3">Eğitmeniniz plan oluşturduğunda burada görünür.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((p) => (
            <li
              key={p.id}
              className="rounded-[var(--radius-lg)] border border-border bg-card p-4 shadow-[var(--shadow-sm)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{p.title ?? "Tedavi protokolü"}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-text-2">
                    <CalendarDays className="size-3.5" aria-hidden />
                    {p.createdAt ? dtf.format(new Date(p.createdAt)) : ""}
                  </p>
                  {p.egitmenFirstName ? (
                    <p className="mt-0.5 text-xs text-text-3">
                      Eğitmen: {p.egitmenFirstName} {p.egitmenLastName}
                    </p>
                  ) : null}
                </div>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-text-2">
                  {PROTOKOL_STATUS_LABELS[p.status ?? ""] ?? p.status}
                </span>
              </div>

              {(p.complaints ?? []).length > 0 ? (
                <div className="mt-3 space-y-2">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-text-2">
                    <ListChecks className="size-3.5" aria-hidden />
                    Şikayetler ve tedavi adımları
                  </p>
                  {(p.complaints ?? []).map((c, i) => (
                    <div
                      key={i}
                      className="rounded-[var(--radius-sm)] bg-muted px-3 py-2 text-xs text-text-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-foreground">{c.description}</span>
                        <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-primary">
                          {PRIORITY_LABELS[c.priority] ?? `Öncelik ${c.priority}`}
                        </span>
                      </div>
                      <p className="mt-1 text-text-3">
                        {c.treatmentMethod}
                        {c.estimatedSessions ? ` · ${c.estimatedSessions} seans` : ""}
                        {c.sessionInterval ? ` · ${c.sessionInterval}` : ""}
                      </p>
                      <p className="mt-0.5 text-text-3">
                        Durum: {COMPLAINT_STATUS_LABELS[c.status] ?? c.status}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}

              {p.notes ? <p className="mt-3 text-sm text-text-2">{p.notes}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
