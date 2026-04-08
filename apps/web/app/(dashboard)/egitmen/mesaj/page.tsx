"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApi, useApiMutation } from "@/hooks/use-api";
import { useAuth } from "@/providers/auth-provider";

interface Danisan {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
}

interface Mesaj {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export default function EgitmenMesajPage() {
  const { user } = useAuth();
  const [selectedDanisan, setSelectedDanisan] = useState<Danisan | null>(null);
  const [message, setMessage] = useState("");

  const { data: danisanlar } = useApi<Danisan[]>("/api/egitmen/danisanlar");
  const { data: mesajlar, refetch } = useApi<Mesaj[]>(
    selectedDanisan ? `/api/mesaj/${selectedDanisan.userId}` : "/api/bildirim",
    { skip: !selectedDanisan },
  );
  const { mutate, loading: sending } = useApiMutation();

  async function handleSend() {
    if (!message.trim() || !selectedDanisan) return;
    await mutate("/api/mesaj", { receiverId: selectedDanisan.userId, content: message.trim() });
    setMessage("");
    refetch();
  }

  const conversations = danisanlar ?? [];
  const messages = mesajlar ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-xl sm:text-2xl font-bold">Mesajlar</h1>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Konusma listesi */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Danisanlar</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {conversations.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">Danisan bulunamadi</p>
            ) : conversations.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDanisan(d)}
                className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${
                  selectedDanisan?.id === d.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
                }`}
              >
                <p className="font-medium">{d.firstName} {d.lastName}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Mesaj alani */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              {selectedDanisan ? `${selectedDanisan.firstName} ${selectedDanisan.lastName}` : "Bir danisan secin"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="min-h-[250px] max-h-[400px] overflow-y-auto border rounded-lg p-3 bg-muted/20 space-y-2">
              {!selectedDanisan ? (
                <p className="text-sm text-muted-foreground text-center pt-20">Sol taraftan bir danisan secerek mesajlasmaya baslayin</p>
              ) : messages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center pt-20">Henuz mesaj yok. Ilk mesaji siz gonderin!</p>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className={`flex ${m.senderId === user?.id ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                      m.senderId === user?.id ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}>
                      <p>{m.content}</p>
                      <p className={`text-xs mt-1 ${m.senderId === user?.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {new Date(m.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            {selectedDanisan && (
              <div className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Mesajinizi yazin..."
                  className="flex-1"
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <Button onClick={handleSend} disabled={sending || !message.trim()}>
                  {sending ? "..." : "Gonder"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
