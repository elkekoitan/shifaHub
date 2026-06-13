"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  HeartPulse,
  CalendarRange,
  Clock,
  Package,
  Wallet,
  Siren,
  MessageCircle,
  User,
  ClipboardList,
  Sprout,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { cn } from "@/lib/utils";

/** Sol kenar (masaustu) + alt (mobil) navigasyon kalemleri. */
const NAV = [
  { href: "/egitmen", label: "Panel", icon: LayoutDashboard },
  { href: "/egitmen/danisan", label: "Danışanlar", icon: Users },
  { href: "/egitmen/randevu", label: "Randevu", icon: CalendarDays },
  { href: "/egitmen/tedavi", label: "Tedavi", icon: HeartPulse },
  { href: "/egitmen/protokol", label: "Protokol", icon: ClipboardList },
  { href: "/egitmen/ajanda", label: "Ajanda", icon: CalendarRange },
  { href: "/egitmen/musaitlik", label: "Müsaitlik", icon: Clock },
  { href: "/egitmen/stok", label: "Stok", icon: Package },
  { href: "/egitmen/odeme", label: "Ödeme", icon: Wallet },
  { href: "/egitmen/acil", label: "Acil", icon: Siren },
  { href: "/egitmen/mesaj", label: "Mesaj", icon: MessageCircle },
  { href: "/egitmen/profil", label: "Profil", icon: User },
] as const;

/** Mobil alt barda yalnizca en sik kullanilan 5 kalem gosterilir. */
const MOBILE_NAV = [
  { href: "/egitmen", label: "Panel", icon: LayoutDashboard },
  { href: "/egitmen/danisan", label: "Danışan", icon: Users },
  { href: "/egitmen/randevu", label: "Randevu", icon: CalendarDays },
  { href: "/egitmen/stok", label: "Stok", icon: Package },
  { href: "/egitmen/profil", label: "Profil", icon: User },
] as const;

export default function EgitmenLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user || user.role !== "egitmen") router.replace("/giris");
  }, [hasHydrated, user, router]);

  if (!hasHydrated || !user || user.role !== "egitmen") return null;

  const isActive = (href: string) =>
    href === "/egitmen" ? pathname === href : pathname.startsWith(href);

  return (
    <div className="min-h-screen md:flex">
      {/* Masaustu sol kenar navigasyonu */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-card px-3 py-5 md:flex">
        <Link href="/egitmen" className="mb-6 flex items-center gap-2.5 px-2">
          <div className="flex size-9 items-center justify-center rounded-[var(--radius)] bg-primary text-primary-foreground">
            <Sprout className="size-5" aria-hidden />
          </div>
          <span className="font-headline text-lg font-semibold text-foreground">ShifaHub</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-primary"
                    : "text-text-2 hover:bg-secondary hover:text-foreground",
                )}
              >
                <Icon className="size-4.5 shrink-0" aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-4 rounded-[var(--radius)] bg-muted px-3 py-2.5">
          <p className="truncate text-xs font-medium text-foreground">
            {user.firstName ? `${user.firstName} ${user.lastName ?? ""}` : user.email}
          </p>
          <p className="text-[11px] text-text-3">Eğitmen</p>
        </div>
      </aside>

      {/* Icerik */}
      <main className="mx-auto min-h-screen w-full max-w-md pb-24 md:max-w-3xl md:pb-8">
        {children}
      </main>

      {/* Mobil alt navigasyon */}
      <nav className="glass safe-bottom fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-t border-border md:hidden">
        <div className="flex justify-around py-2">
          {MOBILE_NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-text-3",
                )}
              >
                <Icon className="size-5" aria-hidden />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
