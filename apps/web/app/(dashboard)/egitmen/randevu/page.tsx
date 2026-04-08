"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HijriDisplay } from "@/components/calendar/hijri-display";
import { useApi, useApiMutation } from "@/hooks/use-api";

type RandevuItem = {
  id: string;
  danisanId: string;
  status: string;
  scheduledAt: string;
  duration: number;
  treatmentType: string;
  complaints: string;
};

const statusLabel: Record<string, string> = {
  pending: "Onay Bekliyor",
  confirmed: "Onaylandi",
  cancelled: "Iptal",
  completed: "Tamamlandi",
  no_show: "Gelmedi",
};

const statusColor: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  completed: "bg-blue-100 text-blue-800",
  no_show: "bg-gray-100 text-gray-800",
};

export default function EgitmenRandevuPage() {
  const { data: randevuList, loading, error, refetch } = useApi<RandevuItem[]>("/api/randevu");
  const { mutate, loading: mutating } = useApiMutation();

  const items = randevuList ?? [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const bugunku = items.filter((r) => {
    const d = new Date(r.scheduledAt);
    return d >= today && d < tomorrow;
  }).length;

  const onayBekleyen = items.filter((r) => r.status === "pending").length;

  const startOfWeek = new Date(today);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const buHafta = items.filter((r) => {
    const d = new Date(r.scheduledAt);
    return d >= startOfWeek && d < endOfWeek;
  }).length;

  const handleStatusChange = async (id: string, newStatus: string) => {
    await mutate(`/api/randevu/${id}/status`, { status: newStatus }, "PATCH");
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Randevu Yonetimi</h1>
        <HijriDisplay date={new Date()} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
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
            <CardTitle className="text-sm text-muted-foreground">Bu Hafta</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{loading ? "..." : buHafta}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Randevu Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Yukleniyor...</p>
          ) : error ? (
            <p className="text-sm text-red-500 text-center py-8">{error}</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Henuz randevu bulunmuyor. Danisanlar randevu talebi olusturdugunda burada gorunecektir.
            </p>
          ) : (
            <div className="space-y-3">
              {items.map((r) => (
                <div
                  key={r.id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{r.treatmentType || "Tedavi"}</p>
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
                      className={`text-xs px-2 py-1 rounded-full ${statusColor[r.status] ?? "bg-gray-100 text-gray-800"}`}
                    >
                      {statusLabel[r.status] ?? r.status}
                    </span>
                  </div>
                  {r.complaints && (
                    <p className="text-sm text-muted-foreground">Sikayetler: {r.complaints}</p>
                  )}
                  {r.status === "pending" && (
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(r.id, "confirmed")}
                        disabled={mutating}
                      >
                        Onayla
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(r.id, "cancelled")}
                        disabled={mutating}
                      >
                        Iptal Et
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
