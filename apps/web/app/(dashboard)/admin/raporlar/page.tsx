"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApi } from "@/hooks/use-api";

interface Stats {
  totalUsers: number;
  totalDanisan: number;
  totalEgitmen: number;
  pendingEgitmen: number;
  totalRandevu: number;
  totalTedavi: number;
}

export default function AdminRaporlarPage() {
  const { data: stats, loading } = useApi<Stats>("/api/admin/stats");

  if (loading) return <div className="flex items-center justify-center py-20 text-muted-foreground">Yukleniyor...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">Platform Raporlari</h1>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Toplam Kullanici</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{stats?.totalUsers || 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Danisan</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-blue-600">{stats?.totalDanisan || 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Egitmen</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-teal-600">{stats?.totalEgitmen || 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Onay Bekleyen</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-amber-600">{stats?.pendingEgitmen || 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Toplam Randevu</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{stats?.totalRandevu || 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Toplam Tedavi</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-green-600">{stats?.totalTedavi || 0}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Ozet</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between py-2 border-b">
            <span className="text-sm">Danisan / Kullanici Orani</span>
            <span className="text-sm font-medium">
              {stats?.totalUsers ? `%${((Number(stats.totalDanisan) / Number(stats.totalUsers)) * 100).toFixed(0)}` : "-"}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-sm">Egitmen / Kullanici Orani</span>
            <span className="text-sm font-medium">
              {stats?.totalUsers ? `%${((Number(stats.totalEgitmen) / Number(stats.totalUsers)) * 100).toFixed(0)}` : "-"}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-sm">Randevu / Tedavi Donusum</span>
            <span className="text-sm font-medium">
              {stats?.totalRandevu && Number(stats.totalRandevu) > 0
                ? `%${((Number(stats.totalTedavi) / Number(stats.totalRandevu)) * 100).toFixed(0)}`
                : "-"}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm">Tedavi / Danisan Ortalama</span>
            <span className="text-sm font-medium">
              {stats?.totalDanisan && Number(stats.totalDanisan) > 0
                ? (Number(stats.totalTedavi) / Number(stats.totalDanisan)).toFixed(1)
                : "-"}
            </span>
          </div>
        </CardContent>
      </Card>
      <HaftalikRapor />
      <EgitmenPerformans />
      <DanisanIlerleme />
      <TedaviDagilimi />
    </div>
  );
}

function EgitmenPerformans() {
  const { data, loading } = useApi<Array<{ firstName: string; lastName: string; clinicCity: string; tedaviSayisi: number; randevuSayisi: number }>>("/api/admin/stats/egitmen-performans");

  return (
    <Card>
      <CardHeader><CardTitle>Egitmen Performansi</CardTitle></CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground py-4">Yukleniyor...</p>
        ) : !data || data.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">Egitmen verisi bulunamadi.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">Egitmen</th>
                  <th className="text-left p-3 font-medium">Sehir</th>
                  <th className="text-left p-3 font-medium">Tedavi</th>
                  <th className="text-left p-3 font-medium">Randevu</th>
                </tr>
              </thead>
              <tbody>
                {data.map((e, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-3 font-medium">{e.firstName} {e.lastName}</td>
                    <td className="p-3 text-muted-foreground">{e.clinicCity || "-"}</td>
                    <td className="p-3 font-bold text-green-600">{e.tedaviSayisi}</td>
                    <td className="p-3">{e.randevuSayisi}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function HaftalikRapor() {
  const { data: weekly, loading } = useApi<Array<{ gun: string; randevu: number; tedavi: number }>>("/api/admin/stats/weekly");

  return (
    <Card>
      <CardHeader><CardTitle>Haftalik Rapor</CardTitle></CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground py-4">Yukleniyor...</p>
        ) : !weekly || weekly.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">Haftalik veri bulunamadi.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Gun</th>
                <th className="text-left p-3 font-medium">Randevu</th>
                <th className="text-left p-3 font-medium">Tedavi</th>
              </tr>
            </thead>
            <tbody>
              {weekly.map((row, i) => (
                <tr key={i} className="border-t hover:bg-muted/30">
                  <td className="p-3">{row.gun}</td>
                  <td className="p-3 font-medium">{row.randevu}</td>
                  <td className="p-3 font-medium text-green-600">{row.tedavi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

function DanisanIlerleme() {
  const { data, loading } = useApi<Array<{
    id: string; firstName: string; lastName: string; city: string;
    mainComplaints: string[]; createdAt: string;
  }>>("/api/admin/danisanlar");

  const danisanlar = data ?? [];

  return (
    <Card>
      <CardHeader><CardTitle>Danisan Ilerleme Raporu</CardTitle></CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground py-4">Yukleniyor...</p>
        ) : danisanlar.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">Danisan verisi bulunamadi.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">Danisan</th>
                  <th className="text-left p-3 font-medium">Sehir</th>
                  <th className="text-left p-3 font-medium">Kayit Tarihi</th>
                  <th className="text-left p-3 font-medium">Sikayet Sayisi</th>
                  <th className="text-left p-3 font-medium">Ilerleme</th>
                </tr>
              </thead>
              <tbody>
                {danisanlar.map((d) => {
                  const sikayetSayisi = d.mainComplaints?.length || 0;
                  const progressWidth = Math.min(100, sikayetSayisi * 20);
                  return (
                    <tr key={d.id} className="border-t hover:bg-muted/30">
                      <td className="p-3 font-medium">{d.firstName} {d.lastName}</td>
                      <td className="p-3 text-muted-foreground">{d.city || "-"}</td>
                      <td className="p-3 text-muted-foreground">{new Date(d.createdAt).toLocaleDateString("tr-TR")}</td>
                      <td className="p-3">{sikayetSayisi}</td>
                      <td className="p-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${progressWidth}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TedaviDagilimi() {
  const { data, loading } = useApi<Array<{ type: string; count: number }>>("/api/admin/stats/tedavi-dagilim");

  const items = data ?? [];
  const maxCount = items.length > 0 ? Math.max(...items.map((i) => i.count)) : 1;

  const TREATMENT_LABELS: Record<string, string> = {
    hacamat_kuru: "Kuru Hacamat",
    hacamat_yas: "Yas Hacamat",
    solucan: "Solucan (Hirudoterapi)",
    sujok: "Sujok Terapi",
    refleksoloji: "Refleksoloji",
    akupunktur: "Akupunktur",
    fitoterapi: "Fitoterapi",
  };

  return (
    <Card>
      <CardHeader><CardTitle>Tedavi Dagilimi</CardTitle></CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground py-4">Yukleniyor...</p>
        ) : items.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">Tedavi verisi bulunamadi.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.type} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{TREATMENT_LABELS[item.type] || item.type}</span>
                  <span className="font-bold">{item.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-teal-600 h-3 rounded-full transition-all"
                    style={{ width: `${(item.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
