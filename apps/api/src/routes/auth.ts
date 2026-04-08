import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq } from "drizzle-orm";
import argon2 from "argon2";
import * as jose from "jose";
import { db } from "../db/index.js";
import { users } from "../db/schema/users.js";
import { kvkkConsent } from "../db/schema/kvkk_consent.js";
import { auditLog } from "../db/schema/audit_log.js";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().optional(),
  role: z.enum(["danisan", "egitmen"]).default("danisan"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret-change-me");
const JWT_REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET || "dev-refresh-secret-change-me",
);

async function generateTokens(userId: string, role: string) {
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

export async function authRoutes(app: FastifyInstance) {
  // POST /api/auth/register
  app.post("/api/auth/register", async (request, reply) => {
    const body = registerSchema.parse(request.body);

    // Check existing user
    const existing = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
    if (existing.length > 0) {
      return reply.status(409).send({ success: false, error: "Bu e-posta adresi zaten kayitli" });
    }

    // Hash password
    const passwordHash = await argon2.hash(body.password);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email: body.email,
        passwordHash,
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        role: body.role,
      })
      .returning({ id: users.id, email: users.email, role: users.role });

    // Create KVKK consent record
    await db.insert(kvkkConsent).values({
      userId: newUser.id,
      purpose: "saglik_verisi_isleme",
      description: "Kisisel saglik verilerimin ShifaHub platformunda islenmesini kabul ediyorum",
      version: 1,
      ipAddress: request.ip,
      userAgent: request.headers["user-agent"] || "",
    });

    // Audit log
    await db.insert(auditLog).values({
      userId: newUser.id,
      action: "create",
      tableName: "users",
      recordId: newUser.id,
      ipAddress: request.ip,
      description: `Yeni ${body.role} kaydi: ${body.email}`,
    });

    const tokens = await generateTokens(newUser.id, newUser.role);

    return reply.status(201).send({
      success: true,
      data: {
        user: { id: newUser.id, email: newUser.email, role: newUser.role },
        ...tokens,
      },
    });
  });

  // POST /api/auth/login
  app.post("/api/auth/login", async (request, reply) => {
    const body = loginSchema.parse(request.body);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, body.email))
      .limit(1);

    if (!user) {
      return reply.status(401).send({ success: false, error: "Gecersiz e-posta veya sifre" });
    }

    if (!user.isActive) {
      return reply.status(403).send({ success: false, error: "Hesabiniz pasif durumda" });
    }

    const validPassword = await argon2.verify(user.passwordHash, body.password);
    if (!validPassword) {
      // Audit failed login
      await db.insert(auditLog).values({
        userId: user.id,
        action: "login",
        tableName: "users",
        recordId: user.id,
        ipAddress: request.ip,
        description: "Basarisiz giris denemesi",
      });
      return reply.status(401).send({ success: false, error: "Gecersiz e-posta veya sifre" });
    }

    // Update last login
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

    // Audit successful login
    await db.insert(auditLog).values({
      userId: user.id,
      action: "login",
      tableName: "users",
      recordId: user.id,
      ipAddress: request.ip,
      description: "Basarili giris",
    });

    const tokens = await generateTokens(user.id, user.role);

    return reply.send({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        ...tokens,
      },
    });
  });

  // POST /api/auth/refresh
  app.post("/api/auth/refresh", async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken: string };

    try {
      const { payload } = await jose.jwtVerify(refreshToken, JWT_REFRESH_SECRET);
      const userId = payload.sub as string;

      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user || !user.isActive) {
        return reply.status(401).send({ success: false, error: "Gecersiz token" });
      }

      const tokens = await generateTokens(user.id, user.role);
      return reply.send({ success: true, data: tokens });
    } catch {
      return reply.status(401).send({ success: false, error: "Gecersiz veya suresi dolmus token" });
    }
  });

  // GET /api/auth/me
  app.get("/api/auth/me", async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return reply.status(401).send({ success: false, error: "Yetkilendirme gerekli" });
    }

    try {
      const token = authHeader.slice(7);
      const { payload } = await jose.jwtVerify(token, JWT_SECRET);
      const userId = payload.sub as string;

      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user) {
        return reply.status(404).send({ success: false, error: "Kullanici bulunamadi" });
      }

      return reply.send({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          isEmailVerified: user.isEmailVerified,
          isMfaEnabled: user.isMfaEnabled,
        },
      });
    } catch {
      return reply.status(401).send({ success: false, error: "Gecersiz token" });
    }
  });
}
