"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserRound,
  Ruler,
  MapPin,
  HeartPulse,
  ClipboardList,
  Phone,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const GENDERS = [
  { value: "erkek", label: "Erkek" },
  { value: "kadin", label: "Kadın" },
];
const BLOOD_TYPES = [
  "A_pozitif",
  "A_negatif",
  "B_pozitif",
  "B_negatif",
  "AB_pozitif",
  "AB_negatif",
  "O_pozitif",
  "O_negatif",
] as const;
const bloodLabel = (b: string) => b.replace("_pozitif", " +").replace("_negatif", " −");

type Form = {
  birthDate: string;
  gender: string;
  bloodType: string;
  height: string;
  weight: string;
  city: string;
  occupation: string;
  chronic: string;
  allergies: string;
  medications: string;
  pregnancy: boolean;
  complaints: string;
  emergencyContact: string;
  emergencyPhone: string;
  notes: string;
};

const EMPTY: Form = {
  birthDate: "",
  gender: "",
  bloodType: "",
  height: "",
  weight: "",
  city: "",
  occupation: "",
  chronic: "",
  allergies: "",
  medications: "",
  pregnancy: false,
  complaints: "",
  emergencyContact: "",
  emergencyPhone: "",
  notes: "",
};

const toList = (s: string) =>
  s
    .split(/[,\n]/)
    .map((x) => x.trim())
    .filter(Boolean);

const fromList = (a?: string[] | null) => (a ?? []).join(", ");

const STEPS = [
  { icon: UserRound, title: "Temel bilgiler" },
  { icon: Ruler, title: "Fiziksel" },
  { icon: MapPin, title: "Yaşam" },
  { icon: HeartPulse, title: "Sağlık öyküsü" },
  { icon: ClipboardList, title: "Başvuru sebebi" },
  { icon: Phone, title: "Acil durum & notlar" },
];

const inputCls =
  "flex h-11 w-full rounded-[var(--radius)] border border-input bg-card px-3 text-sm text-foreground focus-visible:border-ring focus-visible:outline-none";
const areaCls =
  "flex w-full rounded-[var(--radius)] border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-text-3 focus-visible:border-ring focus-visible:outline-none";

