"use client";

import { useState } from "react";
import { ClipboardList, Inbox, Users, ChevronDown } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Label } from "@/components/ui/label";
import { StatusBadge, type BadgeTone } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";

const dateFmt = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const STATUS_LABELS: Record<string, string> = {
  active: "Aktif",
  completed: "Tamamlandı",
  paused: "Duraklatıldı",
};
const statusTone: Record<string, BadgeTone> = {
  active: "primary",
  completed: "success",
  paused: "neutral",
};
const PRIORITY_LABELS: Record<number, string> = {
  1: "Acil",
  2: "Yüksek",
  3: "Normal",
  4: "Takip",
};
const priorityTone: Record<number, BadgeTone> = {
  1: "danger",
  2: "warning",
  3: "neutral",
  4: "info",
};

export default function EgitmenProtokolPage() {
  const [danisanId, setDanisanId] = useState<string>("");
  const danisanlar = trpc.egitmen.danisanlarim.useQuery();
  const protokoller = trpc.protokol.list.useQuery({ danisanId }, { enabled: Boolean(danisanId) });

  return (
    <div className="px-5 pt-6">
      <header className="mb-4">
        <p className="text-xs text-text-3">Eğitmen paneli</p>
        <h1 className="font-headline text-xl font-semibold text-foreground">Tedavi protokolleri</h1>
        <p className="mt-1 text-sm text-text-2">
          Danışan bazlı tedavi planları ve şikayet öncelikleri.
        </p>
      </header>

      {/* Danisan secici */}
      <div className="mb-5 space-y-1.5">
        <Label htmlFor="danisanSec">Danışan</Label>
        <div className="relative">
          <select
            id="danisanSec"
            value={danisanId}
            onChange={(e) => setDanisanId(e.target.value)}
            disabled={danisanlar.isLoading}
            className="h-11 w-full appearance-none rounded-[var(--radius)] border border-input bg-card px-3 pr-9 text-sm text-foreground focus-visible:border-ring focus-visible:outline-none disabled:opacity-50"
          >
            <option value="">Danışan seçin…</option>
            {danisanlar.data?.danisanlar.map((d) => (
              <option key={d.userId} value={d.userId}>
                {d.firstName} {d.lastName}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-text-3"
            aria-hidden
          />
        </div>
      </div>

      {!danisanId ? (
        <div className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-border bg-card p-8 text-center">
          <Users className="size-7 text-text-3" aria-hidden />
          <p className="text-sm text-text-2">Protokolleri görmek için danışan seçin.</p>
        </div>
      ) : protokoller.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : protokoller.isError ? (
        <p className="rounded-[var(--radius)] bg-muted p-4 text-sm text-destructive">
          Protokoller yüklenemedi.
        </p>
      ) : !protokoller.data || protokoller.data.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-border bg-card p-8 text-center">
          <Inbox className="size-7 text-text-3" aria-hidden />
          <p className="text-sm text-text-2">Bu danışan için protokol yok.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {protokoller.data.map((p) => (
            <li
              key={p.id}
              className="rounded-[var(--radius-lg)] border border-border bg-card p-4 shadow-[var(--shadow-sm)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate text-sm font-medium text-foreground">
                    <ClipboardList className="size-4 shrink-0 text-primary" aria-hidden />
                    {p.title ?? "Tedavi protokolü"}
                  </p>
                  <p className="mt-0.5 text-xs text-text-3">
                    {p.createdAt ? dateFmt.format(new Date(p.createdAt)) : ""} ·{" "}
                    {p.egitmenFirstName} {p.egitmenLastName}
                  </p>
                </div>
                <StatusBadge tone={statusTone[p.status ?? ""] ?? "neutral"}>
                  {p.status ? (STATUS_LABELS[p.status] ?? p.status) : "—"}
                </StatusBadge>
              </div>

              {p.complaints && p.complaints.length > 0 ? (
                <ul className="mt-3 space-y-2 border-t border-border pt-3">
                  {p.complaints.map((c, i) => (
                    <li key={i} className="flex items-center justify-between gap-2 text-xs">
                      <span className="min-w-0 truncate text-text-2">{c.description}</span>
                      <StatusBadge tone={priorityTone[c.priority] ?? "neutral"}>
                        {PRIORITY_LABELS[c.priority] ?? `P${c.priority}`}
                      </StatusBadge>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
