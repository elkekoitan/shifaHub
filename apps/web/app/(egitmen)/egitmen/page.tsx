"use client";

import Link from "next/link";
import {
  CalendarClock,
  Users,
  PackageX,
  ClockAlert,
  ArrowRight,
  CheckCircle2,
  Inbox,
  TriangleAlert,
} from "lucide-react";
import { APPOINTMENT_STATUS_LABELS, TREATMENT_LABELS } from "@shifahub/shared";
import { useAuthStore } from "@/stores/auth";
import { trpc } from "@/lib/trpc";
import { StatCard } from "@/components/layout/stat-card";
import { StatusBadge, type BadgeTone } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";

const timeFmt = new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" });

const statusTone: Record<string, BadgeTone> = {
  requested: "warning",
  confirmed: "success",
  reminded: "info",
  arrived: "info",
  treated: "primary",
  completed: "primary",
  cancelled: "danger",
  no_show: "danger",
};

function initials(first?: string | null, last?: string | null): string {
  return `${(first ?? "").charAt(0)}${(last ?? "").charAt(0)}`.toUpperCase() || "?";
}

function isToday(d: Date): boolean {
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export default function EgitmenDashboard() {
  const user = useAuthStore((s) => s.user);
  const stats = trpc.randevu.getDailyStats.useQuery();
  const danisanlar = trpc.egitmen.danisanlarim.useQuery();
  const critical = trpc.stok.getCriticalStock.useQuery();
  const randevular = trpc.randevu.list.useQuery({ limit: 100 });

  const todays = (randevular.data ?? [])
    .filter((r) => r.scheduledAt && isToday(new Date(r.scheduledAt)))
    .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime());

  return (
    <div className="px-5 pt-6">
      <header className="mb-6 flex items-center gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-primary">
          {initials(user?.firstName, user?.lastName)}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-text-3">Eğitmen paneli</p>
          <h1 className="font-headline text-xl font-semibold leading-tight text-foreground">
            {user?.firstName ? `Merhaba, ${user.firstName}` : "Hoş geldiniz"}
          </h1>
        </div>
      </header>

      {/* Ozet istatistikler */}
      <div className="grid grid-cols-2 gap-3">
        {stats.isLoading ? (
          <>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </>
        ) : (
          <>
            <StatCard
              label="Bugünkü randevu"
              value={stats.data?.bugunku ?? 0}
              icon={CalendarClock}
            />
            <StatCard
              label="Onay bekleyen"
              value={stats.data?.onayBekleyen ?? 0}
              icon={ClockAlert}
              accent="warning"
            />
          </>
        )}
        <StatCard
          label="Danışan"
          value={danisanlar.isLoading ? "…" : (danisanlar.data?.count ?? 0)}
          icon={Users}
        />
        <StatCard
          label="Kritik stok"
          value={critical.isLoading ? "…" : (critical.data?.length ?? 0)}
          icon={PackageX}
          accent={critical.data && critical.data.length > 0 ? "warning" : "success"}
        />
      </div>

      {/* Bugunku randevular */}
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-headline text-base font-semibold text-foreground">
            Bugünün randevuları
          </h2>
          <Link
            href="/egitmen/randevu"
            className="flex items-center gap-1 text-xs font-medium text-primary"
          >
            Tümü <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>

        {randevular.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : randevular.isError ? (
          <p className="rounded-[var(--radius)] bg-muted p-4 text-sm text-destructive">
            Randevular yüklenemedi.
          </p>
        ) : todays.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-border bg-card p-6 text-center">
            <Inbox className="size-6 text-text-3" aria-hidden />
            <p className="text-sm text-text-2">Bugün için randevu yok.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {todays.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-3 rounded-[var(--radius)] border border-border bg-card p-3"
              >
                <div className="flex size-11 shrink-0 flex-col items-center justify-center rounded-[var(--radius)] bg-accent text-primary">
                  <span className="text-xs font-semibold tabular-nums">
                    {r.scheduledAt ? timeFmt.format(new Date(r.scheduledAt)) : "--:--"}
                  </span>
                </div>
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
                <StatusBadge tone={statusTone[r.status ?? "requested"] ?? "neutral"}>
                  {r.status ? (APPOINTMENT_STATUS_LABELS[r.status] ?? r.status) : "—"}
                </StatusBadge>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Kritik stok uyarisi */}
      {!critical.isLoading && critical.data && critical.data.length > 0 ? (
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-headline text-base font-semibold text-foreground">Kritik stok</h2>
            <Link
              href="/egitmen/stok"
              className="flex items-center gap-1 text-xs font-medium text-primary"
            >
              Yönet <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
          <ul className="space-y-2">
            {critical.data.slice(0, 4).map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-warning-border bg-warning-bg p-3"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-warning/15 text-warning">
                    <PackageX className="size-4" aria-hidden />
                  </span>
                  <span className="truncate text-sm font-medium text-foreground">{s.name}</span>
                </span>
                <StatusBadge tone="warning" icon={TriangleAlert}>
                  {s.quantity} {s.unit} kaldı
                </StatusBadge>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Gunluk durum ozeti */}
      <div className="mt-6 flex items-center gap-2 rounded-[var(--radius)] bg-secondary px-4 py-3 text-sm text-secondary-foreground">
        <CheckCircle2 className="size-4 text-success" aria-hidden />
        {stats.data
          ? `Bugün ${stats.data.bugunku} randevu, ${stats.data.arrived} danışan klinikte.`
          : "Gün özeti hazırlanıyor."}
      </div>
    </div>
  );
}
