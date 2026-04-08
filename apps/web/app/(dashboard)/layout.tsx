"use client";

import { Sidebar } from "@/components/ui/sidebar";

// TODO: Bu bilgiler auth context'ten gelecek
const role = "danisan";

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
    { label: "Profilim", href: "/egitmen/profil", icon: "👤" },
  ],
  admin: [
    { label: "Dashboard", href: "/admin", icon: "📊" },
    { label: "Egitmenler", href: "/admin/egitmen", icon: "👨‍⚕️" },
    { label: "Danisanlar", href: "/admin/danisan", icon: "👥" },
    { label: "KVKK", href: "/admin/kvkk", icon: "🔒" },
    { label: "Sistem", href: "/admin/sistem", icon: "⚙️" },
  ],
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const items = navItems[role] || navItems.danisan;

  return (
    <div className="min-h-screen">
      <Sidebar items={items} role={role} />
      <main className="ml-64 min-h-screen bg-background">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
