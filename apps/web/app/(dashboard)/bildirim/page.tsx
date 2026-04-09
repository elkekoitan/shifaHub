"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/layout/empty-state";
import { useApi, useApiMutation } from "@/hooks/use-api";
import {
  Bell,
  CalendarClock,
  CalendarCheck,
  CalendarX,
  Pill,
  FlaskConical,
  MessageSquare,
  GraduationCap,
  Settings,
  ShieldCheck,
  CheckCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Bildirim {
  id: string;
  type: string;
  title: string;
  body: string | null;
  isRead: boolean;
  actionUrl: string | null;
  createdAt: string;
}

interface TypeConfig {
  icon: LucideIcon;
  color: string;
  bg: string;
}

const typeConfig: Record<string, TypeConfig> = {
  randevu_hatirlatma: { icon: CalendarClock, color: "text-amber-600", bg: "bg-amber-50" },
  randevu_onay: { icon: CalendarCheck, color: "text-green-600", bg: "bg-green-50" },
  randevu_iptal: { icon: CalendarX, color: "text-red-600", bg: "bg-red-50" },
  tedavi_ozeti: { icon: Pill, color: "text-teal-600", bg: "bg-teal-50" },
  tahlil_sonucu: { icon: FlaskConical, color: "text-violet-600", bg: "bg-violet-50" },
  mesaj: { icon: MessageSquare, color: "text-blue-600", bg: "bg-blue-50" },
  egitmen_onay: { icon: GraduationCap, color: "text-primary", bg: "bg-primary/10" },
  sistem: { icon: Settings, color: "text-gray-600", bg: "bg-gray-100" },
  kvkk: { icon: ShieldCheck, color: "text-indigo-600", bg: "bg-indigo-50" },
};

const fallbackConfig: TypeConfig = { icon: Bell, color: "text-muted-foreground", bg: "bg-muted" };

export default function BildirimPage() {
  const { data: bildirimler, loading, refetch } = useApi<Bildirim[]>("/api/bildirim");
  const { mutate } = useApiMutation();

  async function markRead(id: string) {
    await mutate(`/api/bildirim/${id}/read`, {}, "PATCH");
    refetch();
  }

  const items = bildirimler ?? [];
  const okunmamis = items.filter((b) => !b.isRead);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-xl sm:text-2xl font-bold flex items-center gap-2">
          <Bell className="h-6 w-6 text-primary" />
          Bildirimler
          {okunmamis.length > 0 && (
            <Badge className="ml-1 bg-primary text-primary-foreground">
              {okunmamis.length} yeni
            </Badge>
          )}
        </h1>
        {okunmamis.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={async () => {
              await mutate("/api/bildirim/read-all", {}, "PATCH");
              refetch();
            }}
          >
            <CheckCheck className="h-4 w-4" />
            Tumunu Okundu Isaretle
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-start gap-3 py-4">
                <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-72" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Bildiriminiz bulunmuyor"
          description="Yeni bildirimler geldiginde burada gorunecek."
        />
      ) : (
        <div className="space-y-2">
          {items.map((b) => {
            const cfg = typeConfig[b.type] ?? fallbackConfig;
            const Icon = cfg.icon;
            return (
              <Card
                key={b.id}
                className={
                  b.isRead
                    ? "opacity-60 transition-opacity"
                    : "border-primary/30 shadow-sm transition-shadow"
                }
              >
                <CardContent className="flex items-start gap-3 py-3">
                  {/* Icon bubble */}
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${cfg.bg}`}
                  >
                    <Icon className={`h-4 w-4 ${cfg.color}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {!b.isRead && (
                            <span
                              className="inline-block h-2 w-2 rounded-full bg-primary shrink-0"
                              aria-label="Okunmamis"
                            />
                          )}
                          <p
                            className={`text-sm leading-snug ${b.isRead ? "text-muted-foreground" : "font-medium text-foreground"}`}
                          >
                            {b.title}
                          </p>
                        </div>
                        {b.body && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {b.body}
                          </p>
                        )}
                      </div>
                      {!b.isRead && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs shrink-0 text-muted-foreground hover:text-foreground"
                          onClick={() => markRead(b.id)}
                        >
                          Okundu
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(b.createdAt).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
