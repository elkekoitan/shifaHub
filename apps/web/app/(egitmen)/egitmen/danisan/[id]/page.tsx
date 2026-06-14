"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  HeartPulse,
  AlertTriangle,
  Pill,
  Droplets,
  Cake,
  History,
  Lightbulb,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { TimelineList } from "@/components/gecmis/TimelineList";
import { buildTimeline } from "@/components/gecmis/timeline-utils";
import { BloodValueChart } from "@/components/tahlil/blood-value-chart";

const dateFmt = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const GENDER_LABELS: Record<string, string> = { erkek: "Erkek", kadin: "Kadın" };
const BLOOD_LABELS: Record<string, string> = {
  A_pozitif: "A Rh+",
  A_negatif: "A Rh−",
  B_pozitif: "B Rh+",
  B_negatif: "B Rh−",
  AB_pozitif: "AB Rh+",
  AB_negatif: "AB Rh−",
  O_pozitif: "0 Rh+",
  O_negatif: "0 Rh−",
};

function Chips({ items }: { items: string[] | null | undefined }) {
  if (!items || items.length === 0) return <span className="text-sm text-text-3">—</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((it, i) => (
        <span
          key={`${it}-${i}`}
          className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-text-2"
        >
          {it}
        </span>
      ))}
    </div>
  );
}

