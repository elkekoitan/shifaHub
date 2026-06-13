"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  CalendarPlus,
  CalendarHeart,
  Clock,
  Loader2,
  Stethoscope,
  Moon,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, type BadgeTone } from "@/components/ui/status-badge";

const dtf = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

const TREATMENT_TYPES = [
  { value: "hacamat_kuru", label: "Hacamat (Kuru)" },
  { value: "hacamat_yas", label: "Hacamat (Yaş)" },
  { value: "suluk", label: "Sülük" },
  { value: "sujok", label: "Sujok" },
  { value: "refleksoloji", label: "Refleksoloji" },
  { value: "akupunktur", label: "Akupunktur" },
  { value: "fitoterapi", label: "Fitoterapi" },
  { value: "ozon", label: "Ozon" },
  { value: "kupa", label: "Kupa" },
] as const;

const STATUS_TONE: Record<string, BadgeTone> = {
  requested: "warning",
  confirmed: "success",
  reminded: "info",
  arrived: "info",
  treated: "primary",
  completed: "primary",
  cancelled: "danger",
  no_show: "danger",
  ertelendi: "warning",
};
const STATUS_LABELS: Record<string, string> = {
  requested: "Talep edildi",
  confirmed: "Onaylandı",
  reminded: "Hatırlatıldı",
  arrived: "Geldi",
  treated: "Tedavi edildi",
  completed: "Tamamlandı",
  cancelled: "İptal edildi",
  no_show: "Gelmedi",
  ertelendi: "Ertelendi",
};
const STATUS_ICON: Record<string, LucideIcon> = {
  requested: HelpCircle,
  confirmed: CheckCircle2,
  reminded: Clock,
  arrived: Clock,
  treated: CheckCircle2,
  completed: CheckCircle2,
  cancelled: AlertTriangle,
  no_show: AlertTriangle,
  ertelendi: Clock,
};

