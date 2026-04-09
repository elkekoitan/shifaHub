"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatCard } from "@/components/layout/stat-card";
import { EmptyState } from "@/components/layout/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi, useApiMutation } from "@/hooks/use-api";
import {
  Calendar,
  Clock,
  Users,
  CheckCircle,
  Filter,
  Download,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

type RandevuItem = {
  id: string;
  danisanId: string;
  egitmenId: string;
  status: string;
  scheduledAt: string;
  duration: number;
  treatmentType: string;
  complaints: string;
  danisanFirstName?: string;
  danisanLastName?: string;
};

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  requested: { label: "Onay Bekliyor", variant: "secondary" },
  confirmed: { label: "Onaylandi", variant: "default" },
  reminded: { label: "Hatirlatildi", variant: "outline" },
  arrived: { label: "Geldi", variant: "default" },
  treated: { label: "Tedavi Edildi", variant: "default" },
  completed: { label: "Tamamlandi", variant: "outline" },
  cancelled: { label: "Iptal", variant: "destructive" },
  no_show: { label: "Gelmedi", variant: "destructive" },
  ertelendi: { label: "Ertelendi", variant: "secondary" },
};

type StatusAction = {
  label: string;
  newStatus: string;
  variant: "default" | "outline" | "destructive";
  navigateToTedavi?: boolean;
};

function getStatusActions(status: string): StatusAction[] {
  switch (status) {
    case "requested":
      return [
        { label: "✓ Onayla", newStatus: "confirmed", variant: "default" },
        { label: "Iptal", newStatus: "cancelled", variant: "destructive" },
      ];
    case "confirmed":
    case "reminded":
      return [
        { label: "Geldi", newStatus: "arrived", variant: "default" },
        { label: "Gelmedi", newStatus: "no_show", variant: "outline" },
        { label: "Ertele", newStatus: "ertelendi", variant: "outline" },
        { label: "Iptal", newStatus: "cancelled", variant: "destructive" },
      ];
    case "arrived":
      return [
        {
          label: "Tedavi Baslat →",
          newStatus: "treated",
          variant: "default",
          navigateToTedavi: true,
        },
      ];
    case "treated":
      return [{ label: "Tamamla", newStatus: "completed", variant: "default" }];
    case "ertelendi":
      return [
        { label: "Tekrar Onayla", newStatus: "confirmed", variant: "default" },
        { label: "Iptal", newStatus: "cancelled", variant: "destructive" },
      ];
    default:
      return [];
  }
}

function AppointmentSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border rounded-xl p-4 space-y-3">
          <div className="flex justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function EgitmenRandevuPage() {
  const { data: randevuList, loading, error, refetch } = useApi<RandevuItem[]>("/api/randevu");
  const { mutate, loading: mutating } = useApiMutation();
  const router = useRouter();

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const allItems = randevuList ?? [];

  const items = allItems.filter((r) => {
    if (dateFrom) {
      const rDate = new Date(r.scheduledAt);
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      if (rDate < fromDate) return false;
    }
    if (dateTo) {
      const rDate = new Date(r.scheduledAt);
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (rDate > toDate) return false;
    }
    if (statusFilter && r.status !== statusFilter) return false;
    return true;
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const bugunku = allItems.filter((r) => {
    const d = new Date(r.scheduledAt);
    return d >= today && d < tomorrow;
  }).length;

  const onayBekleyen = allItems.filter((r) => r.status === "requested").length;
  const gelenler = allItems.filter((r) => r.status === "arrived").length;

  const startOfWeek = new Date(today);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 7);
  const buHafta = allItems.filter((r) => {
    const d = new Date(r.scheduledAt);
    return d >= startOfWeek && d < endOfWeek;
  }).length;

  const handleCsvExport = () => {
    const header = "Tarih,Saat,Danisan,Tedavi,Durum,Sure";
    const rows = items.map((r) => {
      const date = new Date(r.scheduledAt);
      const tarih = date.toLocaleDateString("tr-TR");
      const saat = date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
      const danisanAd = `${r.danisanFirstName || ""} ${r.danisanLastName || ""}`
        .trim()
        .replace(/,/g, " ");
      const tedaviStr = (r.treatmentType || "Belirtilmemis").replace(/,/g, " ");
      const durum = (STATUS_CONFIG[r.status]?.label ?? r.status).replace(/,/g, " ");
      const sure = `${r.duration || 0} dk`;
      return `${tarih},${saat},${danisanAd},${tedaviStr},${durum},${sure}`;
    });
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `randevular_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAction = async (r: RandevuItem, action: StatusAction) => {
    try {
      await mutate(`/api/randevu/${r.id}/status`, { status: action.newStatus }, "PATCH");
      if (action.navigateToTedavi) {
        const params = new URLSearchParams({
          randevuId: r.id,
          danisanId: r.danisanId,
          ...(r.treatmentType ? { treatmentType: r.treatmentType } : {}),
        });
        router.push(`/egitmen/tedavi?${params.toString()}`);
      } else {
        refetch();
      }
    } catch {
      // error handled by useApiMutation
    }
  };

  const activeFilterCount = [dateFrom, dateTo, statusFilter].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-headline">Randevu Yonetimi</h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("tr-TR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleCsvExport} disabled={items.length === 0}>
          <Download className="h-4 w-4 mr-1.5" />
          CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Bugunki"
          value={loading ? "..." : bugunku}
          icon={Calendar}
          loading={loading}
        />
        <StatCard
          title="Onay Bekleyen"
          value={loading ? "..." : onayBekleyen}
          icon={Clock}
          color={onayBekleyen > 0 ? "warning" : "default"}
          loading={loading}
        />
        <StatCard
          title="Gelen Danisanlar"
          value={loading ? "..." : gelenler}
          icon={Users}
          color={gelenler > 0 ? "primary" : "default"}
          loading={loading}
        />
        <StatCard
          title="Bu Hafta"
          value={loading ? "..." : buHafta}
          icon={CheckCircle}
          loading={loading}
        />
      </div>

      {/* Filter toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant={showFilters || activeFilterCount > 0 ? "default" : "outline"}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-1.5" />
          Filtrele
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1.5 h-5 px-1.5">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDateFrom("");
              setDateTo("");
              setStatusFilter("");
            }}
          >
            Temizle
          </Button>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="space-y-1 flex-1">
                <Label className="text-xs">Baslangic Tarihi</Label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div className="space-y-1 flex-1">
                <Label className="text-xs">Bitis Tarihi</Label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
              <div className="space-y-1 flex-1">
                <Label className="text-xs">Durum</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">Tum Durumlar</option>
                  {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                    <option key={val} value={val}>
                      {cfg.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appointment list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Randevular{" "}
            <span className="text-muted-foreground font-normal text-sm">({items.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <AppointmentSkeleton />
          ) : error ? (
            <div className="flex items-center gap-2 text-destructive text-sm py-8 justify-center">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="Randevu bulunamadi"
              description={
                activeFilterCount > 0
                  ? "Filtreye uyan randevu yok. Filtreleri temizleyin."
                  : "Danisanlar randevu talebi olusturduğunda burada gorunecektir."
              }
            />
          ) : (
            <div className="space-y-3">
              {items.map((r) => {
                const actions = getStatusActions(r.status);
                const danisanAd = `${r.danisanFirstName || ""} ${r.danisanLastName || ""}`.trim();
                const cfg = STATUS_CONFIG[r.status];
                const apptDate = new Date(r.scheduledAt);
                const isToday =
                  apptDate >= today && apptDate < new Date(today.getTime() + 86400000);

                return (
                  <div
                    key={r.id}
                    className={`rounded-xl border p-4 space-y-3 transition-colors hover:bg-muted/30 ${
                      isToday ? "border-primary/30 bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5 min-w-0">
                        <p className="font-semibold truncate">{danisanAd || "Danisan"}</p>
                        <p className="text-sm text-muted-foreground">
                          {r.treatmentType || "Tedavi"}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {apptDate.toLocaleDateString("tr-TR", {
                            day: "numeric",
                            month: "short",
                          })}
                          {" · "}
                          <Clock className="h-3 w-3" />
                          {apptDate.toLocaleTimeString("tr-TR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {r.duration ? ` · ${r.duration} dk` : ""}
                        </div>
                      </div>
                      <Badge variant={cfg?.variant ?? "outline"} className="flex-shrink-0">
                        {cfg?.label ?? r.status}
                      </Badge>
                    </div>

                    {r.complaints && (
                      <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                        {r.complaints}
                      </p>
                    )}

                    {actions.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1 border-t border-border/50">
                        {actions.map((action) => (
                          <Button
                            key={action.newStatus}
                            size="sm"
                            variant={action.variant}
                            onClick={() => handleAction(r, action)}
                            disabled={mutating}
                            className="h-8 text-xs"
                          >
                            {action.label}
                            {action.navigateToTedavi && <ChevronRight className="h-3 w-3 ml-1" />}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
