"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HijriDisplay } from "@/components/calendar/hijri-display";
import { useApi, useApiMutation } from "@/hooks/use-api";

const TREATMENT_TYPES = [
  "Kuru Hacamat", "Yas Hacamat", "Solucan Tedavisi",
  "Sujok Terapi", "Refleksoloji", "Akupunktur",
  "Fitoterapi", "Aromaterapi", "Diger",
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
};

export default function DanisanRandevuPage() {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedTreatment, setSelectedTreatment] = useState("");
  const [complaints, setComplaints] = useState("");
  const [egitmenId, setEgitmenId] = useState("");
  const [success, setSuccess] = useState(false);

  const { data: egitmenList } = useApi<Egitmen[]>("/api/egitmen/search");
  const { data: randevuList } = useApi<Randevu[]>("/api/randevu");
  const { mutate, loading, error } = useApiMutation();

  const egitmenler = egitmenList ?? [];
  const randevular = randevuList ?? [];

  const handleSubmit = async () => {
    setSuccess(false);

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
    if (result) {
      setSuccess(true);
      setSelectedDate("");
      setSelectedTime("");
      setSelectedTreatment("");
      setComplaints("");
      setEgitmenId("");
    }
  };

  const statusLabel: Record<string, string> = {
    pending: "Beklemede",
    confirmed: "Onaylandi",
    cancelled: "Iptal",
    completed: "Tamamlandi",
  };

  const statusColor: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    confirmed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    completed: "bg-blue-100 text-blue-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Randevularim</h1>
        <HijriDisplay date={new Date()} />
      </div>

      {success && (
        <div className="rounded-md border border-green-200 bg-green-50 p-4 text-green-800 text-sm">
          Randevu talebiniz basariyla olusturuldu.
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
                  <option key={time} value={time}>{time}</option>
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
                  <option key={t} value={t}>{t}</option>
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
                {randevular.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between border rounded-lg p-3"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{r.treatmentType || "Randevu"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.scheduledAt).toLocaleDateString("tr-TR")} -{" "}
                        {new Date(r.scheduledAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                        {" "}({r.duration} dk)
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${statusColor[r.status] ?? "bg-gray-100 text-gray-800"}`}
                    >
                      {statusLabel[r.status] ?? r.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
