import { BaseAgent, type AgentEvent } from "./base-agent.js";
import { db } from "../db/index.js";
import { bildirim } from "../db/schema/bildirim.js";

type NotificationChannel = "sms" | "push" | "email" | "whatsapp" | "telegram";

interface NotificationPayload {
  userId: string;
  channel: NotificationChannel;
  title: string;
  body: string;
  actionUrl?: string;
}

export class NotificationAgent extends BaseAgent {
  readonly name = "NotificationAgent";
  readonly description = "Cok kanalli bildirim - SMS, Push, Email, WhatsApp, Telegram";

  async handle(event: AgentEvent): Promise<void> {
    switch (event.type) {
      case "NOTIFICATION_SEND":
        await this.handleSend(event);
        break;
      case "REMINDER_SCHEDULED":
        await this.handleReminderScheduled(event);
        break;
      case "REMINDER_TRIGGERED":
        await this.handleReminderTriggered(event);
        break;
      default:
        this.log.warn({ event: event.type }, "Unknown event");
    }
  }

  async sendNotification(payload: NotificationPayload): Promise<void> {
    this.logAction("Bildirim gonderiliyor", { channel: payload.channel, userId: payload.userId });

    switch (payload.channel) {
      case "sms":
        await this.sendSMS(payload);
        break;
      case "push":
        await this.sendPush(payload);
        break;
      case "email":
        await this.sendEmail(payload);
        break;
      case "whatsapp":
        await this.sendWhatsApp(payload);
        break;
      case "telegram":
        await this.sendTelegram(payload);
        break;
    }

    // DB'ye kaydet
    await db.insert(bildirim).values({
      userId: payload.userId,
      type: "sistem",
      title: payload.title,
      body: payload.body,
      actionUrl: payload.actionUrl,
    });

    this.emit("NOTIFICATION_DELIVERED", { channel: payload.channel, userId: payload.userId });
  }

  private async sendSMS(payload: NotificationPayload): Promise<void> {
    // TODO: Netgsm API entegrasyonu
    // const response = await fetch('https://api.netgsm.com.tr/sms/send/get', { ... });
    this.log.info({ userId: payload.userId }, `SMS gonderildi: ${payload.title}`);
  }

  private async sendPush(payload: NotificationPayload): Promise<void> {
    // TODO: FCM entegrasyonu
    // const messaging = getMessaging();
    // await messaging.send({ ... });
    this.log.info({ userId: payload.userId }, `Push gonderildi: ${payload.title}`);
  }

  private async sendEmail(payload: NotificationPayload): Promise<void> {
    // TODO: Resend API entegrasyonu
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({ from: 'ShifaHub <noreply@shifahub.app>', ... });
    this.log.info({ userId: payload.userId }, `Email gonderildi: ${payload.title}`);
  }

  private async sendWhatsApp(payload: NotificationPayload): Promise<void> {
    // TODO: Evolution API entegrasyonu
    // await fetch(`${EVOLUTION_API_URL}/message/sendText/${instance}`, { ... });
    this.log.info({ userId: payload.userId }, `WhatsApp gonderildi: ${payload.title}`);
  }

  private async sendTelegram(payload: NotificationPayload): Promise<void> {
    // TODO: grammy bot.api.sendMessage entegrasyonu
    this.log.info({ userId: payload.userId }, `Telegram gonderildi: ${payload.title}`);
  }

  private async handleSend(event: AgentEvent) {
    const { type, target } = event.payload as { type: string; target: string; message: string };
    this.logAction("Bildirim gonderim istegi", { type, target });
    // Multi-channel dispatch icin queue'ya ekle
    // TODO: BullMQ job olustur
  }

  private async handleReminderScheduled(event: AgentEvent) {
    const { type, delayMs } = event.payload as { type: string; delayMs?: number };
    this.logAction("Hatirlatma planlandi", { type, delayMs });
    // TODO: BullMQ delayed job olustur
  }

  private async handleReminderTriggered(event: AgentEvent) {
    this.logAction("Hatirlatma tetiklendi", event.payload);
  }
}

export const notificationAgent = new NotificationAgent();
