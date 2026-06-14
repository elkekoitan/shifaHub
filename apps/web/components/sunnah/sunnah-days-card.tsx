"use client";

import { useEffect, useState } from "react";
import { CalendarHeart, Sparkles } from "lucide-react";
import { upcomingSunnahDays, type SunnahDay } from "@shifahub/shared";

const dayFmt = new Intl.DateTimeFormat("tr-TR", {
  weekday: "short",
  day: "numeric",
  month: "long",
});

/**
 * Yaklaşan hacamat sünnet günleri (Hicri ayın 17/19/21'i). `upcomingSunnahDays`
 * Umm al-Qura ile hesaplar. `new Date()` yalnız istemcide çalıştırılır (useEffect)
 * → SSR/hydration uyuşmazlığı olmaz.
 */
export function SunnahDaysCard({ count = 3 }: { count?: number }) {
  const [days, setDays] = useState<SunnahDay[]>([]);

  useEffect(() => {
    setDays(upcomingSunnahDays(new Date(), count));
  }, [count]);

  if (days.length === 0) return null;

  return (
    <section className="mb-6 overflow-hidden rounded-[var(--radius-lg)] border border-primary/15 bg-accent/40 shadow-[var(--shadow-sm)]">
      <header className="flex items-center gap-2 border-b border-primary/10 px-4 py-2.5">
        <span className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <CalendarHeart className="size-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">Yaklaşan sünnet günleri</p>
          <p className="text-[11px] text-text-3">Hacamat için Hicri ayın 17 · 19 · 21. günleri</p>
        </div>
      </header>
      <ul className="divide-y divide-primary/10">
        {days.map((d) => (
          <li key={d.iso} className="flex items-center justify-between px-4 py-2.5">
            <span className="flex items-center gap-2 text-sm text-foreground">
              <Sparkles className="size-3.5 text-accent-honey" aria-hidden />
              {dayFmt.format(d.date)}
            </span>
            <span className="text-xs text-text-3">{d.hijriDate}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
