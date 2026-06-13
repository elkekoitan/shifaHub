import { TRPCError } from "@trpc/server";
import { eq, sql } from "drizzle-orm";
import { users, danisan, egitmen } from "@shifahub/db";
import { registerSchema, loginSchema, refreshSchema } from "@shifahub/shared";
import { publicProcedure, protectedProcedure, router } from "../trpc";
import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../lib/auth";

export const authRouter = router({
  register: publicProcedure.input(registerSchema).mutation(async ({ ctx, input }) => {
    const existing = await ctx.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, input.email));
    if (existing.length > 0) {
      throw new TRPCError({ code: "CONFLICT", message: "Bu e-posta zaten kayitli." });
    }

    const passwordHash = await hashPassword(input.password);
    const phoneLast4 = input.phone ? input.phone.replace(/\D/g, "").slice(-4) || null : null;

    const [created] = await ctx.db
      .insert(users)
      .values({
        email: input.email,
        passwordHash,
        role: input.role,
        firstName: input.firstName,
        lastName: input.lastName,
        phoneLast4,
      })
      .returning({ id: users.id, email: users.email, role: users.role });

    const user = created!;

    // Bu istek artik yeni kullanici kimligiyle calissin ki RLS WITH CHECK gecsin.
    await ctx.db.execute(sql`select set_config('app.current_user_id', ${user.id}, true)`);

    if (user.role === "danisan") {
      await ctx.db.insert(danisan).values({ userId: user.id });
    } else if (user.role === "egitmen") {
      await ctx.db.insert(egitmen).values({ userId: user.id });
    }

    const authUser = { id: user.id, email: user.email, role: user.role };
    return {
      user: authUser,
      accessToken: await signAccessToken(authUser),
      refreshToken: await signRefreshToken(user.id),
    };
  }),

  login: publicProcedure.input(loginSchema).mutation(async ({ ctx, input }) => {
    const [u] = await ctx.db.select().from(users).where(eq(users.email, input.email));
    if (!u || !(await verifyPassword(u.passwordHash, input.password))) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "E-posta veya sifre hatali." });
    }
    if (!u.isActive) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Hesap pasif." });
    }

    await ctx.db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, u.id));

    const authUser = { id: u.id, email: u.email, role: u.role };
    return {
      user: authUser,
      accessToken: await signAccessToken(authUser),
      refreshToken: await signRefreshToken(u.id),
    };
  }),

  me: protectedProcedure.query(async ({ ctx }) => {
    const [u] = await ctx.db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        firstName: users.firstName,
        lastName: users.lastName,
        phoneLast4: users.phoneLast4,
      })
      .from(users)
      .where(eq(users.id, ctx.user.id));
    if (!u) throw new TRPCError({ code: "NOT_FOUND", message: "Kullanici bulunamadi." });
    return u;
  }),

  refresh: publicProcedure.input(refreshSchema).mutation(async ({ ctx, input }) => {
    let userId: string;
    try {
      userId = await verifyRefreshToken(input.refreshToken);
    } catch {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Gecersiz refresh token." });
    }
    const [u] = await ctx.db.select().from(users).where(eq(users.id, userId));
    if (!u || !u.isActive) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Oturum gecersiz." });
    }
    const authUser = { id: u.id, email: u.email, role: u.role };
    return {
      accessToken: await signAccessToken(authUser),
      refreshToken: await signRefreshToken(u.id),
    };
  }),
});
