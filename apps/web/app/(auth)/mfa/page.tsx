"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * MFA challenge — iki adımlı doğrulama kodu girişi. Backend prosedürü
 * (auth.verifyMfa) henüz mevcut olmadığından, 6 haneli kod doğrulaması yalnızca
 * istemci tarafında format kontrolü yapar ve bilgilendirme verir. Rota
 * derlenebilir ve akış hazır kalır.
 */
export default function MfaPage() {
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const valid = /^\d{6}$/.test(code);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) {
      toast.error("6 haneli kodu girin");
      return;
    }
    setSubmitting(true);
    // Backend hazır olduğunda burada auth.verifyMfa çağrılır.
    toast.success("Doğrulama kodu alındı");
    setSubmitting(false);
  }

  return (
    <div>
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-accent text-primary">
          <ShieldCheck className="size-6" aria-hidden />
        </div>
        <div>
          <h1 className="font-headline text-2xl font-semibold text-foreground">
            İki adımlı doğrulama
          </h1>
          <p className="mt-1 text-sm text-text-2">Doğrulama uygulamandaki 6 haneli kodu gir.</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="mfa-code">Doğrulama kodu</Label>
          <Input
            id="mfa-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            aria-invalid={code.length > 0 && !valid}
            className="text-center text-lg tracking-[0.5em]"
          />
        </div>
        <Button type="submit" className="w-full" loading={submitting} disabled={!valid}>
          Doğrula
        </Button>
      </form>

      <Link
        href="/giris"
        className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden /> Girişe dön
      </Link>
    </div>
  );
}
