"use client";

import {
  BarChart3,
  ShieldCheck,
  Users,
  CalendarHeart,
  HeartPulse,
  GraduationCap,
  Clock,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { StatCard } from "@/components/layout/stat-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function RaporlarPage() {
  const stats = trpc.admin.getStats.useQuery();
  const weekly = trpc.admin.getWeeklyStats.useQuery();

  const days = weekly.data ?? [];
  const maxVal = Math.max(1, ...days.map((d) => Math.max(d.randevu, d.tedavi)));
  const weekRandevu = days.reduce((sum, d) => sum + d.randevu, 0);
  const weekTedavi = days.reduce((sum, d) => sum + d.tedavi, 0);

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-headline text-2xl font-semibold text-foreground">Raporlar</h1>
        <p className="mt-1 text-sm text-text-2">
          Platform geneli sayılar ve son 7 günün etkinliği.
        </p>
      </header>

      {/* Özet sayılar */}
      {stats.isLoading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-[var(--radius)]" />
          ))}
        </div>
      ) : stats.isError ? (
        <div className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-destructive/40 bg-card p-8 text-center">
          <ShieldCheck className="size-6 text-destructive" aria-hidden />
          <p className="text-sm text-text-2">Özet veriler yüklenemedi.</p>
          <button
            type="button"
            onClick={() => stats.refetch()}
            className="text-sm font-medium text-primary"
          >
            Tekrar dene
          </button>
        </div>
      ) : stats.data ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <StatCard label="Toplam kullanıcı" value={stats.data.totalUsers} icon={Users} />
          <StatCard label="Danışan" value={stats.data.totalDanisan} icon={HeartPulse} />
          <StatCard label="Eğitmen" value={stats.data.totalEgitmen} icon={GraduationCap} />
          <StatCard
            label="Onay bekleyen eğitmen"
            value={stats.data.pendingEgitmen}
            icon={Clock}
            accent="warning"
          />
          <StatCard label="Toplam randevu" value={stats.data.totalRandevu} icon={CalendarHeart} />
          <StatCard
            label="Toplam tedavi"
            value={stats.data.totalTedavi}
            icon={HeartPulse}
            accent="success"
          />
        </div>
      ) : null}

      {/* Haftalık grafik */}
      <section className="mt-6 rounded-[var(--radius-lg)] border border-border bg-card p-5 shadow-[var(--shadow-sm)]">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-5 text-primary" aria-hidden />
            <h2 className="font-headline text-lg font-semibold text-foreground">Son 7 gün</h2>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-text-2">
              <span className="size-2.5 rounded-full bg-primary" aria-hidden />
              Randevu
            </span>
            <span className="flex items-center gap-1.5 text-text-2">
              <span className="size-2.5 rounded-full bg-accent-honey" aria-hidden />
              Tedavi
            </span>
          </div>
        </div>

        {weekly.isLoading ? (
          <Skeleton className="h-48 w-full rounded-[var(--radius)]" />
        ) : weekly.isError ? (
          <div className="flex flex-col items-center gap-2 rounded-[var(--radius)] border border-dashed border-destructive/40 p-6 text-center">
            <ShieldCheck className="size-5 text-destructive" aria-hidden />
            <p className="text-sm text-text-2">Haftalık veri yüklenemedi.</p>
            <button
              type="button"
              onClick={() => weekly.refetch()}
              className="text-sm font-medium text-primary"
            >
              Tekrar dene
            </button>
          </div>
        ) : days.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-[var(--radius)] border border-dashed border-border p-8 text-center">
            <BarChart3 className="size-6 text-text-3" aria-hidden />
            <p className="text-sm text-text-2">Gösterilecek veri yok.</p>
          </div>
        ) : (
          <>
            <div className="flex h-48 items-end justify-between gap-2">
              {days.map((d) => (
                <div key={d.date} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-40 w-full items-end justify-center gap-1">
                    <div
                      className="w-1/2 rounded-t-[4px] bg-primary transition-all"
                      style={{ height: `${(d.randevu / maxVal) * 100}%` }}
                      title={`${d.randevu} randevu`}
                      aria-label={`${d.dayName}: ${d.randevu} randevu`}
                    />
                    <div
                      className="w-1/2 rounded-t-[4px] bg-accent-honey transition-all"
                      style={{ height: `${(d.tedavi / maxVal) * 100}%` }}
                      title={`${d.tedavi} tedavi`}
                      aria-label={`${d.dayName}: ${d.tedavi} tedavi`}
                    />
                  </div>
                  <span className="text-[10px] text-text-3">{d.dayName}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
              <div className="rounded-[var(--radius)] bg-muted p-3">
                <p className="text-xs text-text-2">Bu hafta randevu</p>
                <p className="mt-0.5 text-xl font-medium text-foreground">{weekRandevu}</p>
              </div>
              <div className="rounded-[var(--radius)] bg-muted p-3">
                <p className="text-xs text-text-2">Bu hafta tedavi</p>
                <p className="mt-0.5 text-xl font-medium text-foreground">{weekTedavi}</p>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
