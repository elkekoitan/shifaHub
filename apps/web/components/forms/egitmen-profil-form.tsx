"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SPECIALTIES = [
  { value: "hacamat_kuru", label: "Kuru Hacamat" },
  { value: "hacamat_yas", label: "Yas Hacamat" },
  { value: "solucan", label: "Solucan (Hirudoterapi)" },
  { value: "sujok", label: "Sujok Terapi" },
  { value: "refleksoloji", label: "Refleksoloji" },
  { value: "akupunktur", label: "Akupunktur" },
  { value: "fitoterapi", label: "Fitoterapi" },
  { value: "aromaterapi", label: "Aromaterapi" },
  { value: "osteopati", label: "Osteopati" },
  { value: "kayropraktik", label: "Kayropraktik" },
];

export function EgitmenProfilForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    certificateNumber: "",
    certificateIssuer: "",
    clinicName: "",
    clinicAddress: "",
    clinicCity: "",
    clinicPhone: "",
    supervisingPhysicianName: "",
    bio: "",
    defaultSessionDuration: "60",
    workingHoursStart: "09:00",
    workingHoursEnd: "18:00",
  });

  function updateField(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function toggleSpecialty(value: string) {
    setSelectedSpecialties((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    // TODO: API call
    setTimeout(() => setIsLoading(false), 1000);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Sertifika Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sertifika Numarasi</Label>
              <Input value={formData.certificateNumber} onChange={(e) => updateField("certificateNumber", e.target.value)} placeholder="GETAT-XXXX" />
            </div>
            <div className="space-y-2">
              <Label>Veren Kurum</Label>
              <Input value={formData.certificateIssuer} onChange={(e) => updateField("certificateIssuer", e.target.value)} placeholder="Saglik Bakanligi / Universite" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Sertifika Dosyasi</Label>
            <Input type="file" accept=".pdf,.jpg,.jpeg,.png" />
            <p className="text-xs text-muted-foreground">PDF veya gorsel (max 10MB)</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Uzmanlik Alanlari</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {SPECIALTIES.map((s) => (
              <label key={s.value} className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedSpecialties.includes(s.value)}
                  onChange={() => toggleSpecialty(s.value)}
                />
                <span className="text-sm">{s.label}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Klinik Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Klinik Adi</Label>
            <Input value={formData.clinicName} onChange={(e) => updateField("clinicName", e.target.value)} placeholder="Sifa Merkezi" />
          </div>
          <div className="space-y-2">
            <Label>Klinik Adresi</Label>
            <Input value={formData.clinicAddress} onChange={(e) => updateField("clinicAddress", e.target.value)} placeholder="Tam adres" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sehir</Label>
              <Input value={formData.clinicCity} onChange={(e) => updateField("clinicCity", e.target.value)} placeholder="Istanbul" />
            </div>
            <div className="space-y-2">
              <Label>Telefon</Label>
              <Input value={formData.clinicPhone} onChange={(e) => updateField("clinicPhone", e.target.value)} placeholder="0212 XXX XX XX" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Sorumlu Tabip Adi</Label>
            <Input value={formData.supervisingPhysicianName} onChange={(e) => updateField("supervisingPhysicianName", e.target.value)} placeholder="Dr. Ad Soyad" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Calisma Saatleri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Seans Suresi (dk)</Label>
              <Input type="number" value={formData.defaultSessionDuration} onChange={(e) => updateField("defaultSessionDuration", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Baslangic</Label>
              <Input type="time" value={formData.workingHoursStart} onChange={(e) => updateField("workingHoursStart", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Bitis</Label>
              <Input type="time" value={formData.workingHoursEnd} onChange={(e) => updateField("workingHoursEnd", e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Kaydediliyor..." : "Profili Kaydet"}
      </Button>
    </form>
  );
}
