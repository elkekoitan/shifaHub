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
    </div>
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
