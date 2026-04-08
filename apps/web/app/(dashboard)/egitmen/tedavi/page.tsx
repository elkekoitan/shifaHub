"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApi, useApiMutation } from "@/hooks/use-api";

const TREATMENT_TYPES = [
  { value: "hacamat_kuru", label: "Kuru Hacamat" },
  { value: "hacamat_yas", label: "Yas Hacamat" },
  { value: "solucan", label: "Solucan (Hirudoterapi)" },
  { value: "sujok", label: "Sujok Terapi" },
  { value: "refleksoloji", label: "Refleksoloji" },
  { value: "akupunktur", label: "Akupunktur" },
  { value: "fitoterapi", label: "Fitoterapi" },
];

const BODY_AREAS = [
  "Bas", "Boyun", "Omuz", "Sirt (ust)", "Sirt (alt)", "Bel",
  "Gogus", "Karin", "Kol (sag)", "Kol (sol)",
  "Bacak (sag)", "Bacak (sol)", "Ayak", "El",
];

export default function EgitmenTedaviPage() {
  const { mutate, loading, error } = useApiMutation();
  const [success, setSuccess] = useState(false);
  const { data: danisanlar, loading: danisanlarLoading } = useApi<
    Array<{ userId: string; firstName: string; lastName: string }>
  >("/api/danisan/list");

  // Form state
  const [danisanId, setDanisanId] = useState("");
  const [treatmentType, setTreatmentType] = useState("");
  const [treatmentDate, setTreatmentDate] = useState(new Date().toISOString().slice(0, 16));
  const [sessionNumber, setSessionNumber] = useState("1");
  const [complaint1, setComplaint1] = useState("");
  const [complaint2, setComplaint2] = useState("");
  const [complaint3, setComplaint3] = useState("");
  const [bloodPressure, setBloodPressure] = useState("");
  const [pulse, setPulse] = useState("");
  const [findings, setFindings] = useState("");
  const [appliedTreatment, setAppliedTreatment] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [nextSessionDate, setNextSessionDate] = useState("");
  const [bodyArea, setBodyArea] = useState("");

  const handleSubmit = async () => {
    setSuccess(false);

    if (!danisanId.trim() || !treatmentType) {
      return;
    }

    const complaints = [complaint1, complaint2, complaint3].filter((c) => c.trim() !== "");

    const body = {
      danisanId: danisanId.trim(),
      treatmentType,
      sessionNumber: Number(sessionNumber),
      treatmentDate,
      complaints,
      findings,
      vitalSigns: {
        bloodPressure,
        pulse: pulse ? Number(pulse) : undefined,
      },
      appliedTreatment,
      recommendations,
      nextSessionDate: nextSessionDate || undefined,
      bodyArea: bodyArea || undefined,
    };

    const result = await mutate("/api/tedavi", body);
    if (result) {
      setSuccess(true);
      // Reset form
      setDanisanId("");
      setTreatmentType("");
      setTreatmentDate(new Date().toISOString().slice(0, 16));
      setSessionNumber("1");
      setComplaint1("");
      setComplaint2("");
      setComplaint3("");
      setBloodPressure("");
      setPulse("");
      setFindings("");
      setAppliedTreatment("");
      setRecommendations("");
      setNextSessionDate("");
      setBodyArea("");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tedavi Kaydi Olustur</h1>

      {success && (
        <div className="rounded-md border border-green-200 bg-green-50 p-4 text-green-800 text-sm">
          Tedavi kaydi basariyla olusturuldu.
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800 text-sm">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Danisan Secimi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Danisan</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              value={danisanId}
              onChange={(e) => setDanisanId(e.target.value)}
              disabled={danisanlarLoading}
            >
              <option value="">
                {danisanlarLoading ? "Yukleniyor..." : "Danisan Seciniz"}
              </option>
              {(danisanlar ?? []).map((d) => (
                <option key={d.userId} value={d.userId}>
                  {d.firstName} {d.lastName}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tedavi Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tedavi Tipi</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={treatmentType}
                onChange={(e) => setTreatmentType(e.target.value)}
              >
                <option value="">Seciniz</option>
                {TREATMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Tedavi Tarihi</Label>
              <Input
                type="datetime-local"
                value={treatmentDate}
                onChange={(e) => setTreatmentDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Seans No</Label>
              <Input
                type="number"
                value={sessionNumber}
                onChange={(e) => setSessionNumber(e.target.value)}
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label>Uygulama Bolgesi</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={bodyArea}
                onChange={(e) => setBodyArea(e.target.value)}
              >
                <option value="">Bolge seciniz</option>
                {BODY_AREAS.map((area) => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sikayetler (Oncelik Sirali)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2 items-start">
              <span className="mt-2 text-sm font-bold text-primary w-6">1.</span>
              <Input
                placeholder="Sikayet 1 (opsiyonel)"
                className="flex-1"
                value={complaint1}
                onChange={(e) => setComplaint1(e.target.value)}
              />
            </div>
            <div className="flex gap-2 items-start">
              <span className="mt-2 text-sm font-bold text-primary w-6">2.</span>
              <Input
                placeholder="Sikayet 2 (opsiyonel)"
                className="flex-1"
                value={complaint2}
                onChange={(e) => setComplaint2(e.target.value)}
              />
            </div>
            <div className="flex gap-2 items-start">
              <span className="mt-2 text-sm font-bold text-primary w-6">3.</span>
              <Input
                placeholder="Sikayet 3 (opsiyonel)"
                className="flex-1"
                value={complaint3}
                onChange={(e) => setComplaint3(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bulgular ve Vital</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tansiyon</Label>
                <Input
                  placeholder="120/80"
                  value={bloodPressure}
                  onChange={(e) => setBloodPressure(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Nabiz</Label>
                <Input
                  type="number"
                  placeholder="72"
                  value={pulse}
                  onChange={(e) => setPulse(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Bulgular</Label>
              <textarea
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[100px]"
                placeholder="Muayene bulgulari..."
                value={findings}
                onChange={(e) => setFindings(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Uygulanan Tedavi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tedavi Detayi</Label>
              <textarea
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[100px]"
                placeholder="Uygulanan tedavi detaylari..."
                value={appliedTreatment}
                onChange={(e) => setAppliedTreatment(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Oneriler</Label>
              <textarea
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[60px]"
                placeholder="Danisana oneriler..."
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Sonraki Seans Tarihi</Label>
              <Input
                type="date"
                value={nextSessionDate}
                onChange={(e) => setNextSessionDate(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Button
        className="w-full"
        size="lg"
        disabled={loading || !danisanId.trim() || !treatmentType}
        onClick={handleSubmit}
      >
        {loading ? "Kaydediliyor..." : "Tedavi Kaydini Kaydet"}
      </Button>
    </div>
  );
}
