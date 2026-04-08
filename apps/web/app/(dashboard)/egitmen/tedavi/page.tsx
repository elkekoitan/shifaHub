"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TREATMENT_TYPES = [
  { value: "hacamat_kuru", label: "Kuru Hacamat" },
  { value: "hacamat_yas", label: "Yas Hacamat" },
  { value: "solucan", label: "Solucan (Hirudoterapi)" },
  { value: "sujok", label: "Sujok Terapi" },
  { value: "refleksoloji", label: "Refleksoloji" },
  { value: "akupunktur", label: "Akupunktur" },
  { value: "fitoterapi", label: "Fitoterapi" },
];

export default function EgitmenTedaviPage() {
  const [isLoading] = useState(false);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tedavi Kaydi Olustur</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tedavi Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tedavi Tipi</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                <option value="">Seciniz</option>
                {TREATMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Tedavi Tarihi</Label>
              <Input type="datetime-local" defaultValue={new Date().toISOString().slice(0, 16)} />
            </div>

            <div className="space-y-2">
              <Label>Seans No</Label>
              <Input type="number" defaultValue="1" min="1" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sikayetler (Oncelik Sirali)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-2 items-start">
                <span className="mt-2 text-sm font-bold text-primary w-6">{i}.</span>
                <Input placeholder={`Sikayet ${i} (opsiyonel)`} className="flex-1" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bulgular ve Vital</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tansiyon</Label>
                <Input placeholder="120/80" />
              </div>
              <div className="space-y-2">
                <Label>Nabiz</Label>
                <Input type="number" placeholder="72" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Bulgular</Label>
              <textarea className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[100px]" placeholder="Muayene bulgulari..." />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Uygulanan Tedavi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tedavi Detayi</Label>
              <textarea className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[100px]" placeholder="Uygulanan tedavi detaylari..." />
            </div>
            <div className="space-y-2">
              <Label>Oneriler</Label>
              <textarea className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[60px]" placeholder="Danisana oneriler..." />
            </div>
            <div className="space-y-2">
              <Label>Sonraki Seans Tarihi</Label>
              <Input type="date" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Button className="w-full" size="lg" disabled={isLoading}>
        {isLoading ? "Kaydediliyor..." : "Tedavi Kaydini Kaydet"}
      </Button>
    </div>
  );
}
