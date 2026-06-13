import type { ReactNode } from "react";
import { CalendarHeart, ClipboardList, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

const features = [
  {
    icon: CalendarHeart,
    title: "Randevu & ajanda",
    desc: "Hicri takvim ve hacamat sünnet günü uyumlu planlama",
  },
  {
    icon: ClipboardList,
    title: "Tedavi protokolleri",
    desc: "Anamnez, kontrendikasyon kontrolü ve seans takibi",
  },
  {
    icon: ShieldCheck,
    title: "KVKK uyumlu",
    desc: "Uçtan uca şifreli, pgcrypto ile korunan sağlık verisi",
  },
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-primary-800 p-12 text-primary-foreground lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-primary-600/30 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-16 size-80 rounded-full bg-primary-700/50 blur-3xl"
        />

        <div className="relative flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-[var(--radius)] bg-primary-foreground/10 ring-1 ring-primary-foreground/15">
            <BrandMark className="size-6" />
          </div>
          <span className="font-headline text-xl font-semibold">ShifaHub</span>
        </div>

        <div className="relative">
          <h2 className="font-headline text-[2rem] font-semibold leading-tight">
            Bütünsel tedavinin
            <br />
            dijital şifası.
          </h2>
          <p className="mt-3 max-w-sm text-sm text-primary-foreground/75">
            GETAT uygulayıcıları ve danışanlar için sakin, güvenli ve KVKK-uyumlu tek platform.
          </p>
          <ul className="mt-8 space-y-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex gap-3">
                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-primary-foreground/10 ring-1 ring-primary-foreground/15">
                  <Icon className="size-4" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-xs text-primary-foreground/65">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative flex items-center gap-2 text-xs text-primary-foreground/65">
          <ShieldCheck className="size-3.5" aria-hidden /> pgcrypto AES-256 · RLS · uçtan uca
          şifreli
        </p>
      </aside>

      <main className="flex w-full items-center justify-center bg-background p-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex size-9 items-center justify-center rounded-[var(--radius-sm)] bg-primary text-primary-foreground">
              <BrandMark className="size-5" />
            </div>
            <span className="font-headline text-lg font-semibold text-foreground">ShifaHub</span>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
