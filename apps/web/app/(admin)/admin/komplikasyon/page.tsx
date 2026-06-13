"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, AlertCircle, CheckCircle2, Clock, Activity } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, type BadgeTone } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "open" | "following" | "resolved";

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tümü" },
  { value: "open", label: "Açık" },
  { value: "following", label: "Takipte" },
  { value: "resolved", label: "Çözüldü" },
];

const STATUS_META: Record<string, { label: string; tone: BadgeTone; icon: LucideIcon }> = {
  open: { label: "Açık", tone: "danger", icon: Clock },
  following: { label: "Takipte", tone: "warning", icon: Activity },
  resolved: { label: "Çözüldü", tone: "success", icon: CheckCircle2 },
};

const dtf = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function severityTone(severity: number): BadgeTone {
  if (severity >= 4) return "danger";
  if (severity === 3) return "warning";
  return "neutral";
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
        <p className="mt-1.5 text-sm text-text-2">
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
        <div className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-destructive-border bg-card p-8 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-destructive-bg">
            <AlertCircle className="size-5 text-destructive" aria-hidden />
          </span>
          <p className="text-sm text-text-2">Komplikasyonlar yüklenemedi.</p>
          <button
            type="button"
            onClick={() => list.refetch()}
            className="text-sm font-medium text-primary hover:underline"
          >
            Tekrar dene
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-border bg-card p-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-success-bg">
            <CheckCircle2 className="size-6 text-success" aria-hidden />
          </span>
          <p className="text-sm font-medium text-foreground">Komplikasyon yok</p>
          <p className="text-xs text-text-3">Bu filtreye uyan kayıt bulunmuyor.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((k) => {
            const meta = STATUS_META[k.status ?? "open"];
            return (
              <li key={k.id} className="rounded-[var(--radius)] border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone={severityTone(k.severity)} icon={AlertTriangle}>
                      Seviye {k.severity}/5
                    </StatusBadge>
                    <p className="text-sm font-medium text-foreground">{k.type}</p>
                  </div>
                  <StatusBadge tone={meta?.tone ?? "neutral"} icon={meta?.icon ?? Clock}>
                    {meta?.label ?? k.status}
                  </StatusBadge>
                </div>

                <p className="mt-2 text-sm text-text-2">{k.description}</p>

                {k.resolution ? (
                  <p className="mt-2 rounded-[var(--radius)] border border-success-border bg-success-bg px-3 py-2 text-xs text-text-2">
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
