// Hicri Takvim Utility - Umm al-Qura Algorithm
// Intl.DateTimeFormat ile browser-native Hicri takvim

const HIJRI_MONTHS = [
  "Muharrem", "Safer", "Rebiulevvel", "Rebiulahir",
  "Cemaziyelevvel", "Cemaziyelahir", "Receb", "Saban",
  "Ramazan", "Sevval", "Zilkade", "Zilhicce",
];

// Hacamat sunnet gunleri: Hicri ayin 17, 19, 21. gunleri
const SUNNAH_DAYS = [17, 19, 21] as const;

export interface HijriDate {
  day: number;
  month: number;
  year: number;
  monthName: string;
}

export function gregorianToHijri(date: Date): HijriDate {
  const formatter = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });

  const parts = formatter.formatToParts(date);
  const day = parseInt(parts.find((p) => p.type === "day")?.value || "1", 10);
  const month = parseInt(parts.find((p) => p.type === "month")?.value || "1", 10);
  const year = parseInt(parts.find((p) => p.type === "year")?.value || "1446", 10);

  return {
    day,
    month,
    year,
    monthName: HIJRI_MONTHS[month - 1] || "",
  };
}

export function formatHijriDate(date: Date): string {
  const hijri = gregorianToHijri(date);
  return `${hijri.day} ${hijri.monthName} ${hijri.year}`;
}

export function formatDualDate(date: Date): string {
  const hijri = formatHijriDate(date);
  const gregorian = new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

  return `${hijri} / ${gregorian}`;
}

export function isHijriSunnahDay(date: Date): boolean {
  const hijri = gregorianToHijri(date);
  return SUNNAH_DAYS.includes(hijri.day as typeof SUNNAH_DAYS[number]);
}

export function getHijriSunnahDaysInMonth(year: number, month: number): Date[] {
  const sunnahDates: Date[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    if (isHijriSunnahDay(date)) {
      sunnahDates.push(date);
    }
  }

  return sunnahDates;
}

export function getHijriMonthName(month: number): string {
  return HIJRI_MONTHS[month - 1] || "";
}

export { HIJRI_MONTHS, SUNNAH_DAYS };
