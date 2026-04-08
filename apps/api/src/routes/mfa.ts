import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import * as OTPAuth from "otpauth";
import { db } from "../db/index.js";
import { users } from "../db/schema/users.js";
import { requireAuth, getUser } from "../middleware/auth.js";
import { createAuditLog } from "../middleware/audit.js";
import { generateTokens } from "./auth.js";

export async function mfaRoutes(app: FastifyInstance) {
  // POST /api/mfa/setup - MFA kurulumu baslat (QR kod olustur)
  app.post("/api/mfa/setup", { preHandler: requireAuth() }, async (request, reply) => {
    const { sub } = getUser(request);

    const [user] = await db.select().from(users).where(eq(users.id, sub)).limit(1);
    if (!user) {
      return reply.status(404).send({ success: false, error: "Kullanici bulunamadi" });
    }

    if (user.isMfaEnabled) {
      return reply.status(400).send({ success: false, error: "MFA zaten aktif" });
    }

    const totp = new OTPAuth.TOTP({
      issuer: "ShifaHub",
      label: user.email,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: new OTPAuth.Secret({ size: 20 }),
    });

    // Secret'i DB'ye kaydet (henuz aktif degil)
    await db.update(users).set({ mfaSecret: totp.secret.base32 }).where(eq(users.id, sub));

    const otpauthUri = totp.toString();

    await createAuditLog({
      userId: sub,
      action: "update",
      tableName: "users",
      recordId: sub,
      description: "MFA kurulumu baslatildi",
      request,
    });

    return reply.send({
      success: true,
      data: {
        secret: totp.secret.base32,
        otpauthUri,
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUri)}`,
      },
    });
  });

  // POST /api/mfa/verify - MFA kodu dogrula ve aktif et
  app.post("/api/mfa/verify", { preHandler: requireAuth() }, async (request, reply) => {
    const { sub } = getUser(request);
    const { code } = request.body as { code: string };

    const [user] = await db.select().from(users).where(eq(users.id, sub)).limit(1);
    if (!user || !user.mfaSecret) {
      return reply.status(400).send({ success: false, error: "MFA kurulumu yapilmamis" });
    }

    const totp = new OTPAuth.TOTP({
      issuer: "ShifaHub",
      label: user.email,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(user.mfaSecret),
    });

    const delta = totp.validate({ token: code, window: 1 });
    if (delta === null) {
      return reply.status(401).send({ success: false, error: "Gecersiz MFA kodu" });
    }

    await db.update(users).set({ isMfaEnabled: true }).where(eq(users.id, sub));

    await createAuditLog({
      userId: sub,
      action: "update",
      tableName: "users",
      recordId: sub,
      description: "MFA aktif edildi",
      request,
    });

    return reply.send({ success: true, message: "MFA basariyla aktif edildi" });
  });

  // POST /api/mfa/validate - Login sirasinda MFA dogrulama
  app.post(
    "/api/mfa/validate",
    { config: { rateLimit: { max: 5, timeWindow: "15 minutes" } } },
    async (request, reply) => {
      const { userId, code } = request.body as { userId: string; code: string };

      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user || !user.mfaSecret || !user.isMfaEnabled) {
        return reply.status(400).send({ success: false, error: "MFA aktif degil" });
      }

      const totp = new OTPAuth.TOTP({
        issuer: "ShifaHub",
        label: user.email,
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(user.mfaSecret),
      });

      const delta = totp.validate({ token: code, window: 1 });
      if (delta === null) {
        await createAuditLog({
          userId: user.id,
          action: "login",
          tableName: "users",
          recordId: user.id,
          description: "Basarisiz MFA dogrulama",
          request,
        });
        return reply.status(401).send({ success: false, error: "Gecersiz MFA kodu" });
      }

      await createAuditLog({
        userId: user.id,
        action: "login",
        tableName: "users",
        recordId: user.id,
        description: "MFA dogrulama basarili",
        request,
      });

      // MFA dogrulandi - JWT token'lari olustur ve dondur
      const tokens = await generateTokens(user.id, user.role);

      return reply.send({
        success: true,
        message: "MFA dogrulandi",
        data: {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            isMfaEnabled: true,
          },
          ...tokens,
        },
      });
    },
  );

  // DELETE /api/mfa/disable - MFA devre disi birak
  app.delete("/api/mfa/disable", { preHandler: requireAuth() }, async (request, reply) => {
    const { sub } = getUser(request);

    await db.update(users).set({ isMfaEnabled: false, mfaSecret: null }).where(eq(users.id, sub));

    await createAuditLog({
      userId: sub,
      action: "update",
      tableName: "users",
      recordId: sub,
      description: "MFA devre disi birakildi",
      request,
    });

    return reply.send({ success: true, message: "MFA devre disi birakildi" });
  });
}
