"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function SifreSifirlaPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    // TODO: Password reset API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSent(true);
    }, 1000);
  }

  if (isSent) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Email Gonderildi</CardTitle>
          <CardDescription>
            Sifre sifirlama baglantisi e-posta adresinize gonderildi. Lutfen gelen kutunuzu kontrol edin.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Link href="/giris" className="text-sm text-primary hover:underline">
            Giris sayfasina don
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-primary">Sifre Sifirlama</CardTitle>
        <CardDescription>
          E-posta adresinizi girin, size sifirlama baglantisi gonderelim
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="ornek@email.com"
              required
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Gonderiliyor..." : "Sifirlama Linki Gonder"}
          </Button>
          <Link href="/giris" className="text-sm text-muted-foreground hover:text-primary">
            Giris sayfasina don
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
