import { BaseAgent, type AgentEvent } from "./base-agent.js";

export class EmergencyAgent extends BaseAgent {
  readonly name = "EmergencyAgent";
  readonly description = "Komplikasyon raporlama, bildirim zinciri, takip yonetimi";

  async handle(event: AgentEvent): Promise<void> {
    switch (event.type) {
      case "COMPLICATION_REPORTED":
        await this.handleComplicationReported(event);
        break;
      case "FOLLOWUP_DUE":
        await this.handleFollowupDue(event);
        break;
      case "EMERGENCY_RESOLVED":
        await this.handleResolved(event);
        break;
      default:
        this.log.warn({ event: event.type }, "Unknown event");
    }
  }

  private async handleComplicationReported(event: AgentEvent) {
    const severity = event.payload.severity as number;
    const komplikasyonId = event.payload.id as string;

    this.logAction("Komplikasyon raporlandi", { severity, komplikasyonId });

    // Severity bazli bildirim zinciri
    if (severity >= 1) {
      this.emit("NOTIFICATION_SEND", {
        type: "email",
        target: "admin",
        message: `Komplikasyon raporu (Seviye ${severity})`,
      });
    }
    if (severity >= 3) {
      this.emit("NOTIFICATION_SEND", {
        type: "sms",
        target: "tabip",
        message: `ACIL: Komplikasyon seviye ${severity} - Sorumlu tabip bilgilendirmesi`,
      });
    }
    if (severity >= 4) {
      this.emit("TG_NOTIFICATION_SENT", {
        chatType: "admin",
        message: `🚨 KRITIK KOMPLIKASYON (Seviye ${severity}) - Acil mudahale gerekli`,
      });
    }
    if (severity >= 5) {
      this.log.error({ komplikasyonId, severity }, "SEVIYE 5: 112 bilgi karti gerekli!");
      this.emit("NOTIFICATION_SEND", {
        type: "all_channels",
        target: "admin,tabip",
        message: `⚠️ SEVIYE 5 KOMPLIKASYON - 112 bilgilendirilmeli, Bakanlik raporu hazirlanmali`,
      });
    }

    // 24 saat sonra takip hatirlatmasi planla
    this.emit("REMINDER_SCHEDULED", {
      type: "followup_24h",
      komplikasyonId,
      delayMs: 24 * 60 * 60 * 1000,
    });
  }

  private async handleFollowupDue(event: AgentEvent) {
    const { komplikasyonId, period } = event.payload as { komplikasyonId: string; period: string };
    this.logAction("Takip zamani geldi", { komplikasyonId, period });

    this.emit("NOTIFICATION_SEND", {
      type: "push",
      target: "egitmen",
      message: `Komplikasyon takip notu girilmeli (${period})`,
    });
  }

  private async handleResolved(event: AgentEvent) {
    const komplikasyonId = event.payload.id as string;
    this.logAction("Komplikasyon cozuldu", { komplikasyonId });
  }
}

export const emergencyAgent = new EmergencyAgent();
