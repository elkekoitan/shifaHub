"use client";

import { HeartPulse, CalendarDays, AlertTriangle, Stethoscope, Hash } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";

const dtf = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function initialsOf(first?: string | null, last?: string | null) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "ŞH";
}

export default function DanisanTedaviPage() {
  const user = useAuthStore((s) => s.user);
  const tedaviList = trpc.tedavi.list.useQuery(
    { danisanId: user?.id ?? "" },
    { enabled: Boolean(user?.id) },
  );

  const list = tedaviList.data ?? [];

  return (
    <div className="px-5 pt-6">
      <header className="mb-6">
        <h1 className="font-headline text-xl font-semibold text-foreground">Tedavi geçmişi</h1>
        <p className="mt-1 text-sm text-text-2">Geçmiş seanslarınızın kayıtları.</p>
      </header>

      {tedaviList.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full rounded-[var(--radius-lg)]" />
          <Skeleton className="h-28 w-full rounded-[var(--radius-lg)]" />
        </div>
      ) : tedaviList.isError ? (
        <div className="flex items-center gap-2 rounded-[var(--radius)] border border-destructive-border bg-destructive-bg p-4 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
          Tedavi geçmişi yüklenemedi.
        </div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-border bg-card p-8 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-muted">
            <HeartPulse className="size-5 text-text-3" aria-hidden />
          </span>
          <p className="text-sm font-medium text-foreground">Henüz tedavi kaydınız yok</p>
          <p className="text-xs text-text-3">Seanslarınız tamamlandıkça burada listelenir.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((t) => (
            <li
              key={t.id}
              className="rounded-[var(--radius-lg)] border border-border bg-card p-4 shadow-[var(--shadow-sm)]"
            >
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-accent text-primary">
                  <Stethoscope className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{t.treatmentType}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-text-2">
                    <CalendarDays className="size-3.5" aria-hidden />
                    {t.treatmentDate ? dtf.format(new Date(t.treatmentDate)) : "Tarih yok"}
                  </p>
                  {t.egitmenFirstName ? (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-text-3">
                      <span className="flex size-5 items-center justify-center rounded-full bg-muted text-[9px] font-semibold text-text-2">
                        {initialsOf(t.egitmenFirstName, t.egitmenLastName)}
                      </span>
                      {t.egitmenFirstName} {t.egitmenLastName}
                    </p>
                  ) : null}
                </div>
                <StatusBadge tone="info" icon={Hash} className="shrink-0">
                  Seans {t.sessionNumber}
                </StatusBadge>
              </div>

              {t.findings ? (
                <p className="mt-3 text-sm text-text-2">
                  <span className="font-medium text-foreground">Bulgular: </span>
                  {t.findings}
                </p>
              ) : null}
              {t.recommendations ? (
                <p className="mt-1.5 text-sm text-text-2">
                  <span className="font-medium text-foreground">Öneriler: </span>
                  {t.recommendations}
                </p>
              ) : null}

              {(t.contraindications ?? []).length > 0 ? (
                <div className="mt-3 space-y-1.5">
                  {(t.contraindications ?? []).map((w, i) => (
                    <p
                      key={i}
                      className="flex items-start gap-1.5 rounded-[var(--radius-sm)] border border-warning-border bg-warning-bg px-2.5 py-1.5 text-xs text-warning"
                    >
                      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                      {w}
                    </p>
                  ))}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
