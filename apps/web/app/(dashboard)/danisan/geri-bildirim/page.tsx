"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApi, useApiMutation } from "@/hooks/use-api";
import { useAuth } from "@/providers/auth-provider";

export default function DanisanGeriBildirimPage() {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);

  const { data: lastTedavi } = useApi<{ egitmenId: string; treatmentType: string; treatmentDate: string } | null>(
    `/api/tedavi/danisan/${user?.id}/last`,
    { skip: !user?.id },
  );
  const { mutate, loading } = useApiMutation();

  async function handleSubmit() {
    if (!lastTedavi || rating === 0) return;
    const body = `Tedavi Geri Bildirim\nMemnuniyet: ${"★".repeat(rating)}${"☆".repeat(5 - rating)} (${rating}/5)\nTedavi: ${lastTedavi.treatmentType}\nYorum: ${comment || "Yorum yok"}`;
    await mutate("/api/mesaj", { receiverId: lastTedavi.egitmenId, content: body });
    setSent(true);
  }

  if (sent) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <p className="text-4xl">✅</p>
        <h2 className="text-xl font-bold">Tesekkurler!</h2>
        <p className="text-muted-foreground">Geri bildiriminiz egitmeninize iletildi.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">Tedavi Geri Bildirimi</h1>

      {!lastTedavi ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Henuz tedavi kaydiniz bulunmuyor.</CardContent></Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Son tedaviniz hakkinda</CardTitle>
            <p className="text-sm text-muted-foreground">
              {lastTedavi.treatmentType} - {new Date(lastTedavi.treatmentDate).toLocaleDateString("tr-TR")}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Memnuniyet Derecesi</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setRating(n)}
                    className={`text-2xl transition-transform hover:scale-110 ${n <= rating ? "text-yellow-500" : "text-gray-300"}`}>
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Yorumunuz (opsiyonel)</p>
              <textarea className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[100px]"
                value={comment} onChange={(e) => setComment(e.target.value)}
                placeholder="Tedavi hakkindaki dusunceleriniz..." />
            </div>
            <Button onClick={handleSubmit} disabled={loading || rating === 0} className="w-full">
              {loading ? "Gonderiliyor..." : "Geri Bildirim Gonder"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
