import argon2 from "argon2";
import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@shifahub/shared";
import type { AuthUser } from "../context";

const encoder = new TextEncoder();
const accessSecret = () => encoder.encode(process.env.JWT_SECRET ?? "dev-access-secret");
const refreshSecret = () => encoder.encode(process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret");

export const ACCESS_TTL = "15m";
export const REFRESH_TTL = "7d";

export function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, { type: argon2.argon2id });
}

export function verifyPassword(hash: string, password: string): Promise<boolean> {
  return argon2.verify(hash, password);
}

export async function signAccessToken(user: AuthUser): Promise<string> {
  return new SignJWT({ email: user.email, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TTL)
    .sign(accessSecret());
}

export async function signRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ typ: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(REFRESH_TTL)
    .sign(refreshSecret());
}

export async function verifyAccessToken(token: string): Promise<AuthUser> {
  const { payload } = await jwtVerify(token, accessSecret());
  return {
    id: payload.sub as string,
    email: payload.email as string,
    role: payload.role as UserRole,
  };
}

export async function verifyRefreshToken(token: string): Promise<string> {
  const { payload } = await jwtVerify(token, refreshSecret());
  return payload.sub as string;
}
