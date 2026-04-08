"use client";

import { formatDualDate, isHijriSunnahDay, gregorianToHijri } from "@/lib/hijri-calendar";

interface HijriDisplayProps {
  date: Date;
  showSunnah?: boolean;
}

export function HijriDisplay({ date, showSunnah = true }: HijriDisplayProps) {
  const hijri = gregorianToHijri(date);
  const isSunnah = isHijriSunnahDay(date);

  return (
    <div className="text-center">
      <p className="text-sm font-medium">
        {hijri.day} {hijri.monthName} {hijri.year}
      </p>
      <p className="text-xs text-muted-foreground">
        {new Intl.DateTimeFormat("tr-TR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(date)}
      </p>
      {showSunnah && isSunnah && (
        <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
          Sunnet Gunu
        </span>
      )}
    </div>
  );
}
