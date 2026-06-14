"use client";

import { useState } from "react";
import { MessageSquareHeart, Star, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

/**
 * Geri bildirim — danışan memnuniyet puanı (1-5) + yorum gönderir
 * (trpc.geriBildirim.create). RLS: yalnızca kendi gönderdiğini görür.
 */
export default function DanisanGeriBildirimPage() {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);
  const create = trpc.geriBildirim.create.useMutation();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      toast.error("Lütfen bir memnuniyet puanı seçin.");
      return;
    }
    try {
      await create.mutateAsync({ rating, comment: comment.trim() || undefined });
      setDone(true);
      toast.success("Geri bildiriminiz alındı. Teşekkürler!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gönderilemedi.");
    }
  }

  if (done) {
    return (
      <div className="px-5 pt-6">
        <div className="flex flex-col items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-card py-14 text-center shadow-[var(--shadow-sm)]">
          <span className="flex size-14 items-center justify-center rounded-full bg-success-bg text-success">
            <CheckCircle2 className="size-8" aria-hidden />
          </span>
          <h1 className="font-headline text-lg font-semibold text-foreground">Teşekkürler!</h1>
          <p className="max-w-xs text-sm text-text-2">
            Geri bildiriminiz bizim için değerli. Deneyiminizi iyileştirmek için kullanacağız.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setDone(false);
              setRating(0);
              setComment("");
            }}
          >
            Yeni geri bildirim
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pt-6">
      <header className="mb-6">
        <h1 className="font-headline text-xl font-semibold text-foreground">Geri bildirim</h1>
        <p className="mt-1 text-sm text-text-2">Deneyiminizi bizimle paylaşın.</p>
      </header>

      <form
        onSubmit={onSubmit}
        className="space-y-5 rounded-[var(--radius-lg)] border border-border bg-card p-5 shadow-[var(--shadow-sm)]"
      >
        <div className="space-y-2">
          <Label htmlFor="rating-group">Memnuniyet puanı</Label>
          <div
            id="rating-group"
            role="radiogroup"
            aria-label="Memnuniyet puanı"
            className="flex items-center gap-1.5"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} yıldız`}
                onClick={() => setRating(n)}
                className="flex size-10 items-center justify-center rounded-full transition-colors hover:bg-secondary"
              >
                <Star
                  className={
                    "size-6 transition-colors " +
                    (n <= rating ? "fill-accent-honey text-accent-honey" : "text-text-3")
                  }
                  aria-hidden
                />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="comment">Yorumunuz</Label>
          <textarea
            id="comment"
            rows={5}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Görüş, öneri veya şikayetinizi yazın"
            className="flex w-full rounded-[var(--radius)] border border-input bg-card px-3 py-2 text-sm text-foreground transition-colors placeholder:text-text-3 focus-visible:border-ring focus-visible:outline-none"
          />
        </div>

        <Button type="submit" className="w-full" loading={create.isPending}>
          <MessageSquareHeart className="size-4" aria-hidden />
          Gönder
        </Button>
      </form>
    </div>
  );
}
