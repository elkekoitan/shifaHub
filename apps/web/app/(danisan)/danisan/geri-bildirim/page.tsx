"use client";

import { useState } from "react";
import { MessageSquareHeart, Star, Info } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

/**
 * Geri bildirim sayfası — backend'de henüz bir "geri bildirim" prosedürü yok.
 * Rota derlenebilir kalsın diye temiz başlıklı bir form + bilgilendirme placeholder'ı
 * gösterilir; gönderim prosedürü eklendiğinde mutation buraya bağlanır.
 */
export default function DanisanGeriBildirimPage() {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Prosedür hazır olmadığından gönderim devre dışı; kullanıcı bilgilendirilir.
    toast.info("Geri bildirim gönderimi yakında aktif olacak. Teşekkürler!");
  }

  return (
    <div className="px-5 pt-6">
      <header className="mb-6">
        <h1 className="font-headline text-xl font-semibold text-foreground">Geri bildirim</h1>
        <p className="mt-1 text-sm text-text-2">Deneyiminizi bizimle paylaşın.</p>
      </header>

      <div className="mb-5 flex items-start gap-2 rounded-[var(--radius)] border border-info-border bg-info-bg p-4 text-xs text-info">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>
          Geri bildirim gönderimi şu an hazırlık aşamasında. Formu doldurabilirsiniz; gönderim
          özelliği yakında etkinleştirilecek.
        </span>
      </div>

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

        <Button type="submit" className="w-full">
          <MessageSquareHeart className="size-4" aria-hidden />
          Gönder
        </Button>
      </form>
    </div>
  );
}
