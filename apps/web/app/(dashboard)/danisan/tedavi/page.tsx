"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApi } from "@/hooks/use-api";
import { useAuth } from "@/providers/auth-provider";

type TedaviItem = {
  id: string;
  treatmentType: string;
  sessionNumber: number;
  treatmentDate: string;
  complaints: string;
  findings: string;
  appliedTreatment: string;
  recommendations: string;
  nextSessionDate?: string;
  bodyArea?: string;
  egitmenFirstName?: string;
  egitmenLastName?: string;
  vitalSigns?: {
    bloodPressure?: string;
    pulse?: number;
  };
};

export default function DanisanTedaviPage() {
  const { user } = useAuth();
  const {
    data: tedaviList,
    loading,
    error,
  } = useApi<TedaviItem[]>(`/api/tedavi/danisan/${user?.id}`, { skip: !user?.id });

  const items = tedaviList ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tedavi Gecmisim</h1>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Toplam Seans</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{loading ? "..." : items.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Son Tedavi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">
              {loading
                ? "..."
                : items.length > 0
                  ? new Date(items[0]!.treatmentDate).toLocaleDateString("tr-TR")
                  : "-"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Sonraki Seans</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">
              {loading
                ? "..."
                : (() => {
                    const next = items.find((t) => t.nextSessionDate);
                    return next ? new Date(next.nextSessionDate!).toLocaleDateString("tr-TR") : "-";
                  })()}
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
          <CardHeader>
            <CardTitle>Tedavi Kayitlari</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-8">
              Henuz tedavi kaydiniz bulunmuyor. Ilk tedavinizden sonra burada gorunecektir.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((t) => {
            const egitmenAd = `${t.egitmenFirstName || ""} ${t.egitmenLastName || ""}`.trim();
            return (
              <Card key={t.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      Seans {t.sessionNumber} - {t.treatmentType || "Tedavi"}
                    </CardTitle>
                    <span className="text-xs text-muted-foreground">
                      {new Date(t.treatmentDate).toLocaleDateString("tr-TR")}
                    </span>
                  </div>
                  {egitmenAd && (
                    <p className="text-sm text-muted-foreground">Egitmen: {egitmenAd}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {t.bodyArea && (
                    <div className="flex gap-2">
                      <span className="text-xs bg-muted px-2 py-1 rounded">
                        Bolge: {t.bodyArea}
                      </span>
                    </div>
                  )}
                  {t.vitalSigns && (t.vitalSigns.bloodPressure || t.vitalSigns.pulse) && (
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      {t.vitalSigns.bloodPressure && (
                        <span>Tansiyon: {t.vitalSigns.bloodPressure}</span>
                      )}
                      {t.vitalSigns.pulse && <span>Nabiz: {t.vitalSigns.pulse}</span>}
                    </div>
                  )}
                  {t.complaints && (
                    <div>
                      <p className="font-medium">Sikayetler</p>
                      <p className="text-muted-foreground">
                        {typeof t.complaints === "string"
                          ? t.complaints
                          : JSON.stringify(t.complaints)}
                      </p>
                    </div>
                  )}
                  {t.findings && (
                    <div>
                      <p className="font-medium">Bulgular</p>
                      <p className="text-muted-foreground">{t.findings}</p>
                    </div>
                  )}
                  {t.appliedTreatment && (
                    <div>
                      <p className="font-medium">Uygulanan Tedavi</p>
                      <p className="text-muted-foreground">{t.appliedTreatment}</p>
                    </div>
                  )}
                  {t.recommendations && (
                    <div className="border-l-4 border-primary/20 pl-3">
                      <p className="font-medium">Oneriler</p>
                      <p className="text-muted-foreground">{t.recommendations}</p>
                    </div>
                  )}
                  {t.nextSessionDate && (
                    <div className="text-xs text-muted-foreground mt-2 bg-muted/50 p-2 rounded">
                      Sonraki seans: {new Date(t.nextSessionDate).toLocaleDateString("tr-TR")}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
