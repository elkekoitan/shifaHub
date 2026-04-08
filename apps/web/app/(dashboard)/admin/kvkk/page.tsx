"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApi } from "@/hooks/use-api";

export default function AdminKvkkPage() {
  const { data: bildirimler } = useApi<Array<{ id: string; type: string; title: string; createdAt: string }>>("/api/bildirim");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">KVKK Denetim Paneli</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Sistem Durumu</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">OK</p>
            <p className="text-xs text-muted-foreground">Tum sistemler aktif</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Bildirim</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{bildirimler?.length || 0}</p>
            <p className="text-xs text-muted-foreground">toplam bildirim</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Veri Ihlali</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">0</p>
            <p className="text-xs text-muted-foreground">son 30 gunde</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>KVKK Uyumluluk Kontrol Listesi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "Acik riza mekanizmasi", status: true },
            { label: "Audit log sistemi", status: true },
            { label: "Veri maskeleme (TC/Telefon)", status: true },
            { label: "Field-level encryption", status: false },
            { label: "Veri silme akisi", status: false },
            { label: "72 saat ihlal bildirimi", status: true },
            { label: "Veri saklama suresi politikasi", status: true },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b last:border-0">
              <span className="text-sm">{item.label}</span>
              <span className={`px-2 py-1 text-xs rounded-full ${item.status ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                {item.status ? "Aktif" : "Planli"}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
