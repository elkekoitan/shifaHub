"use client";

import { History } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { trpc } from "@/lib/trpc";
import { TimelineList } from "@/components/gecmis/TimelineList";
import { buildTimeline } from "@/components/gecmis/timeline-utils";

/**
 * Danışan "Geçmişim" — randevu + tedavi + tahlil + ödeme + protokol olaylarını
 * tek tarih-sıralı zaman tünelinde birleştirir. Yeni backend yok: mevcut list
 * query'leri kullanılır; RLS danışanı otomatik kendi kayıtlarına kapatır.
 */
export default function GecmisPage() {
  const { user } = useAuthStore();
  const danisanId = user?.id ?? "";
  const enabled = Boolean(danisanId);

  const randevu = trpc.randevu.list.useQuery({ danisanId, limit: 100 }, { enabled });
  const tedavi = trpc.tedavi.list.useQuery({ danisanId }, { enabled });
  const tahlil = trpc.tahlil.list.useQuery({ danisanId, limit: 50 }, { enabled });
  const odeme = trpc.odeme.list.useQuery({ danisanId }, { enabled });
  const protokol = trpc.protokol.list.useQuery({ danisanId }, { enabled });

  const loading =
    randevu.isLoading ||
    tedavi.isLoading ||
    tahlil.isLoading ||
    odeme.isLoading ||
    protokol.isLoading;

  const items = buildTimeline(
    {
      randevu: randevu.data,
      tedavi: tedavi.data,
      tahlil: tahlil.data,
      odeme: odeme.data,
      protokol: protokol.data,
    },
    "/danisan",
  );

  return (
    <div className="px-5 pt-6">
      <header className="mb-5 flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-[var(--radius)] bg-primary text-primary-foreground">
          <History className="size-5" aria-hidden />
        </span>
        <div>
          <h1 className="font-headline text-xl font-semibold leading-tight text-foreground">
            Geçmişim
          </h1>
          <p className="text-xs text-text-3">
            Tüm randevu, tedavi, tahlil ve ödemeleriniz tek yerde
          </p>
        </div>
      </header>

      <TimelineList
        items={items}
        loading={loading}
        emptyText="Henüz bir geçmiş kaydınız yok. İlk randevunuzu oluşturduğunuzda burada görünecek."
      />
    </div>
  );
}
