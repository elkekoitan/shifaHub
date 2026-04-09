"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApi, useApiMutation } from "@/hooks/use-api";

interface DanisanItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Complaint {
  description: string;
  priority: string;
  treatmentMethod: string;
  estimatedSessions: number;
  sessionInterval: string;
}

interface Protocol {
  id: string;
  title: string;
  status: string;
  complaints: Complaint[];
  supportingTreatments: string;
  notes: string;
  createdAt: string;
}

const PRIORITY_OPTIONS = [
  { value: "1", label: "1 - Acil" },
  { value: "2", label: "2 - Yuksek" },
  { value: "3", label: "3 - Normal" },
  { value: "4", label: "4 - Takip" },
];

const TREATMENT_METHODS = [
  { value: "hacamat_kuru", label: "Hacamat (Kuru)" },
  { value: "hacamat_yas", label: "Hacamat (Yas)" },
  { value: "solucan", label: "Solucan Tedavisi" },
  { value: "sujok", label: "Sujok" },
  { value: "refleksoloji", label: "Refleksoloji" },
  { value: "akupunktur", label: "Akupunktur" },
  { value: "fitoterapi", label: "Fitoterapi" },
];

const SESSION_INTERVALS = [
  { value: "haftalik", label: "Haftalik" },
  { value: "2_haftalik", label: "2 Haftalik" },
  { value: "aylik", label: "Aylik" },
];

const PRIORITY_COLORS: Record<string, string> = {
  "1": "bg-red-100 text-red-800",
  "2": "bg-orange-100 text-orange-800",
  "3": "bg-blue-100 text-blue-800",
  "4": "bg-gray-100 text-gray-800",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Aktif",
  completed: "Tamamlandi",
  cancelled: "Iptal",
  draft: "Taslak",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800",
  draft: "bg-gray-100 text-gray-800",
};

function emptyComplaint(): Complaint {
  return {
    description: "",
    priority: "3",
    treatmentMethod: "hacamat_kuru",
    estimatedSessions: 1,
    sessionInterval: "haftalik",
  };
}

