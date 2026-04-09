"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/layout/stat-card";
import { useApi, useApiMutation } from "@/hooks/use-api";
import Link from "next/link";
import {
  Users,
  Stethoscope,
  Calendar,
  Activity,
  Clock,
  ShieldCheck,
  AlertTriangle,
  BarChart3,
  Settings,
  Lock,
  Server,
  ArrowRight,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface PendingEgitmen {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  certificateNumber: string;
  clinicCity: string;
}

interface Stats {
  totalUsers: number;
  totalDanisan: number;
  totalEgitmen: number;
  pendingEgitmen: number;
  totalRandevu: number;
  totalTedavi: number;
}

export default function AdminDashboard() {
  const {
    data: pending,
    loading: pendingLoading,
    refetch,
  } = useApi<PendingEgitmen[]>("/api/admin/egitmen/pending");
  const { data: stats, loading: statsLoading } = useApi<Stats>("/api/admin/stats");
  const { mutate, loading: mutating } = useApiMutation();

  async function handleApprove(id: string) {
    await mutate(`/api/admin/egitmen/${id}/approve`, {});
    refetch();
  }

  async function handleReject(id: string) {
    const reason = prompt("Red sebebi:");
    if (!reason) return;
    await mutate(`/api/admin/egitmen/${id}/reject`, { reason });
    refetch();
  }

  const quickLinks = [
    { label: "Kullanicilar", href: "/admin/kullanicilar", icon: Users },
    { label: "Egitmenler", href: "/admin/egitmen", icon: Stethoscope },
    { label: "Danisanlar", href: "/admin/danisan", icon: Users },
    { label: "Raporlar", href: "/admin/raporlar", icon: BarChart3 },
    { label: "KVKK", href: "/admin/kvkk", icon: Lock },
    { label: "Bildirim Gonder", href: "/admin/bildirim-gonder", icon: AlertTriangle },
    { label: "Komplikasyonlar", href: "/admin/komplikasyon", icon: Activity },
    { label: "Sistem", href: "/admin/sistem", icon: Server },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-headline">Yonetim Paneli</h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("tr-TR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/sistem">
            <Settings className="h-4 w-4 mr-1.5" />
            Sistem
          </Link>
        </Button>
      </div>

      {/* Pending egitmen alert */}
      {!pendingLoading && pending && pending.length > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-sm">{pending.length} egitmen onay bekliyor</p>
            <p className="text-xs mt-0.5">Asagidan inceleyip onaylayabilirsiniz</p>
          </div>
          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
            {pending.length}
          </Badge>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Toplam Kullanici"
          value={statsLoading ? "..." : (stats?.totalUsers ?? 0)}
          icon={Users}
          loading={statsLoading}
        />
        <StatCard
          title="Danisan"
          value={statsLoading ? "..." : (stats?.totalDanisan ?? 0)}
          icon={Users}
          color="primary"
          loading={statsLoading}
        />
        <StatCard
          title="Egitmen"
          value={statsLoading ? "..." : (stats?.totalEgitmen ?? 0)}
          icon={Stethoscope}
          color="success"
          loading={statsLoading}
        />
        <StatCard
          title="Onay Bekleyen"
          value={statsLoading ? "..." : (stats?.pendingEgitmen ?? 0)}
          icon={Clock}
          color={stats && stats.pendingEgitmen > 0 ? "warning" : "default"}
          loading={statsLoading}
        />
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Toplam Randevu"
          value={statsLoading ? "..." : (stats?.totalRandevu ?? 0)}
          icon={Calendar}
          loading={statsLoading}
        />
        <StatCard
          title="Toplam Tedavi"
          value={statsLoading ? "..." : (stats?.totalTedavi ?? 0)}
          icon={Activity}
          loading={statsLoading}
        />
        <div className="col-span-2 flex items-center gap-3 p-4 rounded-xl border bg-card">
          <ShieldCheck className="h-8 w-8 text-primary" />
          <div>
            <p className="font-semibold text-sm">KVKK Uyumlu</p>
            <p className="text-xs text-muted-foreground">
              AES-256 sifreleme aktif · Audit log aktif
            </p>
          </div>
          <Badge variant="outline" className="ml-auto text-primary border-primary">
            Aktif
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Onay Bekleyen Egitmenler */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Onay Bekleyen Egitmenler</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/egitmen" className="flex items-center gap-1 text-xs">
                Tumu <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {pendingLoading ? (
              <p className="text-sm text-muted-foreground text-center py-6">Yukleniyor...</p>
            ) : !pending || pending.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Tum egitmenler onaylandi</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pending.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between p-3 rounded-xl border hover:bg-muted/30 transition-colors"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {e.firstName} {e.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{e.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Sertifika: {e.certificateNumber} · {e.clinicCity}
                      </p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0 ml-2">
                      <Button
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleApprove(e.id)}
                        disabled={mutating}
                        title="Onayla"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 w-8 p-0"
                        onClick={() => handleReject(e.id)}
                        disabled={mutating}
                        title="Reddet"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hizli Erisim */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hizli Erisim</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {quickLinks.map((item) => (
              <Button
                key={item.href}
                variant="outline"
                className="justify-start gap-2 h-11"
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="h-4 w-4 text-primary" />
                  <span className="text-sm">{item.label}</span>
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
