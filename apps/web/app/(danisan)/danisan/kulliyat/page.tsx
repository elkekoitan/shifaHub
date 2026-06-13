"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, BookOpen } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const suggestions = [
  "Hacamat hangi günlerde sünnettir?",
  "Sülük tedavisi kimlere uygulanmaz?",
  "Fitoterapi nedir, nasıl uygulanır?",
];

export default function KulliyatPage() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const ask = trpc.kulliyat.ask.useMutation();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length, ask.isPending]);

  async function send(q: string) {
    const question = q.trim();
    if (!question || ask.isPending) return;
    setMsgs((m) => [...m, { role: "user", content: question }]);
    setInput("");
    try {
      const res = await ask.mutateAsync({ question });
      setMsgs((m) => [...m, { role: "assistant", content: res.answer }]);
    } catch (e) {
      setMsgs((m) => [
        ...m,
        { role: "assistant", content: e instanceof Error ? e.message : "Bir hata oluştu." },
      ]);
    }
  }

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col px-5 pt-6">
      <header className="mb-4 flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-[var(--radius)] bg-primary text-primary-foreground">
          <Sparkles className="size-5" aria-hidden />
        </span>
        <div>
          <h1 className="font-headline text-xl font-semibold leading-tight text-foreground">
            Külliyat
          </h1>
          <p className="text-xs text-text-3">GETAT bilgi asistanı</p>
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto pb-4">
        {msgs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 pt-10 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-accent text-primary">
              <BookOpen className="size-6" aria-hidden />
            </span>
            <p className="max-w-xs text-sm text-text-2">
              Hacamat, sülük, sujok, refleksoloji, fitoterapi ve GETAT hakkında soru sorun.
            </p>
            <div className="mt-2 flex flex-col gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs text-text-2 transition-colors hover:border-primary/40 hover:text-primary"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          msgs.map((m, i) => (
            <div
              key={i}
              className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-[var(--radius-lg)] px-4 py-2.5 text-sm leading-relaxed",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card text-foreground shadow-[var(--shadow-sm)]",
                )}
              >
                {m.content}
              </div>
            </div>
          ))
        )}
        {ask.isPending ? (
          <div className="flex justify-start">
            <div className="rounded-[var(--radius-lg)] border border-border bg-card px-4 py-3">
              <Skeleton className="h-3 w-36" />
            </div>
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 border-t border-border bg-background py-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Sorunuzu yazın…"
          aria-label="Soru"
          className="h-11 flex-1 rounded-full border border-input bg-card px-4 text-sm text-foreground placeholder:text-text-3 focus-visible:border-ring focus-visible:outline-none"
        />
        <Button
          type="submit"
          size="icon"
          loading={ask.isPending}
          aria-label="Gönder"
          className="shrink-0 rounded-full"
        >
          {!ask.isPending ? <Send className="size-4" aria-hidden /> : null}
        </Button>
      </form>
      <p className="pb-2 text-center text-[10px] text-text-3">
        Bilgilendirme amaçlıdır; tıbbi teşhis yerine geçmez.
      </p>
    </div>
  );
}
