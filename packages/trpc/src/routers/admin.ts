import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, gte, lt } from "drizzle-orm";
import { egitmen, randevu, tedavi, users } from "@shifahub/db";
import { z } from "zod";
import { router, adminProcedure } from "../trpc";

/**
 * Admin domaini — platform yonetimi.
 *
 * TUM islemler `adminProcedure` ile kapilanir (sadece "admin" rolu). Eski
 * Fastify admin route'undaki `requireRole("admin")` preHandler'inin karsiligi
 * budur; manuel JWT/role kontrolu YAPILMAZ, prosedur tipi hallediyor.
 *
 * RLS NOTU: `ctx.db` RLS-scoped'dur ve admin rolu icin policy'ler override
 * saglar (admin tum satirlari gorur). `egitmen` tablosunda RLS yoktur; admin
 * onay islemleri dogrudan calisir. Bu yuzden manuel sahiplik (ownership)
 * filtresi EKLENMEZ — yalnizca is-mantigi filtreleri (rol, onay durumu, tarih).
 */

const listUsersSchema = z
  .object({
    role: z.enum(["danisan", "egitmen", "admin", "tabip"]).optional(),
    isActive: z.boolean().optional(),
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(100).default(20),
  })
  .default({ page: 1, pageSize: 20 });

export const adminRouter = router({
  /**
   * Kullanici listesi — rol/aktiflik filtresi ve sayfalama ile. Sifreli PII
   * (telefon/TC) dondurulmez; UI icin yalnizca `phoneLast4` plaintext alani.
   */
  listUsers: adminProcedure.input(listUsersSchema).query(async ({ ctx, input }) => {
    const conditions = [];
    if (input.role) {
      conditions.push(eq(users.role, input.role));
    }
    if (input.isActive !== undefined) {
      conditions.push(eq(users.isActive, input.isActive));
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const offset = (input.page - 1) * input.pageSize;

    const [rows, totalRow] = await Promise.all([
      ctx.db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          isActive: users.isActive,
          isEmailVerified: users.isEmailVerified,
          isMfaEnabled: users.isMfaEnabled,
          phoneLast4: users.phoneLast4,
          lastLoginAt: users.lastLoginAt,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(where)
        .orderBy(desc(users.createdAt))
        .limit(input.pageSize)
        .offset(offset),
      ctx.db.select({ value: count() }).from(users).where(where),
    ]);

    const total = Number(totalRow[0]?.value ?? 0);

    return {
      users: rows,
      page: input.page,
      pageSize: input.pageSize,
      total,
      totalPages: Math.ceil(total / input.pageSize),
    };
  }),

  /**
   * Kullaniciyi aktif/pasif yapar. Admin kendi hesabini pasiflestiremez
   * (eski route'taki kendini-silme korumasinin esdegeri).
   */
  setUserActive: adminProcedure
    .input(z.object({ userId: z.string().uuid(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.user.id && !input.isActive) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Kendi hesabinizi pasiflestiremezsiniz.",
        });
      }

      const [updated] = await ctx.db
        .update(users)
        .set({ isActive: input.isActive, updatedAt: new Date() })
        .where(eq(users.id, input.userId))
        .returning({ id: users.id, isActive: users.isActive });

      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Kullanici bulunamadi." });
      }

      return {
        user: updated,
        message: `Kullanici ${updated.isActive ? "aktif" : "pasif"} yapildi.`,
      };
    }),

  /**
   * Egitmen basvurusunu onaylar. `approvalStatus` -> "approved", onaylayan ve
   * onay zamani kaydedilir, varsa onceki red gerekcesi temizlenir.
   */
  approveEgitmen: adminProcedure
    .input(z.object({ egitmenId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(egitmen)
        .set({
          approvalStatus: "approved",
          approvedBy: ctx.user.id,
          approvedAt: new Date(),
          rejectionReason: null,
          updatedAt: new Date(),
        })
        .where(eq(egitmen.id, input.egitmenId))
        .returning({ id: egitmen.id, approvalStatus: egitmen.approvalStatus });

      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Egitmen bulunamadi." });
      }

      return { egitmen: updated, message: "Egitmen onaylandi." };
    }),

  /**
   * Egitmen basvurusunu reddeder. `approvalStatus` -> "rejected" ve red
   * gerekcesi kaydedilir. Onay alanlari temizlenir.
   */
  rejectEgitmen: adminProcedure
    .input(z.object({ egitmenId: z.string().uuid(), reason: z.string().min(1).max(1000) }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(egitmen)
        .set({
          approvalStatus: "rejected",
          rejectionReason: input.reason,
          approvedBy: null,
          approvedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(egitmen.id, input.egitmenId))
        .returning({ id: egitmen.id, approvalStatus: egitmen.approvalStatus });

      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Egitmen bulunamadi." });
      }

      return { egitmen: updated, message: "Egitmen reddedildi." };
    }),

  /**
   * Platform ozet istatistikleri — kullanici dagilimlari, onay bekleyen egitmen
   * sayisi, bugunku randevu sayisi ve toplam tedavi. Tum sayaclar `Number()`
   * ile cast edilir (drizzle `count()` string dondurebilir).
   */
  getStats: adminProcedure.query(async ({ ctx }) => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const [
      totalUsersRow,
      danisanRow,
      egitmenRow,
      adminRow,
      pendingEgitmenRow,
      todayRandevuRow,
      totalRandevuRow,
      totalTedaviRow,
    ] = await Promise.all([
      ctx.db.select({ value: count() }).from(users),
      ctx.db.select({ value: count() }).from(users).where(eq(users.role, "danisan")),
      ctx.db.select({ value: count() }).from(users).where(eq(users.role, "egitmen")),
      ctx.db.select({ value: count() }).from(users).where(eq(users.role, "admin")),
      ctx.db.select({ value: count() }).from(egitmen).where(eq(egitmen.approvalStatus, "pending")),
      ctx.db
        .select({ value: count() })
        .from(randevu)
        .where(and(gte(randevu.scheduledAt, todayStart), lt(randevu.scheduledAt, tomorrowStart))),
      ctx.db.select({ value: count() }).from(randevu),
      ctx.db.select({ value: count() }).from(tedavi),
    ]);

    return {
      totalUsers: Number(totalUsersRow[0]?.value ?? 0),
      totalDanisan: Number(danisanRow[0]?.value ?? 0),
      totalEgitmen: Number(egitmenRow[0]?.value ?? 0),
      totalAdmin: Number(adminRow[0]?.value ?? 0),
      pendingEgitmen: Number(pendingEgitmenRow[0]?.value ?? 0),
      todayRandevu: Number(todayRandevuRow[0]?.value ?? 0),
      totalRandevu: Number(totalRandevuRow[0]?.value ?? 0),
      totalTedavi: Number(totalTedaviRow[0]?.value ?? 0),
    };
  }),

  /**
   * Son 7 gun gunluk kirilimi — her gun icin randevu ve tedavi sayisi. Eski
   * /admin/stats/weekly mantiginin portu; `scheduledAt` yerine olusturulma
   * tarihi (`createdAt`) bazinda gunluk kovalar.
   */
  getWeeklyStats: adminProcedure.query(async ({ ctx }) => {
    const days: {
      date: string;
      dayName: string;
      randevu: number;
      tedavi: number;
    }[] = [];

    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);
      dayStart.setDate(dayStart.getDate() - i);
      const nextDay = new Date(dayStart);
      nextDay.setDate(nextDay.getDate() + 1);

      const [randevuRow, tedaviRow] = await Promise.all([
        ctx.db
          .select({ value: count() })
          .from(randevu)
          .where(and(gte(randevu.createdAt, dayStart), lt(randevu.createdAt, nextDay))),
        ctx.db
          .select({ value: count() })
          .from(tedavi)
          .where(and(gte(tedavi.createdAt, dayStart), lt(tedavi.createdAt, nextDay))),
      ]);

      days.push({
        date: dayStart.toISOString().split("T")[0]!,
        dayName: dayStart.toLocaleDateString("tr-TR", { weekday: "short" }),
        randevu: Number(randevuRow[0]?.value ?? 0),
        tedavi: Number(tedaviRow[0]?.value ?? 0),
      });
    }

    return days;
  }),
});
