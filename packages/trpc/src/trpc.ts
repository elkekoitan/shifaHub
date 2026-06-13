import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
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

/** Open to everyone (login, register, public lookups). */
export const publicProcedure = t.procedure;

/** Requires an authenticated user. Narrows `ctx.user` to non-null. */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
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
