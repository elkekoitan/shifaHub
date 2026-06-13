import { TRPCError } from "@trpc/server";
import { and, count, desc, eq } from "drizzle-orm";
import { bildirim } from "@shifahub/db";
import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "../trpc";

/**
 * Bildirim domaini — eski notification.service mantigi tRPC'ye portlanmistir.
 * ctx.db ZATEN RLS-scoped: bildirim tablosu user_id uzerinden kapilanir, yani
 * cagiranin goremedigi satir sorgulara dusmez/guncellenmez. Bu yuzden manuel
 * `where userId = ctx.user.id` sahiplik filtresi YOKTUR — yalnizca is-mantigi
 * filtreleri (okundu durumu, tip) ve rol kapilamasi burada ele alinir.
 *
 * Bildirim OLUSTURMA kullaniciya acik degildir: sistem/servis worker'lari ya da
 * admin tarafindan yapilir (adminProcedure). Email gonderimi gibi yan etkiler
 * worker katmaninda kalir; burada yalnizca kayit olusturulur.
 */

// ─── Bildirim tipleri (eski notification_type enum'u birebir) ────────────────
const notificationTypeValues = [
  "randevu_hatirlatma",
  "randevu_onay",
  "randevu_iptal",
  "tedavi_ozeti",
  "tahlil_sonucu",
  "mesaj",
  "egitmen_onay",
  "sistem",
  "kvkk",
] as const;

// ─── Girdi semalari ─────────────────────────────────────────────────────────
const listInput = z.object({
  // Okundu durumuna gore filtre (verilmezse tumu).
  isRead: z.boolean().optional(),
  type: z.enum(notificationTypeValues).optional(),
  limit: z.number().int().min(1).max(200).default(50),
});

const markReadInput = z.object({
  id: z.string().uuid(),
});

const createInput = z.object({
  userId: z.string().uuid(),
  type: z.enum(notificationTypeValues),
  title: z.string().min(1).max(200),
  body: z.string().optional(),
  actionUrl: z.string().max(500).optional(),
});

export const bildirimRouter = router({
  // ─── list — kendi bildirimleri (RLS), opsiyonel isRead/type filtresi ───────
  list: protectedProcedure.input(listInput).query(async ({ ctx, input }) => {
    const conditions = [
      ...(input.isRead !== undefined ? [eq(bildirim.isRead, input.isRead)] : []),
      ...(input.type ? [eq(bildirim.type, input.type)] : []),
    ];

    const rows = await ctx.db
      .select()
      .from(bildirim)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(bildirim.createdAt))
      .limit(input.limit);

    return rows;
  }),

  // ─── unreadCount — okunmamis bildirim sayisi (RLS kapsaminda) ──────────────
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const [row] = await ctx.db
      .select({ value: count() })
      .from(bildirim)
      .where(eq(bildirim.isRead, false));

    return { count: row?.value ?? 0 };
  }),

  // ─── markRead — tek bildirimi okundu isaretle ──────────────────────────────
  markRead: protectedProcedure.input(markReadInput).mutation(async ({ ctx, input }) => {
    // RLS: gorulemeyen satir sorguya dusmez, dolayisiyla sahiplik filtresi yok.
    const [updated] = await ctx.db
      .update(bildirim)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(bildirim.id, input.id))
      .returning();

    if (!updated) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Bildirim bulunamadi." });
    }

    return updated;
  }),

  // ─── markAllRead — tum okunmamis bildirimleri okundu isaretle ──────────────
  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    // RLS kullaniciyi kapsar; yalnizca okunmamis olanlar guncellenir.
    const updated = await ctx.db
      .update(bildirim)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(bildirim.isRead, false))
      .returning({ id: bildirim.id });

    return { count: updated.length };
  }),

  // ─── create — sistem/admin tarafindan bildirim olusturma ───────────────────
  create: adminProcedure.input(createInput).mutation(async ({ ctx, input }) => {
    const [created] = await ctx.db
      .insert(bildirim)
      .values({
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        actionUrl: input.actionUrl,
        isRead: false,
      })
      .returning();

    if (!created) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Bildirim olusturulamadi.",
      });
    }

    return created;
  }),
});
