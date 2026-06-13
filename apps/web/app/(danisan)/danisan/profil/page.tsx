"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { UserCog, ShieldCheck, AlertCircle, LogOut, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Profil form şeması ──────────────────────────────────────────────────────
const GENDERS = [
  { value: "erkek", label: "Erkek" },
  { value: "kadin", label: "Kadın" },
] as const;

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

/**
 * Form alanlari native input ile birebir string'tir; gonderimde bos string'ler
 * ayiklanir ve sayisal alanlar number'a cevrilir (updateProfile payload'i).
 */
const profilSchema = z.object({
  birthDate: z.string().max(10),
  gender: z.string().max(10),
  bloodType: z.string().max(20),
  occupation: z.string().max(100),
  city: z.string().max(50),
  emergencyContact: z.string().max(100),
  emergencyPhone: z.string().max(20),
  height: z.string().max(4),
  weight: z.string().max(4),
  notes: z.string().max(5000),
});

type ProfilFormValues = z.infer<typeof profilSchema>;

const DEFAULTS: ProfilFormValues = {
  birthDate: "",
  gender: "",
  bloodType: "",
  occupation: "",
  city: "",
  emergencyContact: "",
  emergencyPhone: "",
  height: "",
  weight: "",
  notes: "",
};

// ─── KVKK riza amaçları (kvkk router ile birebir) ───────────────────────────
const CONSENT_PURPOSES = [
  { value: "saglik_verisi_isleme", label: "Sağlık verisi işleme" },
  { value: "iletisim", label: "İletişim" },
  { value: "pazarlama", label: "Pazarlama" },
  { value: "ucuncu_taraf_paylasim", label: "Üçüncü taraf paylaşımı" },
] as const;

type ConsentPurpose = (typeof CONSENT_PURPOSES)[number]["value"];

