"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApi, useApiMutation } from "@/hooks/use-api";
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
    nextSessionDate?: string;
    vitalSigns: { bloodPressure?: string; pulse?: number; weight?: number } | null;
    beforeImageUrls?: string[]; afterImageUrls?: string[];
  }>;
  tahliller: Array<{ id: string; testType: string; testDate: string; labName: string; values: unknown[] }>;
  randevular: Array<{ id: string; scheduledAt: string; status: string; treatmentType: string; duration: number }>;
}

const TABS = ["Genel", "Anamnez", "Tedaviler", "Tahliller", "Randevular", "Protokol", "Medya", "Tavsiyeler"];
interface ProtokolComplaint {
  description: string;
  priority: string;
  treatmentMethod: string;
  estimatedSessions: number;
  sessionInterval: string;
}

interface Protokol {
  id: string;
  title: string;
  status: string;
  complaints: ProtokolComplaint[];
  supportingTreatments: string;
  notes: string;
  createdAt: string;
}

const PRIORITY_LABELS: Record<string, string> = {
  "1": "Acil", "2": "Yuksek", "3": "Normal", "4": "Takip",
};
const PRIORITY_COLORS: Record<string, string> = {
  "1": "bg-red-100 text-red-800", "2": "bg-orange-100 text-orange-800",
  "3": "bg-blue-100 text-blue-800", "4": "bg-gray-100 text-gray-800",
};
const TREATMENT_LABELS: Record<string, string> = {
  hacamat_kuru: "Hacamat (Kuru)", hacamat_yas: "Hacamat (Yas)", solucan: "Solucan Tedavisi",
  sujok: "Sujok", refleksoloji: "Refleksoloji", akupunktur: "Akupunktur", fitoterapi: "Fitoterapi",
};
const PROTOKOL_STATUS_LABELS: Record<string, string> = {
  active: "Aktif", completed: "Tamamlandi", cancelled: "Iptal", draft: "Taslak",
};
const PROTOKOL_STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800", completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800", draft: "bg-gray-100 text-gray-800",
};

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
  const { data, loading, error, refetch } = useApi<FullDanisan>(`/api/danisan/${userId}/full`);
  const { data: protokoller, loading: protokolLoading } = useApi<Protokol[]>(
    `/api/protokol/danisan/${userId}`,
  );
  const { mutate: updateTedavi, loading: updatingTedavi } = useApiMutation();
  const [editingTedaviId, setEditingTedaviId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState({
    recommendations: "",
    afterNotes: "",
    sideEffects: "",
    patientFeedback: "",
  });

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
          <Button asChild size="sm" variant="secondary"><Link href={`/egitmen/danisan/${userId}/rapor`}>Rapor</Link></Button>
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
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{new Date(t.treatmentDate).toLocaleDateString("tr-TR")}</span>
                    {editingTedaviId !== t.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingTedaviId(t.id);
                          setEditFields({
                            recommendations: t.recommendations || "",
                            afterNotes: (t as Record<string, unknown>).afterNotes as string || "",
                            sideEffects: (t as Record<string, unknown>).sideEffects as string || "",
                            patientFeedback: (t as Record<string, unknown>).patientFeedback as string || "",
                          });
                        }}
                      >
                        Duzenle
                      </Button>
                    )}
                  </div>
                </div>
                {t.vitalSigns && (
                  <p className="text-xs text-muted-foreground">
                    Tansiyon: {t.vitalSigns.bloodPressure || "-"} | Nabiz: {t.vitalSigns.pulse || "-"} | Kilo: {t.vitalSigns.weight || "-"}
                  </p>
                )}
                {t.findings && <div><p className="text-xs text-muted-foreground">Bulgular:</p><p className="text-sm">{t.findings}</p></div>}
                {t.appliedTreatment && <div><p className="text-xs text-muted-foreground">Tedavi:</p><p className="text-sm">{t.appliedTreatment}</p></div>}
                {t.recommendations && editingTedaviId !== t.id && <div><p className="text-xs text-muted-foreground">Oneriler:</p><p className="text-sm text-primary">{t.recommendations}</p></div>}

                {/* Inline edit form */}
                {editingTedaviId === t.id && (
                  <div className="border-t pt-3 mt-3 space-y-3">
                    <p className="text-sm font-medium text-primary">Tedavi Kaydini Duzenle</p>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Oneriler</label>
                      <textarea
                        className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[60px]"
                        value={editFields.recommendations}
                        onChange={(e) => setEditFields({ ...editFields, recommendations: e.target.value })}
                        placeholder="Danisana oneriler..."
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Sonrasi Notlari</label>
                      <textarea
                        className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[60px]"
                        value={editFields.afterNotes}
                        onChange={(e) => setEditFields({ ...editFields, afterNotes: e.target.value })}
                        placeholder="Tedavi sonrasi notlar..."
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Yan Etkiler</label>
                      <textarea
                        className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[60px]"
                        value={editFields.sideEffects}
                        onChange={(e) => setEditFields({ ...editFields, sideEffects: e.target.value })}
                        placeholder="Gozlemlenen yan etkiler..."
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Danisan Geri Bildirimi</label>
                      <textarea
                        className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[60px]"
                        value={editFields.patientFeedback}
                        onChange={(e) => setEditFields({ ...editFields, patientFeedback: e.target.value })}
                        placeholder="Danisan geri bildirimi..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={updatingTedavi}
                        onClick={async () => {
                          const result = await updateTedavi(`/api/tedavi/${t.id}`, editFields, "PUT");
                          if (result) {
                            setEditingTedaviId(null);
                            refetch();
                          }
                        }}
                      >
                        {updatingTedavi ? "Kaydediliyor..." : "Kaydet"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingTedaviId(null)}
                      >
                        Iptal
                      </Button>
                    </div>
                  </div>
                )}

                {/* Oncesi / Sonrasi gorsel karsilastirma */}
                {((t.beforeImageUrls && t.beforeImageUrls.length > 0) || (t.afterImageUrls && t.afterImageUrls.length > 0)) && (
                  <div className="border-t pt-3 mt-3">
                    <p className="text-xs text-muted-foreground mb-2 font-medium">Oncesi / Sonrasi Gorseller</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-center mb-2 text-amber-700">Oncesi</p>
                        {t.beforeImageUrls && t.beforeImageUrls.length > 0 ? (
                          <div className="space-y-2">
                            {t.beforeImageUrls.map((url, idx) => (
                              <img key={idx} src={url} alt={`Oncesi ${idx + 1}`} className="w-full rounded-md border object-cover max-h-48" />
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-32 bg-muted/50 rounded-md border border-dashed">
                            <span className="text-xs text-muted-foreground">Gorsel yok</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-center mb-2 text-green-700">Sonrasi</p>
                        {t.afterImageUrls && t.afterImageUrls.length > 0 ? (
                          <div className="space-y-2">
                            {t.afterImageUrls.map((url, idx) => (
                              <img key={idx} src={url} alt={`Sonrasi ${idx + 1}`} className="w-full rounded-md border object-cover max-h-48" />
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-32 bg-muted/50 rounded-md border border-dashed">
                            <span className="text-xs text-muted-foreground">Gorsel yok</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
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

      {/* Tab: Protokol */}
      {tab === 5 && (
        <div className="space-y-3">
          {protokolLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Yukleniyor...</p>
          ) : !protokoller || protokoller.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Henuz protokol olusturulmamis
              </CardContent>
            </Card>
          ) : (
            protokoller.map((p) => (
              <Card key={p.id}>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="font-semibold text-base">{p.title}</h3>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${PROTOKOL_STATUS_COLORS[p.status] || "bg-gray-100"}`}>
                      {PROTOKOL_STATUS_LABELS[p.status] || p.status}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {(p.complaints ?? []).map((c, i) => (
                      <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 bg-muted/50 rounded-md">
                        <span className={`px-2 py-0.5 text-xs rounded-full shrink-0 ${PRIORITY_COLORS[c.priority] || "bg-gray-100"}`}>
                          {PRIORITY_LABELS[c.priority] || `Oncelik ${c.priority}`}
                        </span>
                        <span className="text-sm flex-1">{c.description}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {TREATMENT_LABELS[c.treatmentMethod] || c.treatmentMethod}
                          {" | "}
                          {c.estimatedSessions} seans
                        </span>
                      </div>
                    ))}
                  </div>

                  {p.supportingTreatments && (
                    <div>
                      <p className="text-xs text-muted-foreground">Destekleyici Tedaviler:</p>
                      <p className="text-sm">{p.supportingTreatments}</p>
                    </div>
                  )}

                  {p.notes && (
                    <div>
                      <p className="text-xs text-muted-foreground">Notlar:</p>
                      <p className="text-sm">{p.notes}</p>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground text-right">
                    {new Date(p.createdAt).toLocaleDateString("tr-TR")}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Tab: Medya */}
      {tab === 6 && (
        <div className="space-y-3">
          {(() => {
            const allImages = tedaviler.flatMap((t) => {
              const imgs: Array<{ url: string; type: "oncesi" | "sonrasi"; sessionNumber: number; treatmentType: string; treatmentDate: string }> = [];
              (t.beforeImageUrls || []).forEach((url) => imgs.push({ url, type: "oncesi", sessionNumber: t.sessionNumber, treatmentType: t.treatmentType, treatmentDate: t.treatmentDate }));
              (t.afterImageUrls || []).forEach((url) => imgs.push({ url, type: "sonrasi", sessionNumber: t.sessionNumber, treatmentType: t.treatmentType, treatmentDate: t.treatmentDate }));
              return imgs;
            });
            if (allImages.length === 0) {
              return <Card><CardContent className="py-8 text-center text-muted-foreground">Henuz gorsel yuklenmemis</CardContent></Card>;
            }
            return (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {allImages.map((img, i) => (
                  <Card key={i}>
                    <CardContent className="pt-4 space-y-2">
                      <img src={img.url} alt={`${img.type} - Seans ${img.sessionNumber}`} className="w-full rounded-md border object-cover max-h-56" />
                      <div className="flex items-center justify-between text-xs">
                        <span className={`px-2 py-0.5 rounded-full ${img.type === "oncesi" ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"}`}>
                          {img.type === "oncesi" ? "Oncesi" : "Sonrasi"}
                        </span>
                        <span className="text-muted-foreground">
                          Seans {img.sessionNumber} - {new Date(img.treatmentDate).toLocaleDateString("tr-TR")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{img.treatmentType}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* Tab: Tavsiyeler */}
      {tab === 7 && (
        <div className="space-y-3">
          {(() => {
            const tavsiyeler = tedaviler
              .filter((t) => t.recommendations || t.nextSessionDate)
              .sort((a, b) => new Date(b.treatmentDate).getTime() - new Date(a.treatmentDate).getTime());
            if (tavsiyeler.length === 0) {
              return <Card><CardContent className="py-8 text-center text-muted-foreground">Henuz tavsiye kaydi yok</CardContent></Card>;
            }
            return tavsiyeler.map((t) => (
              <Card key={t.id}>
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">Seans {t.sessionNumber} - {t.treatmentType}</p>
                    <span className="text-xs text-muted-foreground">{new Date(t.treatmentDate).toLocaleDateString("tr-TR")}</span>
                  </div>
                  {t.recommendations && (
                    <div className="p-3 bg-primary/5 rounded-md border border-primary/10">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Tavsiyeler</p>
                      <p className="text-sm">{t.recommendations}</p>
                    </div>
                  )}
                  {t.nextSessionDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-xs text-muted-foreground">Sonraki Seans:</span>
                      <span className="font-medium text-primary">{new Date(t.nextSessionDate).toLocaleDateString("tr-TR")}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ));
          })()}
        </div>
      )}
    </div>
  );
}
