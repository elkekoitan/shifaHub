"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Package, Plus, X, PackageX, AlertTriangle, CalendarClock, Inbox } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORIES = [
  { value: "kupa", label: "Kupa" },
  { value: "suluk", label: "Sülük" },
  { value: "sarf", label: "Sarf" },
  { value: "bitkisel", label: "Bitkisel" },
  { value: "igne", label: "İğne" },
  { value: "diger", label: "Diğer" },
] as const;

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label]),
);

type Category = (typeof CATEGORIES)[number]["value"];

export default function EgitmenStokPage() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "sarf" as Category,
    quantity: "",
    unit: "adet",
    minimumLevel: "",
    unitPrice: "",
  });

  const utils = trpc.useUtils();
  const list = trpc.stok.list.useQuery();
  const create = trpc.stok.create.useMutation({
    onSuccess: () => {
      toast.success("Stok kalemi eklendi");
      void utils.stok.list.invalidate();
      void utils.stok.getCriticalStock.invalidate();
      setOpen(false);
      setForm({
        name: "",
        category: "sarf",
        quantity: "",
        unit: "adet",
        minimumLevel: "",
        unitPrice: "",
      });
    },
    onError: (e) => toast.error(e.message),
  });

  function submit() {
    if (!form.name.trim()) {
      toast.error("Ürün adı zorunlu.");
      return;
    }
    create.mutate({
      name: form.name.trim(),
      category: form.category,
      quantity: Number(form.quantity) || 0,
      unit: form.unit || "adet",
      minimumLevel: form.minimumLevel ? Number(form.minimumLevel) : undefined,
      unitPrice: form.unitPrice ? Number(form.unitPrice) : undefined,
    });
  }

  const criticalCount = (list.data ?? []).filter((s) => s.isCritical).length;

  return (
    <div className="px-5 pt-6">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-text-3">Eğitmen paneli</p>
          <h1 className="font-headline text-xl font-semibold text-foreground">Stok yönetimi</h1>
        </div>
        <Button size="sm" onClick={() => setOpen((o) => !o)} aria-label="Yeni stok kalemi">
          {open ? <X className="size-4" aria-hidden /> : <Plus className="size-4" aria-hidden />}
          {open ? "Kapat" : "Ekle"}
        </Button>
      </header>

      {/* Kritik uyari ozeti */}
      {criticalCount > 0 ? (
        <div className="mb-4 flex items-center gap-2 rounded-[var(--radius)] border border-warning/30 bg-warning/5 px-4 py-2.5 text-sm text-warning">
          <PackageX className="size-4 shrink-0" aria-hidden />
          {criticalCount} kalem kritik seviyede.
        </div>
      ) : null}

      {/* Ekleme formu */}
      {open ? (
        <div className="mb-5 rounded-[var(--radius-lg)] border border-border bg-card p-4 shadow-[var(--shadow-sm)]">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Ürün adı</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Örn. Kupa seti"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="category">Kategori</Label>
                <select
                  id="category"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as Category }))}
                  className="h-11 w-full rounded-[var(--radius)] border border-input bg-card px-3 text-sm text-foreground focus-visible:border-ring focus-visible:outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="unit">Birim</Label>
                <Input
                  id="unit"
                  value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                  placeholder="adet"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="quantity">Miktar</Label>
                <Input
                  id="quantity"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="min">Min. seviye</Label>
                <Input
                  id="min"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={form.minimumLevel}
                  onChange={(e) => setForm((f) => ({ ...f, minimumLevel: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="price">Birim ₺</Label>
                <Input
                  id="price"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={form.unitPrice}
                  onChange={(e) => setForm((f) => ({ ...f, unitPrice: e.target.value }))}
                />
              </div>
            </div>
            <Button className="w-full" loading={create.isPending} onClick={submit}>
              Kalemi kaydet
            </Button>
          </div>
        </div>
      ) : null}

      {/* Stok listesi */}
      {list.isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : list.isError ? (
        <p className="rounded-[var(--radius)] bg-muted p-4 text-sm text-destructive">
          Stok listesi yüklenemedi.
        </p>
      ) : !list.data || list.data.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-border bg-card p-8 text-center">
          <Inbox className="size-7 text-text-3" aria-hidden />
          <p className="text-sm text-text-2">Henüz stok kalemi yok.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {list.data.map((s) => (
            <li
              key={s.id}
              className={
                "flex items-center gap-3 rounded-[var(--radius)] border p-3 " +
                (s.isCritical ? "border-warning/30 bg-warning/5" : "border-border bg-card")
              }
            >
              <div
                className={
                  "flex size-10 shrink-0 items-center justify-center rounded-[var(--radius)] " +
                  (s.isCritical ? "bg-warning/15 text-warning" : "bg-muted text-text-2")
                }
              >
                <Package className="size-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{s.name}</p>
                <p className="flex items-center gap-1.5 text-xs text-text-3">
                  {CATEGORY_LABELS[s.category] ?? s.category}
                  {s.isExpiringSoon ? (
                    <span className="flex items-center gap-0.5 text-warning">
                      <CalendarClock className="size-3" aria-hidden /> SKT yakın
                    </span>
                  ) : null}
                  {s.isExpired ? (
                    <span className="flex items-center gap-0.5 text-destructive">
                      <AlertTriangle className="size-3" aria-hidden /> SKT geçti
                    </span>
                  ) : null}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p
                  className={
                    "text-sm font-semibold " + (s.isCritical ? "text-warning" : "text-foreground")
                  }
                >
                  {s.quantity} {s.unit}
                </p>
                {s.isCritical ? (
                  <p className="text-[10px] font-medium text-warning">Kritik</p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
