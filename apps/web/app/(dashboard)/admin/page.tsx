"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApi, useApiMutation } from "@/hooks/use-api";
import Link from "next/link";

interface PendingEgitmen {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  certificateNumber: string;
  clinicCity: string;
}

interface Stats {
  totalUsers: number;
  totalDanisan: number;
  totalEgitmen: number;
  pendingEgitmen: number;
  totalRandevu: number;
  totalTedavi: number;
}

export default function AdminDashboard() {
  const { data: pending, refetch } = useApi<PendingEgitmen[]>("/api/admin/egitmen/pending");
  const { data: stats } = useApi<Stats>("/api/admin/stats");
  const { mutate } = useApiMutation();

  async function handleApprove(id: string) {
    await mutate(`/api/admin/egitmen/${id}/approve`, {});
    refetch();
  }

  async function handleReject(id: string) {
    const reason = prompt("Red sebebi:");
    if (!reason) return;
    await mutate(`/api/admin/egitmen/${id}/reject`, { reason });
    refetch();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Kullanici</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Danisan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{stats?.totalDanisan || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Egitmen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-teal-600">{stats?.totalEgitmen || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Onay Bekleyen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{stats?.pendingEgitmen || 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Randevu</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.totalRandevu || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Tedavi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.totalTedavi || 0}</p>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Hizli Erisim</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2 flex-wrap">
            <Button asChild variant="outline" size="sm"><Link href="/admin/kullanicilar">Kullanicilar</Link></Button>
            <Button asChild variant="outline" size="sm"><Link href="/admin/egitmen">Egitmenler</Link></Button>
            <Button asChild variant="outline" size="sm"><Link href="/admin/danisan">Danisanlar</Link></Button>
            <Button asChild variant="outline" size="sm"><Link href="/admin/kvkk">KVKK</Link></Button>
            <Button asChild variant="outline" size="sm"><Link href="/admin/sistem">Sistem</Link></Button>
          </CardContent>
        </Card>
      </div>

      {pending && pending.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Onay Bekleyen Egitmenler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pending.map((e) => (
              <div key={e.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{e.firstName} {e.lastName}</p>
                  <p className="text-sm text-muted-foreground">{e.email}</p>
                  <p className="text-xs text-muted-foreground">Sertifika: {e.certificateNumber} | {e.clinicCity}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleApprove(e.id)}>Onayla</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleReject(e.id)}>Reddet</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
