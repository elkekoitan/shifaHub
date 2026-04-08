"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/providers/auth-provider";

const API_URL =
  typeof window !== "undefined" && window.location.protocol === "https:"
    ? "/api/proxy"
    : process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const TOTAL_STEPS = 7;

const STEP_TITLES = [
  "Temel Bilgiler",
  "Hesap Bilgileri",
  "Fiziksel Bilgiler",
  "Saglik Gecmisi",
  "Alerji ve Ilaclar",
  "KVKK Riza",
  "Sikayetler",
];

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

interface FormData {
  // Step 1
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  // Step 2
  password: string;
  passwordConfirm: string;
  kvkk: boolean;
  // Step 3
  birthDate: string;
  gender: string;
  bloodType: string;
  height: string;
  weight: string;
  // Step 4
  chronicDiseases: string;
  previousSurgeries: string;
  familyHistory: string;
  smokingStatus: boolean;
  pregnancyStatus: boolean;
  // Step 5
  allergies: string;
  currentMedications: string;
  // Step 6
  saglikVerisi: boolean;
  iletisim: boolean;
  ucuncuTaraf: boolean;
  // Step 7
  mainComplaints: string;
  notes: string;
}

export default function KayitPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [authToken, setAuthToken] = useState("");

  const [form, setForm] = useState<FormData>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    passwordConfirm: "",
    kvkk: false,
    birthDate: "",
    gender: "",
    bloodType: "",
    height: "",
    weight: "",
    chronicDiseases: "",
    previousSurgeries: "",
    familyHistory: "",
    smokingStatus: false,
    pregnancyStatus: false,
    allergies: "",
    currentMedications: "",
    saglikVerisi: false,
    iletisim: false,
    ucuncuTaraf: false,
    mainComplaints: "",
    notes: "",
  });

  function updateField(field: keyof FormData, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  }

  function validateStep(): boolean {
    switch (step) {
      case 1:
        if (!form.firstName.trim() || !form.lastName.trim() || !form.phone.trim() || !form.email.trim()) {
          setError("Lutfen tum alanlari doldurun.");
          return false;
        }
        break;
      case 2:
        if (!form.password || !form.passwordConfirm) {
          setError("Lutfen sifre alanlarini doldurun.");
          return false;
        }
        if (form.password.length < 8) {
          setError("Sifre en az 8 karakter olmalidir.");
          return false;
        }
        if (form.password !== form.passwordConfirm) {
          setError("Sifreler eslesmiyor.");
          return false;
        }
        if (!form.kvkk) {
          setError("KVKK Aydinlatma Metni'ni kabul etmeniz gerekmektedir.");
          return false;
        }
        break;
      case 6:
        if (!form.saglikVerisi) {
          setError("Saglik verilerinin islenmesini kabul etmeniz gerekmektedir.");
          return false;
        }
        break;
    }
    return true;
  }

  async function handleRegister(): Promise<string> {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        role: "danisan",
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Kayit sirasinda bir hata olustu.");
    }

    // Login to get token
    const loginRes = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.email,
        password: form.password,
      }),
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) {
      throw new Error(loginData.error || "Giris sirasinda bir hata olustu.");
    }

    const token = loginData.data?.accessToken || loginData.accessToken;
    localStorage.setItem("shifahub_token", token);
    if (loginData.data?.refreshToken || loginData.refreshToken) {
      localStorage.setItem(
        "shifahub_refresh",
        loginData.data?.refreshToken || loginData.refreshToken
      );
    }
    return token;
  }

  async function handleProfileUpdate(token: string) {
    const profileData: Record<string, unknown> = {
      birthDate: form.birthDate || undefined,
      gender: form.gender || undefined,
      bloodType: form.bloodType || undefined,
      height: form.height ? Number(form.height) : undefined,
      weight: form.weight ? Number(form.weight) : undefined,
      chronicDiseases: form.chronicDiseases || undefined,
      previousSurgeries: form.previousSurgeries || undefined,
      familyHistory: form.familyHistory || undefined,
      smokingStatus: form.smokingStatus,
      pregnancyStatus: form.pregnancyStatus,
      allergies: form.allergies || undefined,
      currentMedications: form.currentMedications || undefined,
      consentHealthData: form.saglikVerisi,
      consentCommunication: form.iletisim,
      consentThirdParty: form.ucuncuTaraf,
      mainComplaints: form.mainComplaints || undefined,
      notes: form.notes || undefined,
    };

    // Remove undefined values
    const cleanData = Object.fromEntries(
      Object.entries(profileData).filter(([, v]) => v !== undefined)
    );

    const res = await fetch(`${API_URL}/api/danisan/me`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(cleanData),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Profil guncellenirken bir hata olustu.");
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!validateStep()) return;

    // Steps 1: just advance
    if (step === 1) {
      setStep(2);
      return;
    }

    // Step 2: register + login, then advance
    if (step === 2) {
      setIsLoading(true);
      try {
        const token = await handleRegister();
        setAuthToken(token);
        setStep(3);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Bir hata olustu.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Steps 3-6: just advance
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
      return;
    }

    // Step 7 (final): update profile and redirect
    setIsLoading(true);
    try {
      await handleProfileUpdate(authToken);
      await login(form.email, form.password);
      router.push("/danisan");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata olustu.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-primary">
          ShifaHub
        </CardTitle>
        <CardDescription>{STEP_TITLES[step - 1]}</CardDescription>

        {/* Step progress bar */}
        <div className="flex items-center justify-center gap-1 pt-3 px-2">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  s < step
                    ? "bg-primary text-primary-foreground"
                    : s === step
                      ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {s < step ? (
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  s
                )}
              </div>
              {s < TOTAL_STEPS && (
                <div
                  className={`h-0.5 w-3 sm:w-5 ${
                    s < step ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground pt-1">
          Adim {step} / {TOTAL_STEPS}
        </p>
      </CardHeader>

      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          {/* Step 1: Temel Bilgiler */}
          {step === 1 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Ad</Label>
                  <Input
                    id="firstName"
                    value={form.firstName}
                    onChange={(e) => updateField("firstName", e.target.value)}
                    placeholder="Adiniz"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Soyad</Label>
                  <Input
                    id="lastName"
                    value={form.lastName}
                    onChange={(e) => updateField("lastName", e.target.value)}
                    placeholder="Soyadiniz"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="05XX XXX XX XX"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="ornek@email.com"
                  required
                />
              </div>
            </>
          )}

          {/* Step 2: Hesap Bilgileri */}
          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="password">Sifre</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  placeholder="En az 8 karakter"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passwordConfirm">Sifre Tekrar</Label>
                <Input
                  id="passwordConfirm"
                  type="password"
                  value={form.passwordConfirm}
                  onChange={(e) =>
                    updateField("passwordConfirm", e.target.value)
                  }
                  placeholder="Sifrenizi tekrar girin"
                  required
                />
              </div>
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="kvkk"
                  checked={form.kvkk}
                  onChange={(e) => updateField("kvkk", e.target.checked)}
                  className="mt-1"
                  required
                />
                <Label
                  htmlFor="kvkk"
                  className="text-xs text-muted-foreground leading-tight"
                >
                  KVKK Aydinlatma Metni&apos;ni okudum ve kisisel verilerimin
                  islenmesini kabul ediyorum.
                </Label>
              </div>
            </>
          )}

          {/* Step 3: Fiziksel Bilgiler */}
          {step === 3 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="birthDate">Dogum Tarihi</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => updateField("birthDate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Cinsiyet</Label>
                <select
                  id="gender"
                  value={form.gender}
                  onChange={(e) => updateField("gender", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Seciniz</option>
                  <option value="erkek">Erkek</option>
                  <option value="kadin">Kadin</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bloodType">Kan Grubu</Label>
                <select
                  id="bloodType"
                  value={form.bloodType}
                  onChange={(e) => updateField("bloodType", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Seciniz</option>
                  {BLOOD_TYPES.map((bt) => (
                    <option key={bt} value={bt}>
                      {bt}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="height">Boy (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={form.height}
                    onChange={(e) => updateField("height", e.target.value)}
                    placeholder="170"
                    min={50}
                    max={250}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Kilo (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={form.weight}
                    onChange={(e) => updateField("weight", e.target.value)}
                    placeholder="70"
                    min={20}
                    max={300}
                  />
                </div>
              </div>
            </>
          )}

          {/* Step 4: Saglik Gecmisi */}
          {step === 4 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="chronicDiseases">
                  Kronik Hastaliklar
                </Label>
                <textarea
                  id="chronicDiseases"
                  value={form.chronicDiseases}
                  onChange={(e) =>
                    updateField("chronicDiseases", e.target.value)
                  }
                  placeholder="Diyabet, hipertansiyon... (virgul ile ayirin)"
                  rows={2}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="previousSurgeries">
                  Gecirdigi Ameliyatlar
                </Label>
                <textarea
                  id="previousSurgeries"
                  value={form.previousSurgeries}
                  onChange={(e) =>
                    updateField("previousSurgeries", e.target.value)
                  }
                  placeholder="Gecmiste gecirdiginiz ameliyatlar"
                  rows={2}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="familyHistory">Aile Gecmisi</Label>
                <textarea
                  id="familyHistory"
                  value={form.familyHistory}
                  onChange={(e) =>
                    updateField("familyHistory", e.target.value)
                  }
                  placeholder="Ailede bilinen hastaliklar"
                  rows={2}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="smokingStatus"
                    checked={form.smokingStatus}
                    onChange={(e) =>
                      updateField("smokingStatus", e.target.checked)
                    }
                  />
                  <Label htmlFor="smokingStatus" className="text-sm">
                    Sigara kullaniyorum
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="pregnancyStatus"
                    checked={form.pregnancyStatus}
                    onChange={(e) =>
                      updateField("pregnancyStatus", e.target.checked)
                    }
                  />
                  <Label htmlFor="pregnancyStatus" className="text-sm">
                    Hamilelik durumu mevcut
                  </Label>
                </div>
              </div>
            </>
          )}

          {/* Step 5: Alerji ve Ilaclar */}
          {step === 5 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="allergies">Alerjiler</Label>
                <textarea
                  id="allergies"
                  value={form.allergies}
                  onChange={(e) => updateField("allergies", e.target.value)}
                  placeholder="Bilinen alerjileriniz (virgul ile ayirin)"
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentMedications">
                  Kullanilan Ilaclar
                </Label>
                <textarea
                  id="currentMedications"
                  value={form.currentMedications}
                  onChange={(e) =>
                    updateField("currentMedications", e.target.value)
                  }
                  placeholder="Su anda kullandiginiz ilaclar (virgul ile ayirin)"
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>
            </>
          )}

          {/* Step 6: KVKK Detayli Riza */}
          {step === 6 && (
            <>
              <p className="text-sm text-muted-foreground">
                Asagidaki riza beyanlarini inceleyip onaylayin.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-2 p-3 rounded-md border">
                  <input
                    type="checkbox"
                    id="saglikVerisi"
                    checked={form.saglikVerisi}
                    onChange={(e) =>
                      updateField("saglikVerisi", e.target.checked)
                    }
                    className="mt-0.5"
                    required
                  />
                  <Label
                    htmlFor="saglikVerisi"
                    className="text-sm leading-tight"
                  >
                    Saglik verilerimin islenmesini kabul ediyorum.{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-md border">
                  <input
                    type="checkbox"
                    id="iletisim"
                    checked={form.iletisim}
                    onChange={(e) =>
                      updateField("iletisim", e.target.checked)
                    }
                    className="mt-0.5"
                  />
                  <Label htmlFor="iletisim" className="text-sm leading-tight">
                    SMS/Email ile bildirim almak istiyorum.
                  </Label>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-md border">
                  <input
                    type="checkbox"
                    id="ucuncuTaraf"
                    checked={form.ucuncuTaraf}
                    onChange={(e) =>
                      updateField("ucuncuTaraf", e.target.checked)
                    }
                    className="mt-0.5"
                  />
                  <Label
                    htmlFor="ucuncuTaraf"
                    className="text-sm leading-tight"
                  >
                    Verilerimin sorumlu tabip ile paylasilmasini kabul
                    ediyorum.
                  </Label>
                </div>
              </div>
            </>
          )}

          {/* Step 7: Sikayetler */}
          {step === 7 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="mainComplaints">Ana Sikayetler</Label>
                <textarea
                  id="mainComplaints"
                  value={form.mainComplaints}
                  onChange={(e) =>
                    updateField("mainComplaints", e.target.value)
                  }
                  placeholder="Basvuru nedeniniz ve sikayetleriniz"
                  rows={4}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Ek Notlar (Opsiyonel)</Label>
                <textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  placeholder="Eklemek istediginiz bilgiler"
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>
            </>
          )}

          {/* Error message */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
              {error}
            </p>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <div className="flex gap-2 w-full">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep(step - 1);
                  setError("");
                }}
                className="flex-1"
                disabled={isLoading}
              >
                Geri
              </Button>
            )}
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading
                ? step === 2
                  ? "Kaydediliyor..."
                  : step === TOTAL_STEPS
                    ? "Tamamlaniyor..."
                    : "Yukleniyor..."
                : step === 2
                  ? "Kayit Ol"
                  : step === TOTAL_STEPS
                    ? "Tamamla"
                    : "Devam"}
            </Button>
          </div>
          {step <= 2 && (
            <p className="text-sm text-muted-foreground text-center">
              Zaten hesabiniz var mi?{" "}
              <Link
                href="/giris"
                className="text-primary hover:underline font-medium"
              >
                Giris yapin
              </Link>
            </p>
          )}
          {step > 2 && (
            <p className="text-xs text-muted-foreground text-center">
              Bu adimlari daha sonra da tamamlayabilirsiniz.
            </p>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
