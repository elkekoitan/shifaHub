import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HijriDisplay } from "@/components/calendar/hijri-display";

const STATUS_COLORS: Record<string, string> = {
  requested: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  reminded: "bg-purple-100 text-purple-800",
  arrived: "bg-teal-100 text-teal-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  no_show: "bg-gray-100 text-gray-800",
};

const STATUS_LABELS: Record<string, string> = {
  requested: "Talep",
  confirmed: "Onaylandi",
  reminded: "Hatirlatildi",
  arrived: "Geldi",
  completed: "Tamamlandi",
  cancelled: "Iptal",
  no_show: "Gelmedi",
};

export default function EgitmenRandevuPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Randevu Yonetimi</h1>
        <HijriDisplay date={new Date()} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Bugunku</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Onay Bekleyen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">0</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Bu Hafta</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Randevu Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Henuz randevu bulunmuyor. Danisanlar randevu talebi olusturdugunda burada gorunecektir.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
