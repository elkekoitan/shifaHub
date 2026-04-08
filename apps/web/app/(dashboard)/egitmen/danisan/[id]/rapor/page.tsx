"use client";

import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useApi } from "@/hooks/use-api";
import Link from "next/link";

interface FullDanisan {
  user: { firstName: string; lastName: string; email: string; phone: string };
  profil: { birthDate: string; gender: string; bloodType: string; city: string; chronicDiseases: string[]; allergies: string[]; mainComplaints: string[] } | null;
  tedaviler: Array<{ treatmentType: string; sessionNumber: number; treatmentDate: string; findings: string; appliedTreatment: string; recommendations: string }>;
  tahliller: Array<{ testType: string; testDate: string; labName: string }>;
}

export default function DanisanRaporPage() {
  const params = useParams();
  const userId = params.id as string;
  const { data, loading } = useApi<FullDanisan>(`/api/danisan/${userId}/full`);

  if (loading) return <div className="flex items-center justify-center py-20">Yukleniyor...</div>;
  if (!data) return <div className="text-center py-20 text-red-500">Veri bulunamadi</div>;

  const { user, profil, tedaviler, tahliller } = data;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Ekranda gorunen butonlar - yazdirma sirasinda gizlenir */}
      <div className="flex justify-between items-center mb-6 print:hidden">
        <Button asChild variant="outline"><Link href={`/egitmen/danisan/${userId}`}>Geri</Link></Button>
        <Button onClick={() => window.print()}>Yazdir / PDF</Button>
      </div>

      {/* Yazdirilabilir rapor */}
      <div className="space-y-8 print:space-y-4">
        {/* Baslik */}
        <div className="text-center border-b pb-4">
          <h1 className="text-2xl font-bold text-primary print:text-black">ShifaHub</h1>
          <h2 className="text-lg font-semibold mt-2">Danisan Tedavi Raporu</h2>
          <p className="text-sm text-muted-foreground mt-1">Tarih: {new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>

        {/* Hasta Bilgileri */}
        <div>
          <h3 className="text-lg font-semibold border-b pb-1 mb-3">Danisan Bilgileri</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="font-medium">Ad Soyad:</span> {user.firstName} {user.lastName}</div>
            <div><span className="font-medium">Email:</span> {user.email}</div>
            <div><span className="font-medium">Telefon:</span> {user.phone || "-"}</div>
            <div><span className="font-medium">Sehir:</span> {profil?.city || "-"}</div>
            <div><span className="font-medium">Dogum Tarihi:</span> {profil?.birthDate ? new Date(profil.birthDate).toLocaleDateString("tr-TR") : "-"}</div>
            <div><span className="font-medium">Kan Grubu:</span> {profil?.bloodType?.replace("_", " ") || "-"}</div>
          </div>
          {profil?.chronicDiseases && profil.chronicDiseases.length > 0 && (
            <div className="mt-2 text-sm"><span className="font-medium">Kronik Hastaliklar:</span> {profil.chronicDiseases.join(", ")}</div>
          )}
          {profil?.allergies && profil.allergies.length > 0 && (
            <div className="mt-1 text-sm"><span className="font-medium">Alerjiler:</span> {profil.allergies.join(", ")}</div>
          )}
          {profil?.mainComplaints && profil.mainComplaints.length > 0 && (
            <div className="mt-1 text-sm"><span className="font-medium">Sikayetler:</span> {profil.mainComplaints.join(", ")}</div>
          )}
        </div>

        {/* Tedavi Gecmisi */}
        <div>
          <h3 className="text-lg font-semibold border-b pb-1 mb-3">Tedavi Gecmisi ({tedaviler.length} seans)</h3>
          {tedaviler.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tedavi kaydi bulunmuyor.</p>
          ) : (
            <div className="space-y-3">
              {tedaviler.map((t, i) => (
                <div key={i} className="border-l-2 border-primary pl-3 text-sm print:border-black">
                  <div className="flex justify-between">
                    <span className="font-medium">Seans {t.sessionNumber} - {t.treatmentType}</span>
                    <span className="text-muted-foreground">{new Date(t.treatmentDate).toLocaleDateString("tr-TR")}</span>
                  </div>
                  {t.findings && <p className="mt-1"><span className="font-medium">Bulgular:</span> {t.findings}</p>}
                  {t.appliedTreatment && <p><span className="font-medium">Tedavi:</span> {t.appliedTreatment}</p>}
                  {t.recommendations && <p><span className="font-medium">Oneriler:</span> {t.recommendations}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tahliller */}
        {tahliller.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold border-b pb-1 mb-3">Tahlil Sonuclari ({tahliller.length})</h3>
            <div className="space-y-1 text-sm">
              {tahliller.map((t, i) => (
                <div key={i} className="flex justify-between py-1 border-b last:border-0">
                  <span>{t.testType}</span>
                  <span className="text-muted-foreground">{new Date(t.testDate).toLocaleDateString("tr-TR")} {t.labName ? `- ${t.labName}` : ""}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-4 border-t mt-8">
          <p>Bu rapor ShifaHub platformu tarafindan otomatik olusturulmustur.</p>
          <p>KVKK kapsaminda gizli saglik verisi icerir. Yetkisiz paylasim yasaktir.</p>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          .print\\:text-black { color: black !important; }
          .print\\:border-black { border-color: black !important; }
          .print\\:space-y-4 > * + * { margin-top: 1rem !important; }
        }
      `}</style>
    </div>
  );
}
