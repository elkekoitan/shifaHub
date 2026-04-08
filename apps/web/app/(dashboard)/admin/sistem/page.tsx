import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSistemPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Sistem Durumu</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">API Sunucu</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold text-green-600">Aktif</p>
            <p className="text-xs text-muted-foreground">api.shifahub.app</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Veritabani</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold text-green-600">Aktif</p>
            <p className="text-xs text-muted-foreground">PostgreSQL 17</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Cache</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold text-green-600">Aktif</p>
            <p className="text-xs text-muted-foreground">Redis 8</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Depolama</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold text-green-600">Aktif</p>
            <p className="text-xs text-muted-foreground">MinIO S3</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Servis Durumu (Coolify)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            { name: "shifahub-postgres", status: "healthy", type: "Database" },
            { name: "shifahub-redis", status: "healthy", type: "Database" },
            { name: "shifahub-minio", status: "running", type: "Storage" },
            { name: "shifahub-qdrant", status: "healthy", type: "Vector DB" },
            { name: "shifahub-grafana", status: "healthy", type: "Monitoring" },
            { name: "shifahub-evolution", status: "degraded", type: "WhatsApp" },
          ].map((s) => (
            <div key={s.name} className="flex items-center justify-between py-2 border-b last:border-0">
              <div>
                <p className="text-sm font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.type}</p>
              </div>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  s.status === "healthy"
                    ? "bg-green-100 text-green-800"
                    : s.status === "running"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {s.status}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
