"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@shifahub/shared";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const dest: Record<string, string> = {
  danisan: "/danisan",
  egitmen: "/egitmen",
  admin: "/admin",
  tabip: "/admin",
};

export default function GirisPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const login = trpc.auth.login.useMutation();
  const [showPw, setShowPw] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    try {
      const res = await login.mutateAsync(values);
      setSession(res);
      toast.success("Giriş başarılı");
      router.push(dest[res.user.role] ?? "/");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Giriş başarısız");
    }
  }

  return (
    <div>
      <h1 className="font-headline text-2xl font-semibold text-foreground">Tekrar hoş geldiniz</h1>
      <p className="mt-1.5 text-sm text-text-2">Hesabınıza güvenle giriş yapın.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">E-posta</Label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-3"
              aria-hidden
            />
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

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Şifre</Label>
            <Link
              href="/sifre-sifirla"
              className="text-xs font-medium text-primary hover:underline"
            >
              Şifremi unuttum
            </Link>
          </div>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-3"
              aria-hidden
            />
            <Input
              id="password"
              type={showPw ? "text" : "password"}
              placeholder="••••••••"
              className="pl-9 pr-10"
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-text-3 transition-colors hover:text-text-2"
              aria-label={showPw ? "Şifreyi gizle" : "Şifreyi göster"}
            >
              {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.password ? (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          ) : null}
        </div>

        <Button type="submit" className="w-full" loading={isSubmitting || login.isPending}>
          Giriş yap <ArrowRight className="size-4" aria-hidden />
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-2">
        Hesabınız yok mu?{" "}
        <Link href="/kayit" className="font-medium text-primary hover:underline">
          Kayıt olun
        </Link>
      </p>
    </div>
  );
}
