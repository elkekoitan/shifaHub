import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { setSessionContext } from "@shifahub/db";
import type { UserRole } from "@shifahub/shared";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zod: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const middleware = t.middleware;
export const mergeRouters = t.mergeRouters;
export const createCallerFactory = t.createCallerFactory;

/**
 * RLS transaction boundary. Wraps every resolver in a Postgres transaction that
 * drops to the non-superuser `shifahub_app` role and sets the per-request GUCs
 * (user id, role, pgcrypto key). Every `ctx.db` query inside the resolver is
 * therefore RLS-enforced and can encrypt/decrypt. Commits on success, rolls
 * back on any thrown error.
 */
const withRls = t.middleware(async ({ ctx, next }) => {
  return ctx.db.transaction(async (tx) => {
    await setSessionContext(tx, {
      userId: ctx.user?.id ?? null,
      role: ctx.user?.role ?? null,
      encKey: ctx.encKey,
    });
    return next({ ctx: { ...ctx, db: tx as unknown as Context["db"] } });
  });
});

/** Open to everyone (login, register), but still RLS-scoped. */
export const publicProcedure = t.procedure.use(withRls);

/** Requires an authenticated user. Narrows `ctx.user` to non-null. */
export const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Oturum gerekli." });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

/** Requires the caller to hold one of the given roles. */
export function roleProcedure(...roles: UserRole[]) {
  return protectedProcedure.use(({ ctx, next }) => {
    if (!roles.includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Bu islem icin yetkiniz yok." });
    }
    return next({ ctx });
  });
}

export const adminProcedure = roleProcedure("admin");
export const egitmenProcedure = roleProcedure("egitmen", "admin");
