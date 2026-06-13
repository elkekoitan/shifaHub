"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  HeartPulse,
  ShieldCheck,
  AlertTriangle,
  BarChart3,
  Send,
  Settings,
  Sprout,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Panel", icon: LayoutDashboard },
  { href: "/admin/kullanicilar", label: "Kullanıcılar", icon: Users },
  { href: "/admin/egitmen", label: "Eğitmen onayları", icon: GraduationCap },
  { href: "/admin/danisan", label: "Danışanlar", icon: HeartPulse },
  { href: "/admin/komplikasyon", label: "Komplikasyonlar", icon: AlertTriangle },
  { href: "/admin/raporlar", label: "Raporlar", icon: BarChart3 },
  { href: "/admin/bildirim-gonder", label: "Bildirim gönder", icon: Send },
  { href: "/admin/kvkk", label: "KVKK denetim", icon: ShieldCheck },
  { href: "/admin/sistem", label: "Sistem", icon: Settings },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, hasHydrated, clear } = useAuthStore();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user || user.role !== "admin") router.replace("/giris");
  }, [hasHydrated, user, router]);

  if (!hasHydrated || !user || user.role !== "admin") return null;

  function onLogout() {
    clear();
    router.replace("/giris");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card lg:flex">
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="flex size-9 items-center justify-center rounded-[var(--radius)] bg-primary text-primary-foreground">
            <Sprout className="size-5" aria-hidden />
          </div>
          <div>
            <p className="font-headline text-sm font-semibold text-foreground">ShifaHub</p>
            <p className="text-[10px] text-text-3">Yönetim paneli</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
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
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <div className="mb-2 px-2">
            <p className="truncate text-sm font-medium text-foreground">
              {user.firstName ? `${user.firstName} ${user.lastName ?? ""}` : user.email}
            </p>
            <p className="truncate text-[10px] text-text-3">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            aria-label="Çıkış yap"
            className="flex w-full items-center gap-2 rounded-[var(--radius)] px-3 py-2 text-sm font-medium text-text-2 transition-colors hover:bg-secondary hover:text-destructive"
          >
            <LogOut className="size-4" aria-hidden />
            Çıkış yap
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobil üst gezinme */}
        <header className="glass safe-bottom sticky top-0 z-20 border-b border-border lg:hidden">
          <div className="flex items-center gap-2 overflow-x-auto px-3 py-2">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-label={label}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    active ? "bg-accent text-primary" : "text-text-2",
                  )}
                >
                  <Icon className="size-3.5" aria-hidden />
                  {label}
                </Link>
              );
            })}
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
