"use client";

import { HeartPulse, CalendarDays, AlertTriangle, AlertCircle, Stethoscope } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";

const dtf = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default function DanisanTedaviPage() {
  const user = useAuthStore((s) => s.user);
  const tedaviList = trpc.tedavi.list.useQuery(
    { danisanId: user?.id ?? "" },
    { enabled: Boolean(user?.id) },
  );

  const list = tedaviList.data ?? [];

  return (
    <div className="px-5 pt-6">
      <header className="mb-5">
        <h1 className="font-headline text-xl font-semibold text-foreground">Tedavi geçmişi</h1>
        <p className="mt-1 text-sm text-text-2">Geçmiş seanslarınızın kayıtları.</p>
      </header>

      {tedaviList.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full rounded-[var(--radius-lg)]" />
          <Skeleton className="h-28 w-full rounded-[var(--radius-lg)]" />
        </div>
      ) : tedaviList.isError ? (
        <div className="flex items-center gap-2 rounded-[var(--radius)] border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" aria-hidden />
          Tedavi geçmişi yüklenemedi.
        </div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-border bg-card p-8 text-center">
          <HeartPulse className="size-7 text-text-3" aria-hidden />
          <p className="text-sm text-text-2">Henüz tedavi kaydınız bulunmuyor.</p>
          <p className="text-xs text-text-3">Seanslarınız tamamlandıkça burada listelenir.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((t) => (
            <li
              key={t.id}
              className="rounded-[var(--radius-lg)] border border-border bg-card p-4 shadow-[var(--shadow-sm)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-medium text-foreground">
                    <Stethoscope className="size-4 text-primary" aria-hidden />
                    {t.treatmentType}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-text-2">
                    <CalendarDays className="size-3.5" aria-hidden />
                    {t.treatmentDate ? dtf.format(new Date(t.treatmentDate)) : "Tarih yok"}
                  </p>
                  {t.egitmenFirstName ? (
                    <p className="mt-0.5 text-xs text-text-3">
                      Eğitmen: {t.egitmenFirstName} {t.egitmenLastName}
                    </p>
                  ) : null}
                </div>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-text-2">
                  Seans {t.sessionNumber}
                </span>
              </div>

              {t.findings ? (
                <p className="mt-3 text-sm text-text-2">
                  <span className="font-medium text-text-2">Bulgular: </span>
                  {t.findings}
                </p>
              ) : null}
              {t.recommendations ? (
                <p className="mt-1.5 text-sm text-text-2">
                  <span className="font-medium text-text-2">Öneriler: </span>
                  {t.recommendations}
                </p>
              ) : null}

              {(t.contraindications ?? []).length > 0 ? (
                <div className="mt-3 space-y-1">
                  {(t.contraindications ?? []).map((w, i) => (
                    <p
                      key={i}
                      className="flex items-start gap-1.5 rounded-[var(--radius-sm)] bg-warning/10 px-2.5 py-1.5 text-xs text-warning"
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
