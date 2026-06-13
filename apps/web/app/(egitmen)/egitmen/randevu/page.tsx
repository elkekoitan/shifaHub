"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Inbox, Clock, Moon } from "lucide-react";
import { APPOINTMENT_STATUS_LABELS, TREATMENT_LABELS } from "@shifahub/shared";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { StatusBadge, type BadgeTone } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";

function initials(first?: string | null, last?: string | null): string {
  return `${(first ?? "").charAt(0)}${(last ?? "").charAt(0)}`.toUpperCase() || "?";
}

/** Backend (randevu.ts) state machine'inin UI karsiligi — buton kapilamasi icin. */
const VALID_TRANSITIONS: Record<string, readonly string[]> = {
  requested: ["confirmed", "cancelled"],
  confirmed: ["reminded", "arrived", "cancelled", "ertelendi"],
  reminded: ["arrived", "cancelled", "no_show", "ertelendi"],
  arrived: ["treated"],
  treated: ["completed"],
  completed: [],
  cancelled: [],
  no_show: [],
  ertelendi: ["confirmed", "cancelled"],
};

const STATUS_LABELS: Record<string, string> = {
  ...APPOINTMENT_STATUS_LABELS,
  ertelendi: "Ertelendi",
};

const NEXT_LABELS: Record<string, string> = {
  confirmed: "Onayla",
  reminded: "Hatırlat",
  arrived: "Geldi",
  treated: "Tedavi et",
  completed: "Tamamla",
  cancelled: "İptal et",
  no_show: "Gelmedi",
  ertelendi: "Ertele",
};

const statusTone: Record<string, BadgeTone> = {
  requested: "warning",
  confirmed: "primary",
  reminded: "info",
  arrived: "info",
  treated: "success",
  completed: "success",
  cancelled: "danger",
  no_show: "danger",
  ertelendi: "neutral",
};

const dtf = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const FILTERS = [
  { value: undefined, label: "Tümü" },
  { value: "requested", label: "Bekleyen" },
  { value: "confirmed", label: "Onaylı" },
  { value: "arrived", label: "Klinikte" },
  { value: "completed", label: "Biten" },
] as const;

export default function EgitmenRandevuPage() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const utils = trpc.useUtils();
  const list = trpc.randevu.list.useQuery(
    statusFilter ? { status: statusFilter as never, limit: 100 } : { limit: 100 },
  );
  const [pendingId, setPendingId] = useState<string | null>(null);

  const updateStatus = trpc.randevu.updateStatus.useMutation({
    onSuccess: (res) => {
      toast.success("Randevu durumu güncellendi");
      if (res.warning) toast.warning(res.warning);
      void utils.randevu.list.invalidate();
      void utils.randevu.getDailyStats.invalidate();
    },
    onError: (e) => toast.error(e.message),
    onSettled: () => setPendingId(null),
  });

  function changeStatus(randevuId: string, status: string) {
    setPendingId(randevuId);
    updateStatus.mutate({ randevuId, status: status as never });
  }

  return (
    <div className="px-5 pt-6">
      <header className="mb-4">
        <p className="text-xs text-text-3">Eğitmen paneli</p>
        <h1 className="font-headline text-xl font-semibold text-foreground">Randevular</h1>
        <p className="mt-1 text-sm text-text-2">
          Randevu akışını yönetin ve durumları güncelleyin.
        </p>
      </header>

      {/* Filtre cipsleri */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => {
          const active = statusFilter === f.value;
          return (
            <button
              key={f.label}
              type="button"
              onClick={() => setStatusFilter(f.value)}
              className={
                "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors " +
                (active
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-text-2 hover:bg-secondary")
              }
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {list.isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : list.isError ? (
        <p className="rounded-[var(--radius)] bg-muted p-4 text-sm text-destructive">
          Randevular yüklenemedi.
        </p>
      ) : !list.data || list.data.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-border bg-card p-8 text-center">
          <Inbox className="size-7 text-text-3" aria-hidden />
          <p className="text-sm text-text-2">Bu filtrede randevu yok.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.data.map((r) => {
            const transitions = VALID_TRANSITIONS[r.status ?? ""] ?? [];
            const busy = pendingId === r.id && updateStatus.isPending;
            return (
              <li
                key={r.id}
                className="rounded-[var(--radius-lg)] border border-border bg-card p-4 shadow-[var(--shadow-sm)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-primary">
                      {initials(r.danisanFirstName, r.danisanLastName)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {r.danisanFirstName} {r.danisanLastName}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-text-3">
                        <CalendarDays className="size-3.5" aria-hidden />
                        {r.scheduledAt ? dtf.format(new Date(r.scheduledAt)) : "Tarih yok"}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-text-3">
                        <Clock className="size-3.5" aria-hidden />
                        {r.treatmentType
                          ? (TREATMENT_LABELS[r.treatmentType] ?? r.treatmentType)
                          : "Genel"}
                        {r.duration ? ` · ${r.duration} dk` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <StatusBadge tone={statusTone[r.status ?? ""] ?? "neutral"}>
                      {r.status ? (STATUS_LABELS[r.status] ?? r.status) : "—"}
                    </StatusBadge>
                    {r.isSunnahDay ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent-honey px-2 py-0.5 text-[10px] font-medium text-accent-honey-foreground">
                        <Moon className="size-2.5" aria-hidden /> Sünnet
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* State machine butonlari */}
                {transitions.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                    {transitions.map((next) => (
                      <Button
                        key={next}
                        size="sm"
                        variant={next === "cancelled" || next === "no_show" ? "outline" : "default"}
                        loading={busy}
                        disabled={busy}
                        onClick={() => changeStatus(r.id, next)}
                        aria-label={`Randevuyu ${NEXT_LABELS[next] ?? next} olarak işaretle`}
                      >
                        {NEXT_LABELS[next] ?? next}
                      </Button>
                    ))}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
