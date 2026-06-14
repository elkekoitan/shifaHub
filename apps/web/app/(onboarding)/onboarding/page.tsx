"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  UserCog,
  Send,
  CalendarClock,
  Stethoscope,
  ChevronRight,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand-mark";

type Slide = {
  icon: typeof Calendar;
  title: string;
  body: string;
};

const VALUE_SLIDES: Slide[] = [
  {
    icon: Calendar,
    title: "Randevu & ajanda",
    body: "Hicri takvim ve hacamat sünnet günleri (17 · 19 · 21) uyumlu, sakin ve akıllı planlama.",
  },
  {
    icon: Sparkles,
    title: "Külliyat — bilgi asistanı",
    body: "Hacamat, sülük, sujok, fitoterapi… yapay zekâ destekli, sünnet kaynaklarına saygılı bilgi.",
  },
  {
    icon: ShieldCheck,
    title: "Verileriniz güvende",
    body: "pgcrypto AES-256 ile uçtan uca şifreli; her veri işleme amacı için ayrı açık rıza.",
  },
];

const danisanSteps = [
  {
    icon: UserCog,
    label: "Profilini tamamla",
    desc: "Sağlık geçmişin için temel bilgiler",
    href: "/danisan/profil",
  },
  {
    icon: ShieldCheck,
    label: "KVKK açık rızası",
    desc: "Sağlık verisi işleme rızası",
    href: "/danisan/profil",
  },
  {
    icon: Send,
    label: "WhatsApp / Telegram bağla",
    desc: "Hatırlatmaları anında al",
    href: "/danisan/profil",
  },
];

const egitmenSteps = [
  {
    icon: CalendarClock,
    label: "Müsaitlik tanımla",
    desc: "Randevu saatlerini aç",
    href: "/egitmen/musaitlik",
  },
  {
    icon: Stethoscope,
    label: "Klinik bilgilerin",
    desc: "Uzmanlık ve klinik profili",
    href: "/egitmen/profil",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [step, setStep] = useState(0);

  const role = user?.role ?? "danisan";
  const total = VALUE_SLIDES.length + 2; // hoş geldin + 3 değer + son adımlar
  const isWelcome = step === 0;
  const isFinal = step === total - 1;
  const valueSlide = !isWelcome && !isFinal ? VALUE_SLIDES[step - 1] : null;

  function finish() {
    if (user) localStorage.setItem(`shifahub-onboarded-${user.id}`, "1");
    const home = role === "egitmen" ? "/egitmen" : role === "admin" ? "/admin" : "/danisan";
    router.replace(home);
  }

  const firstName = user?.firstName ?? "";
  const steps = role === "egitmen" ? egitmenSteps : danisanSteps;

  return (
    <div className="flex min-h-screen flex-col">
      <style>{`@keyframes obIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}.ob-in{animation:obIn .45s cubic-bezier(.22,1,.36,1) both}`}</style>

      {/* Üst: ilerleme + atla */}
      <header className="flex items-center justify-between px-5 pt-5">
        <div
          className="flex items-center gap-1.5"
          role="progressbar"
          aria-valuenow={step + 1}
          aria-valuemax={total}
        >
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={
                "h-1.5 rounded-full transition-all duration-300 " +
                (i === step
                  ? "w-6 bg-primary"
                  : i < step
                    ? "w-1.5 bg-primary/50"
                    : "w-1.5 bg-border")
              }
            />
          ))}
        </div>
        {!isFinal ? (
          <button
            type="button"
            onClick={finish}
            className="text-xs font-medium text-text-3 transition-colors hover:text-text-2"
          >
            Atla
          </button>
        ) : (
          <span className="text-xs text-text-3">Son adım</span>
        )}
      </header>

      {/* İçerik */}
      <main key={step} className="ob-in flex flex-1 flex-col px-6">
        {isWelcome ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
            <span className="flex size-20 items-center justify-center rounded-[var(--radius-xl)] bg-primary text-primary-foreground shadow-[var(--shadow-md)]">
              <BrandMark className="size-11" />
            </span>
            <div className="space-y-2">
              <h1 className="font-headline text-2xl font-semibold leading-tight text-foreground">
                {firstName ? `Hoş geldiniz, ${firstName}` : "Bütünsel şifaya hoş geldiniz"}
              </h1>
              <p className="mx-auto max-w-xs text-sm leading-relaxed text-text-2">
                Geleneksel şifa birikimini modern, güvenli ve sakin bir deneyimle buluşturuyoruz.
                Kısa bir tanıtımla başlayalım.
              </p>
            </div>
            <span className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[11px] text-text-3">
              <ShieldCheck className="size-3.5 text-primary" aria-hidden /> KVKK uyumlu · uçtan uca
              şifreli
            </span>
          </div>
        ) : valueSlide ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
            <span className="flex size-20 items-center justify-center rounded-full bg-accent text-primary">
              <valueSlide.icon className="size-9" aria-hidden />
            </span>
            <div className="space-y-2">
              <h2 className="font-headline text-xl font-semibold text-foreground">
                {valueSlide.title}
              </h2>
              <p className="mx-auto max-w-xs text-sm leading-relaxed text-text-2">
                {valueSlide.body}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col justify-center gap-5 py-6">
            <div className="text-center">
              <h2 className="font-headline text-xl font-semibold text-foreground">Hazırsınız 🌿</h2>
              <p className="mt-1.5 text-sm text-text-2">
                Başlamak için birkaç hızlı adım — istediğiniz zaman tamamlayabilirsiniz.
              </p>
            </div>
            <ul className="space-y-2.5">
              {steps.map((s) => (
                <li key={s.label}>
                  <Link
                    href={s.href}
                    onClick={() => {
                      if (user) localStorage.setItem(`shifahub-onboarded-${user.id}`, "1");
                    }}
                    className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-card px-4 py-3.5 shadow-[var(--shadow-sm)] transition-colors hover:border-primary/40 hover:bg-secondary"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius)] bg-accent text-primary">
                      <s.icon className="size-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-foreground">{s.label}</span>
                      <span className="block text-xs text-text-3">{s.desc}</span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-text-3" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>

      {/* Alt: birincil aksiyon */}
      <footer className="safe-bottom px-6 pb-6 pt-2">
        {isFinal ? (
          <Button className="w-full" size="lg" onClick={finish}>
            Panele git <ArrowRight className="size-4" aria-hidden />
          </Button>
        ) : (
          <Button
            className="w-full"
            size="lg"
            onClick={() => setStep((s) => Math.min(s + 1, total - 1))}
          >
            {isWelcome ? "Başla" : "İleri"} <ArrowRight className="size-4" aria-hidden />
          </Button>
        )}
      </footer>
    </div>
  );
}
