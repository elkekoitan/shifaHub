"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/layout/empty-state";
import { useApi } from "@/hooks/use-api";
import { Users, Search } from "lucide-react";

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

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export default function AdminDanisanPage() {
  const { data: danisanlar, loading } = useApi<DanisanItem[]>("/api/admin/danisanlar");
  const [search, setSearch] = useState("");

  const filtered = (danisanlar || []).filter((d) =>
    `${d.firstName} ${d.lastName} ${d.email} ${d.city || ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <h1 className="font-headline text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          Danisan Yonetimi
          {!loading && danisanlar && (
            <Badge variant="secondary" className="ml-1 font-normal">
              {danisanlar.length}
            </Badge>
          )}
        </h1>
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Ad, email veya sehir ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 w-full sm:w-64"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-4">
                  <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Users}
              title={search ? "Arama sonucu bulunamadi" : "Henuz danisan yok"}
              description={
                search
                  ? `"${search}" icin eslesen danisan bulunamadi.`
                  : "Sisteme kayitli danisan bulunmamaktadir."
              }
            />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-3 font-medium text-muted-foreground">Danisan</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Email</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Sehir</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Cinsiyet</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Kan Grubu</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Kronik Hastalik
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Sikayet</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Kayit</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id} className="border-t hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                            {getInitials(d.firstName, d.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {d.firstName} {d.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">{d.email}</td>
                    <td className="p-3">
                      {d.city || <span className="text-muted-foreground">-</span>}
                    </td>
                    <td className="p-3">
                      {d.gender === "erkek" ? (
                        <Badge
                          variant="outline"
                          className="text-blue-700 border-blue-200 bg-blue-50"
                        >
                          Erkek
                        </Badge>
                      ) : d.gender === "kadin" ? (
                        <Badge
                          variant="outline"
                          className="text-pink-700 border-pink-200 bg-pink-50"
                        >
                          Kadin
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      {d.bloodType ? (
                        <Badge variant="secondary">{d.bloodType.replace("_", " ")}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      {d.chronicDiseases?.length > 0 ? (
                        <div className="flex gap-1 flex-wrap">
                          {d.chronicDiseases.map((c, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="text-red-700 border-red-200 bg-red-50 text-xs font-normal"
                            >
                              {c}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      {d.mainComplaints?.length > 0 ? (
                        <Badge variant="secondary" className="text-xs font-normal">
                          {d.mainComplaints.length} adet
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
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
