"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApi, useApiMutation } from "@/hooks/use-api";
import { useAuth } from "@/providers/auth-provider";

const COMMON_TESTS = [
  "Hemogram (Tam Kan Sayimi)",
  "Biyokimya Paneli",
  "Tiroid Fonksiyon (TSH, T3, T4)",
  "Vitamin D",
  "Vitamin B12",
  "Demir / Ferritin",
  "Karaciger Fonksiyon (ALT, AST)",
  "Bobrek Fonksiyon (BUN, Kreatinin)",
  "Lipid Profili (Kolesterol, Trigliserit)",
  "HbA1c (Seker)",
  "CRP / Sedimentasyon",
  "Tam Idrar Tahlili",
];

type TahlilItem = {
  id: string;
  testType: string;
  testDate: string;
  labName: string;
  notes: string;
  fileUrl: string;
  createdAt: string;
};

export default function DanisanTahlilPage() {
  const [showForm, setShowForm] = useState(false);
  const [testType, setTestType] = useState("");
  const [testDate, setTestDate] = useState("");
  const [labName, setLabName] = useState("");
  const [notes, setNotes] = useState("");
  const { user } = useAuth();
  const { mutate, loading: saving, error: saveError } = useApiMutation();
  const { data: tahlilList, loading, error, refetch } = useApi<TahlilItem[]>(
    `/api/tahlil/danisan/${user?.id}`,
    { skip: !user?.id },
  );

  async function handleSubmit() {
    const result = await mutate("/api/tahlil", {
      testType,
      testDate,
      labName,
      notes,
      danisanId: user?.id,
    });
    if (result) {
      setTestType("");
      setTestDate("");
      setLabName("");
      setNotes("");
      setShowForm(false);
      refetch();
    }
  }

  const items = tahlilList ?? [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Tahlillerim</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Kapat" : "Yeni Tahlil Ekle"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Tahlil Kaydi Ekle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tahlil Tipi</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={testType}
                  onChange={(e) => setTestType(e.target.value)}
                >
                  <option value="">Seciniz</option>
                  {COMMON_TESTS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Tahlil Tarihi</Label>
                <Input type="date" value={testDate} onChange={(e) => setTestDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Laboratuvar</Label>
              <Input placeholder="Lab adi (opsiyonel)" value={labName} onChange={(e) => setLabName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tahlil Dosyasi (PDF/Gorsel)</Label>
              <Input type="file" accept=".pdf,.jpg,.jpeg,.png" />
            </div>
            <div className="space-y-2">
              <Label>Notlar</Label>
              <textarea className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[60px]" placeholder="Ek notlar..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            {saveError && (
              <p className="text-sm text-red-500 text-center">{saveError}</p>
            )}
            <Button className="w-full" onClick={handleSubmit} disabled={saving || !testType || !testDate}>
              {saving ? "Kaydediliyor..." : "Tahlili Kaydet"}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Tahlil Gecmisi</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Yukleniyor...</p>
          ) : error ? (
            <p className="text-sm text-red-500 text-center py-8">{error}</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Henuz tahlil kaydiniz bulunmuyor.
            </p>
          ) : (
            <div className="space-y-3">
              {items.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between border rounded-lg p-3"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{t.testType}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(t.testDate).toLocaleDateString("tr-TR")}
                      {t.labName ? ` - ${t.labName}` : ""}
                    </p>
                    {t.notes && (
                      <p className="text-xs text-muted-foreground">{t.notes}</p>
                    )}
                  </div>
                  {t.fileUrl && (
                    <a
                      href={t.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Dosyayi Gor
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
