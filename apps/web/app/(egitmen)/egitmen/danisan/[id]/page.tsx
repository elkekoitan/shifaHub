"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  HeartPulse,
  FlaskConical,
  AlertTriangle,
  Pill,
  Droplets,
  Cake,
  Inbox,
} from "lucide-react";
import { TREATMENT_LABELS } from "@shifahub/shared";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";

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
  const tedaviler = trpc.tedavi.list.useQuery({ danisanId: id });
  const tahliller = trpc.tahlil.list.useQuery({ danisanId: id, limit: 20 });

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
            <h1 className="font-headline text-lg font-semibold text-foreground">Danışan profili</h1>
            <div className="mt-3 grid grid-cols-3 gap-3">
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

      {/* Tedavi gecmisi */}
      <section className="mb-6">
        <h2 className="mb-3 flex items-center gap-1.5 font-headline text-base font-semibold text-foreground">
          <HeartPulse className="size-4 text-primary" aria-hidden /> Tedavi geçmişi
        </h2>
        {tedaviler.isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : tedaviler.data && tedaviler.data.length > 0 ? (
          <ul className="space-y-2">
            {tedaviler.data.map((t) => (
              <li key={t.id} className="rounded-[var(--radius)] border border-border bg-card p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {TREATMENT_LABELS[t.treatmentType] ?? t.treatmentType}
                  </span>
                  <span className="text-xs text-text-3">
                    {t.treatmentDate ? dateFmt.format(new Date(t.treatmentDate)) : ""}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-text-3">
                  Seans {t.sessionNumber ?? 1} · {t.egitmenFirstName} {t.egitmenLastName}
                </p>
                {t.contraindications && t.contraindications.length > 0 ? (
                  <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-warning">
                    <AlertTriangle className="size-3" aria-hidden /> {t.contraindications.length}{" "}
                    uyarı
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-border bg-card p-6 text-center">
            <Inbox className="size-6 text-text-3" aria-hidden />
            <p className="text-sm text-text-2">Tedavi kaydı yok.</p>
          </div>
        )}
      </section>

      {/* Tahlil sonuclari */}
      <section className="pb-4">
        <h2 className="mb-3 flex items-center gap-1.5 font-headline text-base font-semibold text-foreground">
          <FlaskConical className="size-4 text-primary" aria-hidden /> Tahliller
        </h2>
        {tahliller.isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : tahliller.data && tahliller.data.length > 0 ? (
          <ul className="space-y-2">
            {tahliller.data.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between rounded-[var(--radius)] border border-border bg-card p-3"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{t.testType}</p>
                  <p className="text-xs text-text-3">{t.labName ?? "Laboratuvar"}</p>
                </div>
                <span className="text-xs text-text-3">
                  {t.testDate ? dateFmt.format(new Date(t.testDate)) : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-border bg-card p-6 text-center">
            <Inbox className="size-6 text-text-3" aria-hidden />
            <p className="text-sm text-text-2">Tahlil sonucu yok.</p>
          </div>
        )}
      </section>
    </div>
  );
}
