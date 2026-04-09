"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApi } from "@/hooks/use-api";
import { useAuth } from "@/providers/auth-provider";

interface Complaint {
  description: string;
  priority: string;
  treatmentMethod: string;
  estimatedSessions: number;
  sessionInterval: string;
}

interface Protocol {
  id: string;
  title: string;
  status: string;
  complaints: Complaint[];
  supportingTreatments: string;
  notes: string;
  createdAt: string;
}

const PRIORITY_LABELS: Record<string, string> = {
  "1": "Acil",
  "2": "Yuksek",
  "3": "Normal",
  "4": "Takip",
};

const PRIORITY_COLORS: Record<string, string> = {
  "1": "bg-red-100 text-red-800",
  "2": "bg-orange-100 text-orange-800",
  "3": "bg-blue-100 text-blue-800",
  "4": "bg-gray-100 text-gray-800",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Aktif",
  completed: "Tamamlandi",
  paused: "Duraklatildi",
  cancelled: "Iptal",
  draft: "Taslak",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  completed: "bg-blue-100 text-blue-800",
  paused: "bg-amber-100 text-amber-800",
  cancelled: "bg-red-100 text-red-800",
  draft: "bg-gray-100 text-gray-800",
};

const TREATMENT_LABELS: Record<string, string> = {
  hacamat_kuru: "Hacamat (Kuru)",
  hacamat_yas: "Hacamat (Yas)",
  solucan: "Solucan Tedavisi",
  sujok: "Sujok",
  refleksoloji: "Refleksoloji",
  akupunktur: "Akupunktur",
  fitoterapi: "Fitoterapi",
};

const INTERVAL_LABELS: Record<string, string> = {
  haftalik: "Haftalik",
  "2_haftalik": "2 Haftalik",
  aylik: "Aylik",
};

export default function DanisanProtokolPage() {
  const { user } = useAuth();
  const {
    data: protokoller,
    loading,
    error,
  } = useApi<Protocol[]>(`/api/protokol/danisan/${user?.id}`, { skip: !user?.id });

  const items = protokoller ?? [];
  const activeProtocols = items.filter((p) => p.status === "active");
  const otherProtocols = items.filter((p) => p.status !== "active");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tedavi Protokollerim</h1>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Toplam Protokol</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{loading ? "..." : items.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {loading ? "..." : activeProtocols.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Toplam Sikayet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {loading ? "..." : items.reduce((sum, p) => sum + (p.complaints?.length || 0), 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Yukleniyor...</p>
      ) : error ? (
        <p className="text-sm text-red-500 text-center py-8">{error}</p>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Henuz tedavi protokolunuz bulunmuyor. Egitmeniniz sizin icin bir protokol olusturdugunda
            burada gorunecektir.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Aktif protokoller */}
          {activeProtocols.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Aktif Protokoller</h2>
              {activeProtocols.map((protocol) => (
                <Card key={protocol.id} className="border-green-200">
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-base">{protocol.title}</h3>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${STATUS_COLORS[protocol.status] || "bg-gray-100"}`}
                      >
                        {STATUS_LABELS[protocol.status] || protocol.status}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {(protocol.complaints ?? []).map((c, i) => (
                        <div key={i} className="p-3 bg-muted/50 rounded-lg space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 text-xs rounded-full ${PRIORITY_COLORS[c.priority] || "bg-gray-100"}`}
                            >
                              {PRIORITY_LABELS[c.priority] || `Oncelik ${c.priority}`}
                            </span>
                            <span className="text-sm font-medium">{c.description}</span>
                          </div>
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            <span>
                              Yontem: {TREATMENT_LABELS[c.treatmentMethod] || c.treatmentMethod}
                            </span>
                            <span>Tahmini: {c.estimatedSessions} seans</span>
                            <span>
                              Aralik: {INTERVAL_LABELS[c.sessionInterval] || c.sessionInterval}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {protocol.supportingTreatments && (
                      <div className="border-l-4 border-primary/20 pl-3">
                        <p className="text-xs text-muted-foreground">Destekleyici Tedaviler</p>
                        <p className="text-sm">{protocol.supportingTreatments}</p>
                      </div>
                    )}

                    {protocol.notes && (
                      <div>
                        <p className="text-xs text-muted-foreground">Notlar</p>
                        <p className="text-sm">{protocol.notes}</p>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground text-right">
                      Olusturulma: {new Date(protocol.createdAt).toLocaleDateString("tr-TR")}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Diger protokoller */}
          {otherProtocols.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Tamamlanan / Diger Protokoller</h2>
              {otherProtocols.map((protocol) => (
                <Card key={protocol.id} className="opacity-75">
                  <CardContent className="pt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{protocol.title}</h3>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${STATUS_COLORS[protocol.status] || "bg-gray-100"}`}
                      >
                        {STATUS_LABELS[protocol.status] || protocol.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {(protocol.complaints ?? []).length} sikayet |{" "}
                      {new Date(protocol.createdAt).toLocaleDateString("tr-TR")}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
