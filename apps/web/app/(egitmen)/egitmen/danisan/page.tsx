"use client";

import Link from "next/link";
import { Users, ChevronRight, UserPlus, MapPin } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";

function initials(first?: string | null, last?: string | null): string {
  return `${(first ?? "").charAt(0)}${(last ?? "").charAt(0)}`.toUpperCase() || "?";
}

export default function EgitmenDanisanlarPage() {
  const q = trpc.egitmen.danisanlarim.useQuery();

  return (
    <div className="px-5 pt-6">
      <header className="mb-5">
        <p className="text-xs text-text-3">Eğitmen paneli</p>
        <h1 className="font-headline text-xl font-semibold text-foreground">Danışanlarım</h1>
        <p className="mt-1 text-sm text-text-2">Takip ettiğiniz danışanlar ve klinik bilgileri.</p>
      </header>

      {q.isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : q.isError ? (
        <p className="rounded-[var(--radius)] bg-muted p-4 text-sm text-destructive">
          Danışan listesi yüklenemedi.
        </p>
      ) : !q.data || q.data.count === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-border bg-card p-8 text-center">
          <UserPlus className="size-7 text-text-3" aria-hidden />
          <p className="text-sm text-text-2">Henüz danışanınız yok.</p>
          <p className="text-xs text-text-3">
            Randevu veya tedavi oluşturduğunuzda danışanlar burada listelenir.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-3">
            <StatusBadge tone="primary" icon={Users}>
              {q.data.count} danışan
            </StatusBadge>
          </div>
          <ul className="space-y-2">
            {q.data.danisanlar.map((d) => (
              <li key={d.userId}>
                <Link
                  href={`/egitmen/danisan/${d.userId}`}
                  className="flex items-center gap-3 rounded-[var(--radius)] border border-border bg-card p-3 transition-colors hover:bg-secondary"
                >
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-primary">
                    {initials(d.firstName, d.lastName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {d.firstName} {d.lastName}
                    </p>
                    <p className="flex items-center gap-1 truncate text-xs text-text-3">
                      {d.city ? (
                        <>
                          <MapPin className="size-3" aria-hidden /> {d.city}
                        </>
                      ) : (
                        (d.mainComplaints?.[0] ?? d.email)
                      )}
                    </p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-text-3" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
