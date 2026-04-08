"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApi } from "@/hooks/use-api";

type GunlukKasa = {
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  byMethod: { nakit: number; kart: number; havale: number; eft: number };
  count: number;
};

type OdemeItem = {
  id: string;
  amount: number;
  paidAmount: number;
  method: string;
  status: string;
  description: string;
  createdAt: string;
};

const methodLabel: Record<string, string> = {
  nakit: "Nakit",
  kart: "Kredi/Banka Karti",
  havale: "Havale",
  eft: "EFT",
};

const statusLabel: Record<string, string> = {
  paid: "Odendi",
  pending: "Beklemede",
  partial: "Kismi",
  free: "Ucretsiz",
};

const statusColor: Record<string, string> = {
  paid: "bg-green-100 text-green-800",
  pending: "bg-amber-100 text-amber-800",
  partial: "bg-blue-100 text-blue-800",
  free: "bg-gray-100 text-gray-800",
};

export default function EgitmenOdemePage() {
  const [showForm, setShowForm] = useState(false);
  const { data: kasa, loading: kasaLoading } = useApi<GunlukKasa>("/api/odeme/gunluk-kasa");
  const { data: odemeList, loading: listLoading, error } = useApi<OdemeItem[]>("/api/odeme");

  const payments = odemeList ?? [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Odeme Yonetimi</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Kapat" : "Yeni Odeme Kaydi"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Bugun Toplam</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {kasaLoading ? "..." : `${Number(kasa?.totalAmount || 0).toFixed(2)} TL`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Nakit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {kasaLoading ? "..." : `${Number(kasa?.byMethod?.nakit || 0).toFixed(2)} TL`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Kart</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {kasaLoading ? "..." : `${Number(kasa?.byMethod?.kart || 0).toFixed(2)} TL`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Bekleyen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              {kasaLoading ? "..." : `${Number(kasa?.pendingAmount || 0).toFixed(2)} TL`}
            </p>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Odeme Kaydi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tutar (TL)</Label>
                <Input type="number" step="0.01" placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Odeme Yontemi</Label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  <option value="nakit">Nakit</option>
                  <option value="kart">Kredi/Banka Karti</option>
                  <option value="havale">Havale</option>
                  <option value="eft">EFT</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Durum</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                <option value="paid">Odendi</option>
                <option value="pending">Beklemede</option>
                <option value="partial">Kismi Odeme</option>
                <option value="free">Ucretsiz</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Aciklama</Label>
              <Input placeholder="Tedavi aciklamasi" />
            </div>
            <Button className="w-full">Odemeyi Kaydet</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Odeme Gecmisi</CardTitle>
        </CardHeader>
        <CardContent>
          {listLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Yukleniyor...</p>
          ) : error ? (
            <p className="text-sm text-red-500 text-center py-8">{error}</p>
          ) : payments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Henuz odeme kaydi bulunmuyor.
            </p>
          ) : (
            <div className="space-y-3">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between border rounded-lg p-3"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{p.description || "Odeme"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(p.createdAt).toLocaleDateString("tr-TR")} -{" "}
                      {methodLabel[p.method] ?? p.method}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${statusColor[p.status] ?? "bg-gray-100 text-gray-800"}`}
                    >
                      {statusLabel[p.status] ?? p.status}
                    </span>
                    <span className="font-bold">{Number(p.amount || 0).toFixed(2)} TL</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
