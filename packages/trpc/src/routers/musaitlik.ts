import { TRPCError } from "@trpc/server";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { musaitlik, blockedSlot, randevu } from "@shifahub/db";
import { z } from "zod";
import { router, protectedProcedure, egitmenProcedure } from "../trpc";

/**
 * Musaitlik domaini — egitmen haftalik musaitlik slotlari + bloke zamanlar
 * (blocked_slot). Eski Fastify route mantiginin (routes/randevu.ts musaitlik
 * uctan, db/schema/musaitlik.ts) tRPC'ye portu.
 *
 * NOT: `musaitlik` ve `blocked_slot` tablolarinda RLS YOKTUR. Bu yuzden bir
 * egitmenin yalnizca kendi slotlarini yazip yonetmesi icin sahiplik filtresi
 * (`egitmenId = ctx.user.id`) burada MANUEL uygulanir — RLS-korumali tablolarda
 * (randevu vb.) bu filtre EKLENMEZ, orada RLS halleder.
 *
 * `getAvailability` danisan booking icin aciktir (protectedProcedure): caller
 * bir `egitmenId` verir; o egitmenin aktif slotlari ve onumuzdeki 2 haftadaki
 * dolu (busy) randevu araliklari donulur.
 */

// ─── Girdi semalari ─────────────────────────────────────────────────────────

const HHMM = /^\d{2}:\d{2}$/;

/** Tek bir haftalik musaitlik penceresi. */
const slotInput = z.object({
  dayOfWeek: z.number().int().min(0).max(6), // 0=Pazar ... 6=Cumartesi
  startTime: z.string().regex(HHMM, "Saat formati HH:MM olmali."),
  endTime: z.string().regex(HHMM, "Saat formati HH:MM olmali."),
  slotDuration: z.number().int().min(5).max(480).default(60), // dakika
  isActive: z.boolean().default(true),
});

const setAvailabilityInput = z.object({
  slots: z.array(slotInput).max(50),
});

const getAvailabilityInput = z.object({
  egitmenId: z.string().uuid(),
});

const addBlockedSlotInput = z
  .object({
    startAt: z.string().datetime(),
    endAt: z.string().datetime(),
    reason: z.string().max(200).optional(),
  })
  .refine((v) => new Date(v.endAt).getTime() > new Date(v.startAt).getTime(), {
    message: "Bitis zamani baslangictan sonra olmali.",
    path: ["endAt"],
  });

const removeBlockedSlotInput = z.object({
  id: z.string().uuid(),
});

