"use client";

import { FlaskConical, CalendarDays, AlertTriangle, FileText } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";

const dtf = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default function DanisanTahlilPage() {
  const user = useAuthStore((s) => s.user);
  const tahlilList = trpc.tahlil.list.useQuery(
    { danisanId: user?.id ?? "", limit: 50 },
    { enabled: Boolean(user?.id) },
  );

  const list = tahlilList.data ?? [];

  return (
    <div className="px-5 pt-6">
      <header className="mb-6">
        <h1 className="font-headline text-xl font-semibold text-foreground">Tahlil sonuçları</h1>
        <p className="mt-1 text-sm text-text-2">Laboratuvar sonuçlarınız ve referans değerleri.</p>
      </header>

      {tahlilList.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full rounded-[var(--radius-lg)]" />
          <Skeleton className="h-32 w-full rounded-[var(--radius-lg)]" />
        </div>
      ) : tahlilList.isError ? (
        <div className="flex items-center gap-2 rounded-[var(--radius)] border border-destructive-border bg-destructive-bg p-4 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
          Tahlil sonuçları yüklenemedi.
        </div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-border bg-card p-8 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-muted">
            <FlaskConical className="size-5 text-text-3" aria-hidden />
          </span>
          <p className="text-sm font-medium text-foreground">Henüz tahlil sonucunuz yok</p>
          <p className="text-xs text-text-3">Eğitmeniniz sonuç eklediğinde burada görünür.</p>
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
                  <FlaskConical className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{t.testType}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-text-2">
                    <CalendarDays className="size-3.5" aria-hidden />
                    {t.testDate ? dtf.format(new Date(t.testDate)) : "Tarih yok"}
                  </p>
                  {t.labName ? <p className="mt-0.5 text-xs text-text-3">{t.labName}</p> : null}
                </div>
                {t.fileUrl ? (
                  <a
                    href={t.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex shrink-0 items-center gap-1 rounded-[var(--radius-sm)] bg-accent px-2.5 py-1 text-[11px] font-medium text-primary transition-colors hover:bg-secondary"
                    aria-label="Tahlil dosyasını aç"
                  >
                    <FileText className="size-3.5" aria-hidden />
                    Dosya
                  </a>
                ) : null}
              </div>

              {(t.values ?? []).length > 0 ? (
                <div className="mt-3 divide-y divide-border rounded-[var(--radius-sm)] border border-border">
                  {(t.values ?? []).map((v, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-3 px-3 py-2 text-xs"
                    >
                      <span className="text-text-2">{v.name}</span>
                      <div className="flex items-center gap-2">
                        {v.referenceMin !== undefined && v.referenceMax !== undefined ? (
                          <span className="text-text-3">
                            ({v.referenceMin}–{v.referenceMax})
                          </span>
                        ) : null}
                        {v.isOutOfRange ? (
                          <StatusBadge tone="danger" icon={AlertTriangle}>
                            {v.value} {v.unit}
                          </StatusBadge>
                        ) : (
                          <span className="font-medium text-foreground">
                            {v.value} {v.unit}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {t.notes ? <p className="mt-3 text-sm text-text-2">{t.notes}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
