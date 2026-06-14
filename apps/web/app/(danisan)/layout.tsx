"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Calendar, Sparkles, MessageCircle, User } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/danisan", label: "Ana sayfa", icon: Home },
  { href: "/danisan/randevu", label: "Randevu", icon: Calendar },
  { href: "/danisan/kulliyat", label: "Külliyat", icon: Sparkles },
  { href: "/danisan/mesaj", label: "Mesaj", icon: MessageCircle },
  { href: "/danisan/profil", label: "Profil", icon: User },
];

export default function DanisanLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user || user.role !== "danisan") {
      router.replace("/giris");
      return;
    }
    if (localStorage.getItem(`shifahub-onboarded-${user.id}`) !== "1") {
      router.replace("/onboarding");
    }
  }, [hasHydrated, user, router]);

  if (!hasHydrated || !user || user.role !== "danisan") return null;

  return (
    <div className="mx-auto min-h-screen max-w-md pb-24">
      {children}
      <nav className="glass safe-bottom fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-t border-border">
        <div className="flex justify-around py-2">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
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
