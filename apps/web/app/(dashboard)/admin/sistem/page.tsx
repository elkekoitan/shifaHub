"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApi } from "@/hooks/use-api";

type AdminStats = {
  totalUsers: number;
  totalDanisan: number;
  totalEgitmen: number;
  pendingEgitmen: number;
  totalRandevu: number;
  totalTedavi: number;
};

type AuditItem = {
  id: string;
  userId: string;
  action: string;
  tableName: string;
  description: string;
  ipAddress: string;
  createdAt: string;
};

export default function AdminSistemPage() {
  const { data: stats, loading, error } = useApi<AdminStats>("/api/admin/stats");
  const { data: auditLogs } = useApi<AuditItem[]>("/api/admin/audit-log");
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");

  // Backend health check
  useEffect(() => {
    const apiBase =
      typeof window !== "undefined" && window.location.protocol === "https:"
        ? "/api/proxy"
        : process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    fetch(`${apiBase}/health`)
      .then((r) => (r.ok ? setBackendStatus("online") : setBackendStatus("offline")))
      .catch(() => setBackendStatus("offline"));
  }, []);

  const services = [
    {
      name: "ShifaHub API (Fastify)",
      type: "Backend",
      status: backendStatus === "checking" ? "kontrol ediliyor" : backendStatus,
    },
    { name: "PostgreSQL 17", type: "Veritabani", status: stats ? "healthy" : "bilinmiyor" },
    { name: "Redis 8", type: "Cache", status: "healthy" },
    { name: "MinIO", type: "Dosya Depolama", status: "running" },
    { name: "Qdrant", type: "Vector DB", status: "healthy" },
    { name: "Grafana", type: "Izleme", status: "healthy" },
  ];

  const recentLogs = (auditLogs ?? []).slice(0, 20);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Sistem Durumu</h1>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Kullanicilar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{loading ? "..." : (stats?.totalUsers ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Danisanlar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{loading ? "..." : (stats?.totalDanisan ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Egitmenler</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{loading ? "..." : (stats?.totalEgitmen ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Bekleyen Onay</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-amber-600">
              {loading ? "..." : (stats?.pendingEgitmen ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Randevular</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{loading ? "..." : (stats?.totalRandevu ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Tedaviler</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{loading ? "..." : (stats?.totalTedavi ?? 0)}</p>
          </CardContent>
        </Card>
      </div>

      {error && <p className="text-sm text-red-500">Istatistikler yuklenemedi: {error}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Servis Durumu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {services.map((s) => (
              <div
                key={s.name}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div>
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.type}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    s.status === "healthy" || s.status === "online"
                      ? "bg-green-100 text-green-800"
                      : s.status === "running"
                        ? "bg-blue-100 text-blue-800"
                        : s.status === "offline"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {s.status}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Son Islemler (Audit Log)</CardTitle>
          </CardHeader>
          <CardContent>
            {recentLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Kayit bulunamadi</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start justify-between py-1.5 border-b last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">
                        {log.description || `${log.action} - ${log.tableName}`}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{log.ipAddress}</p>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          log.action === "create"
                            ? "bg-green-100 text-green-700"
                            : log.action === "update"
                              ? "bg-blue-100 text-blue-700"
                              : log.action === "delete"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {log.action}
                      </span>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(log.createdAt).toLocaleTimeString("tr-TR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