const formSchema = z.object({
  egitmenId: z.string().uuid("Lütfen bir eğitmen seçin."),
  scheduledAt: z.string().min(1, "Tarih ve saat zorunlu."),
  treatmentType: z.string().optional(),
  complaints: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const selectCls =
  "flex h-11 w-full rounded-[var(--radius)] border border-input bg-card px-3 py-2 text-sm text-foreground transition-colors focus-visible:border-ring focus-visible:outline-none aria-[invalid=true]:border-destructive";

function initialsOf(first?: string | null, last?: string | null) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "ŞH";
}

export default function DanisanRandevuPage() {
  const utils = trpc.useUtils();
  const randevuList = trpc.randevu.list.useQuery({ limit: 100 });
  const egitmenList = trpc.egitmen.liste.useQuery();
  const create = trpc.randevu.create.useMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema) });

  async function onSubmit(values: FormValues) {
    try {
      await create.mutateAsync({
        egitmenId: values.egitmenId,
        scheduledAt: new Date(values.scheduledAt).toISOString(),
        treatmentType: values.treatmentType || undefined,
        complaints: values.complaints || undefined,
      });
      toast.success("Randevu talebiniz oluşturuldu.");
      reset();
      void utils.randevu.list.invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Randevu oluşturulamadı.");
    }
  }

  const list = randevuList.data ?? [];

  return (
    <div className="px-5 pt-6">
      <header className="mb-6">
        <h1 className="font-headline text-xl font-semibold text-foreground">Randevu</h1>
        <p className="mt-1 text-sm text-text-2">Yeni randevu oluştur ve geçmişini görüntüle.</p>
      </header>

      {/* ─── Yeni randevu formu ─────────────────────────────────────── */}
      <section className="mb-7 rounded-[var(--radius-lg)] border border-border bg-card p-5 shadow-[var(--shadow-sm)]">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-[var(--radius-sm)] bg-accent text-primary">
            <CalendarPlus className="size-4" aria-hidden />
          </span>
          <h2 className="text-sm font-medium text-foreground">Yeni randevu</h2>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="egitmenId">Eğitmen</Label>
            {egitmenList.isLoading ? (
              <Skeleton className="h-11 w-full rounded-[var(--radius)]" />
            ) : (
              <div className="relative">
                <Stethoscope
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-3"
                  aria-hidden
                />
                <select
                  id="egitmenId"
                  aria-invalid={Boolean(errors.egitmenId)}
                  defaultValue=""
                  className={`${selectCls} pl-9`}
                  {...register("egitmenId")}
                >
                  <option value="" disabled>
                    Eğitmen seçin
                  </option>
                  {(egitmenList.data ?? []).map((e) => (
                    <option key={e.userId} value={e.userId}>
                      {e.firstName} {e.lastName}
                      {e.clinicName ? ` — ${e.clinicName}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {errors.egitmenId ? (
              <p className="text-xs text-destructive">{errors.egitmenId.message}</p>
            ) : null}
            {!egitmenList.isLoading && (egitmenList.data ?? []).length === 0 ? (
              <p className="text-xs text-text-3">Şu an onaylı eğitmen bulunmuyor.</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="scheduledAt">Tarih ve saat</Label>
            <div className="relative">
              <CalendarHeart
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-3"
                aria-hidden
              />
              <input
                id="scheduledAt"
                type="datetime-local"
                aria-invalid={Boolean(errors.scheduledAt)}
                className={`${selectCls} pl-9`}
                {...register("scheduledAt")}
              />
            </div>
            {errors.scheduledAt ? (
              <p className="text-xs text-destructive">{errors.scheduledAt.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="treatmentType">
              Tedavi türü <span className="font-normal text-text-3">(opsiyonel)</span>
            </Label>
            <select
              id="treatmentType"
              defaultValue=""
              className={selectCls}
              {...register("treatmentType")}
            >
              <option value="">Belirtmek istemiyorum</option>
              {TREATMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="complaints">
              Şikayetiniz <span className="font-normal text-text-3">(opsiyonel)</span>
            </Label>
            <textarea
              id="complaints"
              rows={3}
              placeholder="Kısaca şikayetinizi yazın"
              className="flex w-full rounded-[var(--radius)] border border-input bg-card px-3 py-2 text-sm text-foreground transition-colors placeholder:text-text-3 focus-visible:border-ring focus-visible:outline-none"
              {...register("complaints")}
            />
          </div>

          <Button type="submit" className="w-full" loading={isSubmitting || create.isPending}>
            Randevu talebi gönder
          </Button>
        </form>
      </section>

      {/* ─── Randevu listesi ───────────────────────────────────────── */}
      <h2 className="mb-3 text-sm font-medium text-foreground">Randevularım</h2>

      {randevuList.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-[var(--radius-lg)]" />
          <Skeleton className="h-20 w-full rounded-[var(--radius-lg)]" />
        </div>
      ) : randevuList.isError ? (
        <div className="flex items-center gap-2 rounded-[var(--radius)] border border-destructive-border bg-destructive-bg p-4 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
          Randevular yüklenemedi.
        </div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-border bg-card p-8 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-muted">
            <CalendarHeart className="size-5 text-text-3" aria-hidden />
          </span>
          <p className="text-sm font-medium text-foreground">Henüz randevunuz yok</p>
          <p className="text-xs text-text-3">Yukarıdaki formdan ilk randevunuzu oluşturun.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((r) => {
            const status = r.status ?? "requested";
            return (
              <li
                key={r.id}
                className="rounded-[var(--radius-lg)] border border-border bg-card p-4 shadow-[var(--shadow-sm)]"
              >
                <div className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-accent text-primary">
                    <CalendarHeart className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{r.treatmentType ?? "Randevu"}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-text-2">
                      <Clock className="size-3.5" aria-hidden />
                      {r.scheduledAt ? dtf.format(new Date(r.scheduledAt)) : "Tarih belirtilmedi"}
                    </p>
                    {r.egitmenFirstName ? (
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-text-3">
                        <span className="flex size-5 items-center justify-center rounded-full bg-muted text-[9px] font-semibold text-text-2">
                          {initialsOf(r.egitmenFirstName, r.egitmenLastName)}
                        </span>
                        {r.egitmenFirstName} {r.egitmenLastName}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <StatusBadge tone={STATUS_TONE[status] ?? "neutral"} icon={STATUS_ICON[status]}>
                      {STATUS_LABELS[status] ?? status}
                    </StatusBadge>
                    {r.isSunnahDay ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent-honey px-2 py-0.5 text-[10px] font-medium text-accent-honey-foreground">
                        <Moon className="size-3" aria-hidden /> Sünnet günü
                      </span>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {create.isPending ? (
        <p className="mt-4 flex items-center justify-center gap-2 text-xs text-text-3">
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
          Randevu oluşturuluyor...
        </p>
      ) : null}
    </div>
  );
}
