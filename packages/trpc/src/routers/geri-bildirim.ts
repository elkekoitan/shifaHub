import { z } from "zod";
import { desc, sql } from "drizzle-orm";
import { geriBildirim } from "@shifahub/db";
import { protectedProcedure, router } from "../trpc";

/**
 * Geri bildirim — danışan memnuniyet puanı (1-5) + yorum. ctx.db RLS-scoped:
 * danışan yalnız kendi yazdığını, eğitmen hakkındakini, admin hepsini görür.
 * Bu yüzden manuel sahiplik filtresi YOKTUR.
 */
export const geriBildirimRouter = router({
  /** Danışan geri bildirim gönderir (opsiyonel olarak bir eğitmen hakkında). */
  create: protectedProcedure
    .input(
      z.object({
        rating: z.number().int().min(1, "Puan 1-5 olmalı").max(5),
        comment: z.string().trim().max(2000).optional(),
        egitmenId: z.string().uuid().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [created] = await ctx.db
        .insert(geriBildirim)
        .values({
          danisanId: ctx.user.id,
          egitmenId: input.egitmenId ?? null,
          rating: input.rating,
          comment: input.comment?.trim() || null,
        })
        .returning();
      return created;
    }),

  /** Geri bildirim listesi (RLS kapsamı: danışan kendi, eğitmen hakkındaki, admin hepsi). */
  list: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100).default(50) }).default({ limit: 50 }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select({
          id: geriBildirim.id,
          rating: geriBildirim.rating,
          comment: geriBildirim.comment,
          createdAt: geriBildirim.createdAt,
        })
        .from(geriBildirim)
        .orderBy(desc(geriBildirim.createdAt))
        .limit(input.limit);
    }),

  /** Ortalama puan + adet (RLS kapsamı). Eğitmen/admin panelinde gösterilir. */
  summary: protectedProcedure.query(async ({ ctx }) => {
    const rows = (await ctx.db.execute(
      sql`select coalesce(avg(rating), 0)::float as avg, count(*)::int as count from geri_bildirim`,
    )) as unknown as Array<{ avg: number; count: number }>;
    return { average: Number(rows[0]?.avg ?? 0), count: Number(rows[0]?.count ?? 0) };
  }),
});
