"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApi } from "@/hooks/use-api";
import { useAuth } from "@/providers/auth-provider";
import Link from "next/link";

export default function EgitmenDashboard() {
  const { user } = useAuth();
  const { data: randevular } = useApi<Array<{ id: string; status: string; scheduledAt: string; treatmentType: string }>>("/api/randevu");
  const { data: kritikStok } = useApi<Array<{ id: string; name: string; quantity: number }>>("/api/stok/kritik");

  const bekleyen = randevular?.filter((r) => r.status === "requested") || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Hos Geldiniz, {user?.firstName}</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Onay Bekleyen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{bekleyen.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Randevu</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{randevular?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Stok Uyari</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${kritikStok && kritikStok.length > 0 ? "text-red-600" : "text-green-600"}`}>
              {kritikStok && kritikStok.length > 0 ? `${kritikStok.length} kalem` : "Tamam"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Hizli Islem</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild size="sm" variant="destructive" className="w-full"><Link href="/egitmen/acil">Acil Durum</Link></Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Hizli Islemler</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <Button asChild variant="outline"><Link href="/egitmen/danisan">Danisanlarim</Link></Button>
          <Button asChild variant="outline"><Link href="/egitmen/randevu">Randevular</Link></Button>
          <Button asChild variant="outline"><Link href="/egitmen/tedavi">Tedavi Kaydi</Link></Button>
          <Button asChild variant="outline"><Link href="/egitmen/protokol">Protokoller</Link></Button>
          <Button asChild variant="outline"><Link href="/egitmen/musaitlik">Musaitlik</Link></Button>
          <Button asChild variant="outline"><Link href="/egitmen/stok">Stok</Link></Button>
          <Button asChild variant="outline"><Link href="/egitmen/odeme">Odemeler</Link></Button>
          <Button asChild variant="outline"><Link href="/egitmen/ajanda">Ajanda</Link></Button>
        </CardContent>
      </Card>

      {kritikStok && kritikStok.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-lg text-red-600">Kritik Stok</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {kritikStok.map((s) => (
              <div key={s.id} className="flex justify-between p-2 bg-red-50 rounded">
                <span className="text-sm">{s.name}</span>
                <span className="text-sm font-bold text-red-600">{s.quantity}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
