"use client";

import { useState } from "react";
import {
  Users,
  UserX,
  UserCheck,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  CheckCircle2,
  Ban,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, type BadgeTone } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

type RoleFilter = "all" | "danisan" | "egitmen" | "admin" | "tabip";

const ROLE_TABS: { value: RoleFilter; label: string }[] = [
  { value: "all", label: "Tümü" },
  { value: "danisan", label: "Danışan" },
  { value: "egitmen", label: "Eğitmen" },
  { value: "admin", label: "Yönetici" },
  { value: "tabip", label: "Tabip" },
];

const ROLE_LABEL: Record<string, string> = {
  danisan: "Danışan",
  egitmen: "Eğitmen",
  admin: "Yönetici",
  tabip: "Tabip",
};

const ROLE_TONE: Record<string, BadgeTone> = {
  danisan: "info",
  egitmen: "primary",
  admin: "warning",
  tabip: "neutral",
};

const dtf = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", year: "numeric" });

function initials(first?: string | null, last?: string | null, email?: string) {
  const fromName = `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
  return fromName || email?.[0]?.toUpperCase() || "?";
}

export default function KullanicilarPage() {
  const [role, setRole] = useState<RoleFilter>("all");
  const [page, setPage] = useState(1);
  const utils = trpc.useUtils();

  const list = trpc.admin.listUsers.useQuery({
    page,
    pageSize: 20,
    ...(role !== "all" ? { role } : {}),
  });

  const setActive = trpc.admin.setUserActive.useMutation({
    onSuccess: (res) => {
      toast.success(res.message);
      utils.admin.listUsers.invalidate();
      utils.admin.getStats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  function changeRole(next: RoleFilter) {
    setRole(next);
    setPage(1);
  }

  const users = list.data?.users ?? [];

  return (
    <div>
      <header className="mb-5">
        <h1 className="font-headline text-2xl font-semibold text-foreground">Kullanıcılar</h1>
        <p className="mt-1.5 text-sm text-text-2">
          Platform kullanıcılarını görüntüleyin, aktif/pasif durumunu yönetin.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Rol filtresi">
        {ROLE_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={role === tab.value}
            onClick={() => changeRole(tab.value)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              role === tab.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-text-2 hover:bg-accent",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {list.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-[var(--radius)]" />
          ))}
        </div>
      ) : list.isError ? (
        <div className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-destructive-border bg-card p-8 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-destructive-bg">
            <AlertCircle className="size-5 text-destructive" aria-hidden />
          </span>
          <p className="text-sm text-text-2">Kullanıcılar yüklenemedi.</p>
          <button
            type="button"
            onClick={() => list.refetch()}
            className="text-sm font-medium text-primary hover:underline"
          >
            Tekrar dene
          </button>
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-border bg-card p-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Users className="size-6 text-text-3" aria-hidden />
          </span>
          <p className="text-sm font-medium text-foreground">Kullanıcı bulunamadı</p>
          <p className="text-xs text-text-3">Bu filtreye uyan kayıt yok.</p>
        </div>
      ) : (
        <>
          <ul className="space-y-2">
            {users.map((u) => (
              <li
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius)] border border-border bg-card p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {initials(u.firstName, u.lastName, u.email)}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium text-foreground">
                        {u.firstName || u.lastName
                          ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim()
                          : "İsimsiz kullanıcı"}
                      </p>
                      <StatusBadge tone={ROLE_TONE[u.role] ?? "neutral"}>
                        {ROLE_LABEL[u.role] ?? u.role}
                      </StatusBadge>
                      {u.isActive ? (
                        <StatusBadge tone="success" icon={CheckCircle2}>
                          Aktif
                        </StatusBadge>
                      ) : (
                        <StatusBadge tone="danger" icon={Ban}>
                          Pasif
                        </StatusBadge>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-3">
                      <span className="flex items-center gap-1">
                        <Mail className="size-3" aria-hidden />
                        {u.email}
                      </span>
                      {u.phoneLast4 ? (
                        <span className="flex items-center gap-1">
                          <Phone className="size-3" aria-hidden />
                          •••• {u.phoneLast4}
                        </span>
                      ) : null}
                      <span>Kayıt: {dtf.format(new Date(u.createdAt))}</span>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={u.isActive ? "outline" : "default"}
                  aria-label={u.isActive ? "Kullanıcıyı pasif yap" : "Kullanıcıyı aktif yap"}
                  loading={setActive.isPending && setActive.variables?.userId === u.id}
                  onClick={() => setActive.mutate({ userId: u.id, isActive: !u.isActive })}
                >
                  {u.isActive ? (
                    <>
                      <UserX className="size-4" aria-hidden />
                      Pasif yap
                    </>
                  ) : (
                    <>
                      <UserCheck className="size-4" aria-hidden />
                      Aktif yap
                    </>
                  )}
                </Button>
              </li>
            ))}
          </ul>

          {list.data && list.data.totalPages > 1 ? (
            <div className="mt-5 flex items-center justify-between">
              <p className="text-xs text-text-3">
                {list.data.total} kullanıcı · sayfa {list.data.page}/{list.data.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  aria-label="Önceki sayfa"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="size-4" aria-hidden />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  aria-label="Sonraki sayfa"
                  disabled={page >= list.data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="size-4" aria-hidden />
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
