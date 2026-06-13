"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MessageCircle, Inbox, ArrowLeft, Send } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/stores/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const timeFmt = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function initials(first?: string | null, last?: string | null): string {
  return `${(first ?? "").charAt(0)}${(last ?? "").charAt(0)}`.toUpperCase() || "?";
}

export default function EgitmenMesajPage() {
  const userId = useAuthStore((s) => s.user?.id);
  const [active, setActive] = useState<{ id: string; name: string } | null>(null);
  const [draft, setDraft] = useState("");

  const utils = trpc.useUtils();
  const conversations = trpc.mesaj.list.useQuery({ limit: 50 });
  const thread = trpc.mesaj.conversation.useQuery(
    { userId: active?.id ?? "", limit: 100 },
    { enabled: Boolean(active) },
  );
  const send = trpc.mesaj.send.useMutation({
    onSuccess: () => {
      setDraft("");
      void utils.mesaj.conversation.invalidate();
      void utils.mesaj.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  function onSend() {
    if (!active || !draft.trim()) return;
    send.mutate({ receiverId: active.id, content: draft.trim() });
  }

  // ─── Konusma detayi gorunumu ───────────────────────────────────────────────
  if (active) {
    const ordered = [...(thread.data ?? [])].sort(
      (a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime(),
    );
    return (
      <div className="flex min-h-screen flex-col px-5 pt-6">
        <header className="mb-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActive(null)}
            aria-label="Konuşmalara dön"
            className="flex size-9 items-center justify-center rounded-[var(--radius)] bg-muted text-text-2 transition-colors hover:bg-secondary"
          >
            <ArrowLeft className="size-4" aria-hidden />
          </button>
          <h1 className="font-headline text-lg font-semibold text-foreground">{active.name}</h1>
        </header>

        <div className="flex-1 space-y-2 pb-24">
          {thread.isLoading ? (
            <>
              <Skeleton className="ml-auto h-10 w-2/3" />
              <Skeleton className="h-10 w-2/3" />
            </>
          ) : ordered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-border bg-card p-6 text-center">
              <MessageCircle className="size-6 text-text-3" aria-hidden />
              <p className="text-sm text-text-2">Henüz mesaj yok. İlk mesajı yazın.</p>
            </div>
          ) : (
            ordered.map((m) => {
              const mine = m.senderId === userId;
              return (
                <div
                  key={m.id}
                  className={
                    "max-w-[80%] rounded-[var(--radius-lg)] px-3.5 py-2 text-sm " +
                    (mine
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "bg-muted text-foreground")
                  }
                >
                  <p>{m.content}</p>
                  <p
                    className={
                      "mt-0.5 text-[10px] " + (mine ? "text-primary-foreground/70" : "text-text-3")
                    }
                  >
                    {m.createdAt ? timeFmt.format(new Date(m.createdAt)) : ""}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Gonderme alani */}
        <div className="glass safe-bottom fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-t border-border p-3 md:max-w-3xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSend();
            }}
            className="flex items-center gap-2"
          >
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Mesaj yazın…"
              aria-label="Mesaj"
            />
            <Button
              type="submit"
              size="icon"
              loading={send.isPending}
              disabled={!draft.trim()}
              aria-label="Gönder"
            >
              <Send className="size-4" aria-hidden />
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // ─── Konusma listesi gorunumu ──────────────────────────────────────────────
  return (
    <div className="px-5 pt-6">
      <header className="mb-4">
        <p className="text-xs text-text-3">Eğitmen paneli</p>
        <h1 className="font-headline text-xl font-semibold text-foreground">Mesajlar</h1>
      </header>

      {conversations.isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : conversations.isError ? (
        <p className="rounded-[var(--radius)] bg-muted p-4 text-sm text-destructive">
          Mesajlar yüklenemedi.
        </p>
      ) : !conversations.data || conversations.data.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-border bg-card p-8 text-center">
          <Inbox className="size-7 text-text-3" aria-hidden />
          <p className="text-sm text-text-2">Henüz mesajınız yok.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {conversations.data.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() =>
                  setActive({
                    id: c.otherUserId,
                    name: `${c.otherFirstName} ${c.otherLastName}`.trim() || "Danışan",
                  })
                }
                className="flex w-full items-center gap-3 rounded-[var(--radius)] border border-border bg-card p-3 text-left transition-colors hover:bg-secondary"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-primary">
                  {initials(c.otherFirstName, c.otherLastName)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {`${c.otherFirstName} ${c.otherLastName}`.trim() || "Danışan"}
                  </p>
                  <p className="truncate text-xs text-text-3">{c.content}</p>
                </div>
                <span className="shrink-0 text-[10px] text-text-3">
                  {c.createdAt ? timeFmt.format(new Date(c.createdAt)) : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
