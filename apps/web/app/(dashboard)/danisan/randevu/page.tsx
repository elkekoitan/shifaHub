"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HijriDisplay } from "@/components/calendar/hijri-display";

const TREATMENT_TYPES = [
  "Kuru Hacamat", "Yas Hacamat", "Solucan Tedavisi",
  "Sujok Terapi", "Refleksoloji", "Akupunktur",
  "Fitoterapi", "Aromaterapi", "Diger",
];

export default function DanisanRandevuPage() {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedTreatment, setSelectedTreatment] = useState("");
  const [complaints, setComplaints] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Randevularim</h1>
        <HijriDisplay date={new Date()} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Yeni Randevu Al</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                placeholder="Sikayetlerinizi kısaca yazin"
              />
            </div>

            <Button className="w-full" disabled={!selectedDate || !selectedTime}>
              Randevu Talebi Olustur
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aktif Randevularim</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-8">
              Henuz aktif randevunuz bulunmuyor.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
