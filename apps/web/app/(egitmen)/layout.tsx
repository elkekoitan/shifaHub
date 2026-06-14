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
import { NotificationBell } from "@/components/notification-bell";

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
    if (!user || user.role !== "egitmen") {
      router.replace("/giris");
      return;
    }
    if (localStorage.getItem(`shifahub-onboarded-${user.id}`) !== "1") {
      router.replace("/onboarding");
    }
  }, [hasHydrated, user, router]);

  if (!hasHydrated || !user || user.role !== "egitmen") return null;

  const isActive = (href: string) =>
    href === "/egitmen" ? pathname === href : pathname.startsWith(href);

  return (
    <div className="min-h-screen md:flex">
      {/* Masaustu sol kenar navigasyonu */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-card px-3 py-5 md:flex">
        <div className="mb-6 flex items-center justify-between px-1">
          <Link href="/egitmen" className="flex items-center gap-2.5 px-1">
            <div className="flex size-9 items-center justify-center rounded-[var(--radius)] bg-primary text-primary-foreground shadow-[var(--shadow-sm)]">
              <Sprout className="size-5" aria-hidden />
            </div>
            <span className="font-headline text-lg font-semibold text-foreground">ShifaHub</span>
          </Link>
          <NotificationBell />
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-primary"
                    : "text-text-2 hover:bg-secondary hover:text-foreground",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-primary transition-opacity",
                    active ? "opacity-100" : "opacity-0",
                  )}
                />
                <Icon
                  className={cn(
                    "size-5 shrink-0 transition-colors",
                    active ? "text-primary" : "text-text-3 group-hover:text-foreground",
                  )}
                  aria-hidden
                />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-4 flex items-center gap-2.5 rounded-[var(--radius)] bg-muted px-3 py-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-primary">
            {`${(user.firstName ?? "").charAt(0)}${(user.lastName ?? "").charAt(0)}`.toUpperCase() ||
              "ŞH"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-foreground">
              {user.firstName ? `${user.firstName} ${user.lastName ?? ""}` : user.email}
            </p>
            <p className="text-[11px] text-text-3">Eğitmen</p>
          </div>
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
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 px-1 py-1 text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-text-3",
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                    active ? "bg-accent" : "bg-transparent",
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                </span>
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
