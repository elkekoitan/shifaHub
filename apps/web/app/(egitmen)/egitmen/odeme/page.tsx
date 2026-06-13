"use client";

import { Wallet, TrendingUp, Clock, Inbox, Banknote, CreditCard } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { StatCard } from "@/components/layout/stat-card";
import { Skeleton } from "@/components/ui/skeleton";

const tl = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 0,
});

const dtf = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const STATUS_LABELS: Record<string, string> = {
  paid: "Ödendi",
  pending: "Bekliyor",
  partial: "Kısmi",
  free: "Ücretsiz",
};
const statusTone: Record<string, string> = {
  paid: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  partial: "bg-accent text-primary",
  free: "bg-muted text-text-2",
};
const METHOD_LABELS: Record<string, string> = {
  nakit: "Nakit",
  kart: "Kart",
  havale: "Havale",
  eft: "EFT",
};

export default function EgitmenOdemePage() {
  const kasa = trpc.odeme.getDailyKasa.useQuery({});
  const list = trpc.odeme.list.useQuery({ limit: 100 });

  return (
    <div className="px-5 pt-6">
      <header className="mb-5">
        <p className="text-xs text-text-3">Eğitmen paneli</p>
        <h1 className="font-headline text-xl font-semibold text-foreground">Ödemeler & Kasa</h1>
      </header>

      {/* Gunluk kasa ozeti */}
      <section className="mb-6">
        <h2 className="mb-3 flex items-center gap-1.5 font-headline text-base font-semibold text-foreground">
          <Wallet className="size-4 text-primary" aria-hidden /> Bugünün kasası
        </h2>
        {kasa.isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : kasa.isError ? (
          <p className="rounded-[var(--radius)] bg-muted p-4 text-sm text-destructive">
            Kasa özeti yüklenemedi.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Tahsil edilen"
                value={tl.format(kasa.data?.paidAmount ?? 0)}
                icon={TrendingUp}
                accent="success"
              />
              <StatCard
                label="Bekleyen"
                value={tl.format(kasa.data?.pendingAmount ?? 0)}
                icon={Clock}
                accent="warning"
              />
            </div>
            {/* Odeme yontemi dagilimi */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between rounded-[var(--radius)] bg-muted px-3 py-2.5">
                <span className="flex items-center gap-1.5 text-xs text-text-2">
                  <Banknote className="size-3.5" aria-hidden /> Nakit
                </span>
                <span className="text-sm font-medium text-foreground">
                  {tl.format(kasa.data?.byMethod.nakit ?? 0)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-[var(--radius)] bg-muted px-3 py-2.5">
                <span className="flex items-center gap-1.5 text-xs text-text-2">
                  <CreditCard className="size-3.5" aria-hidden /> Kart
                </span>
                <span className="text-sm font-medium text-foreground">
                  {tl.format(kasa.data?.byMethod.kart ?? 0)}
                </span>
              </div>
            </div>
            <p className="mt-2 text-xs text-text-3">
              {kasa.data?.count ?? 0} işlem · Toplam {tl.format(kasa.data?.totalAmount ?? 0)}
            </p>
          </>
        )}
      </section>

      {/* Odeme listesi */}
      <section className="pb-4">
        <h2 className="mb-3 font-headline text-base font-semibold text-foreground">Son ödemeler</h2>
        {list.isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : list.isError ? (
          <p className="rounded-[var(--radius)] bg-muted p-4 text-sm text-destructive">
            Ödemeler yüklenemedi.
          </p>
        ) : !list.data || list.data.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-border bg-card p-8 text-center">
            <Inbox className="size-7 text-text-3" aria-hidden />
            <p className="text-sm text-text-2">Henüz ödeme kaydı yok.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {list.data.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-[var(--radius)] border border-border bg-card p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {p.description ?? "Ödeme"}
                  </p>
                  <p className="text-xs text-text-3">
                    {p.method ? (METHOD_LABELS[p.method] ?? p.method) : ""} ·{" "}
                    {p.createdAt ? dtf.format(new Date(p.createdAt)) : ""}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-foreground">
                    {tl.format(Number(p.amount))}
                  </p>
                  <span
                    className={
                      "mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium " +
                      (statusTone[p.status ?? ""] ?? "bg-muted text-text-2")
                    }
                  >
                    {p.status ? (STATUS_LABELS[p.status] ?? p.status) : ""}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
