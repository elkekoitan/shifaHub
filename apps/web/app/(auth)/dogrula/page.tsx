"use client";

import Link from "next/link";
import { MailCheck, ArrowLeft, RefreshCw, Inbox } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * E-posta doğrulama — kayıt sonrası kullanıcıya gönderilen doğrulama bağlantısı
 * için bilgilendirme ekranı. Backend prosedürü (auth.verifyEmail /
 * auth.resendVerification) henüz mevcut değil; bu yüzden temiz bir bilgilendirme
 * placeholder'ı gösterilir. "Tekrar gönder" yalnızca UI geri bildirimi verir.
 */
export default function DogrulaPage() {
  function onResend() {
    // Backend hazır olduğunda burada auth.resendVerification çağrılır.
    toast.success("Doğrulama e-postası tekrar gönderildi");
  }

  return (
    <div>
      <div className="relative overflow-hidden rounded-[var(--radius-lg)] bg-primary p-6 text-center text-primary-foreground shadow-[var(--shadow)]">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-primary-foreground/10 blur-2xl"
        />
        <div className="relative flex flex-col items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary-foreground/15">
            <MailCheck className="size-6" aria-hidden />
          </span>
          <h1 className="font-headline text-xl font-semibold">E-postanı doğrula</h1>
          <p className="text-sm text-primary-foreground/80">
            Hesabını etkinleştirmek için sana bir doğrulama bağlantısı gönderdik. Gelen kutunu (ve
            spam klasörünü) kontrol et.
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2.5 rounded-[var(--radius)] border border-border bg-card p-3.5 text-xs text-text-2">
        <Inbox className="size-4 shrink-0 text-text-3" aria-hidden />
        Bağlantı birkaç dakika içinde gelmezse spam klasörünü kontrol et veya tekrar gönder.
      </div>

      <Button
        type="button"
        variant="outline"
        className="mt-4 w-full"
        onClick={onResend}
        aria-label="Doğrulama e-postasını tekrar gönder"
      >
        <RefreshCw className="size-4" aria-hidden />
        Tekrar gönder
      </Button>

      <Link
        href="/giris"
        className="mt-4 flex items-center justify-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden /> Girişe dön
      </Link>
    </div>
  );
}
