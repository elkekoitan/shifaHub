"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApiMutation } from "@/hooks/use-api";

export default function AdminBildirimGonderPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState("all");
  const [sent, setSent] = useState(false);
  const [resultMsg, setResultMsg] = useState("");
  const { mutate, loading, error } = useApiMutation();

  async function handleSend() {
    if (!title.trim() || !body.trim()) return;
    const result = await mutate("/api/admin/bildirim/toplu", { title, body, target }) as { message?: string } | null;
    if (result) {
      setSent(true);
      setResultMsg(result.message || "Bildirim gonderildi");
      setTitle("");
      setBody("");
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">Toplu Bildirim Gonder</h1>

      {sent && <div className="p-3 text-sm text-green-700 bg-green-50 rounded-lg">{resultMsg}</div>}
      {error && <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg">{error}</div>}

      <Card>
        <CardHeader><CardTitle>Bildirim Icerigi</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Baslik</Label>
            <Input value={title} onChange={(e) => { setTitle(e.target.value); setSent(false); }} placeholder="Bildirim basligi" />
          </div>
          <div className="space-y-2">
            <Label>Icerik</Label>
            <textarea className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[100px]"
              value={body} onChange={(e) => { setBody(e.target.value); setSent(false); }} placeholder="Bildirim icerigi..." />
          </div>
          <div className="space-y-2">
            <Label>Hedef Kitle</Label>
            <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="all">Tum Kullanicilar</option>
              <option value="danisan">Sadece Danisanlar</option>
              <option value="egitmen">Sadece Egitmenler</option>
            </select>
          </div>
          <Button onClick={handleSend} disabled={loading || !title.trim() || !body.trim()} className="w-full">
            {loading ? "Gonderiliyor..." : "Bildirim Gonder"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
