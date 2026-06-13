import type { ReactNode } from "react";
import { Sprout, ShieldCheck } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-1/2 flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-[var(--radius)] bg-primary-foreground/15">
            <Sprout className="size-6" aria-hidden />
          </div>
          <span className="font-headline text-xl font-semibold">ShifaHub</span>
        </div>
        <div>
          <h2 className="font-headline text-3xl font-semibold leading-snug">
            Bütünsel tedavinin
            <br />
            dijital şifası.
          </h2>
          <p className="mt-3 max-w-sm text-primary-foreground/80">
            Danışan, randevu, tedavi ve protokoller; KVKK uyumlu ve uçtan uca şifreli tek
            platformda.
          </p>
        </div>
        <p className="flex items-center gap-2 text-sm text-primary-foreground/80">
          <ShieldCheck className="size-4" aria-hidden /> KVKK uyumlu · pgcrypto AES-256
        </p>
      </aside>
      <main className="flex w-full items-center justify-center bg-background p-6 lg:w-1/2">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
