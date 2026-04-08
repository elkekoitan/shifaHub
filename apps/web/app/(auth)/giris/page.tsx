"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/providers/auth-provider";

export default function GirisPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      await login(email, password);
      // Rol bazli yonlendirme
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/auth/me`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("shifahub_token")}` },
      });
      const data = await res.json();
      const role = data?.data?.role || "danisan";

      if (role === "admin") router.push("/admin");
      else if (role === "egitmen") router.push("/egitmen");
      else router.push("/danisan");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Giris basarisiz");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-primary">ShifaHub</CardTitle>
        <CardDescription>Hesabiniza giris yapin</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>
          )}
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
