"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminEgitmenPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Egitmen Yonetimi</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-amber-600">Onay Bekleyen Egitmenler</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Onay bekleyen egitmen bulunmuyor.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Onaylanmis Egitmenler</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Henuz onaylanmis egitmen yok.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
