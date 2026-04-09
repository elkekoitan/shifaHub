"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/layout/stat-card";
import { useApi } from "@/hooks/use-api";
// Auth import removed - user name shown via header
import Link from "next/link";
import {
  Calendar,
  Clock,
  Users,
  Package,
  AlertTriangle,
  Pill,
  ClipboardList,
  CalendarDays,
  Wallet,
  MessageSquare,
  ArrowRight,
} from "lucide-react";

type RandevuItem = {
  id: string;
  status: string;
  scheduledAt: string;
  treatmentType: string;
  danisanFirstName?: string;
  danisanLastName?: string;
};

type StokItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
};

export default function EgitmenDashboard() {
  const { data: randevular, loading: randevuLoading } = useApi<RandevuItem[]>("/api/randevu");
  const { data: kritikStok, loading: stokLoading } = useApi<StokItem[]>("/api/stok/kritik");

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 86400000);

  const bekleyen = randevular?.filter((r) => r.status === "requested") || [];
  const bugunku =
    randevular?.filter((r) => {
      const d = new Date(r.scheduledAt);
      return d >= today && d < tomorrow && !["cancelled", "no_show"].includes(r.status);
    }) || [];
  const gelenler = randevular?.filter((r) => r.status === "arrived") || [];

  const statusBadge: Record<
    string,
    { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
  > = {
    requested: { label: "Bekliyor", variant: "secondary" },
    confirmed: { label: "Onaylandi", variant: "default" },
    arrived: { label: "Geldi", variant: "outline" },
    treated: { label: "Tedavi", variant: "default" },
  };

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Bugunku Randevu"
          value={randevuLoading ? "..." : bugunku.length}
          icon={Calendar}
          loading={randevuLoading}
        />
        <StatCard
          title="Onay Bekleyen"
          value={randevuLoading ? "..." : bekleyen.length}
          icon={Clock}
          color={bekleyen.length > 0 ? "warning" : "default"}
          loading={randevuLoading}
        />
        <StatCard
          title="Gelen Danisanlar"
          value={randevuLoading ? "..." : gelenler.length}
          icon={Users}
          color={gelenler.length > 0 ? "primary" : "default"}
          loading={randevuLoading}
        />
        <StatCard
          title="Kritik Stok"
          value={stokLoading ? "..." : kritikStok?.length ? `${kritikStok.length} kalem` : "Tamam"}
          icon={Package}
          color={kritikStok && kritikStok.length > 0 ? "danger" : "success"}
          loading={stokLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bugunku randevular */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Bugunku Randevular</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/egitmen/randevu" className="flex items-center gap-1 text-xs">
                Tumu <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {bugunku.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Bugunku randevunuz yok
              </p>
            ) : (
              <div className="space-y-3">
                {bugunku.slice(0, 5).map((r) => {
                  const sb = statusBadge[r.status];
                  return (
                    <div
                      key={r.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">
                          {r.danisanFirstName
                            ? `${r.danisanFirstName} ${r.danisanLastName || ""}`
                            : "Danisan"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(r.scheduledAt).toLocaleTimeString("tr-TR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {" - "}
                          {r.treatmentType || "Tedavi"}
                        </p>
                      </div>
                      {sb && <Badge variant={sb.variant}>{sb.label}</Badge>}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Kritik stok + Hizli islemler */}
        <div className="space-y-6">
          {/* Kritik stok */}
          {kritikStok && kritikStok.length > 0 && (
            <Card className="border-destructive/30">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Kritik Stok
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/egitmen/stok" className="text-xs">
                    Stok Yonetimi
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {kritikStok.slice(0, 4).map((s) => (
                  <div
                    key={s.id}
                    className="flex justify-between items-center p-2 rounded-lg bg-destructive/5"
                  >
                    <span className="text-sm">{s.name}</span>
                    <Badge variant="destructive">
                      {s.quantity} {s.unit || "adet"}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Hizli islemler */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Hizli Islemler</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {[
                { label: "Tedavi Kaydi", href: "/egitmen/tedavi", icon: Pill },
                { label: "Randevular", href: "/egitmen/randevu", icon: Calendar },
                { label: "Danisanlarim", href: "/egitmen/danisan", icon: Users },
                { label: "Protokoller", href: "/egitmen/protokol", icon: ClipboardList },
                { label: "Ajanda", href: "/egitmen/ajanda", icon: CalendarDays },
                { label: "Odemeler", href: "/egitmen/odeme", icon: Wallet },
                { label: "Mesajlar", href: "/egitmen/mesaj", icon: MessageSquare },
                { label: "Acil Durum", href: "/egitmen/acil", icon: AlertTriangle },
              ].map((item) => (
                <Button
                  key={item.href}
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2 h-10"
                  asChild
                >
                  <Link href={item.href}>
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    {item.label}
                  </Link>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