export default function DanisanDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const profil = trpc.danisan.byUserId.useQuery({ userId: id });
  // Hasta dosyasi gecmisi — RLS yalnizca care_relationship='active' danisanin
  // verisini dondurur; danisanId zorunlu/opsiyonel olarak gecilir.
  const tedaviler = trpc.tedavi.list.useQuery({ danisanId: id });
  const tahliller = trpc.tahlil.list.useQuery({ danisanId: id, limit: 50 });
  const randevular = trpc.randevu.list.useQuery({ danisanId: id, limit: 100 });
  const odemeler = trpc.odeme.list.useQuery({ danisanId: id });
  const protokoller = trpc.protokol.list.useQuery({ danisanId: id });

  const gecmisLoading =
    tedaviler.isLoading ||
    tahliller.isLoading ||
    randevular.isLoading ||
    odemeler.isLoading ||
    protokoller.isLoading;

  const timeline = buildTimeline({
    randevu: randevular.data,
    tedavi: tedaviler.data,
    tahlil: tahliller.data,
    odeme: odemeler.data,
    protokol: protokoller.data,
  });

  const tavsiyeler = (tedaviler.data ?? []).filter(
    (t) => t.recommendations && t.recommendations.trim().length > 0,
  );

  return (
    <div className="px-5 pt-6">
      <Link
        href="/egitmen/danisan"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-text-2 transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden /> Danışanlar
      </Link>

      {profil.isLoading ? (
        <Skeleton className="mb-5 h-40 w-full rounded-[var(--radius-lg)]" />
      ) : profil.isError ? (
        <p className="rounded-[var(--radius)] bg-muted p-4 text-sm text-destructive">
          Danışan profili yüklenemedi.
        </p>
      ) : profil.data ? (
        <>
          {/* Kunye */}
          <div className="mb-5 rounded-[var(--radius-lg)] border border-border bg-card p-5 shadow-[var(--shadow-sm)]">
            <div className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
                <HeartPulse className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h1 className="font-headline text-lg font-semibold leading-tight text-foreground">
                  Danışan profili
                </h1>
                <p className="text-xs text-text-3">Sağlık geçmişi ve klinik bilgiler</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-[var(--radius)] bg-muted p-3">
                <p className="flex items-center gap-1 text-[11px] text-text-3">
                  <Droplets className="size-3" aria-hidden /> Kan grubu
                </p>
                <p className="mt-0.5 text-sm font-medium text-foreground">
                  {profil.data.bloodType ? (BLOOD_LABELS[profil.data.bloodType] ?? "—") : "—"}
                </p>
              </div>
              <div className="rounded-[var(--radius)] bg-muted p-3">
                <p className="text-[11px] text-text-3">Cinsiyet</p>
                <p className="mt-0.5 text-sm font-medium text-foreground">
                  {profil.data.gender ? (GENDER_LABELS[profil.data.gender] ?? "—") : "—"}
                </p>
              </div>
              <div className="rounded-[var(--radius)] bg-muted p-3">
                <p className="flex items-center gap-1 text-[11px] text-text-3">
                  <Cake className="size-3" aria-hidden /> Doğum
                </p>
                <p className="mt-0.5 text-sm font-medium text-foreground">
                  {profil.data.birthDate ? dateFmt.format(new Date(profil.data.birthDate)) : "—"}
                </p>
              </div>
            </div>

            <dl className="mt-4 space-y-3">
              <div>
                <dt className="mb-1 flex items-center gap-1 text-xs font-medium text-text-2">
                  <AlertTriangle className="size-3.5 text-warning" aria-hidden /> Kronik hastalıklar
                </dt>
                <dd>
                  <Chips items={profil.data.chronicDiseases} />
                </dd>
              </div>
              <div>
                <dt className="mb-1 flex items-center gap-1 text-xs font-medium text-text-2">
                  <AlertTriangle className="size-3.5 text-destructive" aria-hidden /> Alerjiler
                </dt>
                <dd>
                  <Chips items={profil.data.allergies} />
                </dd>
              </div>
              <div>
                <dt className="mb-1 flex items-center gap-1 text-xs font-medium text-text-2">
                  <Pill className="size-3.5 text-primary" aria-hidden /> Kullandığı ilaçlar
                </dt>
                <dd>
                  <Chips items={profil.data.currentMedications} />
                </dd>
              </div>
              <div>
                <dt className="mb-1 text-xs font-medium text-text-2">Ana şikayetler</dt>
                <dd>
                  <Chips items={profil.data.mainComplaints} />
                </dd>
              </div>
            </dl>
          </div>

          {/* Eylem: tedavi olustur */}
          <Link
            href="/egitmen/tedavi"
            className="mb-6 flex w-full items-center justify-center gap-2 rounded-[var(--radius)] bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-[var(--shadow-sm)] transition-all hover:bg-primary-700 active:scale-[0.98]"
          >
            <HeartPulse className="size-4" aria-hidden /> Yeni tedavi kaydı
          </Link>
        </>
      ) : null}

      {/* Tavsiyeler — tedavi kayitlarindan oneriler */}
      {tavsiyeler.length > 0 ? (
        <section className="mb-6">
          <h2 className="mb-3 flex items-center gap-1.5 font-headline text-base font-semibold text-foreground">
            <Lightbulb className="size-4 text-accent-honey" aria-hidden /> Tavsiyeler
          </h2>
          <ul className="space-y-2">
            {tavsiyeler.map((t) => (
              <li
                key={t.id}
                className="rounded-[var(--radius)] border border-border bg-card p-3 shadow-[var(--shadow-sm)]"
              >
                <p className="text-xs text-text-3">
                  {t.treatmentDate ? dateFmt.format(new Date(t.treatmentDate)) : ""}
                </p>
                <p className="mt-0.5 whitespace-pre-wrap text-sm text-foreground">
                  {t.recommendations}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Kan degerleri trendi */}
      {(tahliller.data?.length ?? 0) > 0 ? (
        <section className="mb-6">
          <BloodValueChart records={tahliller.data ?? []} />
        </section>
      ) : null}

      {/* Hasta dosyasi — birlesik gecmis (randevu + tedavi + tahlil + odeme + protokol) */}
      <section className="pb-4">
        <h2 className="mb-3 flex items-center gap-1.5 font-headline text-base font-semibold text-foreground">
          <History className="size-4 text-primary" aria-hidden /> Hasta dosyası — geçmiş
        </h2>
        <TimelineList
          items={timeline}
          loading={gecmisLoading}
          emptyText="Bu danışan için henüz kayıt yok."
        />
      </section>
    </div>
  );
}
