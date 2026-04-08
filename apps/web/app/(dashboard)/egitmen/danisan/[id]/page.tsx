"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApi } from "@/hooks/use-api";
import Link from "next/link";

interface FullDanisan {
  user: { id: string; email: string; firstName: string; lastName: string; phone: string };
  profil: {
    birthDate: string; gender: string; bloodType: string; city: string; occupation: string;
    chronicDiseases: string[]; allergies: string[]; currentMedications: string[];
    mainComplaints: string[]; height: number; weight: number;
    smokingStatus: boolean; pregnancyStatus: boolean; emergencyContact: string;
  } | null;
  tedaviler: Array<{
    id: string; treatmentType: string; sessionNumber: number; treatmentDate: string;
    complaints: unknown; findings: string; appliedTreatment: string; recommendations: string;
    vitalSigns: { bloodPressure?: string; pulse?: number; weight?: number } | null;
  }>;
  tahliller: Array<{ id: string; testType: string; testDate: string; labName: string; values: unknown[] }>;
  randevular: Array<{ id: string; scheduledAt: string; status: string; treatmentType: string; duration: number }>;
}

const TABS = ["Genel", "Anamnez", "Tedaviler", "Tahliller", "Randevular"];
const statusLabel: Record<string, string> = {
  requested: "Talep", confirmed: "Onaylandi", reminded: "Hatirlatildi",
  arrived: "Geldi", treated: "Tedavi", completed: "Tamamlandi",
  cancelled: "Iptal", no_show: "Gelmedi",
};
const statusColor: Record<string, string> = {
  requested: "bg-yellow-100 text-yellow-800", confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800", cancelled: "bg-red-100 text-red-800",
  no_show: "bg-gray-100 text-gray-800",
};

