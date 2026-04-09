"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/layout/stat-card";
import { useApi } from "@/hooks/use-api";
import { useAuth } from "@/providers/auth-provider";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Bell,
  Activity,
  ArrowRight,
  CalendarDays,
  ClipboardList,
  MessageSquare,
  FlaskConical,
  User,
  ChevronRight,
  Stethoscope,
} from "lucide-react";

type RandevuItem = {
  id: string;
  status: string;
  scheduledAt: string;
  treatmentType: string;
  egitmenFirstName?: string;
  egitmenLastName?: string;
};

type BildirimItem = {
  id: string;
  title: string;
  isRead: boolean;
  createdAt: string;
};

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  requested: { label: "Onay Bekliyor", variant: "secondary" },
  confirmed: { label: "Onaylandi", variant: "default" },
  reminded: { label: "Hatirlatildi", variant: "outline" },
  arrived: { label: "Geldi", variant: "default" },
  treated: { label: "Tedavi", variant: "default" },
  completed: { label: "Tamamlandi", variant: "outline" },
};

function getCountdown(scheduledAt: string): string {
  const now = new Date();
  const appt = new Date(scheduledAt);
  const diff = appt.getTime() - now.getTime();
  if (diff < 0) return "Gecti";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days} gun ${hours} saat sonra`;
  if (hours > 0) return `${hours} saat sonra`;
  const mins = Math.floor((diff % 3600000) / 60000);
  return `${mins} dakika sonra`;
}

export default function DanisanDashboard() {
  const { user } = useAuth();
  const { data: randevular, loading: randevuLoading } = useApi<RandevuItem[]>("/api/randevu");
  const { data: bildirimler, loading: bildirimLoading } = useApi<BildirimItem[]>("/api/bildirim");
  const { data: tedaviler, loading: tedaviLoading } = useApi<Array<{ id: string }>>(
    `/api/tedavi/danisan/${user?.id}`,
    { skip: !user?.id },
  );

  const aktifRandevular =
    randevular?.filter((r) => !["completed", "cancelled", "no_show"].includes(r.status)) || [];
  const sonrakiRandevu = [...aktifRandevular]
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .find((r) => new Date(r.scheduledAt) > new Date());

  const okunmamis = bildirimler?.filter((b) => !b.isRead) || [];

  const quickActions = [
    { label: "Randevu Al", href: "/danisan/randevu", icon: Calendar },
    { label: "Egitmen Ara", href: "/danisan/egitmen", icon: Stethoscope },
    { label: "Tedavilerim", href: "/danisan/tedavi", icon: Activity },
    { label: "Protokollerim", href: "/danisan/protokol", icon: ClipboardList },
    { label: "Tahlillerim", href: "/danisan/tahlil", icon: FlaskConical },
    { label: "Mesajlar", href: "/danisan/mesaj", icon: MessageSquare },
    { label: "Ajanda", href: "/danisan/randevu", icon: CalendarDays },
    { label: "Profilim", href: "/danisan/profil", icon: User },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-headline">
            Hos Geldiniz, {user?.firstName || "Danisan"} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Sagliginizi takip edin, gelecegizi planlayın
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Aktif Randevu"
          value={randevuLoading ? "..." : aktifRandevular.length}
          icon={Calendar}
          color={aktifRandevular.length > 0 ? "primary" : "default"}
          loading={randevuLoading}
        />
        <StatCard
          title="Tedavi Sayisi"
          value={tedaviLoading ? "..." : (tedaviler?.length ?? 0)}
          icon={Activity}
          loading={tedaviLoading}
        />
        <StatCard
          title="Okunmamis Bildirim"
          value={bildirimLoading ? "..." : okunmamis.length}
          icon={Bell}
          color={okunmamis.length > 0 ? "warning" : "default"}
          loading={bildirimLoading}
        />
        <StatCard
          title="Tamamlanan Seans"
          value={tedaviLoading ? "..." : (tedaviler?.length ?? 0)}
          icon={Clock}
          loading={tedaviLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sonraki randevu */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between relative">
            <CardTitle className="text-base">Sonraki Randevunuz</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/danisan/randevu" className="flex items-center gap-1 text-xs">
                Tumunu gor <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="relative">
            {randevuLoading ? (
              <div className="h-20 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Yukleniyor...</p>
              </div>
            ) : sonrakiRandevu ? (
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xl font-bold text-primary">
                      {new Date(sonrakiRandevu.scheduledAt).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "long",
                        weekday: "long",
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(sonrakiRandevu.scheduledAt).toLocaleTimeString("tr-TR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {" · "}
                      {sonrakiRandevu.treatmentType || "Tedavi"}
                    </p>
                    {sonrakiRandevu.egitmenFirstName && (
                      <p className="text-xs text-muted-foreground">
                        Egitmen: {sonrakiRandevu.egitmenFirstName} {sonrakiRandevu.egitmenLastName}
                      </p>
                    )}
                  </div>
                  <Badge variant={statusConfig[sonrakiRandevu.status]?.variant ?? "outline"}>
                    {statusConfig[sonrakiRandevu.status]?.label ?? sonrakiRandevu.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 text-primary text-sm font-medium">
                  <Clock className="h-4 w-4" />
                  {getCountdown(sonrakiRandevu.scheduledAt)}
                </div>
              </div>
            ) : (
              <div className="py-4 text-center space-y-3">
                <p className="text-sm text-muted-foreground">Aktif randevunuz bulunmuyor</p>
                <Button asChild size="sm">
                  <Link href="/danisan/randevu">Randevu Al</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Son bildirimler */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Bildirimler
              {okunmamis.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {okunmamis.length}
                </Badge>
              )}
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/bildirim" className="flex items-center gap-1 text-xs">
                Tumu <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {bildirimLoading ? (
              <p className="text-sm text-muted-foreground text-center py-6">Yukleniyor...</p>
            ) : bildirimler && bildirimler.length > 0 ? (
              <div className="space-y-2">
                {bildirimler.slice(0, 4).map((b) => (
                  <div
                    key={b.id}
                    className={`flex items-center justify-between p-2.5 rounded-lg text-sm transition-colors ${
                      b.isRead ? "text-muted-foreground" : "bg-primary/5 font-medium"
                    }`}
                  >
                    <span className="line-clamp-1">{b.title}</span>
                    {!b.isRead && (
                      <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 ml-2" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">Bildirim bulunmuyor</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hizli islemler */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hizli Islemler</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {quickActions.map((item) => (
            <Button
              key={item.href + item.label}
              variant="outline"
              className="justify-start gap-2 h-12"
              asChild
            >
              <Link href={item.href}>
                <item.icon className="h-4 w-4 text-primary" />
                <span className="text-sm">{item.label}</span>
                <ChevronRight className="h-3 w-3 ml-auto text-muted-foreground" />
              </Link>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
