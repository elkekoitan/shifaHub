"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApi, useApiMutation } from "@/hooks/use-api";

interface Egitmen {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  certificateNumber: string;
  clinicCity: string;
  specialties: string[];
}

export default function AdminEgitmenPage() {
  const { data: pending, loading, refetch } = useApi<Egitmen[]>("/api/admin/egitmen/pending");
  const { mutate } = useApiMutation();

  async function handleApprove(id: string) {
    await mutate(`/api/admin/egitmen/${id}/approve`, {});
    refetch();
  }

  async function handleReject(id: string) {
    const reason = prompt("Red sebebi:");
    if (!reason) return;
    await mutate(`/api/admin/egitmen/${id}/reject`, { reason });
    refetch();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Egitmen Yonetimi</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-amber-600">Onay Bekleyen Egitmenler ({pending?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-4">Yukleniyor...</p>
          ) : pending && pending.length > 0 ? (
            <div className="space-y-4">
              {pending.map((e) => (
                <div key={e.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{e.firstName} {e.lastName}</p>
                    <p className="text-sm text-muted-foreground">{e.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Sertifika: {e.certificateNumber} | {e.clinicCity}
                    </p>
                    {e.specialties && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {e.specialties.map((s) => (
                          <span key={s} className="px-1.5 py-0.5 text-xs bg-teal-50 text-teal-700 rounded">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleApprove(e.id)}>Onayla</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleReject(e.id)}>Reddet</Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">Onay bekleyen egitmen bulunmuyor.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
