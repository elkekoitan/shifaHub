"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

/**
 * Okunmamış bildirim rozetli zil — `/bildirim` merkezine bağlanır. 60 sn'de bir
 * sayacı tazeler. bildirim.unreadCount RLS kapsamında çalışır (kullanıcının kendi).
 */
export function NotificationBell({ className }: { className?: string }) {
  const unread = trpc.bildirim.unreadCount.useQuery(undefined, {
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
  const count = unread.data?.count ?? 0;

  return (
    <Link
      href="/bildirim"
      aria-label={count > 0 ? `Bildirimler (${count} okunmamış)` : "Bildirimler"}
      className={cn(
        "relative inline-flex size-10 items-center justify-center rounded-full text-text-2 transition-colors hover:bg-secondary hover:text-foreground",
        className,
      )}
    >
      <Bell className="size-5" aria-hidden />
      {count > 0 ? (
        <span className="absolute right-1 top-1 flex min-w-[1.1rem] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}
