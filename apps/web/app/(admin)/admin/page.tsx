"use client";

import Link from "next/link";
import {
  Users,
  GraduationCap,
  HeartPulse,
  CalendarHeart,
  Clock,
  AlertCircle,
  ArrowRight,
  UserCog,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/stores/auth";
import { StatCard } from "@/components/layout/stat-card";
import { Skeleton } from "@/components/ui/skeleton";

const quickLinks = [
  { href: "/admin/kullanicilar", label: "Kullanıcıları yönet", icon: Users },
  { href: "/admin/egitmen", label: "Eğitmen onayları", icon: GraduationCap },
  { href: "/admin/raporlar", label: "Raporları görüntüle", icon: CalendarHeart },
];

export default function AdminDashboard() {
  const user = useAuthStore((s) => s.user);
  const stats = trpc.admin.getStats.useQuery();

  return (
    <div>
      <header className="mb-6">
        <p className="text-xs text-text-3">Yönetim paneli</p>
        <h1 className="font-headline text-2xl font-semibold text-foreground">
          Hoş geldiniz{user?.firstName ? `, ${user.firstName}` : ""}
        </h1>
        <p className="mt-1.5 text-sm text-text-2">Platform geneli özet ve hızlı işlemler.</p>
      </header>

      {stats.isLoading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-[var(--radius)]" />
          ))}
        </div>
      ) : stats.isError ? (
        <div className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-destructive-border bg-card p-8 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-destructive-bg">
            <AlertCircle className="size-5 text-destructive" aria-hidden />
          </span>
          <p className="text-sm text-text-2">İstatistikler yüklenemedi.</p>
          <button
            type="button"
            onClick={() => stats.refetch()}
            className="text-sm font-medium text-primary hover:underline"
          >
            Tekrar dene
          </button>
        </div>
      ) : stats.data ? (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="Toplam kullanıcı" value={stats.data.totalUsers} icon={Users} />
            <StatCard label="Danışan" value={stats.data.totalDanisan} icon={HeartPulse} />
            <StatCard label="Eğitmen" value={stats.data.totalEgitmen} icon={GraduationCap} />
            <StatCard
              label="Onay bekleyen"
              value={stats.data.pendingEgitmen}
              icon={Clock}
              accent="warning"
            />
            <StatCard
              label="Bugünkü randevu"
              value={stats.data.todayRandevu}
              icon={CalendarHeart}
              accent="success"
            />
            <StatCard label="Toplam randevu" value={stats.data.totalRandevu} icon={CalendarHeart} />
            <StatCard label="Toplam tedavi" value={stats.data.totalTedavi} icon={HeartPulse} />
            <StatCard label="Yönetici" value={stats.data.totalAdmin} icon={UserCog} />
          </div>

          {stats.data.pendingEgitmen > 0 ? (
            <Link
              href="/admin/egitmen"
              className="mt-5 flex items-center justify-between gap-3 rounded-[var(--radius)] bg-accent-honey px-4 py-3 text-sm font-medium text-accent-honey-foreground transition-opacity hover:opacity-90"
            >
              <span className="flex items-center gap-2">
                <Clock className="size-4" aria-hidden />
                {stats.data.pendingEgitmen} eğitmen başvurusu onay bekliyor
              </span>
              <ArrowRight className="size-4 shrink-0" aria-hidden />
            </Link>
          ) : null}
        </>
      ) : null}

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-medium text-foreground">Hızlı işlemler</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {quickLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-3 rounded-[var(--radius)] border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-secondary"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-accent text-primary">
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="flex-1 text-sm font-medium text-foreground">{label}</span>
              <ArrowRight
                className="size-4 text-text-3 transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                aria-hidden
              />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
