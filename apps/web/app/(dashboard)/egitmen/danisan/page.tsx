"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApi } from "@/hooks/use-api";

type DanisanItem = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  mainComplaints: string[];
  createdAt: string;
};

export default function EgitmenDanisanListePage() {
  const { data: danisanList, loading, error } = useApi<DanisanItem[]>("/api/danisan/list");
  const [search, setSearch] = useState("");

  const items = danisanList ?? [];
  const filtered = search
    ? items.filter(
        (d) =>
          `${d.firstName} ${d.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
          d.city?.toLowerCase().includes(search.toLowerCase()),
      )
    : items;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Danisanlarim</h1>
        <Input
          placeholder="Danisan ara..."
          className="max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Yukleniyor...</p>
      ) : error ? (
        <p className="text-sm text-red-500 text-center py-8">{error}</p>
      ) : filtered.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Danisan Listesi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-8">
              {search
                ? "Aramanizla eslesen danisan bulunamadi."
                : "Henuz atanmis danisaniniz bulunmuyor."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d) => (
            <Card key={d.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {d.firstName} {d.lastName}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {d.city && (
                  <p className="text-muted-foreground">Sehir: {d.city}</p>
                )}
                {d.phone && (
                  <p className="text-muted-foreground">Tel: {d.phone}</p>
                )}
                {d.mainComplaints && d.mainComplaints.length > 0 && (
                  <p className="text-muted-foreground">
                    Sikayetler: {d.mainComplaints.length} kayit
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Kayit: {new Date(d.createdAt).toLocaleDateString("tr-TR")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
