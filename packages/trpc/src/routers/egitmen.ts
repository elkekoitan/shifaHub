import { TRPCError } from "@trpc/server";
import { eq, and, inArray, sql } from "drizzle-orm";
import { egitmen, users, danisan, randevu, tedavi } from "@shifahub/db";
import { z } from "zod";
import { router, protectedProcedure, egitmenProcedure } from "../trpc";

/**
 * Egitmen (uygulama uzmani) domaini.
 *
 * NOT: `egitmen` tablosunda RLS YOKTUR. Bu yuzden bir egitmenin kendi profilini
 * okumasi/guncellemesi icin sahiplik filtresi (`userId = ctx.user.id`) burada
 * MANUEL uygulanir — diger RLS-korumali tablolarda bu filtreyi EKLEMEYIZ.
 *
 * Onay alanlari (`approvalStatus`, `approvedBy`, `approvedAt`, `rejectionReason`)
 * yalnizca admin tarafindan (admin router) degistirilir; bu router asla onay
 * durumunu yazmaz.
 */

/** Egitmenin kendi guncelleyebilecegi profil alanlari. Onay alanlari haric. */
const profilGuncelleSchema = z.object({
  certificateNumber: z.string().max(50).nullish(),
  certificateIssuer: z.string().max(200).nullish(),
  certificateDate: z.coerce.date().nullish(),
  certificateFileUrl: z.string().url().max(500).nullish(),
  specialties: z.array(z.string()).optional(),
  clinicName: z.string().max(200).nullish(),
  clinicAddress: z.string().nullish(),
  clinicCity: z.string().max(50).nullish(),
  clinicPhone: z.string().max(20).nullish(),
  supervisingPhysicianName: z.string().max(100).nullish(),
  defaultSessionDuration: z.string().max(10).optional(),
  workingDays: z.array(z.number().int().min(0).max(6)).optional(),
  workingHoursStart: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Saat formati HH:MM olmali.")
    .optional(),
  workingHoursEnd: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Saat formati HH:MM olmali.")
    .optional(),
  bio: z.string().nullish(),
  profileImageUrl: z.string().url().max(500).nullish(),
  isActive: z.boolean().optional(),
});

