"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApi } from "@/hooks/use-api";

interface Egitmen {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  specialties: string[];
  clinicName: string;
  clinicCity: string;
  bio: string;
  defaultSessionDuration: number;
}

const SPECIALTY_OPTIONS = [
  "Hacamat",
  "Akupunktur",
  "Fitoterapi",
  "Solunum Terapisi",
  "Refleksoloji",
  "Homeopati",
  "Osteopati",
  "Kayropraktik",
  "Hipnoterapi",
  "Muzik Terapisi",
];

export default function DanisanEgitmenPage() {
  const { data: egitmenler, loading, error } = useApi<Egitmen[]>("/api/egitmen/search");

  const [cityFilter, setCityFilter] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("");

  const filtered = useMemo(() => {
    if (!egitmenler) return [];
    return egitmenler.filter((e) => {
      const cityMatch =
        !cityFilter || e.clinicCity.toLowerCase().includes(cityFilter.toLowerCase());
      const specMatch =
        !specialtyFilter || e.specialties.includes(specialtyFilter);
      return cityMatch && specMatch;
    });
  }, [egitmenler, cityFilter, specialtyFilter]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Egitmen Ara</h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Sehir ara..."
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="sm:max-w-[200px]"
        />
        <select
          value={specialtyFilter}
          onChange={(e) => setSpecialtyFilter(e.target.value)}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:max-w-[220px]"
        >
          <option value="">Tum Uzmanliklar</option>
          {SPECIALTY_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground">Egitmenler yukleniyor...</p>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {!loading && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">Sonuc bulunamadi.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((egitmen) => (
          <Card key={egitmen.id}>
            <CardContent className="p-5 space-y-3">
              <div>
                <h3 className="font-semibold text-lg">
                  {egitmen.firstName} {egitmen.lastName}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {egitmen.clinicName} - {egitmen.clinicCity}
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {egitmen.specialties.map((s) => (
                  <span
                    key={s}
                    className="inline-block px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary"
                  >
                    {s}
                  </span>
                ))}
              </div>

              {egitmen.bio && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {egitmen.bio}
                </p>
              )}

              <p className="text-xs text-muted-foreground">
                Seans suresi: {egitmen.defaultSessionDuration} dk
              </p>

              <Link href="/danisan/randevu">
                <Button className="w-full mt-2">Randevu Al</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
