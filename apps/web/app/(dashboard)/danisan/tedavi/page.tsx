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
};

export default function DanisanTedaviPage() {
  const { user } = useAuth();
  const { data: tedaviList, loading, error } = useApi<TedaviItem[]>(
    `/api/tedavi/danisan/${user?.id}`,
    { skip: !user?.id },
  );

  const items = tedaviList ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tedavi Gecmisim</h1>

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
          {items.map((t) => (
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
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {t.complaints && (
                  <div>
                    <p className="font-medium">Sikayetler</p>
                    <p className="text-muted-foreground">{t.complaints}</p>
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
                  <div>
                    <p className="font-medium">Oneriler</p>
                    <p className="text-muted-foreground">{t.recommendations}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
