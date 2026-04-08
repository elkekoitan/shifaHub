import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HijriDisplay } from "@/components/calendar/hijri-display";

export default function EgitmenAjandaPage() {
  const today = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - today.getDay() + 1 + i);
    return date;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Haftalik Ajanda</h1>
        <HijriDisplay date={today} />
      </div>

      <div className="grid grid-cols-7 gap-2">
        {["Pzt", "Sal", "Car", "Per", "Cum", "Cmt", "Paz"].map((day, i) => (
          <div key={day} className="text-center">
            <p className="text-xs font-medium text-muted-foreground mb-1">{day}</p>
            <Card className={weekDays[i].toDateString() === today.toDateString() ? "border-primary" : ""}>
              <CardContent className="p-3 min-h-[120px]">
                <p className="text-lg font-bold">{weekDays[i].getDate()}</p>
                <p className="text-xs text-muted-foreground">
                  {/* Randevular burada listelenecek */}
                </p>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
