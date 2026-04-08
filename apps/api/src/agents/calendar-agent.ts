import { BaseAgent, type AgentEvent } from "./base-agent.js";

const HIJRI_MONTHS = [
  "Muharrem", "Safer", "Rebiulevvel", "Rebiulahir",
  "Cemaziyelevvel", "Cemaziyelahir", "Receb", "Saban",
  "Ramazan", "Sevval", "Zilkade", "Zilhicce",
];

const SUNNAH_DAYS = [17, 19, 21] as const;

interface HijriDate {
  day: number;
  month: number;
  year: number;
  monthName: string;
}

export class CalendarAgent extends BaseAgent {
  readonly name = "CalendarAgent";
  readonly description = "Hicri-Miladi donusum, sunnet gunleri, ozel gunler";

  async handle(event: AgentEvent): Promise<void> {
    switch (event.type) {
      case "CALENDAR_SYNC":
        await this.handleSync(event);
        break;
      case "SUNNAH_DAY_CHECK":
        await this.handleSunnahCheck(event);
        break;
      default:
        this.log.warn({ event: event.type }, "Unknown event");
    }
  }

  gregorianToHijri(date: Date): HijriDate {
    const formatter = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    });

    const parts = formatter.formatToParts(date);
    const day = parseInt(parts.find((p) => p.type === "day")?.value || "1", 10);
    const month = parseInt(parts.find((p) => p.type === "month")?.value || "1", 10);
    const year = parseInt(parts.find((p) => p.type === "year")?.value || "1446", 10);

    return { day, month, year, monthName: HIJRI_MONTHS[month - 1] || "" };
  }

  formatHijriDate(date: Date): string {
    const hijri = this.gregorianToHijri(date);
    return `${hijri.day} ${hijri.monthName} ${hijri.year}`;
  }

  isHijriSunnahDay(date: Date): boolean {
    const hijri = this.gregorianToHijri(date);
    return SUNNAH_DAYS.includes(hijri.day as typeof SUNNAH_DAYS[number]);
  }

  // Bir ay icindeki sunnet gunlerini bul
  getSunnahDaysInMonth(year: number, month: number): Date[] {
    const sunnahDates: Date[] = [];
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      if (this.isHijriSunnahDay(date)) {
        sunnahDates.push(date);
      }
    }

    return sunnahDates;
  }

  private async handleSync(event: AgentEvent) {
    this.logAction("Takvim senkronizasyonu", event.payload);
  }

  private async handleSunnahCheck(event: AgentEvent) {
    const date = new Date(event.payload.date as string);
    const isSunnah = this.isHijriSunnahDay(date);
    const hijri = this.formatHijriDate(date);

    if (isSunnah) {
      this.emit("SUNNAH_DAY_APPROACHING", { date: date.toISOString(), hijriDate: hijri });
      this.emit("NOTIFICATION_SEND", {
        type: "push",
        target: "egitmen",
        message: `Yarin sunnet gunu: ${hijri}`,
      });
    }
  }
}

export const calendarAgent = new CalendarAgent();
