"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HijriDisplay } from "@/components/calendar/hijri-display";
import { useApi, useApiMutation } from "@/hooks/use-api";

const TREATMENT_TYPES = [
  "Kuru Hacamat",
  "Yas Hacamat",
  "Solucan Tedavisi",
  "Sujok Terapi",
  "Refleksoloji",
  "Akupunktur",
  "Fitoterapi",
  "Aromaterapi",
  "Diger",
];

type Egitmen = {
  id: string;
  firstName: string;
  lastName: string;
};

type Randevu = {
  id: string;
  scheduledAt: string;
  duration: number;
  treatmentType: string;
  status: string;
  egitmenFirstName?: string;
  egitmenLastName?: string;
};

export default function DanisanRandevuPage() {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedTreatment, setSelectedTreatment] = useState("");
  const [complaints, setComplaints] = useState("");
  const [egitmenId, setEgitmenId] = useState("");
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Tekrarlayan randevu state
  const [isRecurring, setIsRecurring] = useState(false);
  const [repeatCount, setRepeatCount] = useState(2);
  const [repeatInterval, setRepeatInterval] = useState("haftalik");

  const { data: egitmenList } = useApi<Egitmen[]>("/api/egitmen/search");
  const { data: randevuList } = useApi<Randevu[]>("/api/randevu");
  const { mutate, loading, error } = useApiMutation();

  const egitmenler = egitmenList ?? [];
  const randevular = randevuList ?? [];

  const handleSubmit = async () => {
    setSuccess(false);
    setSuccessMessage("");

    if (!selectedDate || !selectedTime || !egitmenId) return;

    const scheduledAt = `${selectedDate}T${selectedTime}:00`;

    const body = {
      egitmenId,
      scheduledAt,
      duration: 60,
      treatmentType: selectedTreatment || undefined,
      complaints: complaints.trim() || undefined,
    };

    const result = await mutate("/api/randevu", body);
    if (!result) return;

    let createdCount = 1;

    // Tekrarlayan randevular olustur
    if (isRecurring && repeatCount > 1) {
      for (let i = 1; i < repeatCount; i++) {
        const baseDate = new Date(`${selectedDate}T${selectedTime}:00`);
        if (repeatInterval === "haftalik") {
          baseDate.setDate(baseDate.getDate() + 7 * i);
        } else if (repeatInterval === "2haftalik") {
          baseDate.setDate(baseDate.getDate() + 14 * i);
        } else if (repeatInterval === "aylik") {
          baseDate.setMonth(baseDate.getMonth() + i);
        }

        const futureBody = {
          egitmenId,
          scheduledAt: baseDate.toISOString(),
          duration: 60,
          treatmentType: selectedTreatment || undefined,
          complaints: complaints.trim() || undefined,
        };

        const r = await mutate("/api/randevu", futureBody);
        if (r) createdCount++;
      }
    }

    setSuccess(true);
    setSuccessMessage(
      isRecurring && repeatCount > 1
        ? `${createdCount} randevu basariyla olusturuldu.`
        : "Randevu talebiniz basariyla olusturuldu.",
    );
    setSelectedDate("");
    setSelectedTime("");
    setSelectedTreatment("");
    setComplaints("");
    setEgitmenId("");
    setIsRecurring(false);
    setRepeatCount(2);
    setRepeatInterval("haftalik");
  };

  const statusLabel: Record<string, string> = {
    requested: "Beklemede",
    confirmed: "Onaylandi",
    reminded: "Hatirlatildi",
    arrived: "Geldiniz",
    treated: "Tedavi Edildi",
    completed: "Tamamlandi",
    cancelled: "Iptal",
    no_show: "Katilim Yok",
    ertelendi: "Ertelendi",
  };

  const statusColor: Record<string, string> = {
    requested: "bg-amber-100 text-amber-800",
    confirmed: "bg-green-100 text-green-800",
    reminded: "bg-sky-100 text-sky-800",
    arrived: "bg-indigo-100 text-indigo-800",
    treated: "bg-purple-100 text-purple-800",
    completed: "bg-blue-100 text-blue-800",
    cancelled: "bg-red-100 text-red-800",
    no_show: "bg-gray-100 text-gray-800",
    ertelendi: "bg-orange-100 text-orange-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Randevularim</h1>
        <HijriDisplay date={new Date()} />
      </div>

      {success && (
        <div className="rounded-md border border-green-200 bg-green-50 p-4 text-green-800 text-sm">
          {successMessage || "Randevu talebiniz basariyla olusturuldu."}
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800 text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Yeni Randevu Al</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Egitmen</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={egitmenId}
                onChange={(e) => setEgitmenId(e.target.value)}
              >
                <option value="">Egitmen seciniz</option>
                {egitmenler.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.firstName} {e.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Tarih</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
              {selectedDate && <HijriDisplay date={new Date(selectedDate)} />}
            </div>

            <div className="space-y-2">
              <Label>Saat</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
              >
                <option value="">Saat seciniz</option>
                {Array.from({ length: 18 }, (_, i) => {
                  const hour = Math.floor(i / 2) + 9;
                  const min = i % 2 === 0 ? "00" : "30";
                  return `${hour.toString().padStart(2, "0")}:${min}`;
                }).map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Tedavi Tipi</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={selectedTreatment}
                onChange={(e) => setSelectedTreatment(e.target.value)}
              >
                <option value="">Seciniz</option>
                {TREATMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Sikayetler</Label>
              <textarea
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[80px]"
                value={complaints}
                onChange={(e) => setComplaints(e.target.value)}
                placeholder="Sikayetlerinizi kisaca yazin"
              />
            </div>

            {/* Tekrarlayan randevu */}
            <div className="space-y-3 border rounded-md p-3 bg-muted/30">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium">Tekrarlayan randevu olustur</span>
              </label>
              {isRecurring && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Tekrar Sayisi</Label>
                    <input
                      type="number"
                      min={2}
                      max={12}
                      value={repeatCount}
                      onChange={(e) =>
                        setRepeatCount(Math.min(12, Math.max(2, Number(e.target.value))))
                      }
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Aralik</Label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                      value={repeatInterval}
                      onChange={(e) => setRepeatInterval(e.target.value)}
                    >
                      <option value="haftalik">Haftalik</option>
                      <option value="2haftalik">2 Haftalik</option>
                      <option value="aylik">Aylik</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <Button
              className="w-full"
              disabled={loading || !selectedDate || !selectedTime || !egitmenId}
              onClick={handleSubmit}
            >
              {loading ? "Olusturuluyor..." : "Randevu Talebi Olustur"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aktif Randevularim</CardTitle>
          </CardHeader>
          <CardContent>
            {randevular.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Henuz aktif randevunuz bulunmuyor.
              </p>
            ) : (
              <div className="space-y-3">
                {randevular.map((r) => {
                  const egitmenAd = `${r.egitmenFirstName || ""} ${r.egitmenLastName || ""}`.trim();
                  return (
                    <div
                      key={r.id}
                      className="flex items-center justify-between border rounded-lg p-3"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{r.treatmentType || "Randevu"}</p>
                        {egitmenAd && (
                          <p className="text-xs font-medium text-primary">Egitmen: {egitmenAd}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(r.scheduledAt).toLocaleDateString("tr-TR")} -{" "}
                          {new Date(r.scheduledAt).toLocaleTimeString("tr-TR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          ({r.duration} dk)
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${statusColor[r.status] ?? "bg-gray-100 text-gray-800"}`}
                      >
                        {statusLabel[r.status] ?? r.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
