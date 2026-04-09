"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { useAuth } from "@/providers/auth-provider";
import { Skeleton } from "@/components/ui/skeleton";
import type { NavItem } from "@/components/ui/sidebar";

// Lucide icons
import {
  Home,
  Calendar,
  Search,
  Pill,
  ClipboardList,
  TestTube,
  MessageSquare,
  Star,
  Bell,
  User,
  LayoutDashboard,
  Users,
  CalendarDays,
  Clock,
  Package,
  Wallet,
  AlertTriangle,
  UserCog,
  Shield,
  BarChart3,
  Settings as SettingsIcon,
  Send,
} from "lucide-react";

const navItems: Record<string, NavItem[]> = {
  danisan: [
    { label: "Ana Sayfa", href: "/danisan", icon: Home, group: "Genel" },
    { label: "Randevularim", href: "/danisan/randevu", icon: Calendar, group: "Klinik" },
    { label: "Egitmen Ara", href: "/danisan/egitmen", icon: Search, group: "Klinik" },
    { label: "Tedavilerim", href: "/danisan/tedavi", icon: Pill, group: "Klinik" },
    { label: "Protokollerim", href: "/danisan/protokol", icon: ClipboardList, group: "Klinik" },
    { label: "Tahlillerim", href: "/danisan/tahlil", icon: TestTube, group: "Klinik" },
    { label: "Mesajlar", href: "/danisan/mesaj", icon: MessageSquare, group: "Iletisim" },
    { label: "Geri Bildirim", href: "/danisan/geri-bildirim", icon: Star, group: "Iletisim" },
    { label: "Bildirimler", href: "/bildirim", icon: Bell, group: "Iletisim" },
    { label: "Profilim", href: "/danisan/profil", icon: User, group: "Hesap" },
  ],
  egitmen: [
    { label: "Dashboard", href: "/egitmen", icon: LayoutDashboard, group: "Genel" },
    { label: "Danisanlarim", href: "/egitmen/danisan", icon: Users, group: "Klinik" },
    { label: "Randevular", href: "/egitmen/randevu", icon: Calendar, group: "Klinik" },
    { label: "Tedaviler", href: "/egitmen/tedavi", icon: Pill, group: "Klinik" },
    { label: "Protokoller", href: "/egitmen/protokol", icon: ClipboardList, group: "Klinik" },
    { label: "Ajanda", href: "/egitmen/ajanda", icon: CalendarDays, group: "Klinik" },
    { label: "Musaitlik", href: "/egitmen/musaitlik", icon: Clock, group: "Yonetim" },
    { label: "Stok", href: "/egitmen/stok", icon: Package, group: "Yonetim" },
    { label: "Odemeler", href: "/egitmen/odeme", icon: Wallet, group: "Yonetim" },
    { label: "Acil Durum", href: "/egitmen/acil", icon: AlertTriangle, group: "Yonetim" },
    { label: "Mesajlar", href: "/egitmen/mesaj", icon: MessageSquare, group: "Iletisim" },
    { label: "Bildirimler", href: "/bildirim", icon: Bell, group: "Iletisim" },
    { label: "Profilim", href: "/egitmen/profil", icon: User, group: "Hesap" },
  ],
  admin: [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard, group: "Genel" },
    { label: "Kullanicilar", href: "/admin/kullanicilar", icon: UserCog, group: "Yonetim" },
    { label: "Egitmenler", href: "/admin/egitmen", icon: Users, group: "Yonetim" },
    { label: "Danisanlar", href: "/admin/danisan", icon: Users, group: "Yonetim" },
    { label: "KVKK", href: "/admin/kvkk", icon: Shield, group: "Guvenlik" },
    {
      label: "Komplikasyonlar",
      href: "/admin/komplikasyon",
      icon: AlertTriangle,
      group: "Guvenlik",
    },
    { label: "Raporlar", href: "/admin/raporlar", icon: BarChart3, group: "Analiz" },
    { label: "Bildirim Gonder", href: "/admin/bildirim-gonder", icon: Send, group: "Analiz" },
    { label: "Sistem", href: "/admin/sistem", icon: SettingsIcon, group: "Sistem" },
  ],
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/giris");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold animate-pulse">
          S
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const role = user.role || "danisan";
  const items = navItems[role] ?? navItems["danisan"]!;

  return (
    <div className="min-h-screen">
      <Sidebar items={items} role={role} userName={user.firstName} />
      <main className="lg:ml-64 min-h-screen bg-background transition-all duration-300">
        <AppHeader user={user} onLogout={logout} />
        <div className="p-4 lg:p-6 max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