export const egitmenRouter = router({
  /**
   * Egitmenin kendi profili. Yoksa "pending" durumunda otomatik olusturulur
   * (eski PUT /me'deki create-on-write davranisinin okuma karsiligi).
   */
  me: egitmenProcedure.query(async ({ ctx }) => {
    const [profile] = await ctx.db
      .select()
      .from(egitmen)
      .where(eq(egitmen.userId, ctx.user.id))
      .limit(1);

    if (profile) return profile;

    const [created] = await ctx.db
      .insert(egitmen)
      .values({ userId: ctx.user.id, approvalStatus: "pending" })
      .returning();

    if (!created) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Egitmen profili olusturulamadi.",
      });
    }
    return created;
  }),

  /**
   * Egitmen kendi profilini upsert eder. Yeni profil "pending" olur ve admin
   * onayi bekler; mevcut profil guncellenir. Onay alanlari ASLA buradan yazilmaz.
   */
  guncelle: egitmenProcedure.input(profilGuncelleSchema).mutation(async ({ ctx, input }) => {
    const [existing] = await ctx.db
      .select({ id: egitmen.id })
      .from(egitmen)
      .where(eq(egitmen.userId, ctx.user.id))
      .limit(1);

    if (!existing) {
      const [created] = await ctx.db
        .insert(egitmen)
        .values({ ...input, userId: ctx.user.id, approvalStatus: "pending" })
        .returning();

      if (!created) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Profil olusturulamadi.",
        });
      }
      return {
        profile: created,
        message: "Profiliniz olusturuldu. Admin onayi bekleniyor.",
      };
    }

    const [updated] = await ctx.db
      .update(egitmen)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(egitmen.userId, ctx.user.id))
      .returning();

    if (!updated) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Profil bulunamadi." });
    }
    return { profile: updated, message: "Profiliniz guncellendi." };
  }),

  /**
   * Onayli egitmen listesi — danisan arama/board ekranlari icin acik (her
   * oturumlu kullanici gorebilir). Yalnizca onaylanmis ve aktif egitmenler.
   */
  liste: protectedProcedure
    .input(
      z
        .object({
          city: z.string().max(50).optional(),
          specialty: z.string().max(50).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(egitmen.approvalStatus, "approved"), eq(egitmen.isActive, true)];
      if (input?.city) {
        conditions.push(eq(egitmen.clinicCity, input.city));
      }
      if (input?.specialty) {
        conditions.push(sql`${egitmen.specialties} ? ${input.specialty}`);
      }

      return ctx.db
        .select({
          userId: egitmen.userId,
          firstName: users.firstName,
          lastName: users.lastName,
          specialties: egitmen.specialties,
          clinicName: egitmen.clinicName,
          clinicCity: egitmen.clinicCity,
          bio: egitmen.bio,
          profileImageUrl: egitmen.profileImageUrl,
        })
        .from(egitmen)
        .innerJoin(users, eq(egitmen.userId, users.id))
        .where(and(...conditions));
    }),

  /** Tek bir onayli egitmenin herkese acik profil detayi. */
  detay: protectedProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [profile] = await ctx.db
        .select({
          userId: egitmen.userId,
          firstName: users.firstName,
          lastName: users.lastName,
          specialties: egitmen.specialties,
          clinicName: egitmen.clinicName,
          clinicAddress: egitmen.clinicAddress,
          clinicCity: egitmen.clinicCity,
          bio: egitmen.bio,
          profileImageUrl: egitmen.profileImageUrl,
          defaultSessionDuration: egitmen.defaultSessionDuration,
          workingDays: egitmen.workingDays,
          workingHoursStart: egitmen.workingHoursStart,
          workingHoursEnd: egitmen.workingHoursEnd,
        })
        .from(egitmen)
        .innerJoin(users, eq(egitmen.userId, users.id))
        .where(
          and(
            eq(egitmen.userId, input.userId),
            eq(egitmen.approvalStatus, "approved"),
            eq(egitmen.isActive, true),
          ),
        )
        .limit(1);

      if (!profile) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Egitmen bulunamadi." });
      }
      return profile;
    }),

  /**
   * Egitmenin danisanlari — randevu ve tedavi iliskilerinden otomatik cikarilir
   * (ayri bir uye listesi yoktur). Eski /egitmen/danisanlar mantiginin portu;
   * RLS, egitmenin yalnizca kendi randevu/tedavi satirlarini gormesini saglar,
   * bu yuzden manuel egitmenId filtresi gerekmez.
   */
  danisanlarim: egitmenProcedure.query(async ({ ctx }) => {
    const [randevuDanisanlar, tedaviDanisanlar] = await Promise.all([
      ctx.db.selectDistinct({ danisanId: randevu.danisanId }).from(randevu),
      ctx.db.selectDistinct({ danisanId: tedavi.danisanId }).from(tedavi),
    ]);

    const danisanIds = [
      ...new Set([
        ...randevuDanisanlar.map((r) => r.danisanId),
        ...tedaviDanisanlar.map((t) => t.danisanId),
      ]),
    ];

    if (danisanIds.length === 0) {
      return { danisanlar: [], count: 0 };
    }

    const danisanlar = await ctx.db
      .select({
        userId: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phoneLast4: users.phoneLast4,
        city: danisan.city,
        mainComplaints: danisan.mainComplaints,
        chronicDiseases: danisan.chronicDiseases,
      })
      .from(users)
      .leftJoin(danisan, eq(danisan.userId, users.id))
      .where(inArray(users.id, danisanIds));

    return { danisanlar, count: danisanlar.length };
  }),
});
