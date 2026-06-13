"use client";

import { useState } from "react";
import { MessageCircle, ChevronLeft, Send, AlertCircle, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const timeFmt = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

interface ActiveThread {
  userId: string;
  name: string;
}

export default function DanisanMesajPage() {
  const me = useAuthStore((s) => s.user);
  const [active, setActive] = useState<ActiveThread | null>(null);

  if (active) {
    return <Thread thread={active} myId={me?.id ?? ""} onBack={() => setActive(null)} />;
  }
  return <ConversationList onOpen={setActive} />;
}

// ─── Konuşma listesi ─────────────────────────────────────────────────────────
function ConversationList({ onOpen }: { onOpen: (t: ActiveThread) => void }) {
  const list = trpc.mesaj.list.useQuery({ limit: 50 });
  const rows = list.data ?? [];

  return (
    <div className="px-5 pt-6">
      <header className="mb-5">
        <h1 className="font-headline text-xl font-semibold text-foreground">Mesajlar</h1>
        <p className="mt-1 text-sm text-text-2">Eğitmeninizle yazışmalarınız.</p>
      </header>

      {list.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-[var(--radius-lg)]" />
          ))}
        </div>
      ) : list.isError ? (
        <div className="flex items-center gap-2 rounded-[var(--radius)] border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" aria-hidden />
          Mesajlar yüklenemedi.
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-border bg-card p-8 text-center">
          <MessageCircle className="size-7 text-text-3" aria-hidden />
          <p className="text-sm text-text-2">Henüz bir mesajınız yok.</p>
          <p className="text-xs text-text-3">Eğitmeniniz size yazdığında burada görünür.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((m) => {
            const name = `${m.otherFirstName} ${m.otherLastName}`.trim() || "Kullanıcı";
            return (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => onOpen({ userId: m.otherUserId, name })}
                  className="flex w-full items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-card p-3 text-left shadow-[var(--shadow-sm)] transition-colors hover:bg-secondary"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
                    <UserIcon className="size-5" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{name}</p>
                    <p className="truncate text-xs text-text-2">{m.content}</p>
                  </div>
                  <span className="shrink-0 text-[10px] text-text-3">
                    {m.createdAt ? timeFmt.format(new Date(m.createdAt)) : ""}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ─── Tek konuşma görünümü ────────────────────────────────────────────────────
function Thread({
  thread,
  myId,
  onBack,
}: {
  thread: ActiveThread;
  myId: string;
  onBack: () => void;
}) {
  const utils = trpc.useUtils();
  const [text, setText] = useState("");
  const conv = trpc.mesaj.conversation.useQuery({ userId: thread.userId, limit: 100 });
  const send = trpc.mesaj.send.useMutation();

  // En eskiden yeniye sırala (query desc döner).
  const messages = [...(conv.data ?? [])].reverse();

  async function onSend() {
    const content = text.trim();
    if (!content) return;
    try {
      await send.mutateAsync({ receiverId: thread.userId, content });
      setText("");
      await utils.mesaj.conversation.invalidate({ userId: thread.userId, limit: 100 });
      void utils.mesaj.list.invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Mesaj gönderilemedi.");
    }
  }

  return (
    <div className="flex min-h-screen flex-col px-5 pt-6">
      <header className="mb-4 flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="Geri dön"
          className="flex size-9 items-center justify-center rounded-full text-text-2 transition-colors hover:bg-secondary"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </button>
        <h1 className="font-headline text-lg font-semibold text-foreground">{thread.name}</h1>
      </header>

      <div className="flex-1 space-y-2 pb-4">
        {conv.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="ml-auto h-10 w-2/3 rounded-[var(--radius-lg)]" />
            <Skeleton className="h-10 w-2/3 rounded-[var(--radius-lg)]" />
          </div>
        ) : conv.isError ? (
          <div className="flex items-center gap-2 rounded-[var(--radius)] border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" aria-hidden />
            Konuşma yüklenemedi.
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-border bg-card p-8 text-center">
            <MessageCircle className="size-7 text-text-3" aria-hidden />
            <p className="text-sm text-text-2">Henüz mesaj yok. İlk mesajı gönderin.</p>
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === myId;
            return (
              <div key={m.id} className={mine ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={
                    "max-w-[78%] rounded-[var(--radius-lg)] px-3.5 py-2 text-sm " +
                    (mine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")
                  }
                >
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  <p
                    className={
                      "mt-1 text-[10px] " + (mine ? "text-primary-foreground/70" : "text-text-3")
                    }
                  >
                    {m.createdAt ? timeFmt.format(new Date(m.createdAt)) : ""}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="safe-bottom sticky bottom-0 -mx-5 border-t border-border bg-background px-5 py-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void onSend();
          }}
          className="flex items-end gap-2"
        >
          <label htmlFor="mesaj-text" className="sr-only">
            Mesaj yaz
          </label>
          <textarea
            id="mesaj-text"
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Mesaj yazın"
            className="flex max-h-28 min-h-[44px] w-full resize-none rounded-[var(--radius)] border border-input bg-card px-3 py-2.5 text-sm text-foreground transition-colors placeholder:text-text-3 focus-visible:border-ring focus-visible:outline-none"
          />
          <Button
            type="submit"
            size="icon"
            aria-label="Gönder"
            loading={send.isPending}
            disabled={!text.trim()}
          >
            <Send className="size-4" aria-hidden />
          </Button>
        </form>
      </div>
    </div>
  );
}
