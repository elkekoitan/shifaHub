"use client";

import { CalendarHeart, HeartPulse, Bell, CheckCircle2, ArrowRight, Clock } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { trpc } from "@/lib/trpc";
import { StatCard } from "@/components/layout/stat-card";
import { Skeleton } from "@/components/ui/skeleton";

const dtf = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

export default function DanisanDashboard() {
  const user = useAuthStore((s) => s.user);
  const randevu = trpc.randevu.list.useQuery({ limit: 50 });

  const upcoming = (randevu.data ?? [])
    .filter(
      (r) =>
        r.scheduledAt &&
        new Date(r.scheduledAt).getTime() > Date.now() &&
        r.status !== "cancelled" &&
        r.status !== "no_show",
    )
    .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime());
  const next = upcoming[0];
  const activeCount = upcoming.length;
  const treatedCount = (randevu.data ?? []).filter((r) => r.status === "completed").length;

  return (
    <div className="px-5 pt-6">
      <header className="mb-5">
        <p className="text-xs text-text-3">İyi günler</p>
        <h1 className="font-headline text-xl font-semibold text-foreground">
          {user?.firstName ? `${user.firstName} ${user.lastName ?? ""}` : "Hoş geldiniz"}
        </h1>
      </header>

      {randevu.isLoading ? (
        <Skeleton className="mb-5 h-32 w-full rounded-[var(--radius-lg)]" />
      ) : next ? (
        <div className="mb-5 rounded-[var(--radius-lg)] bg-primary p-4 text-primary-foreground shadow-[var(--shadow)]">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-primary-foreground/70">Sıradaki randevu</span>
            {next.isSunnahDay ? (
              <span className="rounded-full bg-accent-honey px-2 py-0.5 text-[10px] font-medium text-accent-honey-foreground">
                Sünnet günü
              </span>
            ) : null}
          </div>
          <p className="font-headline text-lg font-semibold">{next.treatmentType ?? "Randevu"}</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-primary-foreground/80">
            <CalendarHeart className="size-3.5" aria-hidden />
            {next.scheduledAt ? dtf.format(new Date(next.scheduledAt)) : ""}
          </p>
        </div>
      ) : (
        <div className="mb-5 flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-border bg-card p-6 text-center">
          <Clock className="size-6 text-text-3" aria-hidden />
          <p className="text-sm text-text-2">Yaklaşan randevunuz yok.</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Aktif randevu" value={activeCount} icon={CalendarHeart} />
        <StatCard label="Tamamlanan" value={treatedCount} icon={CheckCircle2} accent="success" />
        <StatCard label="Tedavi" value={(randevu.data ?? []).length} icon={HeartPulse} />
        <StatCard label="Bildirim" value={0} icon={Bell} accent="warning" />
      </div>

      <button
        type="button"
        className="mt-5 flex w-full items-center justify-between rounded-[var(--radius)] bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground transition-colors hover:bg-accent"
      >
        Yeni randevu oluştur
        <ArrowRight className="size-4" aria-hidden />
      </button>
    </div>
  );
}
