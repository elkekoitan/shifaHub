"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@shifahub/shared";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
      <h1 className="font-headline text-2xl font-semibold text-foreground">Giriş yap</h1>
      <p className="mt-1 text-sm text-text-2">Hesabına güvenle eriş.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">E-posta</Label>
          <Input
            id="email"
            type="email"
            placeholder="ornek@shifahub.app"
            aria-invalid={Boolean(errors.email)}
            {...register("email")}
          />
          {errors.email ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Şifre</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
          {errors.password ? (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          ) : null}
        </div>
        <Button type="submit" className="w-full" loading={isSubmitting || login.isPending}>
          Giriş yap
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-text-2">
        Hesabın yok mu?{" "}
        <Link href="/kayit" className="font-medium text-primary">
          Kayıt ol
        </Link>
      </p>
    </div>
  );
}
