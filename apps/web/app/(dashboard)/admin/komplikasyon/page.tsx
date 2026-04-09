"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApi } from "@/hooks/use-api";

const SEVERITY_LABELS = [
  { level: "1", label: "Hafif", color: "bg-blue-100 text-blue-800" },
  { level: "2", label: "Orta", color: "bg-yellow-100 text-yellow-800" },
  { level: "3", label: "Ciddi", color: "bg-orange-100 text-orange-800" },
  { level: "4", label: "Agir", color: "bg-red-100 text-red-800" },
  { level: "5", label: "Kritik", color: "bg-red-200 text-red-900" },
];

interface Komplikasyon {
  id: string;
  severity: string;
  type: string;
  description: string;
  status: string;
  danisanId: string;
  egitmenId: string;
  followUp24h?: string;
  followUp48h?: string;
  followUp1w?: string;
  resolution?: string;
  createdAt: string;
}

export default function AdminKomplikasyonPage() {
  const { data: komplikasyonlar, loading } = useApi<Komplikasyon[]>("/api/acil");

  const items = komplikasyonlar ?? [];
  const openItems = items.filter((k) => k.status !== "resolved");
  const resolvedItems = items.filter((k) => k.status === "resolved");

  // Severity dagilimi
  const severityCounts = [1, 2, 3, 4, 5].map((level) => ({
    level,
    count: items.filter((k) => k.severity === String(level)).length,
    open: openItems.filter((k) => k.severity === String(level)).length,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Komplikasyon Izleme</h1>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
        {severityCounts.map((sc) => {
          const sev = SEVERITY_LABELS.find((s) => s.level === String(sc.level));
          return (
            <Card key={sc.level}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">
                  Seviye {sc.level} - {sev?.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold">{sc.count}</p>
                {sc.open > 0 && <p className="text-xs text-amber-600">{sc.open} acik</p>}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Toplam</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{items.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Acik</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{openItems.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Cozuldu</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{resolvedItems.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Acik komplikasyonlar */}
      <Card>
        <CardHeader>
          <CardTitle>Acik Komplikasyonlar ({openItems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Yukleniyor...</p>
          ) : openItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Acik komplikasyon bulunmuyor.
            </p>
          ) : (
            <div className="space-y-3">
              {openItems.map((k) => {
                const sev = SEVERITY_LABELS.find((s) => s.level === k.severity);
                return (
                  <div key={k.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full ${sev?.color || "bg-gray-100"}`}
                        >
                          Seviye {k.severity} - {sev?.label}
                        </span>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800">
                          {k.status === "following" ? "Takipte" : "Acik"}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(k.createdAt).toLocaleDateString("tr-TR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="font-medium">{k.type}</p>
                    <p className="text-sm text-muted-foreground">{k.description}</p>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div
                        className={`p-2 rounded ${k.followUp24h ? "bg-green-50" : "bg-muted/50"}`}
                      >
                        <p className="font-medium">24 Saat</p>
                        <p className="text-muted-foreground">{k.followUp24h || "Bekliyor"}</p>
                      </div>
                      <div
                        className={`p-2 rounded ${k.followUp48h ? "bg-green-50" : "bg-muted/50"}`}
                      >
                        <p className="font-medium">48 Saat</p>
                        <p className="text-muted-foreground">{k.followUp48h || "Bekliyor"}</p>
                      </div>
                      <div
                        className={`p-2 rounded ${k.followUp1w ? "bg-green-50" : "bg-muted/50"}`}
                      >
                        <p className="font-medium">1 Hafta</p>
                        <p className="text-muted-foreground">{k.followUp1w || "Bekliyor"}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cozulmus */}
      {resolvedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cozulmus Komplikasyonlar ({resolvedItems.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {resolvedItems.map((k) => {
                const sev = SEVERITY_LABELS.find((s) => s.level === k.severity);
                return (
                  <div
                    key={k.id}
                    className="flex items-center justify-between p-3 border rounded-lg opacity-75"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full ${sev?.color || "bg-gray-100"}`}
                        >
                          Seviye {k.severity}
                        </span>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">
                          Cozuldu
                        </span>
                      </div>
                      <p className="font-medium text-sm">{k.type}</p>
                      {k.resolution && (
                        <p className="text-xs text-muted-foreground">Cozum: {k.resolution}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(k.createdAt).toLocaleDateString("tr-TR")}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
