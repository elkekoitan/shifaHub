"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApi } from "@/hooks/use-api";

type DanisanItem = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  gender: string;
  bloodType: string;
  chronicDiseases: string[];
  mainComplaints: string[];
  createdAt: string;
};

export default function EgitmenDanisanListePage() {
  const { data: danisanList, loading, error } = useApi<DanisanItem[]>("/api/danisan/list");
  const [search, setSearch] = useState("");

  const items = danisanList ?? [];
  const filtered = search
    ? items.filter((d) =>
        `${d.firstName} ${d.lastName} ${d.city || ""}`.toLowerCase().includes(search.toLowerCase()),
      )
    : items;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <h1 className="text-xl sm:text-2xl font-bold">Danisanlarim ({items.length})</h1>
        <Input placeholder="Ara..." className="max-w-xs" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Yukleniyor...</p>
      ) : error ? (
        <p className="text-center text-red-500 py-8">{error}</p>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Danisan bulunamadi.</CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d) => (
            <Link key={d.id} href={`/egitmen/danisan/${d.userId}`}>
              <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{d.firstName} {d.lastName}</CardTitle>
                    {d.gender && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted">{d.gender === "erkek" ? "E" : "K"}</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-1.5 text-sm">
                  {d.city && <p className="text-muted-foreground">{d.city}</p>}
                  {d.bloodType && <p className="text-xs text-muted-foreground">Kan: {d.bloodType.replace("_", " ")}</p>}
                  {d.chronicDiseases && d.chronicDiseases.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {d.chronicDiseases.slice(0, 3).map((c, i) => (
                        <span key={i} className="px-1.5 py-0.5 text-xs bg-red-50 text-red-700 rounded">{c}</span>
                      ))}
                    </div>
                  )}
                  {d.mainComplaints && d.mainComplaints.length > 0 && (
                    <p className="text-xs text-amber-600">{d.mainComplaints.length} sikayet</p>
                  )}
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-xs text-muted-foreground">{new Date(d.createdAt).toLocaleDateString("tr-TR")}</span>
                    <Button size="sm" variant="ghost" className="h-6 text-xs text-primary">Detay →</Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
