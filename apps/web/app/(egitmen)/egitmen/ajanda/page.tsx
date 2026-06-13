"use client";

import { useMemo, useState } from "react";
import { CalendarRange, Inbox, ChevronLeft, ChevronRight, Clock, Moon } from "lucide-react";
import { APPOINTMENT_STATUS_LABELS, TREATMENT_LABELS } from "@shifahub/shared";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";

const WEEKDAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"] as const;
const MONTHS = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
] as const;

const timeFmt = new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" });

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Pazartesi=0 esasli haftaici indeksi. */
function mondayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

export default function EgitmenAjandaPage() {
  const today = new Date();
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<Date>(today);

  const list = trpc.randevu.list.useQuery({ limit: 200 });

  // Tarih -> randevu sayisi haritasi (nokta gostergesi icin).
  const byDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of list.data ?? []) {
      if (!r.scheduledAt) continue;
      const k = dayKey(new Date(r.scheduledAt));
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return map;
  }, [list.data]);

  // Secili gunun randevulari (saate gore).
  const selectedAppointments = useMemo(() => {
    return (list.data ?? [])
      .filter((r) => r.scheduledAt && dayKey(new Date(r.scheduledAt)) === dayKey(selected))
      .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime());
  }, [list.data, selected]);

  // Ay izgarasi hucreleri.
  const cells = useMemo(() => {
    const firstOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const lead = mondayIndex(firstOfMonth);
    const arr: (Date | null)[] = [];
    for (let i = 0; i < lead; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++)
      arr.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    return arr;
  }, [cursor]);

  function shiftMonth(delta: number) {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  }

  const isSameDay = (a: Date, b: Date) => dayKey(a) === dayKey(b);

  return (
    <div className="px-5 pt-6">
      <header className="mb-4">
        <p className="text-xs text-text-3">Eğitmen paneli</p>
        <h1 className="font-headline text-xl font-semibold text-foreground">Ajanda</h1>
      </header>

      {/* Ay basligi + gezinme */}
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          aria-label="Önceki ay"
          className="flex size-9 items-center justify-center rounded-[var(--radius)] bg-muted text-text-2 transition-colors hover:bg-secondary"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <span className="font-headline text-base font-semibold text-foreground">
          {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
        </span>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          aria-label="Sonraki ay"
          className="flex size-9 items-center justify-center rounded-[var(--radius)] bg-muted text-text-2 transition-colors hover:bg-secondary"
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>

      {/* Takvim izgarasi */}
      <div className="rounded-[var(--radius-lg)] border border-border bg-card p-3 shadow-[var(--shadow-sm)]">
        <div className="mb-1 grid grid-cols-7 gap-1">
          {WEEKDAYS.map((w) => (
            <span key={w} className="py-1 text-center text-[11px] font-medium text-text-3">
              {w}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <span key={`e-${i}`} />;
            const sel = isSameDay(d, selected);
            const isToday = isSameDay(d, today);
            const count = byDay.get(dayKey(d)) ?? 0;
            return (
              <button
                key={dayKey(d)}
                type="button"
                onClick={() => setSelected(d)}
                aria-label={`${d.getDate()} ${MONTHS[d.getMonth()]}, ${count} randevu`}
                aria-pressed={sel}
                className={
                  "relative flex aspect-square flex-col items-center justify-center rounded-[var(--radius)] text-sm transition-colors " +
                  (sel
                    ? "bg-primary font-semibold text-primary-foreground"
                    : isToday
                      ? "bg-accent font-medium text-primary"
                      : "text-foreground hover:bg-secondary")
                }
              >
                {d.getDate()}
                {count > 0 ? (
                  <span
                    className={
                      "absolute bottom-1 size-1.5 rounded-full " +
                      (sel ? "bg-primary-foreground" : "bg-primary")
                    }
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Secili gun randevulari */}
      <section className="mt-5 pb-4">
        <h2 className="mb-3 flex items-center gap-1.5 font-headline text-base font-semibold text-foreground">
          <CalendarRange className="size-4 text-primary" aria-hidden />
          {selected.getDate()} {MONTHS[selected.getMonth()]}
        </h2>

        {list.isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : selectedAppointments.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-border bg-card p-6 text-center">
            <Inbox className="size-6 text-text-3" aria-hidden />
            <p className="text-sm text-text-2">Bu gün için randevu yok.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {selectedAppointments.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-3 rounded-[var(--radius)] border border-border bg-card p-3"
              >
                <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                  <Clock className="size-3.5" aria-hidden />
                  {r.scheduledAt ? timeFmt.format(new Date(r.scheduledAt)) : "--:--"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {r.danisanFirstName} {r.danisanLastName}
                  </p>
                  <p className="truncate text-xs text-text-3">
                    {r.treatmentType
                      ? (TREATMENT_LABELS[r.treatmentType] ?? r.treatmentType)
                      : "Randevu"}
                  </p>
                </div>
                {r.isSunnahDay ? (
                  <Moon className="size-3.5 shrink-0 text-accent-honey" aria-hidden />
                ) : null}
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-text-2">
                  {r.status ? (APPOINTMENT_STATUS_LABELS[r.status] ?? r.status) : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
