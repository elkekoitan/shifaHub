"use client";

import { Card, CardContent } from "@/components/ui/card";
import { HijriDisplay } from "@/components/calendar/hijri-display";
import { useApi } from "@/hooks/use-api";

interface Appointment {
  id: string;
  scheduledAt: string;
  duration: number;
  treatmentType: string;
  status: string;
  danisanId: string;
  danisanFirstName?: string;
  danisanLastName?: string;
}

const statusColors: Record<string, string> = {
  requested: "bg-amber-100 text-amber-800",
  confirmed: "bg-green-100 text-green-800",
  reminded: "bg-sky-100 text-sky-800",
  arrived: "bg-indigo-100 text-indigo-800",
  treated: "bg-purple-100 text-purple-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800",
  no_show: "bg-gray-100 text-gray-800",
  ertelendi: "bg-orange-100 text-orange-800",
};

const statusLabels: Record<string, string> = {
  requested: "Onay Bekliyor",
  confirmed: "Onaylandi",
  reminded: "Hatirlatildi",
  arrived: "Geldi",
  treated: "Tedavi Edildi",
  completed: "Tamamlandi",
  cancelled: "Iptal",
  no_show: "Gelmedi",
  ertelendi: "Ertelendi",
};

export default function EgitmenAjandaPage() {
  const today = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - today.getDay() + 1 + i);
    return date;
  });

  const { data: randevular, loading } = useApi<Appointment[]>("/api/randevu");

  function getAppointmentsForDay(date: Date) {
    if (!randevular) return [];
    return randevular.filter((r) => {
      const rDate = new Date(r.scheduledAt);
      return (
        rDate.getFullYear() === date.getFullYear() &&
        rDate.getMonth() === date.getMonth() &&
        rDate.getDate() === date.getDate()
      );
    });
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Haftalik Ajanda</h1>
        <HijriDisplay date={today} />
      </div>

      {loading && <p className="text-sm text-muted-foreground">Randevular yukleniyor...</p>}

      <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
        <div className="grid grid-cols-7 gap-2 min-w-[700px]">
          {["Pzt", "Sal", "Car", "Per", "Cum", "Cmt", "Paz"].map((day, i) => {
            const wd = weekDays[i]!;
            const dayAppointments = getAppointmentsForDay(wd);
            const isToday = wd.toDateString() === today.toDateString();

            return (
              <div key={day} className="text-center">
                <p className="text-xs font-medium text-muted-foreground mb-1">{day}</p>
                <Card className={isToday ? "border-primary" : ""}>
                  <CardContent className="p-3 min-h-[120px]">
                    <p className="text-lg font-bold">{wd.getDate()}</p>
                    <div className="mt-2 space-y-1.5">
                      {dayAppointments.length === 0 && !loading && (
                        <p className="text-[10px] text-muted-foreground">-</p>
                      )}
                      {dayAppointments.map((apt) => (
                        <div key={apt.id} className="rounded border p-1.5 text-left">
                          <p className="text-[11px] font-semibold">{formatTime(apt.scheduledAt)}</p>
                          {apt.danisanFirstName && (
                            <p className="text-[10px] font-medium truncate">
                              {apt.danisanFirstName} {apt.danisanLastName}
                            </p>
                          )}
                          <p className="text-[10px] text-muted-foreground truncate">
                            {apt.treatmentType || "Tedavi"}
                          </p>
                          <span
                            className={`inline-block mt-0.5 px-1 py-0.5 text-[9px] rounded-full ${
                              statusColors[apt.status] || "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {statusLabels[apt.status] || apt.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
