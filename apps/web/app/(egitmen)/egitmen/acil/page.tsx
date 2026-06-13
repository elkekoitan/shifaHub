"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Siren, ChevronDown, Inbox, AlertTriangle, Plus, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

const dtf = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const SEVERITY_LABELS: Record<number, string> = {
  1: "Düşük",
  2: "Hafif",
  3: "Orta",
  4: "Yüksek",
  5: "Yaşamsal",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Açık",
  following: "Takipte",
  resolved: "Çözüldü",
};
const statusTone: Record<string, string> = {
  open: "bg-destructive/10 text-destructive",
  following: "bg-warning/10 text-warning",
  resolved: "bg-success/10 text-success",
};

function severityTone(sev: number): string {
  if (sev >= 4) return "bg-destructive/10 text-destructive";
  if (sev === 3) return "bg-warning/10 text-warning";
  return "bg-muted text-text-2";
}

export default function EgitmenAcilPage() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    danisanId: "",
    type: "",
    description: "",
    severity: 3,
  });

  const utils = trpc.useUtils();
  const danisanlar = trpc.egitmen.danisanlarim.useQuery();
  const list = trpc.acil.list.useQuery({ limit: 50 });
  const report = trpc.acil.report.useMutation({
    onSuccess: () => {
      toast.success("Acil durum bildirildi");
      void utils.acil.list.invalidate();
      setOpen(false);
      setForm({ danisanId: "", type: "", description: "", severity: 3 });
    },
    onError: (e) => toast.error(e.message),
  });

  function submit() {
    if (!form.danisanId) {
      toast.error("Danışan seçin.");
      return;
    }
    if (!form.type.trim() || !form.description.trim()) {
      toast.error("Tür ve açıklama zorunlu.");
      return;
    }
    report.mutate({
      danisanId: form.danisanId,
      type: form.type.trim(),
      description: form.description.trim(),
      severity: form.severity,
    });
  }

  return (
    <div className="px-5 pt-6">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-text-3">Eğitmen paneli</p>
          <h1 className="font-headline text-xl font-semibold text-foreground">
            Acil durum & Komplikasyon
          </h1>
        </div>
        <Button
          size="sm"
          variant={open ? "outline" : "destructive"}
          onClick={() => setOpen((o) => !o)}
          aria-label="Acil durum bildir"
        >
          {open ? <X className="size-4" aria-hidden /> : <Plus className="size-4" aria-hidden />}
          {open ? "Kapat" : "Bildir"}
        </Button>
      </header>

      {/* Rapor formu */}
      {open ? (
        <div className="mb-5 rounded-[var(--radius-lg)] border border-destructive/30 bg-destructive/5 p-4">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="danisan">Danışan</Label>
              <div className="relative">
                <select
                  id="danisan"
                  value={form.danisanId}
                  onChange={(e) => setForm((f) => ({ ...f, danisanId: e.target.value }))}
                  className="h-11 w-full appearance-none rounded-[var(--radius)] border border-input bg-card px-3 pr-9 text-sm text-foreground focus-visible:border-ring focus-visible:outline-none"
                >
                  <option value="">Danışan seçin…</option>
                  {danisanlar.data?.danisanlar.map((d) => (
                    <option key={d.userId} value={d.userId}>
                      {d.firstName} {d.lastName}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-text-3"
                  aria-hidden
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="type">Durum türü</Label>
              <Input
                id="type"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                placeholder="Örn. Aşırı kanama"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="desc">Açıklama</Label>
              <textarea
                id="desc"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Gözlem ve müdahale…"
                className="flex w-full rounded-[var(--radius)] border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-text-3 focus-visible:border-ring focus-visible:outline-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sev">
                Şiddet:{" "}
                <span className="font-semibold text-foreground">
                  {form.severity} · {SEVERITY_LABELS[form.severity]}
                </span>
              </Label>
              <input
                id="sev"
                type="range"
                min={1}
                max={5}
                step={1}
                value={form.severity}
                onChange={(e) => setForm((f) => ({ ...f, severity: Number(e.target.value) }))}
                className="w-full accent-[hsl(var(--shadow-color))]"
                aria-valuetext={SEVERITY_LABELS[form.severity]}
              />
              {form.severity >= 4 ? (
                <p className="flex items-center gap-1 text-xs text-destructive">
                  <AlertTriangle className="size-3.5" aria-hidden /> Yüksek şiddet — sorumlu tabip
                  bilgilendirilir.
                </p>
              ) : null}
            </div>
            <Button
              variant="destructive"
              className="w-full"
              loading={report.isPending}
              onClick={submit}
            >
              Acil durumu bildir
            </Button>
          </div>
        </div>
      ) : null}

      {/* Triyaj listesi */}
      {list.isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : list.isError ? (
        <p className="rounded-[var(--radius)] bg-muted p-4 text-sm text-destructive">
          Kayıtlar yüklenemedi.
        </p>
      ) : !list.data || list.data.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-border bg-card p-8 text-center">
          <Inbox className="size-7 text-text-3" aria-hidden />
          <p className="text-sm text-text-2">Acil durum kaydı yok.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {list.data.map((k) => (
            <li
              key={k.id}
              className="rounded-[var(--radius-lg)] border border-border bg-card p-4 shadow-[var(--shadow-sm)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate text-sm font-medium text-foreground">
                    <Siren className="size-4 shrink-0 text-destructive" aria-hidden />
                    {k.type}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-text-3">{k.description}</p>
                  <p className="mt-1 text-[11px] text-text-3">
                    {k.createdAt ? dtf.format(new Date(k.createdAt)) : ""}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span
                    className={
                      "rounded-full px-2.5 py-1 text-[10px] font-medium " + severityTone(k.severity)
                    }
                  >
                    Sev {k.severity}
                  </span>
                  <span
                    className={
                      "rounded-full px-2.5 py-1 text-[10px] font-medium " +
                      (statusTone[k.status ?? ""] ?? "bg-muted text-text-2")
                    }
                  >
                    {k.status ? (STATUS_LABELS[k.status] ?? k.status) : ""}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
