import { BaseAgent, type AgentEvent } from "./base-agent.js";
import { db } from "../db/index.js";
import { users } from "../db/schema/users.js";
import { kvkkConsent } from "../db/schema/kvkk_consent.js";
import { eq } from "drizzle-orm";
import argon2 from "argon2";
import * as jose from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret-change-me");
const JWT_REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET || "dev-refresh-secret-change-me",
);

export class AuthAgent extends BaseAgent {
  readonly name = "AuthAgent";
  readonly description = "Kimlik dogrulama, yetkilendirme, KVKK consent yonetimi";

  async handle(event: AgentEvent): Promise<void> {
    switch (event.type) {
      case "USER_REGISTER":
        await this.handleRegister(event);
        break;
      case "USER_LOGIN":
        await this.handleLogin(event);
        break;
      case "MFA_VERIFY":
        await this.handleMfaVerify(event);
        break;
      case "SESSION_REFRESH":
        await this.handleSessionRefresh(event);
        break;
      case "CONSENT_UPDATE":
        await this.handleConsentUpdate(event);
        break;
      case "PASSWORD_RESET":
        await this.handlePasswordReset(event);
        break;
      default:
        this.log.warn({ event: event.type }, "Unknown event type");
    }
  }

  async generateTokens(userId: string, role: string) {
    const accessToken = await new jose.SignJWT({ sub: userId, role })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("15m")
      .sign(JWT_SECRET);

    const refreshToken = await new jose.SignJWT({ sub: userId })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(JWT_REFRESH_SECRET);

    return { accessToken, refreshToken };
  }

  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password);
  }

  async verifyPassword(hash: string, password: string): Promise<boolean> {
    return argon2.verify(hash, password);
  }

  async verifyRefreshToken(token: string) {
    const { payload } = await jose.jwtVerify(token, JWT_REFRESH_SECRET);
    return payload;
  }

  async getUserById(userId: string) {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    return user;
  }

  async getUserByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user;
  }

  async updateLastLogin(userId: string) {
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, userId));
  }

  async grantConsent(userId: string, purpose: string, description: string, ip?: string) {
    await db.insert(kvkkConsent).values({
      userId,
      purpose,
      description,
      version: 1,
      ipAddress: ip,
    });
    this.logAction("KVKK consent granted", { userId, purpose });
  }

  async revokeConsent(userId: string, purpose: string) {
    await db
      .update(kvkkConsent)
      .set({ status: "revoked", revokedAt: new Date() })
      .where(eq(kvkkConsent.userId, userId));
    this.logAction("KVKK consent revoked", { userId, purpose });
  }

  // Event handlers
  private async handleRegister(event: AgentEvent) {
    this.logAction("User registration", { email: event.payload.email });
    this.emit("USER_REGISTERED", event.payload);
  }

  private async handleLogin(event: AgentEvent) {
    this.logAction("User login", { email: event.payload.email });
    this.emit("USER_LOGGED_IN", event.payload);
  }

  private async handleMfaVerify(event: AgentEvent) {
    this.logAction("MFA verification", { userId: event.payload.userId });
  }

  private async handleSessionRefresh(event: AgentEvent) {
    this.logAction("Session refresh", { userId: event.payload.userId });
  }

  private async handleConsentUpdate(event: AgentEvent) {
    this.logAction("Consent update", event.payload);
  }

  private async handlePasswordReset(event: AgentEvent) {
    this.logAction("Password reset requested", { email: event.payload.email });
  }
}

export const authAgent = new AuthAgent();
