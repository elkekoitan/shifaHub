import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import { db } from "@shifahub/db";
import type { Context } from "@shifahub/trpc";

/**
 * Builds the per-request tRPC context.
 *
 * P1: anonymous, shared db handle (interop proof only).
 * P3: verify the JWT once, open a transaction, `SET LOCAL` the RLS + pgcrypto
 * GUCs, and expose a request-scoped db handle + the resolved `user`.
 */
export async function createContext(opts: CreateFastifyContextOptions): Promise<Context> {
  return {
    user: null,
    db,
    meta: {
      ip: opts.req.ip,
      userAgent: opts.req.headers["user-agent"],
    },
  };
}
