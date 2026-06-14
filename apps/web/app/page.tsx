import Link from "next/link";
import { Sprout, ArrowRight, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-12">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="mb-6 flex size-16 items-center justify-center rounded-[var(--radius-xl)] bg-primary text-primary-foreground shadow-[var(--shadow)]">
          <Sprout className="size-8" aria-hidden />
        </div>
        <h1 className="font-headline text-4xl font-bold text-foreground">ShifaHub</h1>
        <p className="mt-3 text-balance text-text-2">
          Bütünsel tedavi yönetimi. Uygulama uzmanları ve danışanlar için sakin, güvenli ve
          KVKK-uyumlu bir alan.
        </p>
        <div className="mt-10 flex w-full flex-col gap-3">
          <Link href="/giris" className={cn(buttonVariants(), "w-full")}>
            Giriş yap <ArrowRight className="size-4" aria-hidden />
          </Link>
          <Link href="/kayit" className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
            Kayıt ol
          </Link>
        </div>
      </div>
      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-text-3">
        <ShieldCheck className="size-3.5" aria-hidden /> KVKK uyumlu · uçtan uca şifreli
      </p>
    </main>
  );
}