export default function EgitmenProtokolPage() {
  const [selectedDanisan, setSelectedDanisan] = useState("");
  const [title, setTitle] = useState("");
  const [complaints, setComplaints] = useState<Complaint[]>([emptyComplaint()]);
  const [supportingTreatments, setSupportingTreatments] = useState("");
  const [notes, setNotes] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data: danisanList, loading: danisanLoading } = useApi<DanisanItem[]>("/api/danisan/list");
  const {
    data: protocols,
    loading: protocolsLoading,
    refetch,
  } = useApi<Protocol[]>(`/api/protokol/danisan/${selectedDanisan}`, { skip: !selectedDanisan });
  const { mutate, loading: saving, error: saveError } = useApiMutation();

  function updateComplaint(index: number, field: keyof Complaint, value: string | number) {
    setComplaints((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  }

  function removeComplaint(index: number) {
    if (complaints.length <= 1) return;
    setComplaints((prev) => prev.filter((_, i) => i !== index));
  }

  function resetForm() {
    setTitle("");
    setComplaints([emptyComplaint()]);
    setSupportingTreatments("");
    setNotes("");
    setShowForm(false);
  }

  async function handleSubmit() {
    if (!selectedDanisan || !title || complaints.some((c) => !c.description)) return;
    const result = await mutate("/api/protokol", {
      danisanId: selectedDanisan,
      title,
      complaints,
      supportingTreatments,
      notes,
    });
    if (result) {
      resetForm();
      refetch();
    }
  }

  const protocolList = protocols ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Tedavi Protokolleri</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Formu Kapat" : "Yeni Protokol"}
        </Button>
      </div>

      {/* Danisan secimi */}
      <Card>
        <CardContent className="pt-4">
          <Label className="mb-2 block">Danisan Seciniz</Label>
          {danisanLoading ? (
            <p className="text-sm text-muted-foreground">Danisanlar yukleniyor...</p>
          ) : (
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              value={selectedDanisan}
              onChange={(e) => setSelectedDanisan(e.target.value)}
            >
              <option value="">-- Danisan Seciniz --</option>
              {(danisanList ?? []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.firstName} {d.lastName} ({d.email})
                </option>
              ))}
            </select>
          )}
        </CardContent>
      </Card>

      {/* Yeni protokol formu */}
      {showForm && selectedDanisan && (
        <Card>
          <CardHeader>
            <CardTitle>Yeni Tedavi Protokolu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Protokol basligi */}
            <div className="space-y-2">
              <Label>Protokol Basligi</Label>
              <Input
                placeholder="Orn: Bel Agrisi Tedavi Plani"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Sikayetler */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Sikayetler</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setComplaints((prev) => [...prev, emptyComplaint()])}
                >
                  Sikayet Ekle
                </Button>
              </div>

              {complaints.map((complaint, index) => (
                <Card key={index} className="border-dashed">
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Sikayet {index + 1}
                      </span>
                      {complaints.length > 1 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700 h-7 px-2"
                          onClick={() => removeComplaint(index)}
                        >
                          Kaldir
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Sikayet Aciklamasi</Label>
                      <Input
                        placeholder="Sikayeti aciklayiniz..."
                        value={complaint.description}
                        onChange={(e) => updateComplaint(index, "description", e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Oncelik</Label>
                        <select
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                          value={complaint.priority}
                          onChange={(e) => updateComplaint(index, "priority", e.target.value)}
                        >
                          {PRIORITY_OPTIONS.map((p) => (
                            <option key={p.value} value={p.value}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>Tedavi Yontemi</Label>
                        <select
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                          value={complaint.treatmentMethod}
                          onChange={(e) =>
                            updateComplaint(index, "treatmentMethod", e.target.value)
                          }
                        >
                          {TREATMENT_METHODS.map((m) => (
                            <option key={m.value} value={m.value}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>Tahmini Seans Sayisi</Label>
                        <Input
                          type="number"
                          min={1}
                          max={50}
                          value={complaint.estimatedSessions}
                          onChange={(e) =>
                            updateComplaint(index, "estimatedSessions", Number(e.target.value) || 1)
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Seans Araligi</Label>
                        <select
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                          value={complaint.sessionInterval}
                          onChange={(e) =>
                            updateComplaint(index, "sessionInterval", e.target.value)
                          }
                        >
                          {SESSION_INTERVALS.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Destekleyici tedaviler */}
            <div className="space-y-2">
              <Label>Destekleyici Tedaviler</Label>
              <textarea
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[80px]"
                placeholder="Bitkisel destek, beslenme onerileri, egzersiz vb..."
                value={supportingTreatments}
                onChange={(e) => setSupportingTreatments(e.target.value)}
              />
            </div>

            {/* Notlar */}
            <div className="space-y-2">
              <Label>Notlar</Label>
              <textarea
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[80px]"
                placeholder="Ek notlar..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {saveError && <p className="text-sm text-red-500 text-center">{saveError}</p>}

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={
                saving || !title || !selectedDanisan || complaints.some((c) => !c.description)
              }
            >
              {saving ? "Kaydediliyor..." : "Protokolu Kaydet"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Mevcut protokoller */}
      {selectedDanisan && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Mevcut Protokoller</h2>
          {protocolsLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Yukleniyor...</p>
          ) : protocolList.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Bu danisan icin henuz protokol olusturulmamis.
              </CardContent>
            </Card>
          ) : (
            protocolList.map((protocol) => (
              <Card key={protocol.id}>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="font-semibold text-base">{protocol.title}</h3>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${STATUS_COLORS[protocol.status] || "bg-gray-100"}`}
                      >
                        {STATUS_LABELS[protocol.status] || protocol.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {(protocol.complaints ?? []).map((c, i) => (
                      <div
                        key={i}
                        className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 bg-muted/50 rounded-md"
                      >
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full shrink-0 ${PRIORITY_COLORS[c.priority] || "bg-gray-100"}`}
                        >
                          {PRIORITY_OPTIONS.find((p) => p.value === c.priority)?.label ||
                            `Oncelik ${c.priority}`}
                        </span>
                        <span className="text-sm flex-1">{c.description}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {TREATMENT_METHODS.find((m) => m.value === c.treatmentMethod)?.label ||
                            c.treatmentMethod}
                          {" | "}
                          {c.estimatedSessions} seans
                        </span>
                      </div>
                    ))}
                  </div>

                  {protocol.supportingTreatments && (
                    <div>
                      <p className="text-xs text-muted-foreground">Destekleyici Tedaviler:</p>
                      <p className="text-sm">{protocol.supportingTreatments}</p>
                    </div>
                  )}

                  {protocol.notes && (
                    <div>
                      <p className="text-xs text-muted-foreground">Notlar:</p>
                      <p className="text-sm">{protocol.notes}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      {new Date(protocol.createdAt).toLocaleDateString("tr-TR")}
                    </p>
                    <div className="flex gap-2">
                      {protocol.status === "active" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={async () => {
                              await mutate(
                                `/api/protokol/${protocol.id}`,
                                { status: "paused" },
                                "PUT",
                              );
                              refetch();
                            }}
                          >
                            Duraklat
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs text-green-700 border-green-300"
                            onClick={async () => {
                              await mutate(
                                `/api/protokol/${protocol.id}`,
                                { status: "completed" },
                                "PUT",
                              );
                              refetch();
                            }}
                          >
                            Tamamlandi
                          </Button>
                        </>
                      )}
                      {protocol.status === "paused" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={async () => {
                            await mutate(
                              `/api/protokol/${protocol.id}`,
                              { status: "active" },
                              "PUT",
                            );
                            refetch();
                          }}
                        >
                          Devam Ettir
                        </Button>
                      )}
                      {protocol.status === "draft" && (
                        <Button
                          size="sm"
                          className="h-7 text-xs"
                          onClick={async () => {
                            await mutate(
                              `/api/protokol/${protocol.id}`,
                              { status: "active" },
                              "PUT",
                            );
                            refetch();
                          }}
                        >
                          Aktif Et
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
