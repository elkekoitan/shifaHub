"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Clock, Save, Plus, Trash2, CalendarOff, ChevronDown } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";

/** dayOfWeek: 0=Pazar … 6=Cumartesi (backend ile birebir). */
const DAYS = [
  { value: 1, label: "Pazartesi" },
  { value: 2, label: "Salı" },
  { value: 3, label: "Çarşamba" },
  { value: 4, label: "Perşembe" },
  { value: 5, label: "Cuma" },
  { value: 6, label: "Cumartesi" },
  { value: 0, label: "Pazar" },
] as const;

interface SlotRow {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  isActive: boolean;
}

export default function EgitmenMusaitlikPage() {
  const userId = useAuthStore((s) => s.user?.id);
  const utils = trpc.useUtils();
  const availability = trpc.musaitlik.getAvailability.useQuery(
    { egitmenId: userId ?? "" },
    { enabled: Boolean(userId) },
  );
  const save = trpc.musaitlik.setAvailability.useMutation({
    onSuccess: () => {
      toast.success("Müsaitlik kaydedildi");
      void utils.musaitlik.getAvailability.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const [slots, setSlots] = useState<SlotRow[]>([]);

  // Sunucudan gelen aktif slotlari forma yukle.
  useEffect(() => {
    if (!availability.data) return;
    setSlots(
      availability.data.slots.map((s) => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        slotDuration: s.slotDuration ?? 60,
        isActive: s.isActive ?? true,
      })),
    );
  }, [availability.data]);

  function addSlot() {
    setSlots((prev) => [
      ...prev,
      { dayOfWeek: 1, startTime: "09:00", endTime: "17:00", slotDuration: 60, isActive: true },
    ]);
  }

  function updateSlot(idx: number, patch: Partial<SlotRow>) {
    setSlots((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }

  function removeSlot(idx: number) {
    setSlots((prev) => prev.filter((_, i) => i !== idx));
  }

  function onSave() {
    for (const s of slots) {
      if (s.endTime <= s.startTime) {
        toast.error("Bitiş saati başlangıçtan sonra olmalı.");
        return;
      }
    }
    save.mutate({ slots });
  }

  return (
    <div className="px-5 pt-6">
      <header className="mb-4">
        <p className="text-xs text-text-3">Eğitmen paneli</p>
        <h1 className="font-headline text-xl font-semibold text-foreground">Haftalık müsaitlik</h1>
        <p className="mt-1 text-sm text-text-2">
          Çalışma günleriniz ve saatleriniz; danışanlar bu aralıklarda randevu alır.
        </p>
      </header>

      {availability.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <>
          {slots.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-border bg-card p-8 text-center">
              <CalendarOff className="size-7 text-text-3" aria-hidden />
              <p className="text-sm text-text-2">Henüz müsaitlik tanımlanmamış.</p>
              <p className="text-xs text-text-3">Aşağıdan bir aralık ekleyin.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {slots.map((slot, idx) => (
                <li
                  key={idx}
                  className="rounded-[var(--radius-lg)] border border-border bg-card p-4 shadow-[var(--shadow-sm)]"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex-1 space-y-1.5">
                      <Label htmlFor={`day-${idx}`}>Gün</Label>
                      <div className="relative">
                        <select
                          id={`day-${idx}`}
                          value={slot.dayOfWeek}
                          onChange={(e) => updateSlot(idx, { dayOfWeek: Number(e.target.value) })}
                          className="h-11 w-full appearance-none rounded-[var(--radius)] border border-input bg-card px-3 pr-9 text-sm text-foreground focus-visible:border-ring focus-visible:outline-none"
                        >
                          {DAYS.map((d) => (
                            <option key={d.value} value={d.value}>
                              {d.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-text-3"
                          aria-hidden
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSlot(idx)}
                      aria-label="Aralığı sil"
                      className="ml-3 mt-6 flex size-10 items-center justify-center rounded-[var(--radius)] text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1.5">
                      <Label htmlFor={`start-${idx}`}>Başlangıç</Label>
                      <Input
                        id={`start-${idx}`}
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => updateSlot(idx, { startTime: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`end-${idx}`}>Bitiş</Label>
                      <Input
                        id={`end-${idx}`}
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => updateSlot(idx, { endTime: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`dur-${idx}`}>Süre (dk)</Label>
                      <Input
                        id={`dur-${idx}`}
                        type="number"
                        inputMode="numeric"
                        min={5}
                        value={slot.slotDuration}
                        onChange={(e) =>
                          updateSlot(idx, { slotDuration: Number(e.target.value) || 60 })
                        }
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={addSlot}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-[var(--radius)] border border-dashed border-border bg-card px-4 py-3 text-sm font-medium text-text-2 transition-colors hover:bg-secondary"
          >
            <Plus className="size-4" aria-hidden /> Aralık ekle
          </button>

          <Button
            className="mt-4 w-full"
            loading={save.isPending}
            onClick={onSave}
            aria-label="Müsaitliği kaydet"
          >
            <Save className="size-4" aria-hidden /> Kaydet
          </Button>

          {/* Bilgilendirici dolu aralik ozeti */}
          {availability.data && availability.data.busySlots.length > 0 ? (
            <div className="mt-4 flex items-center gap-2">
              <StatusBadge tone="info" icon={Clock}>
                {availability.data.busySlots.length} dolu aralık
              </StatusBadge>
              <span className="text-xs text-text-3">Önümüzdeki 2 haftada.</span>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
