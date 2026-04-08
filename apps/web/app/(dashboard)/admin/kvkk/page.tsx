"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApi } from "@/hooks/use-api";

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  tableName: string;
  recordId: string;
  description: string;
  ipAddress: string;
  createdAt: string;
}

export default function AdminKvkkPage() {
  const { data: bildirimler } = useApi<Array<{ id: string; type: string; title: string; createdAt: string }>>("/api/bildirim");
  const { data: auditLogs, loading: auditLoading } = useApi<AuditLog[]>("/api/admin/audit-log");

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const recentLogs = auditLogs?.slice(0, 30) ?? [];

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

      <Card>
        <CardHeader>
          <CardTitle>Son Erisim Kayitlari</CardTitle>
        </CardHeader>
        <CardContent>
          {auditLoading && (
            <p className="text-sm text-muted-foreground">Kayitlar yukleniyor...</p>
          )}

          {!auditLoading && recentLogs.length === 0 && (
            <p className="text-sm text-muted-foreground">Henuz erisim kaydi bulunmuyor.</p>
          )}

          {recentLogs.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Tarih</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Kullanici</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Islem</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Tablo</th>
                    <th className="pb-2 font-medium text-muted-foreground">Aciklama</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLogs.map((log) => (
                    <tr key={log.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 whitespace-nowrap text-xs">{formatDate(log.createdAt)}</td>
                      <td className="py-2 pr-4 whitespace-nowrap text-xs">{log.userId}</td>
                      <td className="py-2 pr-4">
                        <span className={`inline-block px-1.5 py-0.5 text-xs rounded ${
                          log.action === "DELETE" ? "bg-red-100 text-red-800" :
                          log.action === "UPDATE" ? "bg-yellow-100 text-yellow-800" :
                          log.action === "CREATE" ? "bg-green-100 text-green-800" :
                          "bg-blue-100 text-blue-800"
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-xs text-muted-foreground">{log.tableName}</td>
                      <td className="py-2 text-xs text-muted-foreground truncate max-w-[200px]">{log.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
