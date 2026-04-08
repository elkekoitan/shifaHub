"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApi, useApiMutation } from "@/hooks/use-api";
import { useAuth } from "@/providers/auth-provider";

interface Egitmen {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  clinicName: string;
}

interface Mesaj {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export default function DanisanMesajPage() {
  const { user } = useAuth();
  const [selectedEgitmen, setSelectedEgitmen] = useState<Egitmen | null>(null);
  const [message, setMessage] = useState("");

  const { data: egitmenler } = useApi<Egitmen[]>("/api/egitmen/search");
  const { data: mesajlar, refetch } = useApi<Mesaj[]>(
    selectedEgitmen ? `/api/mesaj/${selectedEgitmen.userId}` : "/api/bildirim",
    { skip: !selectedEgitmen },
  );
  const { mutate, loading: sending } = useApiMutation();

  async function handleSend() {
    if (!message.trim() || !selectedEgitmen) return;
    await mutate("/api/mesaj", { receiverId: selectedEgitmen.userId, content: message.trim() });
    setMessage("");
    refetch();
  }

  const conversations = egitmenler ?? [];
  const messages = mesajlar ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-xl sm:text-2xl font-bold">Mesajlar</h1>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Konusma listesi */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Egitmenler</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {conversations.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">Egitmen bulunamadi</p>
            ) : conversations.map((e) => (
              <button
                key={e.id}
                onClick={() => setSelectedEgitmen(e)}
                className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${
                  selectedEgitmen?.id === e.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
                }`}
              >
                <p className="font-medium">{e.firstName} {e.lastName}</p>
                <p className="text-xs text-muted-foreground">{e.clinicName || "-"}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Mesaj alani */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              {selectedEgitmen ? `${selectedEgitmen.firstName} ${selectedEgitmen.lastName}` : "Bir egitmen secin"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="min-h-[250px] max-h-[400px] overflow-y-auto border rounded-lg p-3 bg-muted/20 space-y-2">
              {!selectedEgitmen ? (
                <p className="text-sm text-muted-foreground text-center pt-20">Sol taraftan bir egitmen secerek mesajlasmaya baslayin</p>
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
            {selectedEgitmen && (
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
