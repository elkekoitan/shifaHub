"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import {
  UserCog,
  ShieldCheck,
  AlertTriangle,
  LogOut,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Droplet,
  MapPin,
  Briefcase,
  Ruler,
  Weight,
  Phone,
  UserRound,
  FileText,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";

const iconCls = "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-3";
const selectCls =
  "flex h-11 w-full rounded-[var(--radius)] border border-input bg-card pl-9 pr-3 py-2 text-sm text-foreground transition-colors focus-visible:border-ring focus-visible:outline-none";

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
  const initials =
    `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase() || "ŞH";

  return (
    <div className="px-5 pt-6">
      <header className="mb-6 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary">
            {initials}
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-headline text-xl font-semibold text-foreground">
              {user?.firstName ? `${user.firstName} ${user.lastName ?? ""}` : "Profil"}
            </h1>
            {user?.email ? (
              <p className="truncate text-xs text-text-3">{user.email}</p>
            ) : (
              <p className="text-xs text-text-3">Hesap bilgileriniz</p>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onLogout}
          aria-label="Çıkış yap"
          className="shrink-0"
        >
          <LogOut className="size-4" aria-hidden />
          Çıkış
        </Button>
      </header>

      {/* ─── Belgelerim kısayolu ───────────────────────────────────── */}
      <Link
        href="/danisan/belgeler"
        className="mb-6 flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-card px-4 py-3.5 shadow-[var(--shadow-sm)] transition-colors hover:bg-secondary"
      >
        <span className="flex size-9 items-center justify-center rounded-[var(--radius-sm)] bg-accent text-primary">
          <FileText className="size-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-foreground">Belgelerim</span>
          <span className="block text-xs text-text-3">Tahlil ve sağlık belgelerinizi yükleyin</span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-text-3" aria-hidden />
      </Link>

      {/* ─── Profil formu ──────────────────────────────────────────── */}
      <section className="mb-6 rounded-[var(--radius-lg)] border border-border bg-card p-5 shadow-[var(--shadow-sm)]">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-[var(--radius-sm)] bg-accent text-primary">
            <UserCog className="size-4" aria-hidden />
          </span>
          <h2 className="text-sm font-medium text-foreground">Kişisel bilgiler</h2>
        </div>

        {me.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-11 w-full rounded-[var(--radius)]" />
            <Skeleton className="h-11 w-full rounded-[var(--radius)]" />
            <Skeleton className="h-11 w-full rounded-[var(--radius)]" />
          </div>
        ) : (
          <>
            {profileMissing ? (
              <p className="mb-4 flex items-start gap-1.5 rounded-[var(--radius-sm)] border border-info-border bg-info-bg px-3 py-2 text-xs text-info">
                <UserRound className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                Profiliniz henüz oluşturulmamış. Bilgilerinizi doldurup kaydedin.
              </p>
            ) : null}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="birthDate">Doğum tarihi</Label>
                  <div className="relative">
                    <CalendarDays className={iconCls} aria-hidden />
                    <Input id="birthDate" type="date" className="pl-9" {...register("birthDate")} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="gender">Cinsiyet</Label>
                  <div className="relative">
                    <UserRound className={iconCls} aria-hidden />
                    <select
                      id="gender"
                      defaultValue=""
                      className={selectCls}
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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="bloodType">Kan grubu</Label>
                  <div className="relative">
                    <Droplet className={iconCls} aria-hidden />
                    <select
                      id="bloodType"
                      defaultValue=""
                      className={selectCls}
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
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="city">Şehir</Label>
                  <div className="relative">
                    <MapPin className={iconCls} aria-hidden />
                    <Input id="city" className="pl-9" {...register("city")} />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="occupation">Meslek</Label>
                <div className="relative">
                  <Briefcase className={iconCls} aria-hidden />
                  <Input id="occupation" className="pl-9" {...register("occupation")} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="height">Boy (cm)</Label>
                  <div className="relative">
                    <Ruler className={iconCls} aria-hidden />
                    <Input
                      id="height"
                      type="number"
                      inputMode="numeric"
                      className="pl-9"
                      aria-invalid={Boolean(errors.height)}
                      {...register("height")}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="weight">Kilo (kg)</Label>
                  <div className="relative">
                    <Weight className={iconCls} aria-hidden />
                    <Input
                      id="weight"
                      type="number"
                      inputMode="numeric"
                      className="pl-9"
                      aria-invalid={Boolean(errors.weight)}
                      {...register("weight")}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="emergencyContact">Acil durumda aranacak</Label>
                  <div className="relative">
                    <UserRound className={iconCls} aria-hidden />
                    <Input
                      id="emergencyContact"
                      className="pl-9"
                      {...register("emergencyContact")}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="emergencyPhone">Acil telefon</Label>
                  <div className="relative">
                    <Phone className={iconCls} aria-hidden />
                    <Input
                      id="emergencyPhone"
                      type="tel"
                      className="pl-9"
                      {...register("emergencyPhone")}
                    />
                  </div>
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
        <div className="mb-1 flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-[var(--radius-sm)] bg-accent text-primary">
            <ShieldCheck className="size-4" aria-hidden />
          </span>
          <h2 className="text-sm font-medium text-foreground">KVKK rızaları</h2>
        </div>
        <p className="mb-4 ml-[2.875rem] text-xs text-text-3">
          Her veri işleme amacı için açık rızanızı verebilir veya geri çekebilirsiniz.
        </p>

        {consents.isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-[var(--radius)]" />
            ))}
          </div>
        ) : consents.isError ? (
          <div className="flex items-center gap-2 rounded-[var(--radius)] border border-destructive-border bg-destructive-bg p-4 text-sm text-destructive">
            <AlertTriangle className="size-4 shrink-0" aria-hidden />
            Rıza kayıtları yüklenemedi.
          </div>
        ) : (
          <ul className="space-y-2">
            {CONSENT_PURPOSES.map((p) => {
              const isActive = activeFor(p.value);
              return (
                <li
                  key={p.value}
                  className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-border bg-muted px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{p.label}</p>
                    <div className="mt-1">
                      <StatusBadge
                        tone={isActive ? "success" : "neutral"}
                        icon={isActive ? CheckCircle2 : XCircle}
                      >
                        {isActive ? "Onaylandı" : "Onay yok"}
                      </StatusBadge>
                    </div>
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
