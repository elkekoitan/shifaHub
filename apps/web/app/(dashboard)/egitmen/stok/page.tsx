"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/layout/stat-card";
import { EmptyState } from "@/components/layout/empty-state";
import { useApi, useApiMutation } from "@/hooks/use-api";
import { Package, AlertTriangle, Clock, PackageOpen } from "lucide-react";

const CATEGORIES = [
  { value: "kupa", label: "Kupalar" },
  { value: "suluk", label: "Tibbi Sulukler" },
  { value: "sarf", label: "Sarf Malzeme" },
  { value: "bitkisel", label: "Bitkisel Urunler" },
  { value: "igne", label: "Akupunktur Igneleri" },
  { value: "diger", label: "Diger" },
];

const categoryLabel = (val: string) => CATEGORIES.find((c) => c.value === val)?.label ?? val;

type StokItem = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minimumLevel: number;
  unitPrice: number;
  expiryDate: string;
  isExpired?: boolean;
  isExpiringSoon?: boolean;
  isCritical?: boolean;
};

export default function EgitmenStokPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState("");
  const { data: stokList, loading, error, refetch } = useApi<StokItem[]>("/api/stok");
  const { mutate, loading: mutLoading, error: mutError } = useApiMutation();
  const [success, setSuccess] = useState(false);

  // Hareket state
  const [hareketId, setHareketId] = useState("");
  const [hareketType, setHareketType] = useState<"giris" | "cikis">("giris");
  const [hareketQty, setHareketQty] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState("kupa");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("adet");
  const [minimumLevel, setMinimumLevel] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  const items = stokList ?? [];
  const kritikCount = items.filter((s) => s.quantity <= s.minimumLevel).length;
  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const expiringCount = items.filter(
    (s) => s.expiryDate && new Date(s.expiryDate) <= thirtyDaysLater,
  ).length;

  const resetForm = () => {
    setName("");
    setCategory("kupa");
    setQuantity("");
    setUnit("adet");
    setMinimumLevel("");
    setUnitPrice("");
    setExpiryDate("");
    setEditingId("");
  };

  const handleEdit = (item: StokItem) => {
    setEditingId(item.id);
    setName(item.name);
    setCategory(item.category);
    setQuantity(String(item.quantity));
    setUnit(item.unit || "adet");
    setMinimumLevel(String(item.minimumLevel || 5));
    setUnitPrice(String(item.unitPrice || 0));
    setExpiryDate(item.expiryDate ? new Date(item.expiryDate).toISOString().split("T")[0]! : "");
    setShowForm(true);
    setSuccess(false);
  };

  const handleSubmit = async () => {
    setSuccess(false);
    if (!name.trim()) return;

    const body = {
      name: name.trim(),
      category,
      quantity: Number(quantity) || 0,
      unit: unit.trim() || "adet",
      minimumLevel: Number(minimumLevel) || 5,
      unitPrice: Number(unitPrice) || 0,
      expiryDate: expiryDate || undefined,
    };

    let result;
    if (editingId) {
      result = await mutate(`/api/stok/${editingId}`, body, "PUT");
    } else {
      result = await mutate("/api/stok", body);
    }

    if (result) {
      setSuccess(true);
      resetForm();
      setShowForm(false);
      refetch();
    }
  };

  const handleHareket = async () => {
    if (!hareketId || !hareketQty) return;
    await mutate(`/api/stok/${hareketId}/hareket`, {
      type: hareketType,
      quantity: Number(hareketQty),
      reason: `Manuel ${hareketType}`,
    });
    setHareketId("");
    setHareketQty("");
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-headline">Stok Yonetimi</h1>
        <Button
          onClick={() => {
            setShowForm(!showForm);
            setSuccess(false);
          }}
        >
          {showForm ? "Kapat" : "Yeni Malzeme Ekle"}
        </Button>
      </div>

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-800 text-sm">
          Malzeme basariyla eklendi.
        </div>
      )}

      {mutError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 text-sm">
          {mutError}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Toplam Kalem"
          value={items.length}
          icon={Package}
          color="default"
          loading={loading}
        />
        <StatCard
          title="Kritik Stok"
          value={kritikCount}
          icon={AlertTriangle}
          color="warning"
          loading={loading}
        />
        <StatCard
          title="Son Kullanma Yaklasan"
          value={expiringCount}
          icon={Clock}
          color="danger"
          loading={loading}
        />
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Malzeme Duzenle" : "Yeni Malzeme Ekle"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Malzeme Adi</Label>
                <Input
                  placeholder="Ornek: Cam Kupa 5cm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Kategori</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Miktar</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Birim</Label>
                <Input placeholder="adet" value={unit} onChange={(e) => setUnit(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Minimum Seviye</Label>
                <Input
                  type="number"
                  placeholder="5"
                  value={minimumLevel}
                  onChange={(e) => setMinimumLevel(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Birim Fiyat (TL)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Son Kullanma Tarihi</Label>
                <Input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>
            </div>
            <Button className="w-full" disabled={mutLoading || !name.trim()} onClick={handleSubmit}>
              {mutLoading ? "Kaydediliyor..." : editingId ? "Guncelle" : "Malzeme Ekle"}
            </Button>
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
            <EmptyState
              icon={PackageOpen}
              title="Henuz stok kaydi bulunmuyor."
              description="Yeni malzeme eklemek icin yukardaki butonu kullanin."
            />
          ) : (
            <div className="overflow-x-auto">
              <div className="space-y-3">
                {items.map((item) => {
                  const isLow = item.isCritical || item.quantity <= (item.minimumLevel || 5);
                  const isExpired =
                    item.isExpired || (item.expiryDate && new Date(item.expiryDate) < now);
                  const isExpiringSoon = item.isExpiringSoon;
                  const rowClass = isExpired
                    ? "bg-red-50 border-red-300"
                    : isLow
                      ? "bg-amber-50 border-amber-300"
                      : isExpiringSoon
                        ? "bg-orange-50 border-orange-300"
                        : "";
                  return (
                    <div key={item.id} className={`border rounded-xl p-3 space-y-2 ${rowClass}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {categoryLabel(item.category)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {isExpired && <Badge variant="destructive">Suresi Gecmis</Badge>}
                          {isLow && !isExpired && <Badge variant="destructive">Kritik</Badge>}
                          {isExpiringSoon && !isExpired && (
                            <Badge variant="secondary">Son Kullanim</Badge>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Miktar:</span>{" "}
                          <strong>
                            {item.quantity} {item.unit}
                          </strong>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Min:</span>{" "}
                          {item.minimumLevel || 5}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Fiyat:</span>{" "}
                          {Number(item.unitPrice || 0).toFixed(2)} TL
                        </div>
                        <div>
                          <span className="text-muted-foreground">SKT:</span>{" "}
                          {item.expiryDate
                            ? new Date(item.expiryDate).toLocaleDateString("tr-TR")
                            : "-"}
                        </div>
                      </div>
                      {/* Hareket formu */}
                      {hareketId === item.id ? (
                        <div className="flex gap-2 items-end pt-1">
                          <select
                            className="flex h-8 rounded-md border border-input bg-transparent px-2 py-1 text-xs w-20"
                            value={hareketType}
                            onChange={(e) => setHareketType(e.target.value as "giris" | "cikis")}
                          >
                            <option value="giris">Giris</option>
                            <option value="cikis">Cikis</option>
                          </select>
                          <Input
                            type="number"
                            min="1"
                            placeholder="Miktar"
                            className="h-8 w-20 text-xs"
                            value={hareketQty}
                            onChange={(e) => setHareketQty(e.target.value)}
                          />
                          <Button
                            size="sm"
                            className="h-8 text-xs"
                            onClick={handleHareket}
                            disabled={!hareketQty}
                          >
                            Kaydet
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                            onClick={() => setHareketId("")}
                          >
                            Iptal
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2 pt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => handleEdit(item)}
                          >
                            Duzenle
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => {
                              setHareketId(item.id);
                              setHareketQty("");
                            }}
                          >
                            Stok Hareketi
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
