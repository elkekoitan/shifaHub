"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/providers/auth-provider";

const navItems: Record<string, { label: string; href: string; icon: string }[]> = {
  danisan: [
    { label: "Ana Sayfa", href: "/danisan", icon: "🏠" },
    { label: "Randevularim", href: "/danisan/randevu", icon: "📅" },
    { label: "Tedavilerim", href: "/danisan/tedavi", icon: "💊" },
    { label: "Tahlillerim", href: "/danisan/tahlil", icon: "🔬" },
    { label: "Mesajlar", href: "/danisan/mesaj", icon: "💬" },
    { label: "Profilim", href: "/danisan/profil", icon: "👤" },
  ],
  egitmen: [
    { label: "Dashboard", href: "/egitmen", icon: "📊" },
    { label: "Danisanlarim", href: "/egitmen/danisan", icon: "👥" },
    { label: "Randevular", href: "/egitmen/randevu", icon: "📅" },
    { label: "Tedaviler", href: "/egitmen/tedavi", icon: "💊" },
    { label: "Ajanda", href: "/egitmen/ajanda", icon: "📋" },
    { label: "Stok", href: "/egitmen/stok", icon: "📦" },
    { label: "Odemeler", href: "/egitmen/odeme", icon: "💰" },
    { label: "Acil Durum", href: "/egitmen/acil", icon: "🚨" },
    { label: "Profilim", href: "/egitmen/profil", icon: "👤" },
  ],
  admin: [
    { label: "Dashboard", href: "/admin", icon: "📊" },
    { label: "Kullanicilar", href: "/admin/kullanicilar", icon: "👤" },
    { label: "Egitmenler", href: "/admin/egitmen", icon: "👨‍⚕️" },
    { label: "Danisanlar", href: "/admin/danisan", icon: "👥" },
    { label: "KVKK", href: "/admin/kvkk", icon: "🔒" },
    { label: "Sistem", href: "/admin/sistem", icon: "⚙️" },
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
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Yukleniyor...</p>
      </div>
    );
  }

  if (!user) return null;

  const role = user.role || "danisan";
  const items = navItems[role] ?? navItems["danisan"]!;

  return (
    <div className="min-h-screen">
      <Sidebar items={items} role={role} />
      <main className="ml-64 min-h-screen bg-background">
        <header className="flex items-center justify-between border-b px-6 py-3">
          <span className="text-sm text-muted-foreground">
            Hos geldiniz, <strong>{user.firstName} {user.lastName}</strong>
          </span>
          <button onClick={logout} className="text-sm text-muted-foreground hover:text-destructive">
            Cikis Yap
          </button>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
