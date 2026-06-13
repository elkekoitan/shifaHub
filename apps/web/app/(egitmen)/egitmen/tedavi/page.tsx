"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Users,
  HeartPulse,
  Activity,
  ShieldAlert,
  Check,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Info,
} from "lucide-react";
import { TREATMENT_LABELS } from "@shifahub/shared";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

/** Tedavi tipi secenekleri — backend BASE_PRICES + TREATMENT_LABELS ortak kume. */
const TREATMENT_OPTIONS = [
  "hacamat_kuru",
  "hacamat_yas",
  "solucan",
  "sujok",
  "refleksoloji",
  "akupunktur",
  "fitoterapi",
] as const;

/** Backend checkContraindications mantiginin onizleme (preview) kopyasi. */
const BLOOD_TREATMENT_TYPES = ["hacamat_yas", "solucan", "hacamat_kuru"];
const INVASIVE_TREATMENT_TYPES = ["hacamat_yas", "solucan", "akupunktur"];
const BLOOD_THINNER_DRUGS = ["sulandirici", "warfarin", "aspirin", "klopidogrel", "heparin"];
const BLEEDING_KEYWORDS = ["kanama", "hemofili", "koagulopati", "trombo"];

interface ProfilOzet {
  pregnancyStatus?: boolean | null;
  chronicDiseases?: string[] | null;
  currentMedications?: string[] | null;
  allergies?: string[] | null;
}

function previewContraindications(treatmentType: string, p: ProfilOzet): string[] {
  const warnings: string[] = [];
  const diseases = p.chronicDiseases ?? [];
  const meds = p.currentMedications ?? [];
  const allergies = p.allergies ?? [];
  if (p.pregnancyStatus && BLOOD_TREATMENT_TYPES.includes(treatmentType))
    warnings.push("UYARI: Hamilelik durumunda bu tedavi tipi uygulanmamalı");
  if (
    diseases.some((d) => BLEEDING_KEYWORDS.some((k) => d.toLowerCase().includes(k))) &&
    INVASIVE_TREATMENT_TYPES.includes(treatmentType)
  )
    warnings.push("UYARI: Kanama bozukluğu — invaziv tedaviler riskli");
  if (diseases.some((d) => d.toLowerCase().includes("hemofili")))
    warnings.push("UYARI: Hemofili tanısı — invaziv tedavilerden kaçınılmalı");
  if (meds.some((m) => BLOOD_THINNER_DRUGS.some((k) => m.toLowerCase().includes(k))))
    warnings.push("UYARI: Kan sulandırıcı ilaç kullanımı — kanama riski yüksek");
  if (
    allergies.some((a) => BLOOD_THINNER_DRUGS.some((k) => a.toLowerCase().includes(k))) &&
    INVASIVE_TREATMENT_TYPES.includes(treatmentType)
  )
    warnings.push(
      `UYARI: Alerji tespit edildi (${allergies.join(", ")}) — invaziv tedavi öncesi dikkat`,
    );
  if (allergies.length > 0) warnings.push(`BİLGİ: Danışanın alerjileri: ${allergies.join(", ")}`);
  if (
    diseases.some((d) => d.toLowerCase().includes("diyabet")) &&
    BLOOD_TREATMENT_TYPES.includes(treatmentType)
  )
    warnings.push("UYARI: Diyabet — yara iyileşmesi yavaştır, dikkatli olunmalı");
  if (diseases.some((d) => d.toLowerCase().includes("hipertansiyon")))
    warnings.push("BİLGİ: Hipertansiyon — tansiyon ölçümü tedavi öncesi yapılmalı");
  return warnings;
}

const STEPS = [
  { n: 1, label: "Danışan", icon: Users },
  { n: 2, label: "Tedavi", icon: HeartPulse },
  { n: 3, label: "Vital", icon: Activity },
  { n: 4, label: "Onay", icon: ShieldAlert },
] as const;