export default function AnamnezWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(EMPTY);
  const [done, setDone] = useState(false);

  const me = trpc.danisan.me.useQuery(undefined, { retry: false });
  const update = trpc.danisan.updateProfile.useMutation();
  const utils = trpc.useUtils();

  // Mevcut profil varsa ön-doldur.
  useEffect(() => {
    if (!me.data) return;
    const d = me.data;
    setForm({
      birthDate: d.birthDate ?? "",
      gender: d.gender ?? "",
      bloodType: d.bloodType ?? "",
      height: d.height != null ? String(d.height) : "",
      weight: d.weight != null ? String(d.weight) : "",
      city: d.city ?? "",
      occupation: d.occupation ?? "",
      chronic: fromList(d.chronicDiseases),
      allergies: fromList(d.allergies),
      medications: fromList(d.currentMedications),
      pregnancy: Boolean(d.pregnancyStatus),
      complaints: fromList(d.mainComplaints),
      emergencyContact: d.emergencyContact ?? "",
      emergencyPhone: d.emergencyPhone ?? "",
      notes: d.notes ?? "",
    });
  }, [me.data]);

  const set = (k: keyof Form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));
  const isLast = step === STEPS.length - 1;

  async function finish() {
    try {
      await update.mutateAsync({
        birthDate: form.birthDate || null,
        gender: form.gender === "erkek" || form.gender === "kadin" ? form.gender : null,
        bloodType: form.bloodType ? (form.bloodType as (typeof BLOOD_TYPES)[number]) : null,
        height: form.height ? Number(form.height) : null,
        weight: form.weight ? Number(form.weight) : null,
        city: form.city.trim() || null,
        occupation: form.occupation.trim() || null,
        chronicDiseases: toList(form.chronic),
        allergies: toList(form.allergies),
        currentMedications: toList(form.medications),
        pregnancyStatus: form.gender === "kadin" ? form.pregnancy : false,
        mainComplaints: toList(form.complaints),
        emergencyContact: form.emergencyContact.trim() || null,
        emergencyPhone: form.emergencyPhone.trim() || null,
        notes: form.notes.trim() || null,
      });
      void utils.danisan.me.invalidate();
      setDone(true);
      toast.success("Anamnez bilgileriniz kaydedildi.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kaydedilemedi.");
    }
  }

  if (done) {
    return (
      <div className="px-5 pt-6">
        <div className="flex flex-col items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-card py-14 text-center shadow-[var(--shadow-sm)]">
          <span className="flex size-14 items-center justify-center rounded-full bg-success-bg text-success">
            <CheckCircle2 className="size-8" aria-hidden />
          </span>
          <h1 className="font-headline text-lg font-semibold text-foreground">Anamnez tamam</h1>
          <p className="max-w-xs text-sm text-text-2">
            Bilgileriniz eğitmeninizin daha güvenli ve kişisel bir tedavi planlaması için
            kaydedildi.
          </p>
          <Button size="sm" onClick={() => router.replace("/danisan/profil")}>
            Profile dön
          </Button>
        </div>
      </div>
    );
  }

  const StepIcon = STEPS[step]!.icon;

  return (
    <div className="px-5 pt-6">
      <header className="mb-5">
        <h1 className="font-headline text-xl font-semibold text-foreground">Anamnez</h1>
        <p className="mt-1 text-sm text-text-2">Sağlık öykünüzü adım adım tamamlayın.</p>
        <div className="mt-3 flex items-center gap-1.5" role="progressbar" aria-valuenow={step + 1}>
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={
                "h-1.5 flex-1 rounded-full transition-all " +
                (i <= step ? "bg-primary" : "bg-border")
              }
            />
          ))}
        </div>
      </header>

      <div className="rounded-[var(--radius-lg)] border border-border bg-card p-5 shadow-[var(--shadow-sm)]">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-[var(--radius)] bg-accent text-primary">
            <StepIcon className="size-4" aria-hidden />
          </span>
          <h2 className="font-headline text-base font-semibold text-foreground">
            {STEPS[step]!.title}
          </h2>
        </div>

        <div className="space-y-4">
          {step === 0 ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="birthDate">Doğum tarihi</Label>
                <input
                  id="birthDate"
                  type="date"
                  value={form.birthDate}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => set("birthDate", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Cinsiyet</Label>
                <div className="flex gap-2">
                  {GENDERS.map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => set("gender", g.value)}
                      className={
                        "flex-1 rounded-[var(--radius)] border px-3 py-2.5 text-sm transition-colors " +
                        (form.gender === g.value
                          ? "border-primary bg-accent text-primary"
                          : "border-border bg-card text-text-2")
                      }
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bloodType">Kan grubu</Label>
                <select
                  id="bloodType"
                  value={form.bloodType}
                  onChange={(e) => set("bloodType", e.target.value)}
                  className={inputCls}
                >
                  <option value="">Seçiniz</option>
                  {BLOOD_TYPES.map((b) => (
                    <option key={b} value={b}>
                      {bloodLabel(b)}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : null}

          {step === 1 ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="height">Boy (cm)</Label>
                <Input
                  id="height"
                  inputMode="numeric"
                  value={form.height}
                  onChange={(e) => set("height", e.target.value)}
                  placeholder="170"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="weight">Kilo (kg)</Label>
                <Input
                  id="weight"
                  inputMode="numeric"
                  value={form.weight}
                  onChange={(e) => set("weight", e.target.value)}
                  placeholder="70"
                />
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="city">Şehir</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  placeholder="İstanbul"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="occupation">Meslek</Label>
                <Input
                  id="occupation"
                  value={form.occupation}
                  onChange={(e) => set("occupation", e.target.value)}
                  placeholder="Öğretmen"
                />
              </div>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="chronic">Kronik hastalıklar</Label>
                <textarea
                  id="chronic"
                  rows={2}
                  value={form.chronic}
                  onChange={(e) => set("chronic", e.target.value)}
                  placeholder="Virgülle ayırın: diyabet, hipertansiyon…"
                  className={areaCls}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="allergies">Alerjiler</Label>
                <textarea
                  id="allergies"
                  rows={2}
                  value={form.allergies}
                  onChange={(e) => set("allergies", e.target.value)}
                  placeholder="Virgülle ayırın: polen, penisilin…"
                  className={areaCls}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="medications">Kullandığınız ilaçlar</Label>
                <textarea
                  id="medications"
                  rows={2}
                  value={form.medications}
                  onChange={(e) => set("medications", e.target.value)}
                  placeholder="Virgülle ayırın: aspirin, warfarin…"
                  className={areaCls}
                />
              </div>
              {form.gender === "kadin" ? (
                <label className="flex items-center gap-2.5 rounded-[var(--radius)] border border-border bg-secondary/40 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={form.pregnancy}
                    onChange={(e) => set("pregnancy", e.target.checked)}
                    className="size-4 accent-[var(--color-primary-600)]"
                  />
                  <span className="text-sm text-foreground">Hamilelik durumu</span>
                </label>
              ) : null}
            </>
          ) : null}

          {step === 4 ? (
            <div className="space-y-1.5">
              <Label htmlFor="complaints">Şikayetiniz / başvuru sebebiniz</Label>
              <textarea
                id="complaints"
                rows={4}
                value={form.complaints}
                onChange={(e) => set("complaints", e.target.value)}
                placeholder="Virgülle ayırın: bel ağrısı, uykusuzluk, yorgunluk…"
                className={areaCls}
              />
              <p className="text-[11px] text-text-3">
                Eğitmeniniz bu bilgiyi tedavi planı için kullanır.
              </p>
            </div>
          ) : null}

          {step === 5 ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="emergencyContact">Acil durum kişisi</Label>
                <Input
                  id="emergencyContact"
                  value={form.emergencyContact}
                  onChange={(e) => set("emergencyContact", e.target.value)}
                  placeholder="Ad Soyad (yakınlık)"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="emergencyPhone">Acil durum telefonu</Label>
                <Input
                  id="emergencyPhone"
                  inputMode="tel"
                  value={form.emergencyPhone}
                  onChange={(e) => set("emergencyPhone", e.target.value)}
                  placeholder="05xx…"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes">Eklemek istedikleriniz</Label>
                <textarea
                  id="notes"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  placeholder="Varsa diğer notlarınız…"
                  className={areaCls}
                />
              </div>
            </>
          ) : null}
        </div>

        <div className="mt-6 flex items-center gap-2">
          {step > 0 ? (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)} className="flex-1">
              <ArrowLeft className="size-4" aria-hidden /> Geri
            </Button>
          ) : null}
          {isLast ? (
            <Button onClick={finish} loading={update.isPending} className="flex-1">
              <CheckCircle2 className="size-4" aria-hidden /> Tamamla
            </Button>
          ) : (
            <Button onClick={() => setStep((s) => s + 1)} className="flex-1">
              İleri <ArrowRight className="size-4" aria-hidden />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
