"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function GirisPage() {
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    // TODO: Auth Agent - JWT login implementation
    setTimeout(() => setIsLoading(false), 1000);
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-primary">ShifaHub</CardTitle>
        <CardDescription>Hesabiniza giris yapin</CardDescription>
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
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Sifre</Label>
              <Link href="/sifre-sifirla" className="text-xs text-muted-foreground hover:text-primary">
                Sifremi unuttum
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="********"
              required
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Giris yapiliyor..." : "Giris Yap"}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Hesabiniz yok mu?{" "}
            <Link href="/kayit" className="text-primary hover:underline font-medium">
              Kayit olun
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
