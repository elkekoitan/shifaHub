"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HijriDisplay } from "@/components/calendar/hijri-display";
import { useApi, useApiMutation } from "@/hooks/use-api";

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
  egitmenFirstName?: string;
  egitmenLastName?: string;
};

const statusLabel: Record<string, string> = {
  requested: "Onay Bekliyor",
  confirmed: "Onaylandi",
  reminded: "Hatirlatildi",
  arrived: "Geldi",
  treated: "Tedavi Edildi",
  completed: "Tamamlandi",
  cancelled: "Iptal",
  no_show: "Gelmedi",
  ertelendi: "Ertelendi",
};

const statusColor: Record<string, string> = {
  requested: "bg-amber-100 text-amber-800",
  confirmed: "bg-green-100 text-green-800",
  reminded: "bg-sky-100 text-sky-800",
  arrived: "bg-indigo-100 text-indigo-800",
  treated: "bg-purple-100 text-purple-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800",
  no_show: "bg-gray-100 text-gray-800",
  ertelendi: "bg-orange-100 text-orange-800",
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
        { label: "Onayla", newStatus: "confirmed", variant: "default" },
        { label: "Iptal Et", newStatus: "cancelled", variant: "destructive" },
      ];
    case "confirmed":
    case "reminded":
      return [
        { label: "Geldi", newStatus: "arrived", variant: "default" },
        { label: "Gelmedi", newStatus: "no_show", variant: "outline" },
        { label: "Ertele", newStatus: "ertelendi", variant: "outline" },
        { label: "Iptal Et", newStatus: "cancelled", variant: "destructive" },
      ];
    case "arrived":
      return [
        {
          label: "Tedavi Baslat",
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
        { label: "Iptal Et", newStatus: "cancelled", variant: "destructive" },
      ];
    default:
      return [];
  }
}

export default function EgitmenRandevuPage() {
  const { data: randevuList, loading, error, refetch } = useApi<RandevuItem[]>("/api/randevu");
  const { mutate, loading: mutating } = useApiMutation();
  const router = useRouter();

  // Filtre state
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const allItems = randevuList ?? [];

  // Client-side filtreleme
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

  // CSV export
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
      const durum = (statusLabel[r.status] ?? r.status).replace(/,/g, " ");
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const bugunku = items.filter((r) => {
    const d = new Date(r.scheduledAt);
    return d >= today && d < tomorrow;
  }).length;

  const onayBekleyen = items.filter((r) => r.status === "requested").length;

  const gelenler = items.filter((r) => r.status === "arrived").length;

  const startOfWeek = new Date(today);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const buHafta = items.filter((r) => {
    const d = new Date(r.scheduledAt);
    return d >= startOfWeek && d < endOfWeek;
  }).length;

  const handleAction = async (r: RandevuItem, action: StatusAction) => {
    if (action.navigateToTedavi) {
      // Tedavi Baslat: once durumu guncelle, sonra tedavi formuna yonlendir
      await mutate(`/api/randevu/${r.id}/status`, { status: action.newStatus }, "PATCH");
      const params = new URLSearchParams({
        randevuId: r.id,
        danisanId: r.danisanId,
        ...(r.treatmentType ? { treatmentType: r.treatmentType } : {}),
      });
      router.push(`/egitmen/tedavi?${params.toString()}`);
    } else {
      await mutate(`/api/randevu/${r.id}/status`, { status: action.newStatus }, "PATCH");
      refetch();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Randevu Yonetimi</h1>
        <HijriDisplay date={new Date()} />
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Bugunku</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{loading ? "..." : bugunku}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Onay Bekleyen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{loading ? "..." : onayBekleyen}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Gelen Danisanlar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-indigo-600">{loading ? "..." : gelenler}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Bu Hafta</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{loading ? "..." : buHafta}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtreler */}
      <Card>
        <CardHeader>
          <CardTitle>Filtrele</CardTitle>
        </CardHeader>
        <CardContent>
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
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Tumu</option>
                <option value="requested">Onay Bekliyor</option>
                <option value="confirmed">Onaylandi</option>
                <option value="reminded">Hatirlatildi</option>
                <option value="arrived">Geldi</option>
                <option value="treated">Tedavi Edildi</option>
                <option value="completed">Tamamlandi</option>
                <option value="ertelendi">Ertelendi</option>
                <option value="cancelled">Iptal</option>
                <option value="no_show">Gelmedi</option>
              </select>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDateFrom("");
                setDateTo("");
                setStatusFilter("");
              }}
            >
              Temizle
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Randevu Listesi ({items.length})</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCsvExport}
              disabled={items.length === 0}
            >
              CSV Indir
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Yukleniyor...</p>
          ) : error ? (
            <p className="text-sm text-red-500 text-center py-8">{error}</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Henuz randevu bulunmuyor. Danisanlar randevu talebi olusturdugunda burada
              gorunecektir.
            </p>
          ) : (
            <div className="space-y-3">
              {items.map((r) => {
                const actions = getStatusActions(r.status);
                const danisanAd = `${r.danisanFirstName || ""} ${r.danisanLastName || ""}`.trim();
                return (
                  <div key={r.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        {danisanAd && <p className="font-semibold text-base">{danisanAd}</p>}
                        <p className="text-sm font-medium text-muted-foreground">
                          {r.treatmentType || "Tedavi"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(r.scheduledAt).toLocaleDateString("tr-TR")} -{" "}
                          {new Date(r.scheduledAt).toLocaleTimeString("tr-TR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {r.duration ? ` (${r.duration} dk)` : ""}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${statusColor[r.status] ?? "bg-gray-100 text-gray-800"}`}
                      >
                        {statusLabel[r.status] ?? r.status}
                      </span>
                    </div>
                    {r.complaints && (
                      <p className="text-sm text-muted-foreground">Sikayetler: {r.complaints}</p>
                    )}
                    {actions.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {actions.map((action) => (
                          <Button
                            key={action.newStatus}
                            size="sm"
                            variant={action.variant}
                            onClick={() => handleAction(r, action)}
                            disabled={mutating}
                          >
                            {action.label}
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
