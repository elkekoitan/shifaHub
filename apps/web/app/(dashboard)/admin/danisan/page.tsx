"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useApi } from "@/hooks/use-api";

interface DanisanItem {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  city: string | null;
  gender: string | null;
  bloodType: string | null;
  chronicDiseases: string[];
  mainComplaints: string[];
  createdAt: string;
}

export default function AdminDanisanPage() {
  const { data: danisanlar, loading } = useApi<DanisanItem[]>("/api/admin/danisanlar");
  const [search, setSearch] = useState("");

  const filtered = (danisanlar || []).filter((d) =>
    `${d.firstName} ${d.lastName} ${d.email} ${d.city || ""}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Danisan Yonetimi ({danisanlar?.length || 0})</h1>
        <Input placeholder="Ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Yukleniyor...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Danisan bulunamadi.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">Ad Soyad</th>
                  <th className="text-left p-3 font-medium">Email</th>
                  <th className="text-left p-3 font-medium">Sehir</th>
                  <th className="text-left p-3 font-medium">Cinsiyet</th>
                  <th className="text-left p-3 font-medium">Kan Grubu</th>
                  <th className="text-left p-3 font-medium">Kronik Hastalik</th>
                  <th className="text-left p-3 font-medium">Sikayet</th>
                  <th className="text-left p-3 font-medium">Kayit</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id} className="border-t hover:bg-muted/30">
                    <td className="p-3 font-medium">{d.firstName} {d.lastName}</td>
                    <td className="p-3 text-muted-foreground">{d.email}</td>
                    <td className="p-3">{d.city || "-"}</td>
                    <td className="p-3">{d.gender === "erkek" ? "Erkek" : d.gender === "kadin" ? "Kadin" : "-"}</td>
                    <td className="p-3">{d.bloodType?.replace("_", " ") || "-"}</td>
                    <td className="p-3">
                      {d.chronicDiseases?.length > 0 ? (
                        <div className="flex gap-1 flex-wrap">
                          {d.chronicDiseases.map((c, i) => (
                            <span key={i} className="px-1.5 py-0.5 text-xs bg-red-50 text-red-700 rounded">{c}</span>
                          ))}
                        </div>
                      ) : "-"}
                    </td>
                    <td className="p-3">
                      <span className="text-xs text-muted-foreground">{d.mainComplaints?.length || 0} adet</span>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {new Date(d.createdAt).toLocaleDateString("tr-TR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
