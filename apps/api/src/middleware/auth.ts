import type { FastifyRequest, FastifyReply } from "fastify";
import * as jose from "jose";

type UserRole = "danisan" | "egitmen" | "admin" | "tabip";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret-change-me");

export interface AuthPayload {
  sub: string;
  role: UserRole;
}

export async function verifyToken(request: FastifyRequest): Promise<AuthPayload> {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Yetkilendirme gerekli");
  }

  const token = authHeader.slice(7);
  const { payload } = await jose.jwtVerify(token, JWT_SECRET);

  return {
    sub: payload.sub as string,
    role: payload.role as UserRole,
  };
}

export function requireAuth() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const payload = await verifyToken(request);
      (request as any).user = payload;
    } catch {
      return reply.status(401).send({ success: false, error: "Yetkilendirme gerekli" });
    }
  };
}

export function requireRole(...roles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const payload = await verifyToken(request);
      (request as any).user = payload;

      if (!roles.includes(payload.role)) {
        return reply.status(403).send({
          success: false,
          error: "Bu islemi yapma yetkiniz yok",
        });
      }
    } catch {
      return reply.status(401).send({ success: false, error: "Yetkilendirme gerekli" });
    }
  };
}

export function getUser(request: FastifyRequest): AuthPayload {
  return (request as any).user;
}
