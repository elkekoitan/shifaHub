"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useApi, useApiMutation } from "@/hooks/use-api";

interface UserItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

const rolLabels: Record<string, string> = { danisan: "Danisan", egitmen: "Egitmen", admin: "Admin", tabip: "Tabip" };
const rolColors: Record<string, string> = {
  admin: "bg-purple-100 text-purple-800",
  egitmen: "bg-teal-100 text-teal-800",
  danisan: "bg-blue-100 text-blue-800",
  tabip: "bg-orange-100 text-orange-800",
};

export default function AdminKullanicilarPage() {
  const { data: allUsers, loading, refetch } = useApi<UserItem[]>("/api/admin/users");
  const { mutate } = useApiMutation();
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  const filtered = (allUsers || []).filter((u) => {
    const matchSearch = `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "all" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  async function toggleActive(id: string) {
    await mutate(`/api/admin/users/${id}/toggle-active`, {}, "PATCH");
    refetch();
  }

  async function changeRole(id: string) {
    const role = prompt("Yeni rol (danisan / egitmen / admin / tabip):");
    if (!role || !["danisan", "egitmen", "admin", "tabip"].includes(role)) return;
    await mutate(`/api/admin/users/${id}/role`, { role }, "PATCH");
    refetch();
  }

  async function deleteUser(id: string) {
    if (!confirm("Bu kullaniciyi silmek istediginize emin misiniz?")) return;
    await mutate(`/api/admin/users/${id}`, {}, "DELETE");
    refetch();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Kullanici Yonetimi</h1>

      <div className="flex gap-4 items-center">
        <Input placeholder="Ara (isim, email)..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <select className="h-9 rounded-md border border-input px-3 text-sm" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
          <option value="all">Tum Roller</option>
          <option value="admin">Admin</option>
          <option value="egitmen">Egitmen</option>
          <option value="danisan">Danisan</option>
          <option value="tabip">Tabip</option>
        </select>
        <span className="text-sm text-muted-foreground">{filtered.length} kullanici</span>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Yukleniyor...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Kullanici bulunamadi.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">Kullanici</th>
                  <th className="text-left p-3 font-medium">Email</th>
                  <th className="text-left p-3 font-medium">Rol</th>
                  <th className="text-left p-3 font-medium">Durum</th>
                  <th className="text-left p-3 font-medium">Son Giris</th>
                  <th className="text-right p-3 font-medium">Islemler</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-t hover:bg-muted/30">
                    <td className="p-3 font-medium">{u.firstName} {u.lastName}</td>
                    <td className="p-3 text-muted-foreground">{u.email}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${rolColors[u.role] || "bg-gray-100"}`}>
                        {rolLabels[u.role] || u.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${u.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {u.isActive ? "Aktif" : "Pasif"}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString("tr-TR") : "-"}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="outline" onClick={() => changeRole(u.id)}>Rol</Button>
                        <Button size="sm" variant={u.isActive ? "secondary" : "default"} onClick={() => toggleActive(u.id)}>
                          {u.isActive ? "Pasif Yap" : "Aktif Yap"}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteUser(u.id)}>Sil</Button>
                      </div>
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
