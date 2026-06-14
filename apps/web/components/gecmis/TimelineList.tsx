"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Calendar,
  HeartPulse,
  FlaskConical,
  Wallet,
  ClipboardList,
  History,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { type TimelineItem, type TimelineKind, KIND_LABEL, formatTs } from "./timeline-utils";

const KIND_ICON: Record<TimelineKind, typeof Calendar> = {
  randevu: Calendar,
  tedavi: HeartPulse,
  tahlil: FlaskConical,
  odeme: Wallet,
  protokol: ClipboardList,
};

type Filter = "all" | TimelineKind;

export function TimelineList({
  items,
  loading,
  emptyText = "Henüz bir kayıt yok.",
}: {
  items: TimelineItem[];
  loading?: boolean;
  emptyText?: string;
}) {
  const [filter, setFilter] = useState<Filter>("all");

  // Hangi türler veride mevcut → yalnız onlara filtre çipi göster.
  const present = useMemo(() => {
    const set = new Set<TimelineKind>();
    for (const i of items) set.add(i.kind);
    return set;
  }, [items]);

  const filtered = filter === "all" ? items : items.filter((i) => i.kind === filter);

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-[var(--radius-lg)]" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-border bg-card py-12 text-center">
        <History className="size-7 text-text-3" aria-hidden />
        <p className="text-sm text-text-2">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tür filtreleri */}
      <div className="flex flex-wrap gap-2">
        {(["all", ...present] as Filter[]).map((k) => {
          const active = filter === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                active
                  ? "border-primary bg-accent text-primary"
                  : "border-border bg-card text-text-2 hover:border-primary/40",
              )}
            >
              {k === "all" ? "Hepsi" : KIND_LABEL[k]}
            </button>
          );
        })}
      </div>

      {/* Zaman tüneli */}
      <ol className="relative space-y-3 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-border">
        {filtered.map((item) => {
          const Icon = KIND_ICON[item.kind];
          const inner = (
            <div className="flex items-start gap-3">
              <span className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-card text-primary shadow-[var(--shadow-sm)]">
                <Icon className="size-4.5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1 rounded-[var(--radius-lg)] border border-border bg-card px-3.5 py-2.5 shadow-[var(--shadow-sm)] transition-colors group-hover:border-primary/40">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 truncate text-sm font-medium text-foreground">
                    {item.title}
                  </p>
                  {item.status ? (
                    <StatusBadge tone={item.status.tone}>{item.status.label}</StatusBadge>
                  ) : null}
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <p className="min-w-0 truncate text-xs text-text-3">
                    {[KIND_LABEL[item.kind], item.subtitle].filter(Boolean).join(" · ")}
                  </p>
                  <span className="flex shrink-0 items-center gap-1 text-[11px] text-text-3">
                    {formatTs(item.ts)}
                    {item.href ? <ChevronRight className="size-3.5" aria-hidden /> : null}
                  </span>
                </div>
              </div>
            </div>
          );
          return (
            <li key={item.id} className="group">
              {item.href ? (
                <Link href={item.href} className="block">
                  {inner}
                </Link>
              ) : (
                inner
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
