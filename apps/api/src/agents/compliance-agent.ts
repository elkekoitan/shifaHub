import { BaseAgent, type AgentEvent } from "./base-agent.js";
import { db } from "../db/index.js";
import { auditLog } from "../db/schema/audit_log.js";
import { kvkkConsent } from "../db/schema/kvkk_consent.js";
import { eq, and, sql } from "drizzle-orm";

export class ComplianceAgent extends BaseAgent {
  readonly name = "ComplianceAgent";
  readonly description = "KVKK uyumluluk, audit log, consent yonetimi, veri maskeleme";

  async handle(event: AgentEvent): Promise<void> {
    switch (event.type) {
      case "DATA_ACCESSED":
        await this.handleDataAccessed(event);
        break;
      case "CONSENT_GRANTED":
        await this.handleConsentGranted(event);
        break;
      case "CONSENT_REVOKED":
        await this.handleConsentRevoked(event);
        break;
      case "BREACH_DETECTED":
        await this.handleBreachDetected(event);
        break;
      default:
        this.log.warn({ event: event.type }, "Unknown event");
    }
  }

  // TC Kimlik maskeleme: 12345678901 -> ***456***01
  maskTcKimlik(tc: string): string {
    if (tc.length !== 11) return "***********";
    return `***${tc.substring(3, 6)}***${tc.substring(9)}`;
  }

  // Telefon maskeleme: 05321234567 -> *******4567
  maskPhone(phone: string): string {
    if (phone.length < 4) return "****";
    return "*".repeat(phone.length - 4) + phone.slice(-4);
  }

  // Email maskeleme: user@example.com -> u***@e*****.com
  maskEmail(email: string): string {
    const [local, domain] = email.split("@");
    if (!local || !domain) return "***@***.***";
    const domainParts = domain.split(".");
    const domainFirst = domainParts[0]?.[0] || "*";
    return `${local[0]}***@${domainFirst}*****.${domainParts.slice(1).join(".")}`;
  }

  // Aktif riza kontrolu
  async hasActiveConsent(userId: string, purpose: string): Promise<boolean> {
    const [consent] = await db
      .select()
      .from(kvkkConsent)
      .where(
        and(
          eq(kvkkConsent.userId, userId),
          eq(kvkkConsent.purpose, purpose),
          eq(kvkkConsent.status, "active"),
        ),
      )
      .limit(1);

    return !!consent;
  }

  // Son 24 saatteki audit log sayisi
  async getRecentAuditCount(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(auditLog)
      .where(sql`${auditLog.createdAt} >= NOW() - INTERVAL '24 hours'`);

    return result[0]?.count || 0;
  }

  private async handleDataAccessed(event: AgentEvent) {
    this.logAction("Veri erisimi kaydedildi", {
      userId: event.payload.userId,
      tableName: event.payload.tableName,
    });
  }

  private async handleConsentGranted(event: AgentEvent) {
    this.logAction("KVKK rizasi verildi", {
      userId: event.payload.userId,
      purpose: event.payload.purpose,
    });
  }

  private async handleConsentRevoked(event: AgentEvent) {
    const { userId, purpose } = event.payload as { userId: string; purpose: string };
    this.logAction("KVKK rizasi geri cekildi", { userId, purpose });

    this.emit("NOTIFICATION_SEND", {
      type: "email",
      target: userId,
      message: `KVKK rizaniz geri cekildi: ${purpose}. Ilgili veri isleme durduruldu.`,
    });
  }

  private async handleBreachDetected(event: AgentEvent) {
    this.log.error(event.payload, "KVKK VERI IHLALI TESPIT EDILDI!");

    // 72 saat icinde KVKK Kurulu'na bildirim gerekli
    this.emit("NOTIFICATION_SEND", {
      type: "all_channels",
      target: "admin",
      message: "⚠️ KVKK VERI IHLALI - 72 saat icinde KVKK Kurulu'na bildirim yapilmali!",
    });
  }
}

export const complianceAgent = new ComplianceAgent();
