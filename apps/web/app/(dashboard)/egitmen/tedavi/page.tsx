"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi, useApiMutation } from "@/hooks/use-api";
import {
  User,
  Stethoscope,
  Activity,
  Package,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  AlertTriangle,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const TREATMENT_TYPES = [
  { value: "hacamat_kuru", label: "Kuru Hacamat" },
  { value: "hacamat_yas", label: "Yas Hacamat" },
  { value: "solucan", label: "Solucan (Hirudoterapi)" },
  { value: "sujok", label: "Sujok Terapi" },
  { value: "refleksoloji", label: "Refleksoloji" },
  { value: "akupunktur", label: "Akupunktur" },
  { value: "fitoterapi", label: "Fitoterapi" },
  { value: "ozon", label: "Ozon Terapi" },
  { value: "kupa", label: "Kupa Terapi" },
];

const BODY_AREAS = [
  "Bas",
  "Boyun",
  "Omuz",
  "Sirt (ust)",
  "Sirt (alt)",
  "Bel",
  "Gogus",
  "Karin",
  "Kol (sag)",
  "Kol (sol)",
  "Bacak (sag)",
  "Bacak (sol)",
  "Ayak",
  "El",
];

const STEPS = [
  { id: 1, label: "Danisan", icon: User },
  { id: 2, label: "Tedavi", icon: Stethoscope },
  { id: 3, label: "Bulgular", icon: Activity },
  { id: 4, label: "Malzeme", icon: Package },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type StokItem = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
};

type ProtokolItem = {
  id: string;
  title: string;
  status: string;
  complaints: Array<{
    description: string;
    priority: number;
    treatmentMethod: string;
    estimatedSessions: number;
    sessionInterval: string;
  }>;
};

type UsedItem = { stokId: string; quantity: number };

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, idx) => {
        const isCompleted = step.id < currentStep;
        const isCurrent = step.id === currentStep;
        const Icon = step.icon;
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                  isCompleted
                    ? "bg-primary text-primary-foreground"
                    : isCurrent
                      ? "border-2 border-primary text-primary"
                      : "border-2 border-muted-foreground/30 text-muted-foreground"
                }`}
              >
                {isCompleted ? <CheckCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <span
                className={`text-xs whitespace-nowrap ${isCurrent ? "text-primary font-medium" : "text-muted-foreground"}`}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`h-px w-8 sm:w-16 mb-5 mx-1 transition-all ${
                  step.id < currentStep ? "bg-primary" : "bg-muted-foreground/20"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EgitmenTedaviPage() {
  const searchParams = useSearchParams();
  const { mutate, loading, error } = useApiMutation();
  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);

  // API
  const { data: danisanlar, loading: danisanlarLoading } =
    useApi<Array<{ userId: string; firstName: string; lastName: string }>>("/api/danisan/list");
  const { data: stokList } = useApi<StokItem[]>("/api/stok");

  // Step 1: Danisan
  const [danisanId, setDanisanId] = useState("");
  const [randevuId, setRandevuId] = useState("");
  const [protokolId, setProtokolId] = useState("");

  // Step 2: Tedavi
  const [treatmentType, setTreatmentType] = useState("");
  const [treatmentDate, setTreatmentDate] = useState(new Date().toISOString().slice(0, 16));
  const [sessionNumber, setSessionNumber] = useState("1");
  const [bodyArea, setBodyArea] = useState("");
  const [complaint1, setComplaint1] = useState("");
  const [complaint2, setComplaint2] = useState("");
  const [complaint3, setComplaint3] = useState("");

  // Step 3: Bulgular
  const [bloodPressure, setBloodPressure] = useState("");
  const [pulse, setPulse] = useState("");
  const [findings, setFindings] = useState("");
  const [appliedTreatment, setAppliedTreatment] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [nextSessionDate, setNextSessionDate] = useState("");

  // Step 4: Malzeme
  const [usedItems, setUsedItems] = useState<UsedItem[]>([]);

  // Protokol listesi
  const { data: protokoller, refetch: refetchProtokoller } = useApi<ProtokolItem[]>(
    danisanId ? `/api/protokol/danisan/${danisanId}` : "",
    { skip: !danisanId },
  );

  // URL parametrelerinden otomatik doldur
  useEffect(() => {
    const paramDanisanId = searchParams.get("danisanId");
    const paramTreatmentType = searchParams.get("treatmentType");
    const paramRandevuId = searchParams.get("randevuId");
    if (paramDanisanId) setDanisanId(paramDanisanId);
    if (paramTreatmentType) setTreatmentType(paramTreatmentType);
    if (paramRandevuId) setRandevuId(paramRandevuId);
  }, [searchParams]);

  useEffect(() => {
    if (danisanId) refetchProtokoller();
  }, [danisanId, refetchProtokoller]);

  const addStokItem = () => setUsedItems([...usedItems, { stokId: "", quantity: 1 }]);
  const removeStokItem = (i: number) => setUsedItems(usedItems.filter((_, idx) => idx !== i));
  const updateStokItem = (i: number, field: keyof UsedItem, value: string | number) => {
    const updated = [...usedItems];
    updated[i] = { ...updated[i]!, [field]: field === "quantity" ? Number(value) : value };
    setUsedItems(updated);
  };

  const handleProtokolSelect = (id: string) => {
    setProtokolId(id);
    if (!id) return;
    const prot = protokoller?.find((p) => p.id === id);
    if (!prot?.complaints?.length) return;
    const first = prot.complaints[0];
    if (first?.treatmentMethod) {
      const match = TREATMENT_TYPES.find(
        (t) =>
          first.treatmentMethod.toLowerCase().includes(t.value.replace("_", " ")) ||
          t.label.toLowerCase().includes(first.treatmentMethod.toLowerCase()),
      );
      if (match) setTreatmentType(match.value);
    }
    if (first?.description) setComplaint1(first.description);
  };

  const handleSubmit = async () => {
    setSuccess(false);
    setWarnings([]);
    if (!danisanId || !treatmentType) return;

    const complaints = [complaint1, complaint2, complaint3].filter(Boolean);
    const validUsedItems = usedItems.filter((i) => i.stokId && i.quantity > 0);

    const result = (await mutate("/api/tedavi", {
      danisanId,
      treatmentType,
      sessionNumber: Number(sessionNumber),
      treatmentDate,
      complaints,
      findings,
      vitalSigns: {
        bloodPressure: bloodPressure || undefined,
        pulse: pulse ? Number(pulse) : undefined,
      },
      appliedTreatment,
      recommendations,
      nextSessionDate: nextSessionDate || undefined,
      bodyArea: bodyArea || undefined,
      randevuId: randevuId || undefined,
      protokolId: protokolId || undefined,
      usedItems: validUsedItems.length > 0 ? validUsedItems : undefined,
    })) as { warnings?: string[] } | null;

    if (result) {
      setSuccess(true);
      if (result.warnings) setWarnings(result.warnings);
      // Reset
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
      setRandevuId("");
      setProtokolId("");
      setUsedItems([]);
      setStep(1);
    }
  };

  const availableStok = (stokList ?? []).filter((s) => s.quantity > 0);
  const selectedDanisan = danisanlar?.find((d) => d.userId === danisanId);

  const canProceedStep1 = !!danisanId;
  const canProceedStep2 = !!treatmentType && !!treatmentDate;
  const canProceedStep3 = true; // Bulgular opsiyonel

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-headline">
          {randevuId ? "Randevu Kaydından Tedavi" : "Yeni Tedavi Kaydi"}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Adim {step} / {STEPS.length}
        </p>
      </div>

      {/* Alerts */}
      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Tedavi kaydi basariyla olusturuldu. Odeme kaydi otomatik olusturuldu.
          </AlertDescription>
        </Alert>
      )}
      {warnings.length > 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            {warnings.map((w, i) => (
              <p key={i}>{w}</p>
            ))}
          </AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step indicator */}
      <div className="flex justify-center py-2">
        <StepIndicator currentStep={step} />
      </div>

      {/* ── Step 1: Danisan Secimi ── */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Danisan Secimi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {danisanlarLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-full" />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Danisan *</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={danisanId}
                  onChange={(e) => {
                    setDanisanId(e.target.value);
                    setProtokolId("");
                  }}
                >
                  <option value="">Danisan Seciniz</option>
                  {(danisanlar ?? []).map((d) => (
                    <option key={d.userId} value={d.userId}>
                      {d.firstName} {d.lastName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Protokol secimi */}
            {danisanId && (
              <div className="space-y-2">
                <Label>
                  Protokol Baglantisi{" "}
                  <span className="text-muted-foreground text-xs">(opsiyonel)</span>
                </Label>
                {protokoller && protokoller.length > 0 ? (
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    value={protokolId}
                    onChange={(e) => handleProtokolSelect(e.target.value)}
                  >
                    <option value="">Protokol Sec (opsiyonel)</option>
                    {protokoller
                      .filter((p) => p.status === "active")
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} ({(p.complaints || []).length} sikayet)
                        </option>
                      ))}
                  </select>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Bu danisan icin aktif protokol bulunamadi
                  </p>
                )}
              </div>
            )}

            {selectedDanisan && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                  {selectedDanisan.firstName[0]}
                  {selectedDanisan.lastName[0]}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {selectedDanisan.firstName} {selectedDanisan.lastName}
                  </p>
                  {protokolId && <p className="text-xs text-muted-foreground">Protokol baglandi</p>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Step 2: Tedavi Bilgileri ── */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              Tedavi Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Tedavi Tipi *</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={treatmentType}
                  onChange={(e) => setTreatmentType(e.target.value)}
                >
                  <option value="">Tedavi Secin</option>
                  {TREATMENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Tedavi Tarihi *</Label>
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
                  min="1"
                  value={sessionNumber}
                  onChange={(e) => setSessionNumber(e.target.value)}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label>Vucud Bolgesi</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={bodyArea}
                  onChange={(e) => setBodyArea(e.target.value)}
                >
                  <option value="">Bolge Secin (opsiyonel)</option>
                  {BODY_AREAS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Sikayetler</Label>
              {[
                { val: complaint1, set: setComplaint1, ph: "Birincil sikayet..." },
                { val: complaint2, set: setComplaint2, ph: "Ikincil sikayet (opsiyonel)..." },
                { val: complaint3, set: setComplaint3, ph: "Ucuncul sikayet (opsiyonel)..." },
              ].map((item, idx) => (
                <Input
                  key={idx}
                  value={item.val}
                  onChange={(e) => item.set(e.target.value)}
                  placeholder={item.ph}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 3: Klinik Bulgular ── */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Klinik Bulgular
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tansiyon</Label>
                <Input
                  value={bloodPressure}
                  onChange={(e) => setBloodPressure(e.target.value)}
                  placeholder="120/80"
                />
              </div>
              <div className="space-y-2">
                <Label>Nabiz (bpm)</Label>
                <Input
                  type="number"
                  value={pulse}
                  onChange={(e) => setPulse(e.target.value)}
                  placeholder="72"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Klinik Bulgular</Label>
              <Textarea
                value={findings}
                onChange={(e) => setFindings(e.target.value)}
                placeholder="Fizik muayene ve klinik gozlemler..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Uygulanan Tedavi</Label>
              <Textarea
                value={appliedTreatment}
                onChange={(e) => setAppliedTreatment(e.target.value)}
                placeholder="Uygulanan tedavi detaylari..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Oneriler</Label>
              <Textarea
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                placeholder="Hasta onerileri, diyetle ilgili notlar..."
                rows={2}
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
      )}

      {/* ── Step 4: Malzeme Tuketimi ── */}
      {step === 4 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Malzeme Tuketimi
            </CardTitle>
            <Button variant="outline" size="sm" onClick={addStokItem}>
              <Plus className="h-4 w-4 mr-1" />
              Malzeme Ekle
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {usedItems.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>Malzeme eklenmedi</p>
                <p className="text-xs">Kullanilan malzemeleri stoğa yansitmak icin ekleyin</p>
              </div>
            ) : (
              usedItems.map((item, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select
                    className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                    value={item.stokId}
                    onChange={(e) => updateStokItem(i, "stokId", e.target.value)}
                  >
                    <option value="">Malzeme Secin</option>
                    {availableStok.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.quantity} {s.unit})
                      </option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateStokItem(i, "quantity", e.target.value)}
                    className="w-20"
                    placeholder="Adet"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removeStokItem(i)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}

            {/* Ozet */}
            <div className="mt-4 p-3 rounded-lg bg-muted/50 space-y-1.5 text-sm">
              <p className="font-medium">Kayit Ozeti</p>
              <div className="flex justify-between text-muted-foreground">
                <span>Danisan</span>
                <span>
                  {selectedDanisan
                    ? `${selectedDanisan.firstName} ${selectedDanisan.lastName}`
                    : "-"}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tedavi</span>
                <span>
                  {TREATMENT_TYPES.find((t) => t.value === treatmentType)?.label ?? treatmentType}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Malzeme</span>
                <span>{usedItems.filter((i) => i.stokId).length} kalem</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => setStep(step - 1)}
          disabled={step === 1}
          className="w-32"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Geri
        </Button>

        {step < STEPS.length ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={
              (step === 1 && !canProceedStep1) ||
              (step === 2 && !canProceedStep2) ||
              (step === 3 && !canProceedStep3)
            }
            className="w-40"
          >
            Devam
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={loading || !danisanId || !treatmentType}
            className="w-40"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Kaydediliyor...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Kaydet
              </span>
            )}
          </Button>
        )}
      </div>

      {/* Step hints */}
      <div className="flex gap-1 justify-center">
        {STEPS.map((s) => (
          <div
            key={s.id}
            className={`h-1.5 w-8 rounded-full transition-all ${s.id <= step ? "bg-primary" : "bg-muted"}`}
          />
        ))}
      </div>
    </div>
  );
}
