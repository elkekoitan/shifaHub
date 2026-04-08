"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useApiMutation } from "@/hooks/use-api";

const STEPS = [
  { title: "Kisisel Bilgiler", desc: "Temel iletisim bilgileriniz" },
  { title: "Saglik Gecmisi", desc: "Mevcut saglik durumunuz" },
  { title: "Alerji ve Ilaclar", desc: "Alerjiler ve kullandiginiz ilaclar" },
  { title: "GETAT Gecmisi", desc: "Onceki tedavileriniz ve sikayetleriniz" },
];

export function DanisanKayitWizard() {
  const [step, setStep] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const { mutate, loading: isLoading, error } = useApiMutation();
  const [formData, setFormData] = useState({
    // Step 1 - Kisisel
    birthDate: "",
    gender: "",
    bloodType: "",
    occupation: "",
    address: "",
    city: "",
    emergencyContact: "",
    emergencyPhone: "",
    // Step 2 - Saglik gecmisi
    chronicDiseases: "",
    previousSurgeries: "",
    familyHistory: "",
    height: "",
    weight: "",
    smokingStatus: false,
    alcoholStatus: false,
    pregnancyStatus: false,
    // Step 3 - Alerji ve ilaclar
    allergies: "",
    currentMedications: "",
    // Step 4 - GETAT
    previousTreatments: "",
    mainComplaints: "",
    notes: "",
  });

  function updateField(field: string, value: string | boolean) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function toArray(value: string): string[] {
    return value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async function handleSubmit() {
    const payload = {
      ...formData,
      height: formData.height ? Number(formData.height) : undefined,
      weight: formData.weight ? Number(formData.weight) : undefined,
      chronicDiseases: toArray(formData.chronicDiseases),
      allergies: toArray(formData.allergies),
      currentMedications: toArray(formData.currentMedications),
      previousSurgeries: toArray(formData.previousSurgeries),
      previousTreatments: toArray(formData.previousTreatments),
      mainComplaints: toArray(formData.mainComplaints),
    };
    const result = await mutate("/api/danisan/me", payload, "PUT");
    if (result) {
      setIsSaved(true);
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center mb-4">
          {STEPS.map((_s, i) => (
            <div key={i} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  i <= step
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-12 h-0.5 mx-1 ${i < step ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>
        <CardTitle>{STEPS[step]!.title}</CardTitle>
        <CardDescription>{STEPS[step]!.desc}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {step === 0 && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dogum Tarihi</Label>
                <Input type="date" value={formData.birthDate} onChange={(e) => updateField("birthDate", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Cinsiyet</Label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={formData.gender} onChange={(e) => updateField("gender", e.target.value)}>
                  <option value="">Seciniz</option>
                  <option value="erkek">Erkek</option>
                  <option value="kadin">Kadin</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kan Grubu</Label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={formData.bloodType} onChange={(e) => updateField("bloodType", e.target.value)}>
                  <option value="">Seciniz</option>
                  <option value="A_pozitif">A Rh+</option>
                  <option value="A_negatif">A Rh-</option>
                  <option value="B_pozitif">B Rh+</option>
                  <option value="B_negatif">B Rh-</option>
                  <option value="AB_pozitif">AB Rh+</option>
                  <option value="AB_negatif">AB Rh-</option>
                  <option value="O_pozitif">0 Rh+</option>
                  <option value="O_negatif">0 Rh-</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Meslek</Label>
                <Input value={formData.occupation} onChange={(e) => updateField("occupation", e.target.value)} placeholder="Mesleginiz" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Adres</Label>
              <Input value={formData.address} onChange={(e) => updateField("address", e.target.value)} placeholder="Acik adresiniz" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sehir</Label>
                <Input value={formData.city} onChange={(e) => updateField("city", e.target.value)} placeholder="Istanbul" />
              </div>
              <div className="space-y-2">
                <Label>Acil Durum Kisisi</Label>
                <Input value={formData.emergencyContact} onChange={(e) => updateField("emergencyContact", e.target.value)} placeholder="Ad Soyad" />
              </div>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="space-y-2">
              <Label>Kronik Hastaliklar</Label>
              <textarea className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[80px]" value={formData.chronicDiseases} onChange={(e) => updateField("chronicDiseases", e.target.value)} placeholder="Diyabet, hipertansiyon, astim... (virgul ile ayirin)" />
            </div>
            <div className="space-y-2">
              <Label>Gecirilen Ameliyatlar</Label>
              <textarea className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[60px]" value={formData.previousSurgeries} onChange={(e) => updateField("previousSurgeries", e.target.value)} placeholder="Ameliyat adi, yili (virgul ile ayirin)" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Boy (cm)</Label>
                <Input type="number" value={formData.height} onChange={(e) => updateField("height", e.target.value)} placeholder="170" />
              </div>
              <div className="space-y-2">
                <Label>Kilo (kg)</Label>
                <Input type="number" value={formData.weight} onChange={(e) => updateField("weight", e.target.value)} placeholder="70" />
              </div>
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={formData.smokingStatus} onChange={(e) => updateField("smokingStatus", e.target.checked)} />
                Sigara kullaniyorum
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={formData.pregnancyStatus} onChange={(e) => updateField("pregnancyStatus", e.target.checked)} />
                Hamilelik
              </label>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="space-y-2">
              <Label>Alerjiler</Label>
              <textarea className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[80px]" value={formData.allergies} onChange={(e) => updateField("allergies", e.target.value)} placeholder="Ilac, gida, madde alerjileri (virgul ile ayirin)" />
            </div>
            <div className="space-y-2">
              <Label>Kullanilan Ilaclar</Label>
              <textarea className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[80px]" value={formData.currentMedications} onChange={(e) => updateField("currentMedications", e.target.value)} placeholder="Ilac adi, dozaj, kullanim sikliyi (virgul ile ayirin)" />
            </div>
            <div className="space-y-2">
              <Label>Aile Gecmisi</Label>
              <textarea className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[60px]" value={formData.familyHistory} onChange={(e) => updateField("familyHistory", e.target.value)} placeholder="Ailede gorlen hastaliklar (kalp, diyabet, kanser vs.)" />
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="space-y-2">
              <Label>Daha Once Alinan GETAT Tedavileri</Label>
              <textarea className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[80px]" value={formData.previousTreatments} onChange={(e) => updateField("previousTreatments", e.target.value)} placeholder="Hacamat, solucan tedavisi, akupunktur... (virgul ile ayirin)" />
            </div>
            <div className="space-y-2">
              <Label>Ana Sikayetler</Label>
              <textarea className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[80px]" value={formData.mainComplaints} onChange={(e) => updateField("mainComplaints", e.target.value)} placeholder="Mevcut sikayetlerinizi detayli yazin" />
            </div>
            <div className="space-y-2">
              <Label>Ek Notlar</Label>
              <textarea className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[60px]" value={formData.notes} onChange={(e) => updateField("notes", e.target.value)} placeholder="Egitmeninize iletmek istediginiz ek bilgiler" />
            </div>
          </>
        )}

        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}
        {isSaved && (
          <p className="text-sm text-green-600 text-center">Profiliniz basariyla kaydedildi!</p>
        )}
        <div className="flex gap-2 pt-4">
          {step > 0 && (
            <Button type="button" variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
              Geri
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={() => setStep(step + 1)} className="flex-1">
              Devam
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} className="flex-1" disabled={isLoading || isSaved}>
              {isLoading ? "Kaydediliyor..." : isSaved ? "Kaydedildi" : "Profili Tamamla"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
