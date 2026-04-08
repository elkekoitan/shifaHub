import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EgitmenDanisanListePage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Danisanlarim</h1>
        <Input placeholder="Danisan ara..." className="max-w-xs" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danisan Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Henuz atanmis danisaniniz bulunmuyor.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
