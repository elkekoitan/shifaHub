"use client";

import { useState } from "react";
import {
  GraduationCap,
  AlertCircle,
  Mail,
  Building2,
  Check,
  X,
  Ban,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, type BadgeTone } from "@/components/ui/status-badge";

const dtf = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", year: "numeric" });

const STATUS_META: Record<string, { tone: BadgeTone; label: string; icon: typeof Clock }> = {
  pending: { tone: "warning", label: "Bekliyor", icon: Clock },
  approved: { tone: "success", label: "Onaylı", icon: CheckCircle2 },
  rejected: { tone: "danger", label: "Reddedildi", icon: XCircle },
};

function initials(first?: string | null, last?: string | null, email?: string) {
  const fromName = `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
  return fromName || email?.[0]?.toUpperCase() || "?";
}

export default function EgitmenOnayPage() {
  const [page, setPage] = useState(1);
  const [rejectFor, setRejectFor] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const utils = trpc.useUtils();

  // listEgitmenApplications users+egitmen JOIN ile hem egitmenId hem userId verir
  // (approve/reject egitmenId ister). Boylece aksiyon butonlari aktiftir.
  const list = trpc.admin.listEgitmenApplications.useQuery({ page, pageSize: 20 });

  const invalidate = () => {
    utils.admin.listEgitmenApplications.invalidate();
    utils.admin.getStats.invalidate();
  };

  const approve = trpc.admin.approveEgitmen.useMutation({
    onSuccess: (res) => {
      toast.success(res.message);
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const reject = trpc.admin.rejectEgitmen.useMutation({
    onSuccess: (res) => {
      toast.success(res.message);
      setRejectFor(null);
      setReason("");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const apps = list.data?.applications ?? [];
  const total = list.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / (list.data?.pageSize ?? 20)));

  return (
    <div>
      <header className="mb-5">
        <h1 className="font-headline text-2xl font-semibold text-foreground">Eğitmen onayları</h1>
        <p className="mt-1.5 text-sm text-text-2">
          Başvuran eğitmenleri inceleyin; başvuruları onaylayın veya gerekçeyle reddedin.
        </p>
      </header>

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
          <p className="text-sm text-text-2">Başvurular yüklenemedi.</p>
          <button
            type="button"
            onClick={() => list.refetch()}
            className="text-sm font-medium text-primary hover:underline"
          >
            Tekrar dene
          </button>
        </div>
      ) : apps.length === 0 ? (
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
            {apps.map((a) => {
              const meta = STATUS_META[a.approvalStatus ?? "pending"] ?? STATUS_META.pending!;
              const isPending = (a.approvalStatus ?? "pending") === "pending";
              const busy =
                (approve.isPending && approve.variables?.egitmenId === a.egitmenId) ||
                (reject.isPending && reject.variables?.egitmenId === a.egitmenId);
              return (
                <li
                  key={a.egitmenId}
                  className="rounded-[var(--radius)] border border-border bg-card p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {initials(a.firstName, a.lastName, a.email)}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-medium text-foreground">
                            {a.firstName || a.lastName
                              ? `${a.firstName ?? ""} ${a.lastName ?? ""}`.trim()
                              : "İsimsiz eğitmen"}
                          </p>
                          <StatusBadge tone={meta.tone} icon={meta.icon}>
                            {meta.label}
                          </StatusBadge>
                          {!a.isActive ? (
                            <StatusBadge tone="danger" icon={Ban}>
                              Pasif
                            </StatusBadge>
                          ) : null}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-3">
                          <span className="flex items-center gap-1">
                            <Mail className="size-3" aria-hidden />
                            {a.email}
                          </span>
                          {a.clinicName ? (
                            <span className="flex items-center gap-1">
                              <Building2 className="size-3" aria-hidden />
                              {a.clinicName}
                            </span>
                          ) : null}
                          <span>Kayıt: {dtf.format(new Date(a.createdAt))}</span>
                        </div>
                      </div>
                    </div>
                    {isPending ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          aria-label="Başvuruyu onayla"
                          loading={busy}
                          onClick={() => approve.mutate({ egitmenId: a.egitmenId })}
                        >
                          <Check className="size-4" aria-hidden />
                          Onayla
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          aria-label="Başvuruyu reddet"
                          disabled={busy}
                          onClick={() => setRejectFor(a.egitmenId)}
                        >
                          <X className="size-4" aria-hidden />
                          Reddet
                        </Button>
                      </div>
                    ) : null}
                  </div>

                  {rejectFor === a.egitmenId ? (
                    <form
                      className="mt-3 border-t border-border pt-3"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (reason.trim().length === 0) {
                          toast.error("Ret gerekçesi gereklidir.");
                          return;
                        }
                        reject.mutate({ egitmenId: a.egitmenId, reason: reason.trim() });
                      }}
                    >
                      <Label htmlFor={`reason-${a.egitmenId}`}>Ret gerekçesi</Label>
                      <Input
                        id={`reason-${a.egitmenId}`}
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
              );
            })}
          </ul>

          {totalPages > 1 ? (
            <div className="mt-5 flex items-center justify-between">
              <p className="text-xs text-text-3">
                {total} başvuru · sayfa {page}/{totalPages}
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
                  disabled={page >= totalPages}
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
