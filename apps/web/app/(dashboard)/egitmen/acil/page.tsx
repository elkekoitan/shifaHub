"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SEVERITY_LABELS = [
  { level: "1", label: "Hafif", color: "bg-blue-100 text-blue-800", desc: "Kayit + bilgilendirme" },
  { level: "2", label: "Orta", color: "bg-yellow-100 text-yellow-800", desc: "Kayit + bilgilendirme" },
  { level: "3", label: "Ciddi", color: "bg-orange-100 text-orange-800", desc: "+ Sorumlu tabip bildirim" },
  { level: "4", label: "Agir", color: "bg-red-100 text-red-800", desc: "+ Admin acil bildirim" },
  { level: "5", label: "Kritik", color: "bg-red-200 text-red-900", desc: "+ 112 + Bakanlik raporu" },
];

export default function EgitmenAcilPage() {
  const [severity, setSeverity] = useState("1");
  const [isLoading] = useState(false);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-red-600">Komplikasyon Raporlama</h1>

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle>Yeni Komplikasyon Raporu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Ciddiyet Seviyesi</Label>
            <div className="grid grid-cols-5 gap-2">
              {SEVERITY_LABELS.map((s) => (
                <button
                  key={s.level}
                  type="button"
                  onClick={() => setSeverity(s.level)}
                  className={`p-3 rounded-lg text-center transition-all ${
                    severity === s.level ? s.color + " ring-2 ring-offset-1" : "bg-muted hover:bg-accent"
                  }`}
                >
                  <p className="text-lg font-bold">{s.level}</p>
                  <p className="text-xs font-medium">{s.label}</p>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {SEVERITY_LABELS.find((s) => s.level === severity)?.desc}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Komplikasyon Tipi</Label>
            <Input placeholder="Ornek: Kanama, enfeksiyon, reaksiyon..." />
          </div>

          <div className="space-y-2">
            <Label>Detayli Aciklama</Label>
            <textarea
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[120px]"
              placeholder="Komplikasyonun detayli aciklamasi, belirtiler, alinan onlemler..."
            />
          </div>

          <div className="space-y-2">
            <Label>Foto Ekle</Label>
            <Input type="file" accept="image/*" multiple />
          </div>

          <Button className="w-full bg-red-600 hover:bg-red-700" disabled={isLoading}>
            {isLoading ? "Raporlaniyor..." : "Komplikasyon Raporla"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Acik Komplikasyonlar</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Acik komplikasyon raporu bulunmuyor.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
