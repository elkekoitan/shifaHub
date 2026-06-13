import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { randevu, users } from "@shifahub/db";
import { HIJRI_MONTHS, SUNNAH_DAYS } from "@shifahub/shared";
import { z } from "zod";
import { protectedProcedure, egitmenProcedure, router } from "../trpc";

/**
 * Randevu domaini — eski Fastify route + appointment.service mantigi tRPC'ye
 * portlanmistir. ctx.db ZATEN RLS-scoped: cagiranin goremedigi randevu satiri
 * sorgulara dusmez. Bu yuzden manuel `where danisanId = ctx.user.id` sahiplik
 * filtresi YOKTUR — yalnizca is-mantigi (state machine, cakisma, rol kapilamasi)
 * burada ele alinir.
 */

// ─── State Machine ──────────────────────────────────────────────────────────
// Gecerli durum gecisleri. Bos dizi = terminal durum.
const VALID_TRANSITIONS: Record<string, readonly string[]> = {
  requested: ["confirmed", "cancelled"],
  confirmed: ["reminded", "arrived", "cancelled", "ertelendi"],
  reminded: ["arrived", "cancelled", "no_show", "ertelendi"],
  arrived: ["treated"],
  treated: ["completed"],
  completed: [],
  cancelled: [],
  no_show: [],
  ertelendi: ["confirmed", "cancelled"],
};

const appointmentStatusValues = [
  "requested",
  "confirmed",
  "reminded",
  "arrived",
  "treated",
  "completed",
  "cancelled",
  "no_show",
  "ertelendi",
] as const;

// ─── Hicri tarih + sunnet gunu (Umm al-Qura, Intl.DateTimeFormat) ───────────
interface HijriInfo {
  hijriDate: string;
  isSunnahDay: boolean;
}

/**
 * Verilen tarihin Hicri karsiligini ve hacamat sunnet gunu (ayin 17/19/21)
 * olup olmadigini hesaplar. islamic-umalqura takvimi kullanilir.
 */
function computeHijri(date: Date): HijriInfo {
  const parts = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).formatToParts(date);

  const get = (type: string): number => {
    const part = parts.find((p) => p.type === type);
    return part ? Number.parseInt(part.value, 10) : 0;
  };

  const day = get("day");
  const monthIndex = get("month") - 1;
  const year = get("year");
  const monthName = HIJRI_MONTHS[monthIndex] ?? "";

  return {
    hijriDate: `${day} ${monthName} ${year}`.trim(),
    isSunnahDay: (SUNNAH_DAYS as readonly number[]).includes(day),
  };
}

// ─── Girdi semalari ─────────────────────────────────────────────────────────
const createInput = z.object({
  egitmenId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  duration: z.number().int().min(15).max(180).default(60),
  treatmentType: z.string().max(50).optional(),
  complaints: z.string().optional(),
  notes: z.string().optional(),
  // Egitmen/admin baskasi adina olusturabilir; danisan icin gormezden gelinir.
  danisanId: z.string().uuid().optional(),
});

const updateStatusInput = z.object({
  randevuId: z.string().uuid(),
  status: z.enum(appointmentStatusValues),
  cancelReason: z.string().optional(),
});

const listInput = z.object({
  status: z.enum(appointmentStatusValues).optional(),
  limit: z.number().int().min(1).max(200).default(100),
});

const getByIdInput = z.object({
  id: z.string().uuid(),
});

