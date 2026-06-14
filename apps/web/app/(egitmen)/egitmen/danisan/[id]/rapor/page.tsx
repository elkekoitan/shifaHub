"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { TREATMENT_LABELS } from "@shifahub/shared";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BrandMark } from "@/components/brand-mark";

const dFmt = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" });
const GENDER: Record<string, string> = { erkek: "Erkek", kadin: "Kadın" };
const BLOOD: Record<string, string> = {
  A_pozitif: "A Rh+",
  A_negatif: "A Rh−",
  B_pozitif: "B Rh+",
  B_negatif: "B Rh−",
  AB_pozitif: "AB Rh+",
  AB_negatif: "AB Rh−",
  O_pozitif: "0 Rh+",
  O_negatif: "0 Rh−",
};

/**
 * Yazdırılabilir hasta/tedavi özet raporu. PDF için ayrı kütüphane yerine
 * tarayıcı yazdırma (window.print → "PDF olarak kaydet") kullanılır: tam Türkçe
 * karakter desteği, ek bağımlılık yok. Print CSS layout kromunu (sidebar/nav) gizler.
 */
export default function RaporPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const profil = trpc.danisan.byUserId.useQuery({ userId: id });
  const tedaviler = trpc.tedavi.list.useQuery({ danisanId: id });
  const tahliller = trpc.tahlil.list.useQuery({ danisanId: id, limit: 50 });

  const adi = profil.data
    ? `${profil.data.firstName ?? ""} ${profil.data.lastName ?? ""}`.trim() || "Danışan"
    : "Danışan";

  return (
    <div className="px-5 pt-6">
      <style>{`@media print {
        aside, nav, .no-print { display: none !important; }
        main { max-width: none !important; }
        body { background: #fff !important; }
        .print-card { box-shadow: none !important; border-color: #ddd !important; }
      }`}</style>

      <div className="no-print mb-4 flex items-center justify-between gap-2">
        <Link
          href={`/egitmen/danisan/${id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-text-2 transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden /> Danışan
        </Link>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="size-4" aria-hidden /> Yazdır / PDF
        </Button>
      </div>

      {profil.isLoading ? (
        <Skeleton className="h-96 w-full rounded-[var(--radius-lg)]" />
      ) : (
        <article className="print-card mx-auto max-w-2xl rounded-[var(--radius-lg)] border border-border bg-card p-6 shadow-[var(--shadow-sm)]">
          {/* Baslik */}
          <header className="mb-5 flex items-center justify-between gap-3 border-b border-border pb-4">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-[var(--radius)] bg-primary text-primary-foreground">
                <BrandMark className="size-5" />
              </span>
              <div>
                <p className="font-headline text-base font-semibold text-foreground">ShifaHub</p>
                <p className="text-[11px] text-text-3">Bütünsel Tedavi Özet Raporu</p>
              </div>
            </div>
            <p className="text-[11px] text-text-3">{dFmt.format(new Date())}</p>
          </header>

          {/* Danisan kunye */}
          <section className="mb-5">
            <h2 className="mb-2 font-headline text-sm font-semibold text-foreground">Danışan</h2>
            <p className="text-sm font-medium text-foreground">{adi}</p>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-text-2">
              {profil.data?.gender ? <span>{GENDER[profil.data.gender] ?? ""}</span> : null}
              {profil.data?.bloodType ? <span>{BLOOD[profil.data.bloodType] ?? ""}</span> : null}
              {profil.data?.birthDate ? (
                <span>Doğum: {dFmt.format(new Date(profil.data.birthDate))}</span>
              ) : null}
              {profil.data?.city ? <span>{profil.data.city}</span> : null}
            </div>
            <dl className="mt-3 grid grid-cols-1 gap-1.5 text-xs">
              <RaporRow label="Kronik hastalıklar" items={profil.data?.chronicDiseases} />
              <RaporRow label="Alerjiler" items={profil.data?.allergies} />
              <RaporRow label="Kullandığı ilaçlar" items={profil.data?.currentMedications} />
              <RaporRow label="Ana şikayetler" items={profil.data?.mainComplaints} />
            </dl>
          </section>

          {/* Tedavi gecmisi */}
          <section className="mb-5">
            <h2 className="mb-2 font-headline text-sm font-semibold text-foreground">
              Tedavi geçmişi
            </h2>
            {tedaviler.data && tedaviler.data.length > 0 ? (
              <ul className="space-y-2">
                {tedaviler.data.map((t) => (
                  <li key={t.id} className="rounded-[var(--radius-sm)] border border-border p-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">
                        {TREATMENT_LABELS[t.treatmentType] ?? t.treatmentType} · Seans{" "}
                        {t.sessionNumber ?? 1}
                      </span>
                      <span className="text-text-3">
                        {t.treatmentDate ? dFmt.format(new Date(t.treatmentDate)) : ""}
                      </span>
                    </div>
                    {t.recommendations ? (
                      <p className="mt-1 text-[11px] text-text-2">Tavsiye: {t.recommendations}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-text-3">Tedavi kaydı yok.</p>
            )}
          </section>

          {/* Tahliller */}
          <section>
            <h2 className="mb-2 font-headline text-sm font-semibold text-foreground">
              Tahlil sonuçları
            </h2>
            {tahliller.data && tahliller.data.length > 0 ? (
              <ul className="space-y-1.5">
                {tahliller.data.map((t) => (
                  <li key={t.id} className="flex items-center justify-between text-xs">
                    <span className="text-foreground">{t.testType}</span>
                    <span className="text-text-3">
                      {t.testDate ? dFmt.format(new Date(t.testDate)) : ""}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-text-3">Tahlil sonucu yok.</p>
            )}
          </section>

          <footer className="mt-6 border-t border-border pt-3 text-center text-[10px] text-text-3">
            Bu rapor ShifaHub üzerinden oluşturulmuştur. Bilgilendirme amaçlıdır.
          </footer>
        </article>
      )}
    </div>
  );
}

function RaporRow({ label, items }: { label: string; items?: string[] | null }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 font-medium text-text-2">{label}:</dt>
      <dd className="text-text-2">{items && items.length > 0 ? items.join(", ") : "—"}</dd>
    </div>
  );
}
