"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Wallet, CheckCircle2, Clock, CircleDollarSign, Gift, CreditCard } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, type BadgeTone } from "@/components/ui/status-badge";

const STATUS_META: Record<string, { tone: BadgeTone; label: string; icon: typeof Clock }> = {
  paid: { tone: "success", label: "Ödendi", icon: CheckCircle2 },
  pending: { tone: "warning", label: "Bekliyor", icon: Clock },
  partial: { tone: "info", label: "Kısmi ödendi", icon: CircleDollarSign },
  free: { tone: "neutral", label: "Ücretsiz", icon: Gift },
};

const money = (v: string | number | null | undefined) =>
  `${Number(v ?? 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;

export default function OdemelerimPage() {
  const router = useRouter();
  const list = trpc.odeme.list.useQuery({});
  const initiate = trpc.odeme.initiateOnline.useMutation();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function payOnline(id: string) {
    setBusyId(id);
    try {
      const res = await initiate.mutateAsync({ odemeId: id });
      router.push(res.redirectUrl);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Ödeme başlatılamadı.");
      setBusyId(null);
    }
  }

  return (
    <div className="px-5 pt-6">
      <header className="mb-5 flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-[var(--radius)] bg-primary text-primary-foreground">
          <Wallet className="size-5" aria-hidden />
        </span>
        <div>
          <h1 className="font-headline text-xl font-semibold leading-tight text-foreground">
            Ödemelerim
          </h1>
          <p className="text-xs text-text-3">Tedavi ve seans ücretlerini görüntüle, online öde</p>
        </div>
      </header>

      {list.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-[var(--radius-lg)]" />
          ))}
        </div>
      ) : !list.data || list.data.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-border bg-card py-12 text-center">
          <Wallet className="size-7 text-text-3" aria-hidden />
          <p className="text-sm text-text-2">Henüz bir ödeme kaydınız yok.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.data.map((o) => {
            const meta = STATUS_META[o.status ?? "pending"] ?? STATUS_META.pending!;
            const balance = Number(o.amount) - Number(o.paidAmount ?? 0);
            const payable = (o.status === "pending" || o.status === "partial") && balance > 0;
            return (
              <li
                key={o.id}
                className="rounded-[var(--radius-lg)] border border-border bg-card p-4 shadow-[var(--shadow-sm)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {o.description || "Tedavi ücreti"}
                    </p>
                    <p className="mt-0.5 text-xs text-text-3">
                      {o.createdAt
                        ? new Date(o.createdAt).toLocaleDateString("tr-TR", { dateStyle: "medium" })
                        : ""}
                      {o.provider === "demo" ? " · online (demo)" : ""}
                    </p>
                  </div>
                  <StatusBadge tone={meta.tone} icon={meta.icon}>
                    {meta.label}
                  </StatusBadge>
                </div>

                <div className="mt-3 flex items-end justify-between gap-3">
                  <div>
                    <p className="font-headline text-lg font-semibold text-foreground">
                      {money(o.amount)}
                    </p>
                    {o.status === "partial" ? (
                      <p className="text-[11px] text-text-3">
                        Ödenen {money(o.paidAmount)} · Kalan {money(balance)}
                      </p>
                    ) : null}
                  </div>
                  {payable ? (
                    <Button
                      size="sm"
                      onClick={() => payOnline(o.id)}
                      loading={busyId === o.id}
                      className="shrink-0"
                    >
                      <CreditCard className="size-4" aria-hidden /> Online öde
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-5 text-center text-[10px] text-text-3">
        Online ödeme demo modundadır; gerçek kart bilgisi istenmez.
      </p>
    </div>
  );
}
