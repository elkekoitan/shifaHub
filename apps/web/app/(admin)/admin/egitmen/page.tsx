"use client";

import { useState } from "react";
import {
  GraduationCap,
  AlertCircle,
  Mail,
  Phone,
  Check,
  X,
  Info,
  Ban,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";

const dtf = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", year: "numeric" });

function initials(first?: string | null, last?: string | null, email?: string) {
  const fromName = `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
  return fromName || email?.[0]?.toUpperCase() || "?";
}

export default function EgitmenOnayPage() {
  const [page, setPage] = useState(1);
  const [rejectFor, setRejectFor] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const utils = trpc.useUtils();

  // Eğitmen rolündeki kullanıcılar. NOT: approve/reject mutasyonları egitmen
  // tablosu id'sini ister; listUsers yalnızca kullanıcı id'si döner. Bu eşleme
  // bir backend prosedürü (örn. admin.listEgitmenApplications -> egitmenId)
  // eklenene kadar onay işlemi güvenle bağlanamaz, aşağıda bilgilendirilir.
  const list = trpc.admin.listUsers.useQuery({ role: "egitmen", page, pageSize: 20 });

  const approve = trpc.admin.approveEgitmen.useMutation({
    onSuccess: (res) => {
      toast.success(res.message);
      utils.admin.listUsers.invalidate();
      utils.admin.getStats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const reject = trpc.admin.rejectEgitmen.useMutation({
    onSuccess: (res) => {
      toast.success(res.message);
      setRejectFor(null);
      setReason("");
      utils.admin.listUsers.invalidate();
      utils.admin.getStats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const users = list.data?.users ?? [];

  return (
    <div>
      <header className="mb-5">
        <h1 className="font-headline text-2xl font-semibold text-foreground">Eğitmen onayları</h1>
        <p className="mt-1.5 text-sm text-text-2">
          Başvuran eğitmenleri inceleyin; başvuruları onaylayın veya gerekçeyle reddedin.
        </p>
      </header>

      <div className="mb-4 flex items-start gap-2 rounded-[var(--radius)] border border-dashed border-warning/40 bg-warning/5 p-3 text-xs text-text-2">
        <Info className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
        <p>
          Onay/ret işlemleri <code className="font-mono">egitmenId</code> (eğitmen kaydı kimliği)
          gerektirir. Mevcut <code className="font-mono">admin.listUsers</code> prosedürü yalnızca
          kullanıcı kimliği döndürdüğünden, başvuru kimliğini sağlayan bir prosedür eklenene kadar
          aksiyon butonları devre dışıdır.
        </p>
      </div>

      {list.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-[var(--radius)]" />
          ))}
        </div>
      ) : list.isError ? (
        <div className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-destructive-border bg-card p-8 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-destructive-bg">
            <AlertCircle className="size-5 text-destructive" aria-hidden />
          </span>
          <p className="text-sm text-text-2">Eğitmenler yüklenemedi.</p>
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
            <GraduationCap className="size-6 text-text-3" aria-hidden />
          </span>
          <p className="text-sm font-medium text-foreground">Başvuru yok</p>
          <p className="text-xs text-text-3">Henüz eğitmen başvurusu bulunmuyor.</p>
        </div>
      ) : (
        <>
          <ul className="space-y-2">
            {users.map((u) => (
              <li key={u.id} className="rounded-[var(--radius)] border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {initials(u.firstName, u.lastName, u.email)}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium text-foreground">
                          {u.firstName || u.lastName
                            ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim()
                            : "İsimsiz eğitmen"}
                        </p>
                        {!u.isActive ? (
                          <StatusBadge tone="danger" icon={Ban}>
                            Pasif
                          </StatusBadge>
                        ) : null}
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
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      aria-label="Başvuruyu onayla"
                      disabled
                      title="egitmenId gerektirir"
                      onClick={() => approve.mutate({ egitmenId: u.id })}
                    >
                      <Check className="size-4" aria-hidden />
                      Onayla
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      aria-label="Başvuruyu reddet"
                      disabled
                      title="egitmenId gerektirir"
                      onClick={() => setRejectFor(u.id)}
                    >
                      <X className="size-4" aria-hidden />
                      Reddet
                    </Button>
                  </div>
                </div>

                {rejectFor === u.id ? (
                  <form
                    className="mt-3 border-t border-border pt-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (reason.trim().length === 0) {
                        toast.error("Ret gerekçesi gereklidir.");
                        return;
                      }
                      reject.mutate({ egitmenId: u.id, reason: reason.trim() });
                    }}
                  >
                    <Label htmlFor={`reason-${u.id}`}>Ret gerekçesi</Label>
                    <Input
                      id={`reason-${u.id}`}
                      className="mt-1.5"
                      placeholder="Örn. Sertifika belgesi eksik."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        type="submit"
                        loading={reject.isPending}
                      >
                        Reddi onayla
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        type="button"
                        onClick={() => {
                          setRejectFor(null);
                          setReason("");
                        }}
                      >
                        Vazgeç
                      </Button>
                    </div>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>

          {list.data && list.data.totalPages > 1 ? (
            <div className="mt-5 flex items-center justify-between">
              <p className="text-xs text-text-3">
                {list.data.total} eğitmen · sayfa {list.data.page}/{list.data.totalPages}
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
