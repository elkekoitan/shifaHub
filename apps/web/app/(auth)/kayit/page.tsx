"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@shifahub/shared";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  HeartPulse,
  Stethoscope,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const iconCls = "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-3";

const roles = [
  { value: "danisan", label: "Danışan", desc: "Tedavi alıyorum", icon: HeartPulse },
  { value: "egitmen", label: "Eğitmen", desc: "Uygulama yapıyorum", icon: Stethoscope },
] as const;

export default function KayitPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const reg = trpc.auth.register.useMutation();
  const [showPw, setShowPw] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "danisan" },
  });
  const role = watch("role");

  async function onSubmit(values: RegisterInput) {
    try {
      const res = await reg.mutateAsync(values);
      setSession(res);
      toast.success("Kayıt başarılı");
      router.push(res.user.role === "egitmen" ? "/egitmen" : "/danisan");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kayıt başarısız");
    }
  }

  return (
    <div>
      <h1 className="font-headline text-2xl font-semibold text-foreground">Hesabınızı oluşturun</h1>
      <p className="mt-1.5 text-sm text-text-2">ShifaHub&apos;a katılın, birkaç adımda hazır.</p>

      <div className="mt-6 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Hesap türü">
        {roles.map(({ value, label, desc, icon: Icon }) => {
          const active = role === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setValue("role", value)}
              className={cn(
                "flex flex-col items-start gap-1.5 rounded-[var(--radius)] border p-3 text-left transition-all",
                active
                  ? "border-primary bg-accent ring-1 ring-primary/30"
                  : "border-border bg-card hover:border-primary/40",
              )}
            >
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-[var(--radius-sm)]",
                  active ? "bg-primary text-primary-foreground" : "bg-muted text-text-3",
                )}
              >
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="text-sm font-medium text-foreground">{label}</span>
              <span className="text-xs text-text-3">{desc}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="firstName">Ad</Label>
            <div className="relative">
              <User className={iconCls} aria-hidden />
              <Input
                id="firstName"
                className="pl-9"
                aria-invalid={Boolean(errors.firstName)}
                {...register("firstName")}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName">Soyad</Label>
            <Input
              id="lastName"
              aria-invalid={Boolean(errors.lastName)}
              {...register("lastName")}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">E-posta</Label>
          <div className="relative">
            <Mail className={iconCls} aria-hidden />
            <Input
              id="email"
              type="email"
              className="pl-9"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              {...register("email")}
            />
          </div>
          {errors.email ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">
            Telefon <span className="font-normal text-text-3">(opsiyonel)</span>
          </Label>
          <div className="relative">
            <Phone className={iconCls} aria-hidden />
            <Input
              id="phone"
              type="tel"
              placeholder="05xx xxx xx xx"
              className="pl-9"
              {...register("phone")}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Şifre</Label>
          <div className="relative">
            <Lock className={iconCls} aria-hidden />
            <Input
              id="password"
              type={showPw ? "text" : "password"}
              placeholder="En az 8 karakter"
              className="pl-9 pr-10"
              autoComplete="new-password"
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

        <Button type="submit" className="w-full" loading={isSubmitting || reg.isPending}>
          Hesap oluştur <ArrowRight className="size-4" aria-hidden />
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-2">
        Zaten hesabınız var mı?{" "}
        <Link href="/giris" className="font-medium text-primary hover:underline">
          Giriş yapın
        </Link>
      </p>
    </div>
  );
}
