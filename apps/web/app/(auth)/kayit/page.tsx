"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function KayitPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (step < 2) {
      setStep(step + 1);
      return;
    }
    setIsLoading(true);
    // TODO: Auth Agent - Registration implementation
    setTimeout(() => setIsLoading(false), 1000);
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-primary">ShifaHub</CardTitle>
        <CardDescription>
          {step === 1 ? "Kisisel bilgilerinizi girin" : "Hesap bilgilerinizi girin"}
        </CardDescription>
        <div className="flex justify-center gap-2 pt-2">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-2 w-8 rounded-full ${s <= step ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Ad</Label>
                  <Input id="firstName" name="firstName" placeholder="Adiniz" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Soyad</Label>
                  <Input id="lastName" name="lastName" placeholder="Soyadiniz" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input id="phone" name="phone" type="tel" placeholder="05XX XXX XX XX" required />
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">E-posta</Label>
                <Input id="email" name="email" type="email" placeholder="ornek@email.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Sifre</Label>
                <Input id="password" name="password" type="password" placeholder="En az 8 karakter" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passwordConfirm">Sifre Tekrar</Label>
                <Input id="passwordConfirm" name="passwordConfirm" type="password" placeholder="Sifrenizi tekrar girin" required />
              </div>
              <div className="flex items-start gap-2">
                <input type="checkbox" id="kvkk" name="kvkk" required className="mt-1" />
                <Label htmlFor="kvkk" className="text-xs text-muted-foreground leading-tight">
                  KVKK Aydinlatma Metni&apos;ni okudum ve kisisel verilerimin islenmesini kabul ediyorum.
                </Label>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <div className="flex gap-2 w-full">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
                Geri
              </Button>
            )}
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? "Kaydediliyor..." : step < 2 ? "Devam" : "Kayit Ol"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Zaten hesabiniz var mi?{" "}
            <Link href="/giris" className="text-primary hover:underline font-medium">
              Giris yapin
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
