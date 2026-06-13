"use client";

import { useState } from "react";
import { AlertTriangle, ShieldCheck, CheckCircle2, Clock, Activity } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "open" | "following" | "resolved";

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tümü" },
  { value: "open", label: "Açık" },
  { value: "following", label: "Takipte" },
  { value: "resolved", label: "Çözüldü" },
];

const STATUS_META: Record<string, { label: string; tone: string; bg: string }> = {
  open: { label: "Açık", tone: "text-destructive", bg: "bg-destructive/10" },
  following: { label: "Takipte", tone: "text-warning", bg: "bg-warning/10" },
  resolved: { label: "Çözüldü", tone: "text-success", bg: "bg-success/10" },
};

const dtf = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function severityTone(severity: number) {
  if (severity >= 4) return "bg-destructive/10 text-destructive";
  if (severity === 3) return "bg-warning/10 text-warning";
  return "bg-muted text-text-2";
}

export default function KomplikasyonPage() {
  const [status, setStatus] = useState<StatusFilter>("all");

  const list = trpc.komplikasyon.list.useQuery({
    limit: 100,
    ...(status !== "all" ? { status } : {}),
  });

  const items = list.data ?? [];

  return (
    <div>
      <header className="mb-5">
        <h1 className="font-headline text-2xl font-semibold text-foreground">Komplikasyonlar</h1>
        <p className="mt-1 text-sm text-text-2">
          Tedavi sonrası bildirilen komplikasyonlar ve takip durumları.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Durum filtresi">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={status === tab.value}
            onClick={() => setStatus(tab.value)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              status === tab.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-text-2 hover:bg-accent",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {list.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-[var(--radius)]" />
          ))}
        </div>
      ) : list.isError ? (
        <div className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-destructive/40 bg-card p-8 text-center">
          <ShieldCheck className="size-6 text-destructive" aria-hidden />
          <p className="text-sm text-text-2">Komplikasyonlar yüklenemedi.</p>
          <button
            type="button"
            onClick={() => list.refetch()}
            className="text-sm font-medium text-primary"
          >
            Tekrar dene
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-border bg-card p-10 text-center">
          <CheckCircle2 className="size-7 text-success" aria-hidden />
          <p className="text-sm text-text-2">Bu filtreye uyan komplikasyon kaydı yok.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((k) => {
            const meta = STATUS_META[k.status ?? "open"];
            return (
              <li key={k.id} className="rounded-[var(--radius)] border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        severityTone(k.severity),
                      )}
                    >
                      <AlertTriangle className="size-3" aria-hidden />
                      Seviye {k.severity}/5
                    </span>
                    <p className="text-sm font-medium text-foreground">{k.type}</p>
                  </div>
                  <span
                    className={cn(
                      "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                      meta?.bg ?? "bg-muted",
                      meta?.tone ?? "text-text-2",
                    )}
                  >
                    {k.status === "resolved" ? (
                      <CheckCircle2 className="size-3" aria-hidden />
                    ) : k.status === "following" ? (
                      <Activity className="size-3" aria-hidden />
                    ) : (
                      <Clock className="size-3" aria-hidden />
                    )}
                    {meta?.label ?? k.status}
                  </span>
                </div>

                <p className="mt-2 text-sm text-text-2">{k.description}</p>

                {k.resolution ? (
                  <p className="mt-2 rounded-[var(--radius)] bg-success/5 px-3 py-2 text-xs text-text-2">
                    <span className="font-medium text-success">Çözüm: </span>
                    {k.resolution}
                  </p>
                ) : null}

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-text-3">
                  <span>Bildirildi: {dtf.format(new Date(k.createdAt))}</span>
                  {k.resolvedAt ? <span>Çözüldü: {dtf.format(new Date(k.resolvedAt))}</span> : null}
                  {Array.isArray(k.imageUrls) && k.imageUrls.length > 0 ? (
                    <span>{k.imageUrls.length} görsel</span>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
