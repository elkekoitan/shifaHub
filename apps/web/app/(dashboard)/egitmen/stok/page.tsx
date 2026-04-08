"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApi } from "@/hooks/use-api";

const CATEGORIES = [
  { value: "kupa", label: "Kupalar" },
  { value: "suluk", label: "Tibbi Sulukler" },
  { value: "sarf", label: "Sarf Malzeme" },
  { value: "bitkisel", label: "Bitkisel Urunler" },
  { value: "igne", label: "Akupunktur Igneleri" },
  { value: "diger", label: "Diger" },
];

const categoryLabel = (val: string) =>
  CATEGORIES.find((c) => c.value === val)?.label ?? val;

type StokItem = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minimumLevel: number;
  unitPrice: number;
  expiryDate: string;
};

export default function EgitmenStokPage() {
  const [showForm, setShowForm] = useState(false);
  const { data: stokList, loading, error } = useApi<StokItem[]>("/api/stok");

  const items = stokList ?? [];
  const kritikCount = items.filter((s) => s.quantity <= s.minimumLevel).length;
  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const expiringCount = items.filter(
    (s) => s.expiryDate && new Date(s.expiryDate) <= thirtyDaysLater,
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Stok Yonetimi</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Kapat" : "Yeni Malzeme Ekle"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Toplam Kalem</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{items.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Kritik Stok</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{kritikCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Son Kullanma Yaklasan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{expiringCount}</p>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Yeni Malzeme Ekle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Malzeme Adi</Label>
                <Input placeholder="Ornek: Cam Kupa 5cm" />
              </div>
              <div className="space-y-2">
                <Label>Kategori</Label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Miktar</Label>
                <Input type="number" placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Birim</Label>
                <Input placeholder="adet" />
              </div>
              <div className="space-y-2">
                <Label>Minimum Seviye</Label>
                <Input type="number" placeholder="5" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Birim Fiyat (TL)</Label>
                <Input type="number" step="0.01" placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Son Kullanma Tarihi</Label>
                <Input type="date" />
              </div>
            </div>
            <Button className="w-full">Malzeme Ekle</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Stok Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Yukleniyor...</p>
          ) : error ? (
            <p className="text-sm text-red-500 text-center py-8">{error}</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Henuz stok kaydi bulunmuyor.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium">Malzeme</th>
                    <th className="pb-2 font-medium">Kategori</th>
                    <th className="pb-2 font-medium">Miktar</th>
                    <th className="pb-2 font-medium">Birim</th>
                    <th className="pb-2 font-medium">Min. Seviye</th>
                    <th className="pb-2 font-medium">Birim Fiyat</th>
                    <th className="pb-2 font-medium">SKT</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const isLow = item.quantity <= item.minimumLevel;
                    return (
                      <tr
                        key={item.id}
                        className={`border-b ${isLow ? "bg-red-50 text-red-700" : ""}`}
                      >
                        <td className="py-2 font-medium">{item.name}</td>
                        <td className="py-2">{categoryLabel(item.category)}</td>
                        <td className={`py-2 ${isLow ? "font-bold" : ""}`}>{item.quantity}</td>
                        <td className="py-2">{item.unit}</td>
                        <td className="py-2">{item.minimumLevel}</td>
                        <td className="py-2">{item.unitPrice?.toFixed(2)} TL</td>
                        <td className="py-2">
                          {item.expiryDate
                            ? new Date(item.expiryDate).toLocaleDateString("tr-TR")
                            : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