export default function TedaviWizardPage() {
  const [step, setStep] = useState(1);
  const [danisanId, setDanisanId] = useState<string>("");
  const [treatmentType, setTreatmentType] = useState<string>("");
  const [findings, setFindings] = useState("");
  const [vital, setVital] = useState({ bloodPressure: "", pulse: "", temperature: "", weight: "" });
  const [done, setDone] = useState(false);

  const danisanlar = trpc.egitmen.danisanlarim.useQuery();
  const profil = trpc.danisan.byUserId.useQuery(
    { userId: danisanId },
    { enabled: Boolean(danisanId) },
  );
  const utils = trpc.useUtils();
  const create = trpc.tedavi.create.useMutation();

  const previewWarnings = useMemo(() => {
    if (!treatmentType || !profil.data) return [];
    return previewContraindications(treatmentType, profil.data);
  }, [treatmentType, profil.data]);

  const canNext = step === 1 ? Boolean(danisanId) : step === 2 ? Boolean(treatmentType) : true;
  const danisanAdi = danisanlar.data?.danisanlar.find((d) => d.userId === danisanId);

  async function submit() {
    try {
      const res = await create.mutateAsync({
        danisanId,
        treatmentType,
        findings: findings || undefined,
        vitalSigns: {
          bloodPressure: vital.bloodPressure || undefined,
          pulse: vital.pulse ? Number(vital.pulse) : undefined,
          temperature: vital.temperature ? Number(vital.temperature) : undefined,
          weight: vital.weight ? Number(vital.weight) : undefined,
        },
      });
      void utils.tedavi.list.invalidate();
      setDone(true);
      if (res.warnings.length > 0) {
        toast.warning(`${res.warnings.length} kontrendikasyon uyarısı`);
      } else {
        toast.success("Tedavi kaydedildi");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Tedavi kaydedilemedi");
    }
  }

  if (done) {
    return (
      <div className="px-5 pt-6">
        <div className="flex flex-col items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-card p-8 text-center shadow-[var(--shadow-sm)]">
          <div className="flex size-14 items-center justify-center rounded-full bg-success-bg">
            <Check className="size-7 text-success" aria-hidden />
          </div>
          <h1 className="font-headline text-lg font-semibold text-foreground">Tedavi kaydedildi</h1>
          <p className="text-sm text-text-2">
            {danisanAdi ? `${danisanAdi.firstName} ${danisanAdi.lastName}` : "Danışan"} için{" "}
            {TREATMENT_LABELS[treatmentType] ?? treatmentType} kaydı oluşturuldu.
          </p>
          {create.data && create.data.warnings.length > 0 ? (
            <ul className="mt-2 w-full space-y-1.5 text-left">
              {create.data.warnings.map((w, i) => (
                <li
                  key={i}
                  className="flex items-start gap-1.5 rounded-[var(--radius)] border border-warning-border bg-warning-bg px-3 py-2 text-xs text-warning"
                >
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden /> {w}
                </li>
              ))}
            </ul>
          ) : null}
          <Button
            className="mt-2 w-full"
            onClick={() => {
              setDone(false);
              setStep(1);
              setDanisanId("");
              setTreatmentType("");
              setFindings("");
              setVital({ bloodPressure: "", pulse: "", temperature: "", weight: "" });
            }}
          >
            Yeni tedavi kaydı
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pt-6">
      <header className="mb-4">
        <p className="text-xs text-text-3">Eğitmen paneli</p>
        <h1 className="font-headline text-xl font-semibold text-foreground">Yeni tedavi</h1>
      </header>

      {/* Adim gostergesi */}
      <ol className="mb-5 flex items-center gap-1.5">
        {STEPS.map((s, i) => {
          const reached = step >= s.n;
          return (
            <li key={s.n} className="flex flex-1 items-center gap-1.5">
              <div
                className={
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors " +
                  (reached ? "bg-primary text-primary-foreground" : "bg-muted text-text-3")
                }
              >
                {step > s.n ? <Check className="size-3.5" aria-hidden /> : s.n}
              </div>
              {i < STEPS.length - 1 ? (
                <span
                  className={
                    "h-0.5 flex-1 rounded-full " + (step > s.n ? "bg-primary" : "bg-muted")
                  }
                />
              ) : null}
            </li>
          );
        })}
      </ol>

      <div className="rounded-[var(--radius-lg)] border border-border bg-card p-5 shadow-[var(--shadow-sm)]">
        {/* Adim 1: Danisan secimi */}
        {step === 1 ? (
          <div className="space-y-3">
            <h2 className="font-headline text-base font-semibold text-foreground">Danışan seçin</h2>
            {danisanlar.isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : !danisanlar.data || danisanlar.data.count === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-[var(--radius)] border border-dashed border-border p-6 text-center">
                <Users className="size-6 text-text-3" aria-hidden />
                <p className="text-sm text-text-2">Önce bir danışanınız olmalı.</p>
              </div>
            ) : (
              <div className="space-y-2" role="radiogroup" aria-label="Danışan">
                {danisanlar.data.danisanlar.map((d) => (
                  <button
                    key={d.userId}
                    type="button"
                    role="radio"
                    aria-checked={danisanId === d.userId}
                    onClick={() => setDanisanId(d.userId)}
                    className={
                      "flex w-full items-center gap-3 rounded-[var(--radius)] border px-3 py-2.5 text-left transition-colors " +
                      (danisanId === d.userId
                        ? "border-primary bg-accent"
                        : "border-border bg-card hover:bg-secondary")
                    }
                  >
                    <span className="flex size-9 items-center justify-center rounded-full bg-accent text-xs font-semibold text-primary">
                      {`${(d.firstName ?? "").charAt(0)}${(d.lastName ?? "").charAt(0)}`.toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {d.firstName} {d.lastName}
                      </span>
                      <span className="block truncate text-xs text-text-3">
                        {d.city ?? d.email}
                      </span>
                    </span>
                    {danisanId === d.userId ? (
                      <Check className="size-4 shrink-0 text-primary" aria-hidden />
                    ) : null}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {/* Adim 2: Tedavi turu + bulgular */}
        {step === 2 ? (
          <div className="space-y-3">
            <h2 className="font-headline text-base font-semibold text-foreground">Tedavi türü</h2>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tedavi türü">
              {TREATMENT_OPTIONS.map((t) => (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={treatmentType === t}
                  onClick={() => setTreatmentType(t)}
                  className={
                    "rounded-[var(--radius)] border px-3 py-2.5 text-sm font-medium transition-colors " +
                    (treatmentType === t
                      ? "border-primary bg-accent text-primary"
                      : "border-border bg-card text-text-2 hover:bg-secondary")
                  }
                >
                  {TREATMENT_LABELS[t] ?? t}
                </button>
              ))}
            </div>
            <div className="space-y-1.5 pt-1">
              <Label htmlFor="findings">Bulgular (opsiyonel)</Label>
              <textarea
                id="findings"
                value={findings}
                onChange={(e) => setFindings(e.target.value)}
                rows={3}
                placeholder="Muayene bulguları, gözlemler…"
                className="flex w-full rounded-[var(--radius)] border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-text-3 focus-visible:border-ring focus-visible:outline-none"
              />
            </div>
          </div>
        ) : null}

        {/* Adim 3: Vital bulgular */}
        {step === 3 ? (
          <div className="space-y-3">
            <h2 className="font-headline text-base font-semibold text-foreground">
              Vital bulgular
            </h2>
            <p className="text-xs text-text-3">Tümü opsiyoneldir; bilinenleri girin.</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="bp">Tansiyon</Label>
                <Input
                  id="bp"
                  placeholder="120/80"
                  value={vital.bloodPressure}
                  onChange={(e) => setVital((v) => ({ ...v, bloodPressure: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pulse">Nabız</Label>
                <Input
                  id="pulse"
                  type="number"
                  inputMode="numeric"
                  placeholder="72"
                  value={vital.pulse}
                  onChange={(e) => setVital((v) => ({ ...v, pulse: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="temp">Ateş (°C)</Label>
                <Input
                  id="temp"
                  type="number"
                  inputMode="decimal"
                  placeholder="36.5"
                  value={vital.temperature}
                  onChange={(e) => setVital((v) => ({ ...v, temperature: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="weight">Kilo (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  inputMode="decimal"
                  placeholder="70"
                  value={vital.weight}
                  onChange={(e) => setVital((v) => ({ ...v, weight: e.target.value }))}
                />
              </div>
            </div>
          </div>
        ) : null}

        {/* Adim 4: Kontrendikasyon uyarisi + onay */}
        {step === 4 ? (
          <div className="space-y-3">
            <h2 className="font-headline text-base font-semibold text-foreground">Onay</h2>
            <div className="rounded-[var(--radius)] bg-muted p-3 text-sm">
              <p className="text-text-2">
                <span className="font-medium text-foreground">
                  {danisanAdi ? `${danisanAdi.firstName} ${danisanAdi.lastName}` : "Danışan"}
                </span>{" "}
                için{" "}
                <span className="font-medium text-foreground">
                  {TREATMENT_LABELS[treatmentType] ?? treatmentType}
                </span>
              </p>
            </div>

            {profil.isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : previewWarnings.length > 0 ? (
              <div className="space-y-2">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-warning">
                  <ShieldAlert className="size-4" aria-hidden /> Kontrendikasyon uyarıları
                </p>
                <ul className="space-y-1.5">
                  {previewWarnings.map((w, i) => {
                    const info = w.startsWith("BİLGİ");
                    return (
                      <li
                        key={i}
                        className={
                          "flex items-start gap-1.5 rounded-[var(--radius)] border px-3 py-2 text-xs " +
                          (info
                            ? "border-border bg-muted text-text-2"
                            : "border-warning-border bg-warning-bg text-warning")
                        }
                      >
                        {info ? (
                          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                        ) : (
                          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                        )}
                        {w}
                      </li>
                    );
                  })}
                </ul>
                <p className="text-[11px] text-text-3">
                  Uyarılar bilgilendirme amaçlıdır; sunucu kayıtla birlikte yeniden doğrular.
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-[var(--radius)] border border-success-border bg-success-bg px-3 py-2.5 text-sm text-success">
                <Check className="size-4" aria-hidden /> Bilinen kontrendikasyon bulunmadı.
              </div>
            )}
          </div>
        ) : null}

        {/* Navigasyon */}
        <div className="mt-5 flex gap-2 border-t border-border pt-4">
          {step > 1 ? (
            <Button
              variant="outline"
              onClick={() => setStep((s) => s - 1)}
              aria-label="Önceki adım"
            >
              <ChevronLeft className="size-4" aria-hidden /> Geri
            </Button>
          ) : null}
          {step < 4 ? (
            <Button className="flex-1" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
              İleri <ChevronRight className="size-4" aria-hidden />
            </Button>
          ) : (
            <Button
              className="flex-1"
              loading={create.isPending}
              onClick={submit}
              disabled={!danisanId || !treatmentType}
            >
              Tedaviyi kaydet
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
