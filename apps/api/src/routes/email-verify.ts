import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { db } from "../db/index.js";
import { users } from "../db/schema/users.js";
import { requireAuth, getUser } from "../middleware/auth.js";
import { createAuditLog } from "../middleware/audit.js";

// In-memory token store (production'da Redis'e tasinacak)
const verificationTokens = new Map<string, { userId: string; expiresAt: Date }>();
const resetTokens = new Map<string, { userId: string; expiresAt: Date }>();

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function emailVerifyRoutes(app: FastifyInstance) {
  // POST /api/email/send-verification - Dogrulama emaili gonder
  app.post(
    "/api/email/send-verification",
    { preHandler: requireAuth() },
    async (request, reply) => {
      const { sub } = getUser(request);

      const [user] = await db.select().from(users).where(eq(users.id, sub)).limit(1);
      if (!user) {
        return reply.status(404).send({ success: false, error: "Kullanici bulunamadi" });
      }

      if (user.isEmailVerified) {
        return reply.status(400).send({ success: false, error: "Email zaten dogrulanmis" });
      }

      const token = generateToken();
      const otp = generateOTP();
      verificationTokens.set(token, {
        userId: sub,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 saat
      });

      // TODO: Resend API ile email gonder
      // await resend.emails.send({
      //   from: "ShifaHub <noreply@shifahub.app>",
      //   to: user.email,
      //   subject: "Email Adresinizi Dogrulayin - ShifaHub",
      //   html: `<p>Dogrulama kodunuz: <strong>${otp}</strong></p>`
      // });

      app.log.info({ email: user.email, otp }, "Email verification OTP generated");

      await createAuditLog({
        userId: sub,
        action: "update",
        tableName: "users",
        recordId: sub,
        description: "Email dogrulama kodu gonderildi",
        request,
      });

      return reply.send({
        success: true,
        message: "Dogrulama kodu gonderildi",
        // Dev modda OTP'yi dondur (production'da kaldirilacak)
        ...(process.env.NODE_ENV !== "production" && { devOtp: otp, devToken: token }),
      });
    },
  );

  // POST /api/email/verify - Email dogrula
  app.post("/api/email/verify", { preHandler: requireAuth() }, async (request, reply) => {
    const { sub } = getUser(request);
    const { token } = request.body as { token: string };

    const stored = verificationTokens.get(token);
    if (!stored || stored.userId !== sub || stored.expiresAt < new Date()) {
      return reply.status(400).send({ success: false, error: "Gecersiz veya suresi dolmus token" });
    }

    await db.update(users).set({ isEmailVerified: true }).where(eq(users.id, sub));
    verificationTokens.delete(token);

    await createAuditLog({
      userId: sub,
      action: "update",
      tableName: "users",
      recordId: sub,
      description: "Email dogrulandi",
      request,
    });

    return reply.send({ success: true, message: "Email basariyla dogrulandi" });
  });

  // POST /api/email/forgot-password - Sifre sifirlama talebi
  app.post("/api/email/forgot-password", async (request, reply) => {
    const { email } = request.body as { email: string };

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    // Guvenlik: kullanici var/yok bilgisini verme
    if (!user) {
      return reply.send({ success: true, message: "Eger bu email kayitliysa sifirlama linki gonderildi" });
    }

    const token = generateToken();
    resetTokens.set(token, {
      userId: user.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 saat
    });

    // TODO: Resend API ile sifre sifirlama emaili gonder
    app.log.info({ email, token }, "Password reset token generated");

    await createAuditLog({
      userId: user.id,
      action: "update",
      tableName: "users",
      recordId: user.id,
      description: "Sifre sifirlama talebi",
      request,
    });

    return reply.send({
      success: true,
      message: "Eger bu email kayitliysa sifirlama linki gonderildi",
      ...(process.env.NODE_ENV !== "production" && { devToken: token }),
    });
  });

  // POST /api/email/reset-password - Sifre sifirla
  app.post("/api/email/reset-password", async (request, reply) => {
    const { token, newPassword } = request.body as { token: string; newPassword: string };

    const stored = resetTokens.get(token);
    if (!stored || stored.expiresAt < new Date()) {
      return reply.status(400).send({ success: false, error: "Gecersiz veya suresi dolmus token" });
    }

    const argon2 = await import("argon2");
    const passwordHash = await argon2.hash(newPassword);

    await db.update(users).set({ passwordHash }).where(eq(users.id, stored.userId));
    resetTokens.delete(token);

    await createAuditLog({
      userId: stored.userId,
      action: "update",
      tableName: "users",
      recordId: stored.userId,
      description: "Sifre sifirlandi",
      request,
    });

    return reply.send({ success: true, message: "Sifre basariyla sifirlandi" });
  });
}