export const musaitlikRouter = router({
  /**
   * Egitmenin haftalik musaitlik programini topluca ayarlar (replace). Eski
   * programi tamamen siler, yeni slotlari yazar. RLS yok -> sahiplik
   * filtresi/insert degeri olarak `egitmenId = ctx.user.id` kullanilir.
   */
  setAvailability: egitmenProcedure.input(setAvailabilityInput).mutation(async ({ ctx, input }) => {
    // Saat tutarliligi: bitis > baslangic (string karsilastirma HH:MM icin yeterli).
    for (const s of input.slots) {
      if (s.endTime <= s.startTime) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Gun ${s.dayOfWeek}: bitis saati baslangictan sonra olmali.`,
        });
      }
    }

    // Replace semantigi: once mevcut program silinir, sonra yenisi yazilir.
    await ctx.db.delete(musaitlik).where(eq(musaitlik.egitmenId, ctx.user.id));

    if (input.slots.length === 0) {
      return { slots: [], count: 0 };
    }

    const created = await ctx.db
      .insert(musaitlik)
      .values(
        input.slots.map((s) => ({
          egitmenId: ctx.user.id,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          slotDuration: s.slotDuration,
          isActive: s.isActive,
        })),
      )
      .returning();

    return { slots: created, count: created.length };
  }),

  /**
   * Bir egitmenin musaitligi — danisan booking ekrani icin acik. Aktif haftalik
   * slotlar + onumuzdeki 2 haftadaki dolu randevu araliklari (busy) donulur.
   * Eski GET /api/randevu/musaitlik/:egitmenId mantiginin portu.
   *
   * randevu tablosu RLS-korumalidir; busy sorgusu egitmenId ile is-mantigi
   * filtresi olarak daraltilir (sahiplik kontrolu degil — herkes bir egitmenin
   * dolu araliklarini gorebilmeli ki bos slot secebilsin).
   */
  getAvailability: protectedProcedure.input(getAvailabilityInput).query(async ({ ctx, input }) => {
    const slots = await ctx.db
      .select()
      .from(musaitlik)
      .where(and(eq(musaitlik.egitmenId, input.egitmenId), eq(musaitlik.isActive, true)))
      .orderBy(asc(musaitlik.dayOfWeek), asc(musaitlik.startTime));

    const now = new Date();
    const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const existingAppointments = await ctx.db
      .select({
        scheduledAt: randevu.scheduledAt,
        endAt: randevu.endAt,
        duration: randevu.duration,
      })
      .from(randevu)
      .where(
        and(
          eq(randevu.egitmenId, input.egitmenId),
          gte(randevu.scheduledAt, now),
          lte(randevu.scheduledAt, twoWeeksLater),
        ),
      );

    const busySlots = existingAppointments
      .filter((a): a is typeof a & { scheduledAt: Date } => a.scheduledAt !== null)
      .map((a) => ({
        start: a.scheduledAt.toISOString(),
        end: (a.endAt
          ? a.endAt
          : new Date(a.scheduledAt.getTime() + (a.duration ?? 60) * 60000)
        ).toISOString(),
      }));

    // Onumuzdeki 2 hafta icin egitmenin bloke ettigi zaman araliklari da
    // booking ekraninda musaitsiz gosterilmeli.
    const blocks = await ctx.db
      .select({
        startAt: blockedSlot.startAt,
        endAt: blockedSlot.endAt,
        reason: blockedSlot.reason,
      })
      .from(blockedSlot)
      .where(
        and(
          eq(blockedSlot.egitmenId, input.egitmenId),
          gte(blockedSlot.endAt, now),
          lte(blockedSlot.startAt, twoWeeksLater),
        ),
      );

    const blockedSlots = blocks.map((b) => ({
      start: b.startAt.toISOString(),
      end: b.endAt.toISOString(),
      reason: b.reason,
    }));

    return { slots, busySlots, blockedSlots };
  }),

  /**
   * Egitmenin kendi bloke zaman araliklarini listeler (tatil/izin yonetim
   * ekrani). RLS yok -> sahiplik filtresi manuel.
   */
  listBlockedSlots: egitmenProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(blockedSlot)
      .where(eq(blockedSlot.egitmenId, ctx.user.id))
      .orderBy(asc(blockedSlot.startAt));
  }),

  /**
   * Yeni bloke zaman araligi ekler (tatil, izin vs.). `egitmenId` her zaman
   * cagiranin kimligidir; baskasi adina bloke eklenemez.
   */
  addBlockedSlot: egitmenProcedure.input(addBlockedSlotInput).mutation(async ({ ctx, input }) => {
    const [created] = await ctx.db
      .insert(blockedSlot)
      .values({
        egitmenId: ctx.user.id,
        startAt: new Date(input.startAt),
        endAt: new Date(input.endAt),
        reason: input.reason ?? null,
      })
      .returning();

    if (!created) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Bloke zaman olusturulamadi.",
      });
    }

    return created;
  }),

  /**
   * Bir bloke zaman araligini kaldirir. Sahiplik filtresi manuel: yalnizca
   * cagiranin kendi blokunu silebilir.
   */
  removeBlockedSlot: egitmenProcedure
    .input(removeBlockedSlotInput)
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .delete(blockedSlot)
        .where(and(eq(blockedSlot.id, input.id), eq(blockedSlot.egitmenId, ctx.user.id)))
        .returning({ id: blockedSlot.id });

      if (!deleted) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Bloke zaman bulunamadi." });
      }

      return { id: deleted.id, success: true };
    }),
});
