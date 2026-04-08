"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

export default function DanisanTahlilPage() {
  const [showForm, setShowForm] = useState(false);

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
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  <option value="">Seciniz</option>
                  {COMMON_TESTS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Tahlil Tarihi</Label>
                <Input type="date" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Laboratuvar</Label>
              <Input placeholder="Lab adi (opsiyonel)" />
            </div>
            <div className="space-y-2">
              <Label>Tahlil Dosyasi (PDF/Gorsel)</Label>
              <Input type="file" accept=".pdf,.jpg,.jpeg,.png" />
            </div>
            <div className="space-y-2">
              <Label>Notlar</Label>
              <textarea className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[60px]" placeholder="Ek notlar..." />
            </div>
            <Button className="w-full">Tahlili Kaydet</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Tahlil Gecmisi</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Henuz tahlil kaydiniz bulunmuyor.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
