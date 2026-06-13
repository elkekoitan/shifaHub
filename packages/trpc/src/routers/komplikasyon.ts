import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { komplikasyon, bildirim, users } from "@shifahub/db";
import { router, protectedProcedure, egitmenProcedure } from "../trpc";

/**
 * Komplikasyon domaini — eski Fastify `acil` route is mantigi (severity bazli
 * bildirim zinciri, takip notlari, cozum durum gecisleri) tRPC'ye portlanmistir.
 *
 * ctx.db ZATEN RLS-scoped: komplikasyon satirlari danisan/egitmen kapsamiyla
 * gorunur. Bu yuzden manuel `where egitmenId = ctx.user.id` sahiplik filtresi
 * YOKTUR — gorunurluk RLS ile saglanir. Burada yalnizca is-mantigi (severity
 * esikleri, durum makinesi) ve rol kapilamasi (procedure tipi) ele alinir.
 */

// ─── Durum makinesi ─────────────────────────────────────────────────────────
// open -> following -> resolved. resolved terminaldir.
const komplikasyonStatusValues = ["open", "following", "resolved"] as const;

const VALID_TRANSITIONS: Record<string, readonly string[]> = {
  open: ["following", "resolved"],
  following: ["resolved"],
  resolved: [],
};

// ─── Girdi semalari ─────────────────────────────────────────────────────────
const createInput = z.object({
  danisanId: z.string().uuid(),
  tedaviId: z.string().uuid().optional(),
  severity: z.number().int().min(1).max(5),
  type: z.string().min(1).max(100),
  description: z.string().min(1),
  imageUrls: z.array(z.string().url()).default([]),
});

const listInput = z
  .object({
    status: z.enum(komplikasyonStatusValues).optional(),
    danisanId: z.string().uuid().optional(),
    limit: z.number().int().min(1).max(100).default(50),
  })
  .default({ limit: 50 });

const getByIdInput = z.object({ id: z.string().uuid() });

const updateStatusInput = z
  .object({
    id: z.string().uuid(),
    status: z.enum(komplikasyonStatusValues),
    // Takip notu: durum "following" iken bir donem icin not eklenir.
    followUpPeriod: z.enum(["24h", "48h", "1w"]).optional(),
    followUpNote: z.string().optional(),
    // Cozum metni: durum "resolved" iken zorunlu.
    resolution: z.string().optional(),
  })
  .refine(
    (v) => v.status !== "resolved" || (v.resolution !== undefined && v.resolution.length > 0),
    {
      message: "Cozum durumu icin cozum metni gereklidir.",
      path: ["resolution"],
    },
  )
  .refine(
    (v) =>
      v.followUpPeriod === undefined || (v.followUpNote !== undefined && v.followUpNote.length > 0),
    {
      message: "Takip donemi belirtildiyse takip notu gereklidir.",
      path: ["followUpNote"],
    },
  );