export default function DanisanDetayPage() {
  const params = useParams();
  const userId = params.id as string;
  const [tab, setTab] = useState(0);
  const { data, loading, error } = useApi<FullDanisan>(`/api/danisan/${userId}/full`);

  if (loading) return <div className="flex items-center justify-center py-20 text-muted-foreground">Yukleniyor...</div>;
  if (error || !data) return <div className="text-center py-20 text-red-500">{error || "Veri bulunamadi"}</div>;

  const { user, profil, tedaviler, tahliller, randevular } = data;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{user.firstName} {user.lastName}</h1>
          <p className="text-sm text-muted-foreground">{user.email} | {user.phone || "-"}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm"><Link href="/egitmen/tedavi">Tedavi Kaydi</Link></Button>
          <Button asChild size="sm" variant="outline"><Link href="/egitmen/danisan">Geri</Link></Button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto border-b pb-1">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-3 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors ${
              tab === i ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            }`}>{t}
          </button>
        ))}
      </div>

      {/* Tab: Genel */}
      {tab === 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Sehir</p>
              <p className="font-medium">{profil?.city || "-"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Kan Grubu</p>
              <p className="font-medium">{profil?.bloodType?.replace("_", " ") || "-"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Dogum Tarihi</p>
              <p className="font-medium">{profil?.birthDate ? new Date(profil.birthDate).toLocaleDateString("tr-TR") : "-"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Boy / Kilo</p>
              <p className="font-medium">{profil?.height || "-"} cm / {profil?.weight || "-"} kg</p>
            </CardContent>
          </Card>
          <Card className="sm:col-span-2">
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-1">Ana Sikayetler</p>
              <div className="flex flex-wrap gap-1">
                {profil?.mainComplaints?.map((c, i) => (
                  <span key={i} className="px-2 py-0.5 text-xs bg-amber-50 text-amber-700 rounded">{c}</span>
                )) || <span className="text-sm text-muted-foreground">-</span>}
              </div>
            </CardContent>
          </Card>
          <Card className="sm:col-span-2">
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-1">Kronik Hastaliklar</p>
              <div className="flex flex-wrap gap-1">
                {profil?.chronicDiseases?.map((c, i) => (
                  <span key={i} className="px-2 py-0.5 text-xs bg-red-50 text-red-700 rounded">{c}</span>
                )) || <span className="text-sm text-muted-foreground">-</span>}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Toplam Tedavi</p>
              <p className="text-2xl font-bold">{tedaviler.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Toplam Randevu</p>
              <p className="text-2xl font-bold">{randevular.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Toplam Tahlil</p>
              <p className="text-2xl font-bold">{tahliller.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Alerjiler</p>
              <p className="text-sm">{profil?.allergies?.join(", ") || "Yok"}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab: Anamnez */}
      {tab === 1 && (
        <Card>
          <CardHeader><CardTitle>Saglik Gecmisi (Anamnez)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Meslek</p>
                <p className="text-sm font-medium">{profil?.occupation || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cinsiyet</p>
                <p className="text-sm font-medium">{profil?.gender === "erkek" ? "Erkek" : profil?.gender === "kadin" ? "Kadin" : "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sigara</p>
                <p className="text-sm font-medium">{profil?.smokingStatus ? "Evet" : "Hayir"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Hamilelik</p>
                <p className="text-sm font-medium">{profil?.pregnancyStatus ? "Evet" : "Hayir"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Acil Durumda Aranacak</p>
                <p className="text-sm font-medium">{profil?.emergencyContact || "-"}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Kullanilan Ilaclar</p>
              <p className="text-sm">{profil?.currentMedications?.join(", ") || "Yok"}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab: Tedaviler */}
      {tab === 2 && (
        <div className="space-y-3">
          {tedaviler.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Tedavi kaydi yok</CardContent></Card>
          ) : tedaviler.map((t) => (
            <Card key={t.id}>
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium">Seans {t.sessionNumber} - {t.treatmentType}</p>
                  <span className="text-xs text-muted-foreground">{new Date(t.treatmentDate).toLocaleDateString("tr-TR")}</span>
                </div>
                {t.vitalSigns && (
                  <p className="text-xs text-muted-foreground">
                    Tansiyon: {t.vitalSigns.bloodPressure || "-"} | Nabiz: {t.vitalSigns.pulse || "-"} | Kilo: {t.vitalSigns.weight || "-"}
                  </p>
                )}
                {t.findings && <div><p className="text-xs text-muted-foreground">Bulgular:</p><p className="text-sm">{t.findings}</p></div>}
                {t.appliedTreatment && <div><p className="text-xs text-muted-foreground">Tedavi:</p><p className="text-sm">{t.appliedTreatment}</p></div>}
                {t.recommendations && <div><p className="text-xs text-muted-foreground">Oneriler:</p><p className="text-sm text-primary">{t.recommendations}</p></div>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tab: Tahliller */}
      {tab === 3 && (
        <div className="space-y-3">
          {tahliller.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Tahlil kaydi yok</CardContent></Card>
          ) : tahliller.map((t) => (
            <Card key={t.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">{t.testType}</p>
                  <span className="text-xs text-muted-foreground">{new Date(t.testDate).toLocaleDateString("tr-TR")}</span>
                </div>
                {t.labName && <p className="text-xs text-muted-foreground mb-2">Lab: {t.labName}</p>}
                {Array.isArray(t.values) && t.values.length > 0 && (
                  <div className="space-y-1">
                    {(t.values as Array<{ name: string; value: number; unit: string; referenceMin?: number; referenceMax?: number; isOutOfRange?: boolean }>).map((v, i) => (
                      <div key={i} className={`flex justify-between text-sm px-2 py-1 rounded ${v.isOutOfRange ? "bg-red-50 text-red-700 font-medium" : ""}`}>
                        <span>{v.name}</span>
                        <span>{v.value} {v.unit} {v.referenceMin && v.referenceMax ? `(${v.referenceMin}-${v.referenceMax})` : ""}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tab: Randevular */}
      {tab === 4 && (
        <div className="space-y-3">
          {randevular.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Randevu kaydi yok</CardContent></Card>
          ) : randevular.map((r) => (
            <Card key={r.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{new Date(r.scheduledAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(r.scheduledAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })} - {r.treatmentType || "Belirtilmemis"} ({r.duration}dk)
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${statusColor[r.status] || "bg-gray-100"}`}>
                    {statusLabel[r.status] || r.status}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
