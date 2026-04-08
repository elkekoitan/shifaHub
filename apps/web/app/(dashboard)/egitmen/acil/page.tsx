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
  danisanId: string;
  tedaviId?: string;
  followUp24h?: string;
  followUp48h?: string;
  followUp1w?: string;
  resolution?: string;
  createdAt: string;
}

export default function EgitmenAcilPage() {
  const [severity, setSeverity] = useState("1");
  const [danisanId, setDanisanId] = useState("");
  const [tedaviId, setTedaviId] = useState("");
  const [followupId, setFollowupId] = useState("");
  const [followupPeriod, setFollowupPeriod] = useState<"24h" | "48h" | "1w">("24h");
  const [followupNote, setFollowupNote] = useState("");
  const [resolveId, setResolveId] = useState("");
  const [resolution, setResolution] = useState("");

  const { data: komplikasyonlar, loading, refetch } = useApi<Komplikasyon[]>("/api/acil");
  const { data: danisanlar } =
    useApi<Array<{ userId: string; firstName: string; lastName: string }>>("/api/danisan/list");
  const { mutate, loading: submitting } = useApiMutation();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!danisanId) return;
    const fd = new FormData(e.currentTarget);
    await mutate("/api/acil", {
      severity,
      type: fd.get("type"),
      description: fd.get("description"),
      danisanId,
      tedaviId: tedaviId || undefined,
    });
    refetch();
    setDanisanId("");
    setTedaviId("");
    setSeverity("1");
    (e.target as HTMLFormElement).reset();
  }

  async function handleFollowup() {
    if (!followupId || !followupNote.trim()) return;
    await mutate(
      `/api/acil/${followupId}/followup`,
      { period: followupPeriod, note: followupNote },
      "PATCH",
    );
    setFollowupId("");
    setFollowupNote("");
    refetch();
  }

  async function handleResolve() {
    if (!resolveId || !resolution.trim()) return;
    await mutate(`/api/acil/${resolveId}/resolve`, { resolution }, "PATCH");
    setResolveId("");
    setResolution("");
    refetch();
  }

  const openKomplikasyonlar = (komplikasyonlar ?? []).filter((k) => k.status !== "resolved");
  const resolvedKomplikasyonlar = (komplikasyonlar ?? []).filter((k) => k.status === "resolved");

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
              <Label>Danisan</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={danisanId}
                onChange={(e) => setDanisanId(e.target.value)}
                required
              >
                <option value="">Danisan seciniz</option>
                {(danisanlar ?? []).map((d) => (
                  <option key={d.userId} value={d.userId}>
                    {d.firstName} {d.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Ciddiyet Seviyesi</Label>
              <div className="grid grid-cols-5 gap-2">
                {SEVERITY_LABELS.map((s) => (
                  <button
                    key={s.level}
                    type="button"
                    onClick={() => setSeverity(s.level)}
                    className={`p-3 rounded-lg text-center transition-all ${severity === s.level ? s.color + " ring-2 ring-offset-1" : "bg-muted hover:bg-accent"}`}
                  >
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
              <textarea
                name="description"
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[120px]"
                placeholder="Komplikasyonun detayli aciklamasi..."
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700"
              disabled={submitting || !danisanId}
            >
              {submitting ? "Raporlaniyor..." : "Komplikasyon Raporla"}
            </Button>
          </CardContent>
        </form>
      </Card>

      {/* Acik Komplikasyonlar */}
      <Card>
        <CardHeader>
          <CardTitle>Acik Komplikasyonlar ({openKomplikasyonlar.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-4">Yukleniyor...</p>
          ) : openKomplikasyonlar.length > 0 ? (
            <div className="space-y-3">
              {openKomplikasyonlar.map((k) => {
                const sev = SEVERITY_LABELS.find((s) => s.level === k.severity);
                return (
                  <div key={k.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full ${sev?.color || "bg-gray-100"}`}
                        >
                          Seviye {k.severity} - {sev?.label}
                        </span>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800">
                          {k.status === "following" ? "Takipte" : "Acik"}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(k.createdAt).toLocaleDateString("tr-TR")}
                      </span>
                    </div>
                    <p className="font-medium">{k.type}</p>
                    <p className="text-sm text-muted-foreground">{k.description}</p>

                    {/* Takip notlari */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div
                        className={`p-2 rounded ${k.followUp24h ? "bg-green-50" : "bg-muted/50"}`}
                      >
                        <p className="font-medium">24 Saat</p>
                        <p className="text-muted-foreground">{k.followUp24h || "Bekliyor"}</p>
                      </div>
                      <div
                        className={`p-2 rounded ${k.followUp48h ? "bg-green-50" : "bg-muted/50"}`}
                      >
                        <p className="font-medium">48 Saat</p>
                        <p className="text-muted-foreground">{k.followUp48h || "Bekliyor"}</p>
                      </div>
                      <div
                        className={`p-2 rounded ${k.followUp1w ? "bg-green-50" : "bg-muted/50"}`}
                      >
                        <p className="font-medium">1 Hafta</p>
                        <p className="text-muted-foreground">{k.followUp1w || "Bekliyor"}</p>
                      </div>
                    </div>

                    {/* Takip notu ekle */}
                    {followupId === k.id ? (
                      <div className="flex gap-2 items-end">
                        <select
                          className="flex h-9 rounded-md border border-input bg-transparent px-2 py-1 text-sm w-24"
                          value={followupPeriod}
                          onChange={(e) =>
                            setFollowupPeriod(e.target.value as "24h" | "48h" | "1w")
                          }
                        >
                          <option value="24h">24 Saat</option>
                          <option value="48h">48 Saat</option>
                          <option value="1w">1 Hafta</option>
                        </select>
                        <Input
                          placeholder="Takip notu..."
                          value={followupNote}
                          onChange={(e) => setFollowupNote(e.target.value)}
                          className="flex-1"
                        />
                        <Button size="sm" onClick={handleFollowup} disabled={!followupNote.trim()}>
                          Kaydet
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setFollowupId("")}>
                          Iptal
                        </Button>
                      </div>
                    ) : resolveId === k.id ? (
                      <div className="flex gap-2 items-end">
                        <Input
                          placeholder="Cozum aciklamasi..."
                          value={resolution}
                          onChange={(e) => setResolution(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          size="sm"
                          onClick={handleResolve}
                          disabled={!resolution.trim()}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Coz
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setResolveId("")}>
                          Iptal
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setFollowupId(k.id);
                            setResolveId("");
                          }}
                        >
                          Takip Notu Ekle
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-700 border-green-300"
                          onClick={() => {
                            setResolveId(k.id);
                            setFollowupId("");
                          }}
                        >
                          Cozuldu Olarak Isaretle
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Acik komplikasyon bulunmuyor.</p>
          )}
        </CardContent>
      </Card>

      {/* Cozulmus */}
      {resolvedKomplikasyonlar.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cozulmus Komplikasyonlar ({resolvedKomplikasyonlar.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {resolvedKomplikasyonlar.map((k) => {
                const sev = SEVERITY_LABELS.find((s) => s.level === k.severity);
                return (
                  <div
                    key={k.id}
                    className="flex items-center justify-between p-3 border rounded-lg opacity-75"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full ${sev?.color || "bg-gray-100"}`}
                        >
                          Seviye {k.severity}
                        </span>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">
                          Cozuldu
                        </span>
                      </div>
                      <p className="font-medium text-sm">{k.type}</p>
                      {k.resolution && (
                        <p className="text-xs text-muted-foreground">Cozum: {k.resolution}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(k.createdAt).toLocaleDateString("tr-TR")}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
