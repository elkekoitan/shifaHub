import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DanisanDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Hos Geldiniz</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sonraki Randevu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">Henuz randevu yok</p>
            <p className="text-xs text-muted-foreground">Randevu almak icin tiklayin</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Toplam Tedavi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Son Tahlil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">-</p>
            <p className="text-xs text-muted-foreground">Tahlil kaydı yok</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Okunmamis Mesaj
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
