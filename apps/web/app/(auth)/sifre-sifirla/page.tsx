"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { toast } from "sonner";
import { MailCheck, ArrowLeft, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const iconCls = "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-3";

/**
 * Şifre sıfırlama — kullanıcı e-postasını girer, sistem sıfırlama bağlantısı
 * gönderir. Backend prosedürü (auth.requestPasswordReset) henüz mevcut olmadığı
 * için form gönderiminde bilgilendirici onay ekranı gösterilir; rota derlenebilir
 * ve UX akışı hazır kalır.
 */
const resetSchema = z.object({
  email: z.string().email("Geçerli bir e-posta girin"),
});
type ResetInput = z.infer<typeof resetSchema>;

export default function SifreSifirlaPage() {
  const [sent, setSent] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetInput>({ resolver: zodResolver(resetSchema) });

  async function onSubmit(values: ResetInput) {
    try {
      // Backend prosedürü hazır olduğunda burada auth.requestPasswordReset çağrılır.
      setSent(values.email);
      toast.success("Sıfırlama bağlantısı gönderildi");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "İşlem başarısız");
    }
  }

  if (sent) {
    return (
      <div>
        <div className="flex flex-col items-center gap-3 rounded-[var(--radius-lg)] border border-success-border bg-success-bg p-7 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-success text-success-foreground">
            <MailCheck className="size-6" aria-hidden />
          </span>
          <h1 className="font-headline text-xl font-semibold text-foreground">
            E-postanı kontrol et
          </h1>
          <p className="text-sm text-text-2">
            <span className="font-medium text-foreground">{sent}</span> adresine bir şifre sıfırlama
            bağlantısı gönderdik. Bağlantı 30 dakika geçerlidir.
          </p>
        </div>
        <Link
          href="/giris"
          className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden /> Girişe dön
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-headline text-2xl font-semibold text-foreground">Şifreni sıfırla</h1>
      <p className="mt-1.5 text-sm text-text-2">
        Kayıtlı e-posta adresini gir, sana sıfırlama bağlantısı gönderelim.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">E-posta</Label>
          <div className="relative">
            <Mail className={iconCls} aria-hidden />
            <Input
              id="email"
              type="email"
              placeholder="ornek@shifahub.app"
              className="pl-9"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              {...register("email")}
            />
          </div>
          {errors.email ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
        </div>
        <Button type="submit" className="w-full" loading={isSubmitting}>
          Sıfırlama bağlantısı gönder <ArrowRight className="size-4" aria-hidden />
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-text-2">
        Şifreni hatırladın mı?{" "}
        <Link href="/giris" className="font-medium text-primary hover:underline">
          Giriş yap
        </Link>
      </p>
    </div>
  );
}
