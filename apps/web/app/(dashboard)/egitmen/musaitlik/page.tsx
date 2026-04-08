"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApi, useApiMutation } from "@/hooks/use-api";

const DAYS = [
  { value: 1, label: "Pazartesi" },
  { value: 2, label: "Sali" },
  { value: 3, label: "Carsamba" },
  { value: 4, label: "Persembe" },
  { value: 5, label: "Cuma" },
  { value: 6, label: "Cumartesi" },
  { value: 0, label: "Pazar" },
];

interface EgitmenProfil {
  defaultSessionDuration: string;
  workingHoursStart: string;
  workingHoursEnd: string;
  workingDays: number[];
}

export default function EgitmenMusaitlikPage() {
  const { data: profil, loading } = useApi<EgitmenProfil>("/api/egitmen/me");
  const { mutate, loading: saving } = useApiMutation();
  const [success, setSuccess] = useState(false);

  const [sessionDuration, setSessionDuration] = useState("60");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);

  // Profil yuklendikten sonra state'leri doldur
  useState(() => {
    if (profil) {
      setSessionDuration(profil.defaultSessionDuration || "60");
      setStartTime(profil.workingHoursStart || "09:00");
      setEndTime(profil.workingHoursEnd || "18:00");
      setSelectedDays(profil.workingDays || [1, 2, 3, 4, 5]);
    }
  });

  function toggleDay(day: number) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  async function handleSave() {
    setSuccess(false);
    const result = await mutate("/api/egitmen/me", {
      defaultSessionDuration: sessionDuration,
      workingHoursStart: startTime,
      workingHoursEnd: endTime,
      workingDays: selectedDays,
    }, "PUT");
    if (result) setSuccess(true);
  }

  if (loading) return <div className="flex items-center justify-center py-20 text-muted-foreground">Yukleniyor...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">Musaitlik Ayarlari</h1>

      {success && <div className="p-3 text-sm text-green-700 bg-green-50 rounded-lg">Ayarlar kaydedildi!</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Calisma Gunleri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {DAYS.map((day) => (
              <label key={day.value} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedDays.includes(day.value)}
                  onChange={() => toggleDay(day.value)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">{day.label}</span>
              </label>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Calisma Saatleri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Baslangic</Label>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Bitis</Label>
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Seans Suresi (dakika)</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={sessionDuration}
                onChange={(e) => setSessionDuration(e.target.value)}
              >
                <option value="30">30 dakika</option>
                <option value="45">45 dakika</option>
                <option value="60">60 dakika</option>
                <option value="90">90 dakika</option>
                <option value="120">120 dakika</option>
              </select>
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium mb-2">Ozet</h3>
              <p className="text-xs text-muted-foreground">
                {selectedDays.length} gun, {startTime} - {endTime}, {sessionDuration} dk seans
              </p>
              <p className="text-xs text-muted-foreground">
                Gunluk max seans: {Math.floor(
                  ((parseInt(endTime.split(":")[0]!) * 60 + parseInt(endTime.split(":")[1]!)) -
                   (parseInt(startTime.split(":")[0]!) * 60 + parseInt(startTime.split(":")[1]!))) /
                  parseInt(sessionDuration)
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
        {saving ? "Kaydediliyor..." : "Ayarlari Kaydet"}
      </Button>
    </div>
  );
}
