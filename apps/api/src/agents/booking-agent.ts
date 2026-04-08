import { BaseAgent, type AgentEvent } from "./base-agent.js";

// Valid state transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  requested: ["confirmed", "cancelled"],
  confirmed: ["reminded", "cancelled"],
  reminded: ["arrived", "cancelled", "no_show"],
  arrived: ["treated"],
  treated: ["completed"],
  completed: [],
  cancelled: [],
  no_show: [],
};

export class BookingAgent extends BaseAgent {
  readonly name = "BookingAgent";
  readonly description = "Randevu yonetimi, state machine, catisma algilama, hatirlatilar";

  async handle(event: AgentEvent): Promise<void> {
    switch (event.type) {
      case "APPOINTMENT_CREATED":
        await this.handleCreated(event);
        break;
      case "APPOINTMENT_CONFIRMED":
        await this.handleConfirmed(event);
        break;
      case "APPOINTMENT_CANCELLED":
        await this.handleCancelled(event);
        break;
      case "APPOINTMENT_REMINDED":
        await this.handleReminded(event);
        break;
      case "APPOINTMENT_COMPLETED":
        await this.handleCompleted(event);
        break;
      case "APPOINTMENT_NO_SHOW":
        await this.handleNoShow(event);
        break;
      default:
        this.log.warn({ event: event.type }, "Unknown event");
    }
  }

  isValidTransition(from: string, to: string): boolean {
    return (VALID_TRANSITIONS[from] || []).includes(to);
  }

  private async handleCreated(event: AgentEvent) {
    const { randevuId, scheduledAt } = event.payload;
    this.logAction("Randevu olusturuldu", { randevuId });

    // Onay bildirimi
    this.emit("NOTIFICATION_SEND", {
      type: "sms",
      target: "danisan",
      template: "randevu_onay",
      data: { randevuId, scheduledAt },
    });

    // 24h hatirlatma planla
    const scheduledDate = new Date(scheduledAt as string);
    const reminder24h = new Date(scheduledDate.getTime() - 24 * 60 * 60 * 1000);
    const reminder1h = new Date(scheduledDate.getTime() - 60 * 60 * 1000);

    this.emit("REMINDER_SCHEDULED", {
      type: "appointment_24h",
      randevuId,
      scheduledFor: reminder24h.toISOString(),
    });

    this.emit("REMINDER_SCHEDULED", {
      type: "appointment_1h",
      randevuId,
      scheduledFor: reminder1h.toISOString(),
    });
  }

  private async handleConfirmed(event: AgentEvent) {
    this.logAction("Randevu onaylandi", event.payload);
    this.emit("NOTIFICATION_SEND", {
      type: "push",
      target: "danisan",
      message: "Randevunuz onaylandi",
    });
  }

  private async handleCancelled(event: AgentEvent) {
    this.logAction("Randevu iptal edildi", event.payload);
    this.emit("NOTIFICATION_SEND", {
      type: "sms",
      target: "danisan",
      message: "Randevunuz iptal edildi",
    });
  }

  private async handleReminded(event: AgentEvent) {
    this.logAction("Randevu hatirlati gonderildi", event.payload);
  }

  private async handleCompleted(event: AgentEvent) {
    this.logAction("Randevu tamamlandi", event.payload);
  }

  private async handleNoShow(event: AgentEvent) {
    this.logAction("Danisan gelmedi", event.payload);
  }
}

export const bookingAgent = new BookingAgent();
