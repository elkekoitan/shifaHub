import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DanisanTedaviPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tedavi Gecmisim</h1>

      <Card>
        <CardHeader>
          <CardTitle>Tedavi Kayitlari</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Henuz tedavi kaydiniz bulunmuyor. Ilk tedavinizden sonra burada gorunecektir.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
