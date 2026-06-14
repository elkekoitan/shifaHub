"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ShieldCheck, CheckCircle2, ArrowLeft, Lock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand-mark";

const money = (v: string | number | null | undefined) =>
  `${Number(v ?? 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;

export default function DemoCheckoutPage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const odemeId = params.id;
  const ref = search.get("ref") ?? "";

  const odeme = trpc.odeme.getById.useQuery({ id: odemeId });
  const confirm = trpc.odeme.confirmDemo.useMutation();
  const [done, setDone] = useState(false);

  const balance = odeme.data ? Number(odeme.data.amount) - Number(odeme.data.paidAmount ?? 0) : 0;

  async function pay() {
    try {
      await confirm.mutateAsync({ odemeId, ref });
      setDone(true);
      setTimeout(() => router.replace("/danisan/odeme"), 1600);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Ödeme tamamlanamadı.");
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-md flex-col justify-center px-5">
      <button
        type="button"
        onClick={() => router.replace("/danisan/odeme")}
        className="mb-4 inline-flex items-center gap-1 self-start text-xs text-text-3 transition-colors hover:text-text-2"
      >
        <ArrowLeft className="size-3.5" aria-hidden /> Ödemelerime dön
      </button>

      <div className="overflow-hidden rounded-[var(--radius-xl)] border border-border bg-card shadow-[var(--shadow-md)]">
        {/* Gateway başlığı */}
        <div className="flex items-center justify-between bg-primary px-5 py-3 text-primary-foreground">
          <span className="flex items-center gap-2 font-headline text-sm font-semibold">
            <BrandMark className="size-5" /> ShifaHub Ödeme
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium">
            <Lock className="size-3" aria-hidden /> DEMO
          </span>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-success-bg text-success">
              <CheckCircle2 className="size-8" aria-hidden />
            </span>
            <h1 className="font-headline text-lg font-semibold text-foreground">Ödeme alındı</h1>
            <p className="text-sm text-text-2">
              {money(odeme.data?.amount)} tutarındaki ödemeniz başarıyla tamamlandı.
            </p>
          </div>
        ) : (
          <div className="space-y-4 px-6 py-6">
            <div className="text-center">
              <p className="text-xs text-text-3">Ödenecek tutar</p>
              <p className="font-headline text-3xl font-bold text-foreground">
                {odeme.isLoading ? "…" : money(balance)}
              </p>
              <p className="mt-1 truncate text-xs text-text-3">
                {odeme.data?.description || "Tedavi ücreti"}
              </p>
            </div>

            {/* Demo kart alanı (devre dışı, bilgi amaçlı) */}
            <div className="space-y-2 rounded-[var(--radius-lg)] border border-dashed border-border bg-secondary/50 p-3">
              <div className="flex items-center justify-between text-[11px] text-text-3">
                <span>Kart numarası</span>
                <span>Demo</span>
              </div>
              <div className="rounded-[var(--radius)] border border-border bg-card px-3 py-2 font-mono text-sm tracking-widest text-text-3">
                4242 4242 4242 4242
              </div>
              <p className="text-[10px] leading-snug text-text-3">
                Bu bir demo ödeme ekranıdır; gerçek kart bilgisi girilmez ve para tahsil edilmez.
                Gerçek ortamda iyzico/PayTR güvenli ödeme sayfası açılır.
              </p>
            </div>

            <Button className="w-full" size="lg" onClick={pay} loading={confirm.isPending}>
              <ShieldCheck className="size-4" aria-hidden /> Ödemeyi tamamla
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
