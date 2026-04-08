"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApi, useApiMutation } from "@/hooks/use-api";

const SEVERITY_LABELS = [
  { level: "1", label: "Hafif", color: "bg-blue-100 text-blue-800" },
  { level: "2", label: "Orta", color: "bg-yellow-100 text-yellow-800" },
  { level: "3", label: "Ciddi", color: "bg-orange-100 text-orange-800" },
  { level: "4", label: "Agir", color: "bg-red-100 text-red-800" },
  { level: "5", label: "Kritik", color: "bg-red-200 text-red-900" },
];

interface Komplikasyon {
  id: string;
  severity: string;
  type: string;
  description: string;
  status: string;
  createdAt: string;
}

export default function EgitmenAcilPage() {
  const [severity, setSeverity] = useState("1");
  const { data: komplikasyonlar, loading, refetch } = useApi<Komplikasyon[]>("/api/acil");
  const { mutate, loading: submitting } = useApiMutation();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await mutate("/api/acil", {
      severity,
      type: fd.get("type"),
      description: fd.get("description"),
      danisanId: "00000000-0000-0000-0000-000000000000",
    });
    refetch();
    (e.target as HTMLFormElement).reset();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-red-600">Komplikasyon Raporlama</h1>

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle>Yeni Komplikasyon Raporu</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Ciddiyet Seviyesi</Label>
              <div className="grid grid-cols-5 gap-2">
                {SEVERITY_LABELS.map((s) => (
                  <button key={s.level} type="button" onClick={() => setSeverity(s.level)}
                    className={`p-3 rounded-lg text-center transition-all ${severity === s.level ? s.color + " ring-2 ring-offset-1" : "bg-muted hover:bg-accent"}`}>
                    <p className="text-lg font-bold">{s.level}</p>
                    <p className="text-xs font-medium">{s.label}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Komplikasyon Tipi</Label>
              <Input name="type" placeholder="Ornek: Kanama, enfeksiyon, reaksiyon..." required />
            </div>
            <div className="space-y-2">
              <Label>Detayli Aciklama</Label>
              <textarea name="description" className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[120px]"
                placeholder="Komplikasyonun detayli aciklamasi..." required />
            </div>
            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={submitting}>
              {submitting ? "Raporlaniyor..." : "Komplikasyon Raporla"}
            </Button>
          </CardContent>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Komplikasyon Gecmisi</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-4">Yukleniyor...</p>
          ) : komplikasyonlar && komplikasyonlar.length > 0 ? (
            <div className="space-y-3">
              {komplikasyonlar.map((k) => {
                const sev = SEVERITY_LABELS.find((s) => s.level === k.severity);
                return (
                  <div key={k.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${sev?.color || "bg-gray-100"}`}>
                          Seviye {k.severity}
                        </span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${k.status === "resolved" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                          {k.status === "resolved" ? "Cozuldu" : "Acik"}
                        </span>
                      </div>
                      <p className="font-medium">{k.type}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{k.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(k.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Komplikasyon raporu bulunmuyor.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