export const randevuRouter = router({
  // ─── create — danisan kendi adina, egitmen/admin baskasi adina ────────────
  create: protectedProcedure.input(createInput).mutation(async ({ ctx, input }) => {
    const scheduledAt = new Date(input.scheduledAt);

    // Gecmis tarih kontrolu
    if (scheduledAt.getTime() <= Date.now()) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Gecmis bir tarihe randevu olusturulamaz.",
      });
    }

    // danisanId cozumlemesi: danisan her zaman kendisi; egitmen/admin
    // belirtilen danisani (yoksa kendisini) kullanir.
    const danisanId = ctx.user.role === "danisan" ? ctx.user.id : (input.danisanId ?? ctx.user.id);

    const endAt = new Date(scheduledAt.getTime() + input.duration * 60 * 1000);

    // Cakisma kontrolu RLS'i baypaslayan, satir sizdirmayan SECURITY DEFINER
    // fonksiyon ile yapilir: danisan baska danisanlarin randevularini goremez,
    // bu yuzden RLS-filtreli bir sorgu cakismayi kaciririr (yalnizca boolean doner).
    const conflictRows = (await ctx.db.execute(
      sql`select egitmen_has_conflict(${input.egitmenId}::uuid, ${scheduledAt.toISOString()}::timestamp, ${endAt.toISOString()}::timestamp) as has_conflict`,
    )) as unknown as Array<{ has_conflict: boolean }>;
    if (conflictRows[0]?.has_conflict) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Bu zaman diliminde egitmenin zaten bir randevusu var.",
      });
    }

    const { hijriDate, isSunnahDay } = computeHijri(scheduledAt);

    const [created] = await ctx.db
      .insert(randevu)
      .values({
        danisanId,
        egitmenId: input.egitmenId,
        scheduledAt,
        endAt,
        duration: input.duration,
        treatmentType: input.treatmentType,
        complaints: input.complaints,
        notes: input.notes,
        hijriDate,
        isSunnahDay,
        status: "requested",
        statusChangedAt: new Date(),
      })
      .returning();

    if (!created) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Randevu olusturulamadi.",
      });
    }

    return created;
  }),

  // ─── updateStatus — state machine zorlamasi ───────────────────────────────
  updateStatus: protectedProcedure.input(updateStatusInput).mutation(async ({ ctx, input }) => {
    // RLS: gorulemeyen satir sorguya dusmez, dolayisiyla sahiplik filtresi yok.
    const [existing] = await ctx.db
      .select()
      .from(randevu)
      .where(eq(randevu.id, input.randevuId))
      .limit(1);

    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Randevu bulunamadi." });
    }

    // Is kurali (sahiplik DEGIL): danisan yalnizca iptal edebilir.
    if (ctx.user.role === "danisan" && input.status !== "cancelled") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Danisan yalnizca randevu iptal edebilir.",
      });
    }

    // State machine: gecerli gecisleri zorla.
    const current = existing.status ?? "";
    const allowed = VALID_TRANSITIONS[current] ?? [];
    if (!allowed.includes(input.status)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `"${current}" durumundan "${input.status}" durumuna gecilemez.`,
      });
    }

    // Gec iptal uyarisi: randevuya 24 saatten az kaldiysa.
    let warning: string | undefined;
    if (input.status === "cancelled" && existing.scheduledAt) {
      const hoursUntil = (existing.scheduledAt.getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursUntil > 0 && hoursUntil < 24) {
        warning = "UYARI: Randevuya 24 saatten az kalmis. Gec iptal kaydedildi.";
      }
    }

    const isCancel = input.status === "cancelled";

    const [updated] = await ctx.db
      .update(randevu)
      .set({
        status: input.status,
        statusChangedAt: new Date(),
        ...(isCancel ? { cancelledBy: ctx.user.id, cancelReason: input.cancelReason ?? null } : {}),
      })
      .where(eq(randevu.id, input.randevuId))
      .returning();

    if (!updated) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Randevu durumu guncellenemedi.",
      });
    }

    return { randevu: updated, warning };
  }),

  // ─── list — kendi randevulari (RLS), opsiyonel status filtresi ────────────
  list: protectedProcedure.input(listInput).query(async ({ ctx, input }) => {
    const conditions = input.status ? [eq(randevu.status, input.status)] : [];

    const rows = await ctx.db
      .select()
      .from(randevu)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(randevu.scheduledAt))
      .limit(input.limit);

    // Taraf isimlerini tek sorguda topla (N+1 kacinma).
    const userIds = [...new Set(rows.flatMap((r) => [r.danisanId, r.egitmenId]))];
    const nameMap = new Map<string, { firstName: string; lastName: string }>();

    if (userIds.length > 0) {
      const people = await ctx.db
        .select({ id: users.id, firstName: users.firstName, lastName: users.lastName })
        .from(users)
        .where(inArray(users.id, userIds));
      for (const p of people) {
        nameMap.set(p.id, { firstName: p.firstName, lastName: p.lastName });
      }
    }

    return rows.map((r) => ({
      ...r,
      danisanFirstName: nameMap.get(r.danisanId)?.firstName ?? "",
      danisanLastName: nameMap.get(r.danisanId)?.lastName ?? "",
      egitmenFirstName: nameMap.get(r.egitmenId)?.firstName ?? "",
      egitmenLastName: nameMap.get(r.egitmenId)?.lastName ?? "",
    }));
  }),

  // ─── getById — tekil detay (RLS sahiplik kontrolunu yapar) ────────────────
  getById: protectedProcedure.input(getByIdInput).query(async ({ ctx, input }) => {
    const [item] = await ctx.db.select().from(randevu).where(eq(randevu.id, input.id)).limit(1);

    if (!item) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Randevu bulunamadi." });
    }

    return item;
  }),

  // ─── getDailyStats — egitmen gosterge ozeti ───────────────────────────────
  getDailyStats: egitmenProcedure.query(async ({ ctx }) => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart.getTime() + 86400000);

    // RLS sayesinde yalnizca egitmenin kendi randevulari donar.
    const rows = await ctx.db
      .select({
        id: randevu.id,
        status: randevu.status,
        scheduledAt: randevu.scheduledAt,
      })
      .from(randevu)
      .orderBy(asc(randevu.scheduledAt));

    let bugunku = 0;
    let onayBekleyen = 0;
    let arrived = 0;

    for (const r of rows) {
      if (r.scheduledAt && r.scheduledAt >= todayStart && r.scheduledAt < tomorrowStart) {
        bugunku += 1;
      }
      if (r.status === "requested") onayBekleyen += 1;
      if (r.status === "arrived") arrived += 1;
    }

    return { bugunku, onayBekleyen, arrived };
  }),
});
