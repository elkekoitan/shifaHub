"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/providers/auth-provider";
import { Mail, Lock, LogIn, AlertCircle } from "lucide-react";

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
      const apiBase =
        window.location.protocol === "https:"
          ? "/api/proxy"
          : process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const res = await fetch(`${apiBase}/api/auth/me`, {
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
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Giris Yap</h2>
        <p className="text-sm text-muted-foreground">Hesabiniza giris yaparak devam edin</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-posta Adresi</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="ornek@email.com"
              className="pl-10"
              required
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Sifre</Label>
            <Link href="/sifre-sifirla" className="text-xs text-primary hover:underline">
              Sifremi unuttum
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="********"
              className="pl-10"
              required
              disabled={isLoading}
            />
          </div>
        </div>

        <Button type="submit" className="w-full h-11" disabled={isLoading}>
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Giris yapiliyor...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              Giris Yap
            </span>
          )}
        </Button>
      </form>

      <Separator />

      <p className="text-sm text-muted-foreground text-center">
        Hesabiniz yok mu?{" "}
        <Link href="/kayit" className="text-primary hover:underline font-medium">
          Ucretsiz kayit olun
        </Link>
      </p>
    </div>
  );
}
