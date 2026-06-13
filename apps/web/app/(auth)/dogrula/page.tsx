"use client";

import Link from "next/link";
import { MailCheck, ArrowLeft, RefreshCw } from "lucide-react";
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
      <div className="flex flex-col items-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-border bg-card p-7 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-accent text-primary">
          <MailCheck className="size-6" aria-hidden />
        </div>
        <h1 className="font-headline text-xl font-semibold text-foreground">E-postanı doğrula</h1>
        <p className="text-sm text-text-2">
          Hesabını etkinleştirmek için sana bir doğrulama bağlantısı gönderdik. Gelen kutunu (ve
          spam klasörünü) kontrol et.
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        className="mt-6 w-full"
        onClick={onResend}
        aria-label="Doğrulama e-postasını tekrar gönder"
      >
        <RefreshCw className="size-4" aria-hidden />
        Tekrar gönder
      </Button>

      <Link
        href="/giris"
        className="mt-4 flex items-center justify-center gap-1.5 text-sm font-medium text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden /> Girişe dön
      </Link>
    </div>
  );
}
