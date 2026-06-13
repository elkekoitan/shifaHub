import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import { db } from "@shifahub/db";
import { verifyAccessToken, type AuthUser, type Context } from "@shifahub/trpc";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY ?? "";

/**
 * Builds the per-request tRPC context: resolves the caller from the Bearer JWT
 * (if present) and provides the base db handle + pgcrypto key. The `withRls`
 * middleware then opens the RLS transaction.
 */
export async function createContext(opts: CreateFastifyContextOptions): Promise<Context> {
  let user: AuthUser | null = null;
  const header = opts.req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      user = await verifyAccessToken(header.slice(7));
    } catch {
      user = null;
    }
  }

  return {
    user,
    db,
    encKey: ENCRYPTION_KEY,
    meta: { ip: opts.req.ip, userAgent: opts.req.headers["user-agent"] },
  };
}
