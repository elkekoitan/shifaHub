"use client";

import { useState } from "react";
import { Search, GraduationCap, MapPin, Stethoscope, AlertTriangle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

function initialsOf(first?: string | null, last?: string | null) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "ŞH";
}

export default function DanisanEgitmenPage() {
  const [query, setQuery] = useState("");
  const egitmenList = trpc.egitmen.liste.useQuery();

  const term = query.trim().toLocaleLowerCase("tr-TR");
  const all = egitmenList.data ?? [];
  const filtered = term
    ? all.filter((e) => {
        const name = `${e.firstName} ${e.lastName}`.toLocaleLowerCase("tr-TR");
        const clinic = (e.clinicName ?? "").toLocaleLowerCase("tr-TR");
        const city = (e.clinicCity ?? "").toLocaleLowerCase("tr-TR");
        const specialties = (e.specialties ?? []).join(" ").toLocaleLowerCase("tr-TR");
        return (
          name.includes(term) ||
          clinic.includes(term) ||
          city.includes(term) ||
          specialties.includes(term)
        );
      })
    : all;

  return (
    <div className="px-5 pt-6">
      <header className="mb-6">
        <h1 className="font-headline text-xl font-semibold text-foreground">Eğitmenler</h1>
        <p className="mt-1 text-sm text-text-2">Onaylı uygulama uzmanlarını keşfedin.</p>
      </header>

      <div className="mb-5 space-y-1.5">
        <Label htmlFor="egitmen-search" className="sr-only">
          Eğitmen ara
        </Label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-3"
            aria-hidden
          />
          <Input
            id="egitmen-search"
            type="search"
            placeholder="İsim, klinik, şehir veya uzmanlık ara"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            aria-label="Eğitmen ara"
          />
        </div>
      </div>

      {egitmenList.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-[var(--radius-lg)]" />
          ))}
        </div>
      ) : egitmenList.isError ? (
        <div className="flex items-center gap-2 rounded-[var(--radius)] border border-destructive-border bg-destructive-bg p-4 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
          Eğitmenler yüklenemedi.
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-border bg-card p-8 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-muted">
            <GraduationCap className="size-5 text-text-3" aria-hidden />
          </span>
          <p className="text-sm font-medium text-foreground">
            {term ? "Eşleşen eğitmen yok" : "Henüz onaylı eğitmen yok"}
          </p>
          <p className="text-xs text-text-3">
            {term
              ? "Farklı bir isim, şehir veya uzmanlık deneyin."
              : "Eğitmenler onaylandıkça burada listelenir."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((e) => (
            <li
              key={e.userId}
              className="rounded-[var(--radius-lg)] border border-border bg-card p-4 shadow-[var(--shadow-sm)]"
            >
              <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {initialsOf(e.firstName, e.lastName)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">
                    {e.firstName} {e.lastName}
                  </p>
                  {e.clinicName ? (
                    <p className="mt-0.5 truncate text-xs text-text-2">{e.clinicName}</p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-3">
                    {e.clinicCity ? (
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3.5" aria-hidden />
                        {e.clinicCity}
                      </span>
                    ) : null}
                  </div>
                  {(e.specialties ?? []).length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(e.specialties ?? []).slice(0, 3).map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-primary"
                        >
                          <Stethoscope className="size-3" aria-hidden />
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {e.bio ? <p className="mt-2 line-clamp-2 text-xs text-text-2">{e.bio}</p> : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
