"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApiMutation } from "@/hooks/use-api";

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
  // isLoading replaced by saving from useApiMutation
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

  const { mutate, loading: saving, error: saveError } = useApiMutation();
  const [saveSuccess, setSaveSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaveSuccess(false);
    const result = await mutate("/api/egitmen/me", {
      ...formData,
      specialties: selectedSpecialties,
      workingDays: [1, 2, 3, 4, 5],
    }, "PUT");
    if (result) setSaveSuccess(true);
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

      {saveSuccess && <div className="p-3 text-sm text-green-700 bg-green-50 rounded-lg">Profil basariyla kaydedildi!</div>}
      {saveError && <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg">{saveError}</div>}
      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? "Kaydediliyor..." : "Profili Kaydet"}
      </Button>
    </form>
  );
}
