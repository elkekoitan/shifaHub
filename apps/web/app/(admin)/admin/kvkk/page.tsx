"use client";

import { useState } from "react";
import {
  AlertCircle,
  ScrollText,
  ChevronLeft,
  ChevronRight,
  FilePlus2,
  Eye,
  Pencil,
  Trash2,
  LogIn,
  LogOut,
  Download,
  ShieldPlus,
  ShieldMinus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, type BadgeTone } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

type Action =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "login"
  | "logout"
  | "export"
  | "consent_granted"
  | "consent_revoked";

type ActionFilter = "all" | Action;

const ACTION_META: Record<Action, { label: string; icon: LucideIcon; tone: BadgeTone }> = {
  create: { label: "Oluşturma", icon: FilePlus2, tone: "success" },
  read: { label: "Okuma", icon: Eye, tone: "neutral" },
  update: { label: "Güncelleme", icon: Pencil, tone: "primary" },
  delete: { label: "Silme", icon: Trash2, tone: "danger" },
  login: { label: "Giriş", icon: LogIn, tone: "info" },
  logout: { label: "Çıkış", icon: LogOut, tone: "neutral" },
  export: { label: "Dışa aktarma", icon: Download, tone: "warning" },
  consent_granted: { label: "Rıza verildi", icon: ShieldPlus, tone: "success" },
  consent_revoked: { label: "Rıza geri çekildi", icon: ShieldMinus, tone: "danger" },
};

const TONE_ICON: Record<BadgeTone, string> = {
  success: "text-success",
  warning: "text-warning",
  danger: "text-destructive",
  info: "text-info",
  primary: "text-primary",
  neutral: "text-text-2",
};

const FILTERS: { value: ActionFilter; label: string }[] = [
  { value: "all", label: "Tümü" },
  { value: "consent_granted", label: "Rıza verildi" },
  { value: "consent_revoked", label: "Rıza geri çekildi" },
  { value: "export", label: "Dışa aktarma" },
  { value: "delete", label: "Silme" },
  { value: "update", label: "Güncelleme" },
];

const PAGE_SIZE = 30;

const dtf = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default function KvkkAuditPage() {
  const [action, setAction] = useState<ActionFilter>("all");
  const [offset, setOffset] = useState(0);

  const logs = trpc.kvkk.listAuditLogs.useQuery({
    limit: PAGE_SIZE,
    offset,
    ...(action !== "all" ? { action } : {}),
  });

  function changeFilter(next: ActionFilter) {
    setAction(next);
    setOffset(0);
  }

  const items = logs.data?.items ?? [];
  const total = logs.data?.total ?? 0;
  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <header className="mb-5">
        <h1 className="font-headline text-2xl font-semibold text-foreground">KVKK denetim izi</h1>
        <p className="mt-1.5 text-sm text-text-2">
          Kişisel veri erişim ve rıza olaylarının değiştirilemez denetim kaydı.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Olay türü filtresi">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            role="tab"
            aria-selected={action === f.value}
            onClick={() => changeFilter(f.value)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              action === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-text-2 hover:bg-accent",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {logs.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-[var(--radius)]" />
          ))}
        </div>
      ) : logs.isError ? (
        <div className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-destructive-border bg-card p-8 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-destructive-bg">
            <AlertCircle className="size-5 text-destructive" aria-hidden />
          </span>
          <p className="text-sm text-text-2">Denetim kayıtları yüklenemedi.</p>
          <button
            type="button"
            onClick={() => logs.refetch()}
            className="text-sm font-medium text-primary hover:underline"
          >
            Tekrar dene
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-border bg-card p-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted">
            <ScrollText className="size-6 text-text-3" aria-hidden />
          </span>
          <p className="text-sm font-medium text-foreground">Denetim kaydı yok</p>
          <p className="text-xs text-text-3">Bu filtreye uyan kayıt bulunmuyor.</p>
        </div>
      ) : (
        <>
          <ul className="space-y-2">
            {items.map((log) => {
              const meta = ACTION_META[log.action as Action];
              const Icon = meta?.icon ?? ScrollText;
              return (
                <li
                  key={log.id}
                  className="flex items-start gap-3 rounded-[var(--radius)] border border-border bg-card p-4"
                >
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Icon
                      className={cn("size-4", meta ? TONE_ICON[meta.tone] : "text-text-2")}
                      aria-hidden
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone={meta?.tone ?? "neutral"} icon={meta?.icon}>
                        {meta?.label ?? log.action}
                      </StatusBadge>
                      <StatusBadge tone="neutral">{log.tableName}</StatusBadge>
                    </div>
                    {log.description ? (
                      <p className="mt-0.5 text-xs text-text-2">{log.description}</p>
                    ) : null}
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-text-3">
                      <span>{dtf.format(new Date(log.createdAt))}</span>
                      {log.userId ? (
                        <span className="font-mono">kullanıcı: {log.userId.slice(0, 8)}…</span>
                      ) : null}
                      {log.ipAddress ? <span>IP: {log.ipAddress}</span> : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-5 flex items-center justify-between">
            <p className="text-xs text-text-3">
              {total} kayıt · sayfa {page}/{totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                aria-label="Önceki sayfa"
                disabled={offset <= 0}
                onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
              >
                <ChevronLeft className="size-4" aria-hidden />
              </Button>
              <Button
                size="sm"
                variant="outline"
                aria-label="Sonraki sayfa"
                disabled={offset + PAGE_SIZE >= total}
                onClick={() => setOffset((o) => o + PAGE_SIZE)}
              >
                <ChevronRight className="size-4" aria-hidden />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
