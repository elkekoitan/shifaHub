"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@shifahub/shared";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function KayitPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const reg = trpc.auth.register.useMutation();
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
      <h1 className="font-headline text-2xl font-semibold text-foreground">Kayıt ol</h1>
      <p className="mt-1 text-sm text-text-2">Birkaç adımda hesabını oluştur.</p>

      <div className="mt-5 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Hesap türü">
        {(["danisan", "egitmen"] as const).map((r) => (
          <button
            key={r}
            type="button"
            role="radio"
            aria-checked={role === r}
            onClick={() => setValue("role", r)}
            className={
              "rounded-[var(--radius)] border px-3 py-2.5 text-sm font-medium transition-colors " +
              (role === r
                ? "border-primary bg-accent text-primary"
                : "border-border bg-card text-text-2")
            }
          >
            {r === "danisan" ? "Danışan" : "Eğitmen"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="firstName">Ad</Label>
            <Input
              id="firstName"
              aria-invalid={Boolean(errors.firstName)}
              {...register("firstName")}
            />
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
          <Input
            id="email"
            type="email"
            aria-invalid={Boolean(errors.email)}
            {...register("email")}
          />
          {errors.email ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Telefon (opsiyonel)</Label>
          <Input id="phone" type="tel" placeholder="05xx xxx xx xx" {...register("phone")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Şifre</Label>
          <Input
            id="password"
            type="password"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
          {errors.password ? (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          ) : null}
        </div>
        <Button type="submit" className="w-full" loading={isSubmitting || reg.isPending}>
          Hesap oluştur
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-text-2">
        Zaten hesabın var mı?{" "}
        <Link href="/giris" className="font-medium text-primary">
          Giriş yap
        </Link>
      </p>
    </div>
  );
}