export const komplikasyonRouter = router({
  /**
   * Komplikasyon raporu olusturma. Yalnizca egitmen/admin. RLS, egitmenin
   * yalnizca bakim iliskisi (care_relationship) bulunan danisanlar icin satir
   * yazmasina izin verir; iliski yoksa INSERT politika tarafindan reddedilir.
   *
   * Severity bazli bildirim zinciri (eski acil route mantigi):
   *  - severity >= 3 : tum admin'lere "sistem" bildirimi.
   *  - severity >= 4 : rapor eden egitmene kritik uyari bildirimi.
   */
  create: egitmenProcedure.input(createInput).mutation(async ({ ctx, input }) => {
    const [created] = await ctx.db
      .insert(komplikasyon)
      .values({
        danisanId: input.danisanId,
        egitmenId: ctx.user.id,
        tedaviId: input.tedaviId ?? null,
        severity: input.severity,
        type: input.type,
        description: input.description,
        imageUrls: input.imageUrls,
        status: "open",
      })
      .returning();

    if (!created) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Komplikasyon raporu olusturulamadi.",
      });
    }

    const severity = created.severity;

    // severity >= 3 : admin'lere bildirim zinciri.
    if (severity >= 3) {
      const admins = await ctx.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.role, "admin"));

      for (const admin of admins) {
        await ctx.db.insert(bildirim).values({
          userId: admin.id,
          type: "sistem",
          title: `Komplikasyon Raporu (Seviye ${severity})`,
          body: `Yuksek seviyeli komplikasyon rapor edildi: ${created.type}`,
          actionUrl: "/admin/sistem",
        });
      }
    }

    // severity >= 4 : rapor eden egitmene kritik uyari.
    if (severity >= 4) {
      await ctx.db.insert(bildirim).values({
        userId: ctx.user.id,
        type: "sistem",
        title: `KRITIK: Komplikasyon Seviye ${severity}`,
        body: "Kritik seviyede komplikasyon kaydedildi. Sorumlu tabip bilgilendirildi.",
        actionUrl: "/admin/sistem",
      });
    }

    return created;
  }),

  /**
   * Komplikasyon listesi. Danisan kendi komplikasyonlarini, egitmen ise bakim
   * iliskisi bulunan danisanlarin komplikasyonlarini gorur — gorunurluk RLS
   * ile saglanir. `status`/`danisanId` yalnizca is-mantigi filtresidir.
   */
  list: protectedProcedure.input(listInput).query(async ({ ctx, input }) => {
    const conditions = [
      input.status ? eq(komplikasyon.status, input.status) : undefined,
      input.danisanId ? eq(komplikasyon.danisanId, input.danisanId) : undefined,
    ].filter((c): c is NonNullable<typeof c> => c !== undefined);

    return ctx.db
      .select()
      .from(komplikasyon)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(komplikasyon.createdAt))
      .limit(input.limit);
  }),

  /**
   * Tek bir komplikasyon raporu. RLS gorunurlugu kapilar; cagiranin goremedigi
   * satir sonuc kumesine girmez, bu durumda NOT_FOUND doneriz.
   */
  getById: protectedProcedure.input(getByIdInput).query(async ({ ctx, input }) => {
    const [row] = await ctx.db
      .select()
      .from(komplikasyon)
      .where(eq(komplikasyon.id, input.id))
      .limit(1);

    if (!row) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Komplikasyon bulunamadi." });
    }

    return row;
  }),

  /**
   * Komplikasyon durumu guncelleme (takip + cozum). Yalnizca egitmen/admin.
   * Durum makinesi (open -> following -> resolved) zorlanir. "following" iken
   * ilgili donem (24h/48h/1w) takip notu eklenir; "resolved" iken cozum metni
   * ve `resolvedAt` kaydedilir. Eski acil route'taki followup/resolve uclari
   * tek mutasyonda birlestirilmistir.
   */
  updateStatus: egitmenProcedure.input(updateStatusInput).mutation(async ({ ctx, input }) => {
    const [existing] = await ctx.db
      .select()
      .from(komplikasyon)
      .where(eq(komplikasyon.id, input.id))
      .limit(1);

    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Komplikasyon bulunamadi." });
    }

    const current = existing.status ?? "";
    const allowed = VALID_TRANSITIONS[current] ?? [];
    // Ayni duruma kalip yalnizca takip notu eklemek serbest; aksi halde
    // gecerli gecisleri zorla.
    if (input.status !== current && !allowed.includes(input.status)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `"${current}" durumundan "${input.status}" durumuna gecilemez.`,
      });
    }

    // Takip notu donemine gore ilgili kolon (eski /followup ucu).
    const followUpField =
      input.followUpPeriod === "24h"
        ? { followUp24h: input.followUpNote ?? null }
        : input.followUpPeriod === "48h"
          ? { followUp48h: input.followUpNote ?? null }
          : input.followUpPeriod === "1w"
            ? { followUp1w: input.followUpNote ?? null }
            : {};

    const resolveField =
      input.status === "resolved"
        ? { resolvedAt: new Date(), resolution: input.resolution ?? null }
        : {};

    const [updated] = await ctx.db
      .update(komplikasyon)
      .set({
        status: input.status,
        ...followUpField,
        ...resolveField,
        updatedAt: new Date(),
      })
      .where(eq(komplikasyon.id, input.id))
      .returning();

    if (!updated) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Komplikasyon durumu guncellenemedi.",
      });
    }

    return updated;
  }),
});
