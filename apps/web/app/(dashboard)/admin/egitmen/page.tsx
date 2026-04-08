"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApi, useApiMutation } from "@/hooks/use-api";

interface Egitmen {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  certificateNumber: string;
  specialties: string[];
  clinicName: string;
  clinicCity: string;
  approvalStatus: string;
  rejectionReason: string | null;
  createdAt: string;
}

const statusLabel: Record<string, string> = { pending: "Bekliyor", approved: "Onaylandi", rejected: "Reddedildi" };
const statusColor: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export default function AdminEgitmenPage() {
  const { data: allEgitmen, loading, refetch } = useApi<Egitmen[]>("/api/admin/egitmen/all");
  const { mutate } = useApiMutation();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = (allEgitmen || []).filter((e) => {
    const matchSearch = `${e.firstName} ${e.lastName} ${e.email} ${e.clinicCity || ""}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || e.approvalStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  async function handleApprove(id: string) {
    await mutate(`/api/admin/egitmen/${id}/approve`, {});
    refetch();
  }

  async function handleReject(id: string) {
    const reason = prompt("Red sebebi:");
    if (!reason) return;
    await mutate(`/api/admin/egitmen/${id}/reject`, { reason });
    refetch();
  }

  const pendingCount = (allEgitmen || []).filter((e) => e.approvalStatus === "pending").length;
  const approvedCount = (allEgitmen || []).filter((e) => e.approvalStatus === "approved").length;
  const rejectedCount = (allEgitmen || []).filter((e) => e.approvalStatus === "rejected").length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Egitmen Yonetimi</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:border-amber-300" onClick={() => setFilterStatus("pending")}>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Bekleyen</p>
            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-green-300" onClick={() => setFilterStatus("approved")}>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Onaylanmis</p>
            <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-red-300" onClick={() => setFilterStatus("rejected")}>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Reddedilmis</p>
            <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 items-center">
        <Input placeholder="Ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <select className="h-9 rounded-md border border-input px-3 text-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">Tum Durumlar</option>
          <option value="pending">Bekleyen</option>
          <option value="approved">Onaylanmis</option>
          <option value="rejected">Reddedilmis</option>
        </select>
        <span className="text-sm text-muted-foreground">{filtered.length} egitmen</span>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Yukleniyor...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Egitmen bulunamadi.</p>
          ) : (
            <div className="divide-y">
              {filtered.map((e) => (
                <div key={e.id} className="flex items-center justify-between p-4 hover:bg-muted/30">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{e.firstName} {e.lastName}</p>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${statusColor[e.approvalStatus] || "bg-gray-100"}`}>
                        {statusLabel[e.approvalStatus] || e.approvalStatus}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{e.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Sertifika: {e.certificateNumber || "-"} | {e.clinicName || "-"}, {e.clinicCity || "-"}
                    </p>
                    {e.specialties && e.specialties.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {e.specialties.map((s) => (
                          <span key={s} className="px-1.5 py-0.5 text-xs bg-teal-50 text-teal-700 rounded">{s}</span>
                        ))}
                      </div>
                    )}
                    {e.rejectionReason && (
                      <p className="text-xs text-red-600 mt-1">Red sebebi: {e.rejectionReason}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {e.approvalStatus === "pending" && (
                      <>
                        <Button size="sm" onClick={() => handleApprove(e.id)}>Onayla</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleReject(e.id)}>Reddet</Button>
                      </>
                    )}
                    {e.approvalStatus === "rejected" && (
                      <Button size="sm" onClick={() => handleApprove(e.id)}>Yeniden Onayla</Button>
                    )}
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
