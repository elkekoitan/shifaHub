"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApi, useApiMutation } from "@/hooks/use-api";

interface Bildirim {
  id: string;
  type: string;
  title: string;
  body: string | null;
  isRead: boolean;
  actionUrl: string | null;
  createdAt: string;
}

const typeIcon: Record<string, string> = {
  randevu_hatirlatma: "📅", randevu_onay: "✅", randevu_iptal: "❌",
  tedavi_ozeti: "💊", tahlil_sonucu: "🔬", mesaj: "💬",
  egitmen_onay: "👨‍⚕️", sistem: "⚙️", kvkk: "🔒",
};

export default function BildirimPage() {
  const { data: bildirimler, loading, refetch } = useApi<Bildirim[]>("/api/bildirim");
  const { mutate } = useApiMutation();

  async function markRead(id: string) {
    await mutate(`/api/bildirim/${id}/read`, {}, "PATCH");
    refetch();
  }

  const items = bildirimler ?? [];
  const okunmamis = items.filter((b) => !b.isRead);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold">
          Bildirimler {okunmamis.length > 0 && <span className="text-sm text-amber-600">({okunmamis.length} yeni)</span>}
        </h1>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Yukleniyor...</p>
      ) : items.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Bildiriminiz bulunmuyor.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {items.map((b) => (
            <Card key={b.id} className={b.isRead ? "opacity-60" : "border-primary/30"}>
              <CardContent className="flex items-start gap-3 py-3">
                <span className="text-xl mt-0.5">{typeIcon[b.type] || "🔔"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`text-sm ${b.isRead ? "" : "font-medium"}`}>{b.title}</p>
                      {b.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{b.body}</p>}
                    </div>
                    {!b.isRead && (
                      <Button size="sm" variant="ghost" className="h-6 text-xs shrink-0" onClick={() => markRead(b.id)}>
                        Okundu
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(b.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