export default function DanisanProfilPage() {
  const router = useRouter();
  const { user, clear } = useAuthStore();
  const utils = trpc.useUtils();

  const me = trpc.danisan.me.useQuery(undefined, { retry: false });
  const updateProfile = trpc.danisan.updateProfile.useMutation();
  const consents = trpc.kvkk.listConsents.useQuery();
  const grant = trpc.kvkk.grantConsent.useMutation();
  const revoke = trpc.kvkk.revokeConsent.useMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfilFormValues>({
    resolver: zodResolver(profilSchema),
    defaultValues: DEFAULTS,
  });

  // Profil verisi gelince formu doldur (null -> "" eslemesi).
  useEffect(() => {
    if (!me.data) return;
    const d = me.data;
    reset({
      birthDate: d.birthDate ?? "",
      gender: d.gender ?? "",
      bloodType: d.bloodType ?? "",
      occupation: d.occupation ?? "",
      city: d.city ?? "",
      emergencyContact: d.emergencyContact ?? "",
      emergencyPhone: d.emergencyPhone ?? "",
      height: d.height != null ? String(d.height) : "",
      weight: d.weight != null ? String(d.weight) : "",
      notes: d.notes ?? "",
    });
  }, [me.data, reset]);

  async function onSubmit(values: ProfilFormValues) {
    // Bos string'leri ayikla; sayisal alanlari number'a cevir.
    const trimmed = (v: string) => (v.trim() === "" ? null : v.trim());
    const num = (v: string) => (v.trim() === "" ? null : Number(v));
    try {
      await updateProfile.mutateAsync({
        birthDate: trimmed(values.birthDate),
        gender: values.gender === "erkek" || values.gender === "kadin" ? values.gender : null,
        bloodType:
          values.bloodType !== "" ? (values.bloodType as (typeof BLOOD_TYPES)[number]) : null,
        occupation: trimmed(values.occupation),
        city: trimmed(values.city),
        emergencyContact: trimmed(values.emergencyContact),
        emergencyPhone: trimmed(values.emergencyPhone),
        height: num(values.height),
        weight: num(values.weight),
        notes: trimmed(values.notes),
      });
      toast.success("Profiliniz güncellendi.");
      void utils.danisan.me.invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Profil güncellenemedi.");
    }
  }

  function activeFor(purpose: ConsentPurpose) {
    return (consents.data ?? []).some((c) => c.purpose === purpose && c.status === "active");
  }

  async function toggleConsent(purpose: ConsentPurpose, isActive: boolean) {
    try {
      if (isActive) {
        await revoke.mutateAsync({ purpose });
        toast.success("Rıza geri çekildi.");
      } else {
        await grant.mutateAsync({ purpose });
        toast.success("Rıza verildi.");
      }
      void utils.kvkk.listConsents.invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "İşlem başarısız.");
    }
  }

  function onLogout() {
    clear();
    router.replace("/giris");
  }

  // me NOT_FOUND => profil henüz yok; form boş gösterilir (ilk kayıt).
  const profileMissing = me.isError;
  const consentBusy = grant.isPending || revoke.isPending;

  return (
    <div className="px-5 pt-6">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-headline text-xl font-semibold text-foreground">Profil</h1>
          <p className="mt-1 text-sm text-text-2">
            {user?.firstName ? `${user.firstName} ${user.lastName ?? ""}` : "Hesap bilgileriniz"}
          </p>
          {user?.email ? <p className="text-xs text-text-3">{user.email}</p> : null}
        </div>
        <Button variant="outline" size="sm" onClick={onLogout} aria-label="Çıkış yap">
          <LogOut className="size-4" aria-hidden />
          Çıkış
        </Button>
      </header>

      {/* ─── Profil formu ──────────────────────────────────────────── */}
      <section className="mb-6 rounded-[var(--radius-lg)] border border-border bg-card p-5 shadow-[var(--shadow-sm)]">
        <h2 className="mb-4 flex items-center gap-2 font-headline text-base font-semibold text-foreground">
          <UserCog className="size-4 text-primary" aria-hidden />
          Kişisel bilgiler
        </h2>

        {me.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        ) : (
          <>
            {profileMissing ? (
              <p className="mb-4 rounded-[var(--radius-sm)] bg-muted px-3 py-2 text-xs text-text-2">
                Profiliniz henüz oluşturulmamış. Bilgilerinizi doldurup kaydedin.
              </p>
            ) : null}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="birthDate">Doğum tarihi</Label>
                  <Input id="birthDate" type="date" {...register("birthDate")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="gender">Cinsiyet</Label>
                  <select
                    id="gender"
                    defaultValue=""
                    className="flex h-11 w-full rounded-[var(--radius)] border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:border-ring focus-visible:outline-none"
                    {...register("gender")}
                  >
                    <option value="">Seçin</option>
                    {GENDERS.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="bloodType">Kan grubu</Label>
                  <select
                    id="bloodType"
                    defaultValue=""
                    className="flex h-11 w-full rounded-[var(--radius)] border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:border-ring focus-visible:outline-none"
                    {...register("bloodType")}
                  >
                    <option value="">Seçin</option>
                    {BLOOD_TYPES.map((b) => (
                      <option key={b} value={b}>
                        {bloodLabel(b)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="city">Şehir</Label>
                  <Input id="city" {...register("city")} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="occupation">Meslek</Label>
                <Input id="occupation" {...register("occupation")} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="height">Boy (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    inputMode="numeric"
                    aria-invalid={Boolean(errors.height)}
                    {...register("height")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="weight">Kilo (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    inputMode="numeric"
                    aria-invalid={Boolean(errors.weight)}
                    {...register("weight")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="emergencyContact">Acil durumda aranacak</Label>
                  <Input id="emergencyContact" {...register("emergencyContact")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="emergencyPhone">Acil telefon</Label>
                  <Input id="emergencyPhone" type="tel" {...register("emergencyPhone")} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Notlar</Label>
                <textarea
                  id="notes"
                  rows={3}
                  className="flex w-full rounded-[var(--radius)] border border-input bg-card px-3 py-2 text-sm text-foreground transition-colors placeholder:text-text-3 focus-visible:border-ring focus-visible:outline-none"
                  {...register("notes")}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                loading={isSubmitting || updateProfile.isPending}
              >
                Kaydet
              </Button>
            </form>
          </>
        )}
      </section>

      {/* ─── KVKK rızaları ─────────────────────────────────────────── */}
      <section className="mb-6 rounded-[var(--radius-lg)] border border-border bg-card p-5 shadow-[var(--shadow-sm)]">
        <h2 className="mb-1 flex items-center gap-2 font-headline text-base font-semibold text-foreground">
          <ShieldCheck className="size-4 text-primary" aria-hidden />
          KVKK rızaları
        </h2>
        <p className="mb-4 text-xs text-text-3">
          Her veri işleme amacı için açık rızanızı verebilir veya geri çekebilirsiniz.
        </p>

        {consents.isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-[var(--radius)]" />
            ))}
          </div>
        ) : consents.isError ? (
          <div className="flex items-center gap-2 rounded-[var(--radius)] border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" aria-hidden />
            Rıza kayıtları yüklenemedi.
          </div>
        ) : (
          <ul className="space-y-2">
            {CONSENT_PURPOSES.map((p) => {
              const isActive = activeFor(p.value);
              return (
                <li
                  key={p.value}
                  className="flex items-center justify-between gap-3 rounded-[var(--radius)] bg-muted px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{p.label}</p>
                    <p
                      className={
                        "flex items-center gap-1 text-xs " +
                        (isActive ? "text-success" : "text-text-3")
                      }
                    >
                      {isActive ? (
                        <>
                          <Check className="size-3" aria-hidden /> Onaylandı
                        </>
                      ) : (
                        <>
                          <X className="size-3" aria-hidden /> Onay yok
                        </>
                      )}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant={isActive ? "outline" : "default"}
                    disabled={consentBusy}
                    onClick={() => toggleConsent(p.value, isActive)}
                    aria-label={isActive ? `${p.label} rızasını geri çek` : `${p.label} rızası ver`}
                  >
                    {isActive ? "Geri çek" : "Rıza ver"}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
