"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/layout/stat-card";
import { EmptyState } from "@/components/layout/empty-state";
import { useApi, useApiMutation } from "@/hooks/use-api";
import { GraduationCap, Clock, CheckCircle, XCircle, Search } from "lucide-react";

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

const statusLabel: Record<string, string> = {
  pending: "Bekliyor",
  approved: "Onaylandi",
  rejected: "Reddedildi",
};

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function StatusBadge({ status }: { status: string }) {
  if (status === "approved") {
    return (
      <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50 gap-1">
        <CheckCircle className="h-3 w-3" />
        {statusLabel[status] ?? status}
      </Badge>
    );
  }
  if (status === "rejected") {
    return (
      <Badge variant="outline" className="text-red-700 border-red-200 bg-red-50 gap-1">
        <XCircle className="h-3 w-3" />
        {statusLabel[status] ?? status}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50 gap-1">
      <Clock className="h-3 w-3" />
      {statusLabel[status] ?? status}
    </Badge>
  );
}

export default function AdminEgitmenPage() {
  const { data: allEgitmen, loading, refetch } = useApi<Egitmen[]>("/api/admin/egitmen/all");
  const { mutate } = useApiMutation();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = (allEgitmen || []).filter((e) => {
    const matchSearch = `${e.firstName} ${e.lastName} ${e.email} ${e.clinicCity || ""}`
      .toLowerCase()
      .includes(search.toLowerCase());
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
      <h1 className="font-headline text-2xl font-bold flex items-center gap-2">
        <GraduationCap className="h-6 w-6 text-primary" />
        Egitmen Yonetimi
      </h1>

      <div className="grid gap-4 md:grid-cols-3">
        <button
          type="button"
          className="text-left w-full"
          onClick={() => setFilterStatus("pending")}
        >
          <StatCard
            title="Bekleyen Basvurular"
            value={pendingCount}
            icon={Clock}
            color="warning"
            loading={loading}
            className="cursor-pointer hover:border-amber-300"
          />
        </button>
        <button
          type="button"
          className="text-left w-full"
          onClick={() => setFilterStatus("approved")}
        >
          <StatCard
            title="Onaylanmis Egitmenler"
            value={approvedCount}
            icon={CheckCircle}
            color="success"
            loading={loading}
            className="cursor-pointer hover:border-green-300"
          />
        </button>
        <button
          type="button"
          className="text-left w-full"
          onClick={() => setFilterStatus("rejected")}
        >
          <StatCard
            title="Reddedilmis Basvurular"
            value={rejectedCount}
            icon={XCircle}
            color="danger"
            loading={loading}
            className="cursor-pointer hover:border-red-300"
          />
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Ad, email veya sehir ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 w-64"
          />
        </div>
        <select
          className="h-9 rounded-md border border-input px-3 text-sm bg-background"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">Tum Durumlar</option>
          <option value="pending">Bekleyen</option>
          <option value="approved">Onaylanmis</option>
          <option value="rejected">Reddedilmis</option>
        </select>
        {!loading && (
          <span className="text-sm text-muted-foreground">{filtered.length} egitmen</span>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-4">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                    <Skeleton className="h-3 w-52" />
                    <Skeleton className="h-3 w-44" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-20 rounded-md" />
                    <Skeleton className="h-8 w-20 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title={
                search || filterStatus !== "all"
                  ? "Filtre sonucu bulunamadi"
                  : "Henuz egitmen basvurusu yok"
              }
              description={
                search || filterStatus !== "all"
                  ? "Farkli bir arama veya filtre deneyin."
                  : "Sisteme kayitli egitmen basvurusu bulunmamaktadir."
              }
              {...(filterStatus !== "all"
                ? { actionLabel: "Filtreyi Temizle", onAction: () => setFilterStatus("all") }
                : {})}
            />
          ) : (
            <div className="divide-y">
              {filtered.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="text-sm bg-primary/10 text-primary font-semibold">
                        {getInitials(e.firstName, e.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="font-medium">
                          {e.firstName} {e.lastName}
                        </p>
                        <StatusBadge status={e.approvalStatus} />
                      </div>
                      <p className="text-sm text-muted-foreground">{e.email}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Sertifika: {e.certificateNumber || "-"} | {e.clinicName || "-"},{" "}
                        {e.clinicCity || "-"}
                      </p>
                      {e.specialties && e.specialties.length > 0 && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {e.specialties.map((s) => (
                            <Badge
                              key={s}
                              variant="outline"
                              className="text-teal-700 border-teal-200 bg-teal-50 text-xs font-normal"
                            >
                              {s}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {e.rejectionReason && (
                        <p className="text-xs text-red-600 mt-1">Red sebebi: {e.rejectionReason}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0 ml-4">
                    {e.approvalStatus === "pending" && (
                      <>
                        <Button size="sm" onClick={() => handleApprove(e.id)}>
                          Onayla
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleReject(e.id)}>
                          Reddet
                        </Button>
                      </>
                    )}
                    {e.approvalStatus === "rejected" && (
                      <Button size="sm" variant="outline" onClick={() => handleApprove(e.id)}>
                        Yeniden Onayla
                      </Button>
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
