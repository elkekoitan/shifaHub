"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/layout/stat-card";
import { useApi } from "@/hooks/use-api";
import { useAuth } from "@/providers/auth-provider";
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
  Plus,
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

function WeeklyCalendar({ randevular }: { randevular: RandevuItem[] }) {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const gunIsimleri = ["Pzt", "Sal", "Car", "Per", "Cum", "Cmt", "Paz"];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {days.map((d, i) => {
        const isToday = d.toDateString() === today.toDateString();
        const dayAppts = randevular.filter((r) => {
          const rd = new Date(r.scheduledAt);
          return (
            rd.toDateString() === d.toDateString() && !["cancelled", "no_show"].includes(r.status)
          );
        });
        return (
          <div
            key={i}
            className={`flex-shrink-0 flex flex-col items-center gap-1 p-3 rounded-xl border min-w-[60px] transition-all ${
              isToday
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border hover:bg-muted/50"
            }`}
          >
            <span className="text-xs font-medium">{gunIsimleri[i]}</span>
            <span className={`text-lg font-bold ${isToday ? "" : "text-foreground"}`}>
              {d.getDate()}
            </span>
            {dayAppts.length > 0 && (
              <span
                className={`text-xs ${isToday ? "text-primary-foreground/80" : "text-primary"}`}
              >
                {dayAppts.length} randevu
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function EgitmenDashboard() {
  const { user } = useAuth();
  const { data: randevular, loading: randevuLoading } = useApi<RandevuItem[]>("/api/randevu");
  const { data: kritikStok, loading: stokLoading } = useApi<StokItem[]>("/api/stok/kritik");
  const { data: danisanList } = useApi<Array<{ userId: string }>>("/api/danisan/list");
  const { data: kasaData } = useApi<{ totalAmount: number; paidAmount: number }>(
    "/api/odeme/gunluk-kasa",
  );
  const { data: stokList } = useApi<Array<{ id: string }>>("/api/stok");

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

  // Inventory health calculation
  const totalItems = stokList?.length ?? 0;
  const kritikCount = kritikStok?.length ?? 0;
  const healthPercent =
    totalItems > 0 ? Math.round(((totalItems - kritikCount) / totalItems) * 100) : 100;

  const statusBadge: Record<
    string,
    {
      label: string;
      variant: "default" | "secondary" | "destructive" | "outline";
    }
  > = {
    requested: { label: "Bekliyor", variant: "secondary" },
    confirmed: { label: "Onaylandi", variant: "default" },
    arrived: { label: "Geldi", variant: "outline" },
    treated: { label: "Tedavi", variant: "default" },
  };

  return (
    <div className="space-y-6">
      {/* 1. Personal Welcome Section */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold font-headline">
            Hos Geldiniz, {user?.firstName || "Egitmen"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Bugun beklenen {bugunku.length} randevunuz var
          </p>
        </div>
        <Button asChild>
          <Link href="/egitmen/tedavi">
            <Plus className="h-4 w-4 mr-1.5" />
            Yeni Kayit
          </Link>
        </Button>
      </div>

      {/* 2. Stat cards — 6 metrics in 2x3 grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
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
        <StatCard
          title="Toplam Danisan"
          value={danisanList?.length ?? 0}
          icon={Users}
          color="primary"
        />
        <StatCard
          title="Gunluk Gelir"
          value={kasaData ? `\u20BA${kasaData.paidAmount.toLocaleString("tr-TR")}` : "\u20BA0"}
          icon={Wallet}
          color="success"
        />
      </div>

      {/* 3. Weekly Calendar Strip */}
      <WeeklyCalendar randevular={randevular || []} />

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

        {/* Kritik stok + Envanter Sagligi + Hizli islemler */}
        <div className="space-y-6">
          {/* 4. Inventory Health Card */}
          <Card>
            <CardContent className="pt-4 flex items-center gap-4">
              <div className="relative h-16 w-16 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
                  <path
                    d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0-31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-muted"
                  />
                  <path
                    d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0-31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray={`${healthPercent}, 100`}
                    className="text-primary"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                  %{healthPercent}
                </span>
              </div>
              <div>
                <p className="font-medium text-sm">Envanter Sagligi</p>
                <p className="text-xs text-muted-foreground">
                  {totalItems} kalem, {kritikCount} kritik
                </p>
              </div>
            </CardContent>
          </Card>

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
                {
                  label: "Randevular",
                  href: "/egitmen/randevu",
                  icon: Calendar,
                },
                {
                  label: "Danisanlarim",
                  href: "/egitmen/danisan",
                  icon: Users,
                },
                {
                  label: "Protokoller",
                  href: "/egitmen/protokol",
                  icon: ClipboardList,
                },
                {
                  label: "Ajanda",
                  href: "/egitmen/ajanda",
                  icon: CalendarDays,
                },
                {
                  label: "Odemeler",
                  href: "/egitmen/odeme",
                  icon: Wallet,
                },
                {
                  label: "Mesajlar",
                  href: "/egitmen/mesaj",
                  icon: MessageSquare,
                },
                {
                  label: "Acil Durum",
                  href: "/egitmen/acil",
                  icon: AlertTriangle,
                },
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
