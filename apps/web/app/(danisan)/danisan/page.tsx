"use client";

import Link from "next/link";
import {
  CalendarHeart,
  HeartPulse,
  CheckCircle2,
  ArrowRight,
  Clock,
  Plus,
  MessageCircle,
  Stethoscope,
  Moon,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { trpc } from "@/lib/trpc";
import { StatCard } from "@/components/layout/stat-card";
import { StatusBadge, type BadgeTone } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";

const dtf = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

const statusTone: Record<string, BadgeTone> = {
  requested: "warning",
  confirmed: "success",
  reminded: "info",
  arrived: "info",
  treated: "primary",
  completed: "primary",
  cancelled: "danger",
  no_show: "danger",
  ertelendi: "warning",
};
const statusLabel: Record<string, string> = {
  requested: "Talep edildi",
  confirmed: "Onaylandı",
  reminded: "Hatırlatıldı",
  arrived: "Geldi",
  treated: "Tedavi edildi",
  completed: "Tamamlandı",
  cancelled: "İptal edildi",
  no_show: "Gelmedi",
  ertelendi: "Ertelendi",
};

const quickActions = [
  { href: "/danisan/randevu", label: "Randevu al", icon: Plus },
  { href: "/danisan/egitmen", label: "Eğitmen bul", icon: Stethoscope },
  { href: "/danisan/mesaj", label: "Mesajlar", icon: MessageCircle },
];

export default function DanisanDashboard() {
  const user = useAuthStore((s) => s.user);
  const randevu = trpc.randevu.list.useQuery({ limit: 50 });
  const rows = randevu.data ?? [];

  const upcoming = rows
    .filter(
      (r) =>
        r.scheduledAt &&
        new Date(r.scheduledAt).getTime() > Date.now() &&
        r.status !== "cancelled" &&
        r.status !== "no_show",
    )
    .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime());
  const next = upcoming[0];
  const recent = [...rows]
    .sort((a, b) => new Date(b.scheduledAt!).getTime() - new Date(a.scheduledAt!).getTime())
    .slice(0, 4);
  const completed = rows.filter((r) => r.status === "completed").length;
  const initials =
    `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase() || "ŞH";

  return (
    <div className="px-5 pt-6">
      <header className="mb-6 flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {initials}
        </div>
        <div>
          <p className="text-xs text-text-3">İyi günler</p>
          <h1 className="font-headline text-xl font-semibold leading-tight text-foreground">
            {user?.firstName ? `${user.firstName} ${user.lastName ?? ""}` : "Hoş geldiniz"}
          </h1>
        </div>
      </header>

      {randevu.isLoading ? (
        <Skeleton className="mb-6 h-36 w-full rounded-[var(--radius-lg)]" />
      ) : next ? (
        <div className="relative mb-6 overflow-hidden rounded-[var(--radius-lg)] bg-primary p-5 text-primary-foreground shadow-[var(--shadow)]">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-primary-foreground/10 blur-2xl"
          />
          <div className="relative">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-primary-foreground/70">Sıradaki randevunuz</span>
              {next.isSunnahDay ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent-honey px-2 py-0.5 text-[10px] font-medium text-accent-honey-foreground">
                  <Moon className="size-3" aria-hidden /> Sünnet günü
                </span>
              ) : null}
            </div>
            <p className="font-headline text-xl font-semibold">{next.treatmentType ?? "Randevu"}</p>
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-primary-foreground/80">
              <CalendarHeart className="size-4" aria-hidden />
              {next.scheduledAt ? dtf.format(new Date(next.scheduledAt)) : ""}
            </p>
            <Link
              href="/danisan/randevu"
              className="mt-4 inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-primary-foreground/15 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-primary-foreground/25"
            >
              Detayları gör <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
        </div>
      ) : (
        <Link
          href="/danisan/randevu"
          className="mb-6 flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-border bg-card p-7 text-center transition-colors hover:border-primary/40"
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-muted">
            <Clock className="size-5 text-text-3" aria-hidden />
          </span>
          <p className="text-sm font-medium text-foreground">Yaklaşan randevunuz yok</p>
          <p className="text-xs text-text-3">Hemen bir randevu oluşturun</p>
        </Link>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3">
        <StatCard label="Aktif randevu" value={upcoming.length} icon={CalendarHeart} />
        <StatCard label="Tamamlanan" value={completed} icon={CheckCircle2} accent="success" />
        <StatCard label="Toplam seans" value={rows.length} icon={HeartPulse} />
        <StatCard
          label="Eğitmen"
          value={new Set(rows.map((r) => r.egitmenId)).size}
          icon={Stethoscope}
        />
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        {quickActions.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-2 rounded-[var(--radius)] border border-border bg-card p-3.5 text-center transition-colors hover:border-primary/40 hover:bg-secondary"
          >
            <span className="flex size-9 items-center justify-center rounded-[var(--radius-sm)] bg-accent text-primary">
              <Icon className="size-4" aria-hidden />
            </span>
            <span className="text-[11px] font-medium text-text-2">{label}</span>
          </Link>
        ))}
      </div>

      <section>
        <h2 className="mb-3 text-sm font-medium text-foreground">Son randevular</h2>
        {randevu.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full rounded-[var(--radius)]" />
            <Skeleton className="h-16 w-full rounded-[var(--radius)]" />
          </div>
        ) : recent.length === 0 ? (
          <p className="rounded-[var(--radius)] border border-dashed border-border bg-card px-4 py-6 text-center text-sm text-text-3">
            Henüz randevunuz yok.
          </p>
        ) : (
          <ul className="space-y-2">
            {recent.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-3 rounded-[var(--radius)] border border-border bg-card p-3"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-accent text-primary">
                  <CalendarHeart className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">{r.treatmentType ?? "Randevu"}</p>
                  <p className="text-xs text-text-3">
                    {r.scheduledAt ? dtf.format(new Date(r.scheduledAt)) : ""}
                  </p>
                </div>
                <StatusBadge tone={statusTone[r.status ?? "requested"]}>
                  {statusLabel[r.status ?? "requested"]}
                </StatusBadge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
