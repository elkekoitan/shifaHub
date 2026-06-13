"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, Info, Search, User as UserIcon, Type, Link2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const iconCls = "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-3";

function initials(first?: string | null, last?: string | null, email?: string) {
  const fromName = `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
  return fromName || email?.[0]?.toUpperCase() || "?";
}

const NOTIFICATION_TYPES = [
  { value: "sistem", label: "Sistem" },
  { value: "randevu_hatirlatma", label: "Randevu hatırlatma" },
  { value: "randevu_onay", label: "Randevu onay" },
  { value: "randevu_iptal", label: "Randevu iptal" },
  { value: "tedavi_ozeti", label: "Tedavi özeti" },
  { value: "tahlil_sonucu", label: "Tahlil sonucu" },
  { value: "mesaj", label: "Mesaj" },
  { value: "egitmen_onay", label: "Eğitmen onay" },
  { value: "kvkk", label: "KVKK" },
] as const;

const formSchema = z.object({
  userId: z.string().uuid("Bir alıcı seçin."),
  type: z.enum([
    "randevu_hatirlatma",
    "randevu_onay",
    "randevu_iptal",
    "tedavi_ozeti",
    "tahlil_sonucu",
    "mesaj",
    "egitmen_onay",
    "sistem",
    "kvkk",
  ]),
  title: z.string().trim().min(1, "Başlık gerekli.").max(200),
  body: z.string().trim().max(2000).optional(),
  actionUrl: z.string().trim().max(500).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function BildirimGonderPage() {
  const [recipientName, setRecipientName] = useState<string>("");
  const recipients = trpc.admin.listUsers.useQuery({ page: 1, pageSize: 100 });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { type: "sistem" },
  });

  const selectedUserId = watch("userId");
  const selectedType = watch("type");

  const create = trpc.bildirim.create.useMutation({
    onSuccess: () => {
      toast.success("Bildirim gönderildi.");
      reset({ type: "sistem", userId: "", title: "", body: "", actionUrl: "" });
      setRecipientName("");
    },
    onError: (e) => toast.error(e.message),
  });

  function onSubmit(values: FormValues) {
    create.mutate({
      userId: values.userId,
      type: values.type,
      title: values.title,
      body: values.body && values.body.length > 0 ? values.body : undefined,
      actionUrl: values.actionUrl && values.actionUrl.length > 0 ? values.actionUrl : undefined,
    });
  }

  const users = recipients.data?.users ?? [];

  return (
    <div>
      <header className="mb-5">
        <h1 className="font-headline text-2xl font-semibold text-foreground">Bildirim gönder</h1>
        <p className="mt-1.5 text-sm text-text-2">
          Seçilen kullanıcıya uygulama içi bildirim gönderin.
        </p>
      </header>

      <div className="mb-5 flex items-start gap-2 rounded-[var(--radius)] border border-dashed border-warning/40 bg-warning/5 p-3 text-xs text-text-2">
        <Info className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
        <p>
          <span className="font-medium text-foreground">Toplu gönderim:</span> mevcut{" "}
          <code className="font-mono">bildirim.create</code> prosedürü tek bir alıcıya gönderir.
          Rol/segment bazlı toplu gönderim için ayrı bir prosedür (örn.{" "}
          <code className="font-mono">bildirim.broadcast</code>) eklenmelidir. Şimdilik tekil
          gönderim aşağıda kullanılabilir.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* Alıcı seçimi */}
        <div className="space-y-1.5">
          <Label htmlFor="recipient-search">Alıcı</Label>
          {recipients.isLoading ? (
            <Skeleton className="h-11 w-full rounded-[var(--radius)]" />
          ) : (
            <>
              {selectedUserId ? (
                <div className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-primary bg-accent px-3 py-2.5">
                  <span className="flex min-w-0 items-center gap-2 text-sm text-primary">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary">
                      <UserIcon className="size-3.5" aria-hidden />
                    </span>
                    <span className="truncate">{recipientName || "Seçili alıcı"}</span>
                  </span>
                  <button
                    type="button"
                    className="shrink-0 text-xs font-medium text-text-2 hover:text-destructive"
                    onClick={() => {
                      setValue("userId", "");
                      setRecipientName("");
                    }}
                  >
                    Değiştir
                  </button>
                </div>
              ) : (
                <div className="rounded-[var(--radius)] border border-border bg-card">
                  <div className="flex items-center gap-2 border-b border-border px-3 py-2 text-text-3">
                    <Search className="size-4" aria-hidden />
                    <span className="text-xs">Aşağıdan bir alıcı seçin</span>
                  </div>
                  <ul className="max-h-56 overflow-y-auto">
                    {users.length === 0 ? (
                      <li className="px-3 py-3 text-sm text-text-3">Kullanıcı bulunamadı.</li>
                    ) : (
                      users.map((u) => {
                        const name =
                          u.firstName || u.lastName
                            ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim()
                            : u.email;
                        return (
                          <li key={u.id}>
                            <button
                              type="button"
                              onClick={() => {
                                setValue("userId", u.id, { shouldValidate: true });
                                setRecipientName(`${name} · ${u.email}`);
                              }}
                              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-secondary"
                            >
                              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                                {initials(u.firstName, u.lastName, u.email)}
                              </span>
                              <span className="min-w-0 flex-1 truncate text-foreground">
                                {name}
                              </span>
                              <span className="shrink-0 text-xs text-text-3">{u.email}</span>
                            </button>
                          </li>
                        );
                      })
                    )}
                  </ul>
                </div>
              )}
            </>
          )}
          {errors.userId ? (
            <p className="text-xs text-destructive">{errors.userId.message}</p>
          ) : null}
        </div>

        {/* Tür */}
        <div className="space-y-1.5">
          <Label>Bildirim türü</Label>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Bildirim türü">
            {NOTIFICATION_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                role="radio"
                aria-checked={selectedType === t.value}
                onClick={() => setValue("type", t.value)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  selectedType === t.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-text-2 hover:bg-accent",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Başlık */}
        <div className="space-y-1.5">
          <Label htmlFor="title">Başlık</Label>
          <div className="relative">
            <Type className={iconCls} aria-hidden />
            <Input
              id="title"
              className="pl-9"
              placeholder="Örn. Planlı bakım bildirimi"
              aria-invalid={Boolean(errors.title)}
              {...register("title")}
            />
          </div>
          {errors.title ? <p className="text-xs text-destructive">{errors.title.message}</p> : null}
        </div>

        {/* İçerik */}
        <div className="space-y-1.5">
          <Label htmlFor="body">İçerik (opsiyonel)</Label>
          <textarea
            id="body"
            rows={4}
            placeholder="Bildirim metni…"
            className="flex w-full rounded-[var(--radius)] border border-input bg-card px-3 py-2 text-sm text-foreground transition-colors placeholder:text-text-3 focus-visible:border-ring focus-visible:outline-none aria-[invalid=true]:border-destructive"
            {...register("body")}
          />
        </div>

        {/* Aksiyon URL */}
        <div className="space-y-1.5">
          <Label htmlFor="actionUrl">Yönlendirme bağlantısı (opsiyonel)</Label>
          <div className="relative">
            <Link2 className={iconCls} aria-hidden />
            <Input
              id="actionUrl"
              className="pl-9"
              placeholder="/danisan/randevu"
              {...register("actionUrl")}
            />
          </div>
        </div>

        <Button type="submit" loading={isSubmitting || create.isPending}>
          <Send className="size-4" aria-hidden />
          Bildirimi gönder
        </Button>
      </form>
    </div>
  );
}
