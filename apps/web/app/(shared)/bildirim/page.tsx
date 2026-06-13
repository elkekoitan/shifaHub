"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BellOff,
  CheckCheck,
  CalendarClock,
  CalendarCheck,
  CalendarX,
  FileText,
  FlaskConical,
  MessageCircle,
  UserCheck,
  Info,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";

/** Bildirim tipi → ikon eşlemesi (bildirim router'ındaki enum ile birebir). */
const typeIcon: Record<string, LucideIcon> = {
  randevu_hatirlatma: CalendarClock,
  randevu_onay: CalendarCheck,
  randevu_iptal: CalendarX,
  tedavi_ozeti: FileText,
  tahlil_sonucu: FlaskConical,
  mesaj: MessageCircle,
  egitmen_onay: UserCheck,
  sistem: Info,
  kvkk: ShieldCheck,
};

const dtf = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

export default function BildirimPage() {
  const utils = trpc.useUtils();
  const list = trpc.bildirim.list.useQuery({ limit: 100 });
  const markRead = trpc.bildirim.markRead.useMutation({
    onSuccess: () => {
      void utils.bildirim.list.invalidate();
      void utils.bildirim.unreadCount.invalidate();
    },
  });
  const markAllRead = trpc.bildirim.markAllRead.useMutation({
    onSuccess: () => {
      void utils.bildirim.list.invalidate();
      void utils.bildirim.unreadCount.invalidate();
      toast.success("Tüm bildirimler okundu işaretlendi");
    },
    onError: (e) => toast.error(e.message ?? "İşlem başarısız"),
  });

  const rows = list.data ?? [];
  const hasUnread = rows.some((r) => !r.isRead);

  return (
    <div className="px-5 pt-6">
      <header className="mb-5">
        <Link
          href="/giris"
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-text-3"
        >
          <ArrowLeft className="size-3.5" aria-hidden /> Geri
        </Link>
        <div className="flex items-end justify-between gap-3">
          <h1 className="font-headline text-xl font-semibold text-foreground">Bildirimler</h1>
          {hasUnread ? (
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              aria-label="Tüm bildirimleri okundu işaretle"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary disabled:opacity-50"
            >
              <CheckCheck className="size-4" aria-hidden /> Tümünü okundu işaretle
            </button>
          ) : null}
        </div>
      </header>

      {list.isLoading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[68px] w-full rounded-[var(--radius-lg)]" />
          ))}
        </div>
      ) : list.isError ? (
        <div className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-destructive-border bg-destructive-bg p-7 text-center">
          <Info className="size-6 text-destructive" aria-hidden />
          <p className="text-sm text-destructive">Bildirimler yüklenemedi.</p>
          <button
            type="button"
            onClick={() => void list.refetch()}
            className="text-xs font-medium text-primary"
          >
            Tekrar dene
          </button>
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-border bg-card p-10 text-center">
          <BellOff className="size-7 text-text-3" aria-hidden />
          <p className="text-sm font-medium text-foreground">Henüz bildirimin yok</p>
          <p className="text-xs text-text-3">Yeni bir gelişme olduğunda burada görünecek.</p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {rows.map((n) => {
            const Icon = typeIcon[n.type] ?? Info;
            const unread = !n.isRead;
            return (
              <li key={n.id}>
                <div
                  className={
                    "flex items-start gap-3 rounded-[var(--radius-lg)] border p-3.5 transition-colors " +
                    (unread ? "border-border bg-accent/40" : "border-border bg-card")
                  }
                >
                  <div
                    className={
                      "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full " +
                      (unread ? "bg-primary text-primary-foreground" : "bg-muted text-text-3")
                    }
                  >
                    <Icon className="size-4" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">{n.title}</p>
                      {unread ? (
                        <span
                          className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                          aria-label="Okunmadı"
                        />
                      ) : null}
                    </div>
                    {n.body ? (
                      <p className="mt-0.5 line-clamp-2 text-xs text-text-2">{n.body}</p>
                    ) : null}
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-text-3">
                        {n.createdAt ? dtf.format(new Date(n.createdAt)) : ""}
                      </span>
                      {unread ? (
                        <button
                          type="button"
                          onClick={() => markRead.mutate({ id: n.id })}
                          disabled={markRead.isPending}
                          aria-label={`"${n.title}" bildirimini okundu işaretle`}
                          className="text-[11px] font-medium text-primary disabled:opacity-50"
                        >
                          Okundu işaretle
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
