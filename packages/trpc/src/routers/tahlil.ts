import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { tahlil, bildirim } from "@shifahub/db";
import { router, protectedProcedure, egitmenProcedure } from "../trpc";

/**
 * Tek bir tahlil deger satiri. `referenceMin`/`referenceMax` opsiyoneldir;
 * `isOutOfRange` istemciden alinmaz, sunucu referans araligindan hesaplar.
 */
const tahlilValueSchema = z.object({
  name: z.string().min(1),
  value: z.number(),
  unit: z.string(),
  referenceMin: z.number().optional(),
  referenceMax: z.number().optional(),
});

type TahlilValueInput = z.infer<typeof tahlilValueSchema>;

/**
 * Eski clinical-agent is mantigi: bir degerin referans araligi disinda olup
 * olmadigini hesaplar. Referans degeri tanimli degilse aralik disi sayilmaz.
 */
function markOutOfRange(values: TahlilValueInput[]) {
  return values.map((v) => ({
    ...v,
    isOutOfRange:
      (v.referenceMax !== undefined && v.value > v.referenceMax) ||
      (v.referenceMin !== undefined && v.value < v.referenceMin),
  }));
}

const createInput = z.object({
  danisanId: z.string().uuid(),
  testType: z.string().min(1).max(100),
  testDate: z.date().optional(),
  labName: z.string().max(200).optional(),
  values: z.array(tahlilValueSchema).default([]),
  fileUrl: z.string().url().max(500).optional(),
  notes: z.string().optional(),
});

const listInput = z
  .object({
    danisanId: z.string().uuid().optional(),
    limit: z.number().int().min(1).max(100).default(50),
  })
  .default({ limit: 50 });

const getByIdInput = z.object({ id: z.string().uuid() });

export const tahlilRouter = router({
  /**
   * Tahlil sonucu olusturma. Yalnizca egitmen/admin. RLS, egitmenin yalnizca
   * bakim iliskisi (care_relationship) bulunan danisanlar icin satir
   * yazmasina izin verir; iliski yoksa INSERT politika tarafindan reddedilir.
   */
  create: egitmenProcedure.input(createInput).mutation(async ({ ctx, input }) => {
    const computedValues = markOutOfRange(input.values);

    const [created] = await ctx.db
      .insert(tahlil)
      .values({
        danisanId: input.danisanId,
        egitmenId: ctx.user.id,
        testType: input.testType,
        testDate: input.testDate ?? new Date(),
        labName: input.labName ?? null,
        values: computedValues,
        fileUrl: input.fileUrl ?? null,
        notes: input.notes ?? null,
      })
      .returning();

    if (!created) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Tahlil sonucu olusturulamadi.",
      });
    }

    // Danisana bildirim (eski tedavi route is mantigi).
    await ctx.db.insert(bildirim).values({
      userId: input.danisanId,
      type: "tahlil_sonucu",
      title: "Tahlil Sonucu Eklendi",
      body: `${input.testType} tahlil sonucunuz sisteme eklendi.`,
      actionUrl: "/danisan/tahlil",
    });

    return created;
  }),

  /**
   * Tahlil listesi. Danisan kendi tahlillerini, egitmen ise bakim iliskisi
   * bulunan danisanlarin tahlillerini gorur — gorunurluk RLS ile saglanir.
   * `danisanId` yalnizca is-mantigi filtresidir (sahiplik kapilamasi RLS'te).
   */
  list: protectedProcedure.input(listInput).query(async ({ ctx, input }) => {
    return ctx.db
      .select()
      .from(tahlil)
      .where(input.danisanId ? eq(tahlil.danisanId, input.danisanId) : undefined)
      .orderBy(desc(tahlil.testDate))
      .limit(input.limit);
  }),

  /**
   * Tek bir tahlil sonucu. RLS gorunurlugu kapilar; cagiranin goremedigi satir
   * sonuc kumesine girmez, bu durumda NOT_FOUND doneriz.
   */
  getById: protectedProcedure.input(getByIdInput).query(async ({ ctx, input }) => {
    const [row] = await ctx.db.select().from(tahlil).where(eq(tahlil.id, input.id)).limit(1);

    if (!row) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Tahlil sonucu bulunamadi." });
    }

    return row;
  }),
});
