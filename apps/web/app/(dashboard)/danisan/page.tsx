"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApi } from "@/hooks/use-api";
import { useAuth } from "@/providers/auth-provider";
import Link from "next/link";

export default function DanisanDashboard() {
  const { user } = useAuth();
  const { data: randevular } =
    useApi<
      Array<{
        id: string;
        status: string;
        scheduledAt: string;
        treatmentType: string;
        egitmenFirstName?: string;
        egitmenLastName?: string;
      }>
    >("/api/randevu");
  const { data: bildirimler } =
    useApi<Array<{ id: string; title: string; isRead: boolean }>>("/api/bildirim");
  const { data: tedaviler } = useApi<Array<{ id: string }>>(`/api/tedavi/danisan/${user?.id}`, {
    skip: !user?.id,
  });

  const aktifRandevu =
    randevular?.filter((r) => !["completed", "cancelled", "no_show"].includes(r.status)) || [];
  const sonraki = aktifRandevu.sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  )[0];
  const okunmamis = bildirimler?.filter((b) => !b.isRead) || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Hos Geldiniz, {user?.firstName}</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sonraki Randevu
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sonraki ? (
              <div>
                <p className="text-lg font-bold">
                  {new Date(sonraki.scheduledAt).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(sonraki.scheduledAt).toLocaleTimeString("tr-TR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {" - "}
                  {sonraki.treatmentType}
                </p>
                {sonraki.egitmenFirstName && (
                  <p className="text-xs text-primary mt-1">
                    Egitmen: {sonraki.egitmenFirstName} {sonraki.egitmenLastName}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-muted-foreground">Aktif randevunuz yok</p>
                <Button asChild size="sm" className="mt-2">
                  <Link href="/danisan/randevu">Randevu Al</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tedavilerim</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{tedaviler?.length || 0}</p>
            <p className="text-xs text-muted-foreground">tamamlanan seans</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bildirim</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{okunmamis.length}</p>
            <p className="text-xs text-muted-foreground">okunmamis</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Hizli Islemler</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2 flex-wrap">
          <Button asChild>
            <Link href="/danisan/randevu">Randevu Al</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/danisan/egitmen">Egitmen Ara</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/danisan/tedavi">Tedavilerim</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/danisan/protokol">Protokollerim</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/danisan/tahlil">Tahlillerim</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/danisan/mesaj">Mesajlar</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/danisan/geri-bildirim">Geri Bildirim</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/danisan/profil">Profilim</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
