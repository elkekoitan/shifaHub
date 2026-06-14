import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { odeme } from "@shifahub/db";
import { PAYMENT_STATUS_VALUES, deriveStatus } from "@shifahub/shared";
import { z } from "zod";
import { router, protectedProcedure, egitmenProcedure } from "../trpc";
import { getPaymentGateway } from "../lib/payment";

/**
 * Odeme (billing) routeri — eski Fastify route + billing.service mantigi
 * tRPC'ye portlanmistir. ctx.db ZATEN RLS-scoped: cagiranin goremedigi odeme
 * satiri sorgulara dusmez (danisan kendi odemesini, egitmen kendi danisaninin
 * odemesini gorur). Bu yuzden manuel `where egitmenId = ctx.user.id` sahiplik
 * filtresi YOKTUR — yalnizca is-mantigi (tutar matematigi, status state
 * makinesi, gunluk kasa toplami) ve rol kapilamasi burada ele alinir.
 *
 * Para alanlari numeric(10,2) — DB'de string olarak tutulur; matematik
 * Number(...) ile yapilir, yazarken toFixed(2) ile string'e cevrilir.
 */

// ─── Enumlar ────────────────────────────────────────────────────────────────
// Odeme durum tuple'i + deriveStatus @shifahub/shared/domain'de (tek kaynak + test).
const paymentMethodValues = ["nakit", "kart", "havale", "eft"] as const;

// ─── Girdi semalari ─────────────────────────────────────────────────────────
const createInput = z.object({
  danisanId: z.string().uuid("Gecersiz danisan ID"),
  tedaviId: z.string().uuid().optional(),
  amount: z.number().min(0, "Tutar negatif olamaz"),
  paidAmount: z.number().min(0).default(0),
  method: z.enum(paymentMethodValues).default("nakit"),
  status: z.enum(PAYMENT_STATUS_VALUES).optional(),
  description: z.string().optional(),
});

const updateInput = z.object({
  id: z.string().uuid(),
  amount: z.number().min(0).optional(),
  paidAmount: z.number().min(0).optional(),
  method: z.enum(paymentMethodValues).optional(),
  status: z.enum(PAYMENT_STATUS_VALUES).optional(),
  description: z.string().optional(),
});

const listInput = z.object({
  danisanId: z.string().uuid().optional(),
  status: z.enum(PAYMENT_STATUS_VALUES).optional(),
  limit: z.number().int().min(1).max(200).default(100),
});

const idInput = z.object({ id: z.string().uuid() });

const dailyKasaInput = z.object({
  // ISO tarih (yyyy-mm-dd veya tam datetime); verilmezse bugun.
  date: z.string().optional(),
});

export const odemeRouter = router({
  // ─── create — odeme kaydi olustur (egitmen/admin) ─────────────────────────
  create: egitmenProcedure.input(createInput).mutation(async ({ ctx, input }) => {
    // Is kurali: odenen tutar toplam tutardan buyuk olamaz.
    if (input.paidAmount > input.amount) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Odenen tutar toplam tutardan buyuk olamaz.",
      });
    }

    const status = deriveStatus(input.amount, input.paidAmount, input.status);

    const [created] = await ctx.db
      .insert(odeme)
      .values({
        danisanId: input.danisanId,
        egitmenId: ctx.user.id,
        tedaviId: input.tedaviId,
        amount: input.amount.toFixed(2),
        paidAmount: input.paidAmount.toFixed(2),
        method: input.method,
        status,
        description: input.description,
        paidAt: status === "paid" ? new Date() : undefined,
      })
      .returning();

    if (!created) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Odeme olusturulamadi.",
      });
    }

    return created;
  }),

  // ─── initiateOnline — danisan kendi odemesi icin online checkout baslatir ──
  // Salt-okuma: ref deterministik (gateway uretir), DB'ye yazilmaz; odeme onayi
  // confirmDemo + SECURITY DEFINER fonksiyonda yapilir (danisan RLS ile yazamaz).
  initiateOnline: protectedProcedure
    .input(z.object({ odemeId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [o] = await ctx.db.select().from(odeme).where(eq(odeme.id, input.odemeId)).limit(1);
      if (!o) throw new TRPCError({ code: "NOT_FOUND", message: "Odeme bulunamadi." });
      // RLS zaten baska danisanin odemesini gizler; yine de acik kontrol.
      if (ctx.user.role === "danisan" && o.danisanId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Bu odemeyi odeyemezsiniz." });
      }
      if (o.status === "paid" || o.status === "free") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Bu odeme zaten kapatilmis." });
      }
      const balance = Number(o.amount) - Number(o.paidAmount ?? 0);
      if (balance <= 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Odenecek tutar bulunmuyor." });
      }
      const checkout = await getPaymentGateway().createCheckout({
        odemeId: o.id,
        amount: balance,
        description: o.description ?? "ShifaHub odeme",
      });
      return { redirectUrl: checkout.redirectUrl, provider: checkout.provider, amount: balance };
    }),

  // ─── confirmDemo — demo gateway odemesini "paid" yapar (danisan) ───────────
  // Gercek gateway'de bu adimin yerini sunucu-tarafi callback verify alir.
  // SECURITY DEFINER fonksiyon sahiplik + referansi kendi icinde dogrular.
  confirmDemo: protectedProcedure
    .input(z.object({ odemeId: z.string().uuid(), ref: z.string().min(1).max(120) }))
    .mutation(async ({ ctx, input }) => {
      const rows = (await ctx.db.execute(
        sql`select confirm_demo_payment(${input.odemeId}::uuid, ${ctx.user.id}::uuid, ${input.ref}) as ok`,
      )) as unknown as Array<{ ok: boolean }>;
      if (!rows[0]?.ok) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Odeme onaylanamadi (gecersiz referans ya da yetki).",
        });
      }
      const [updated] = await ctx.db
        .select()
        .from(odeme)
        .where(eq(odeme.id, input.odemeId))
        .limit(1);
      return updated;
    }),

  // ─── update — odeme guncelle, tutar/status yeniden hesapla (egitmen/admin) ─
  update: egitmenProcedure.input(updateInput).mutation(async ({ ctx, input }) => {
    // RLS: gorulemeyen satir sorguya dusmez, dolayisiyla sahiplik filtresi yok.
    const [existing] = await ctx.db.select().from(odeme).where(eq(odeme.id, input.id)).limit(1);

    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Odeme bulunamadi." });
    }

    const newAmount = input.amount ?? Number(existing.amount);
    const newPaid = input.paidAmount ?? Number(existing.paidAmount ?? 0);

    if (newPaid > newAmount) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Odenen tutar toplam tutardan buyuk olamaz.",
      });
    }

    const newStatus = deriveStatus(newAmount, newPaid, input.status ?? existing.status);

    const [updated] = await ctx.db
      .update(odeme)
      .set({
        amount: newAmount.toFixed(2),
        paidAmount: newPaid.toFixed(2),
        method: input.method ?? existing.method,
        status: newStatus,
        description: input.description ?? existing.description,
        paidAt: newStatus === "paid" ? (existing.paidAt ?? new Date()) : existing.paidAt,
        updatedAt: new Date(),
      })
      .where(eq(odeme.id, input.id))
      .returning();

    if (!updated) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Odeme guncellenemedi.",
      });
    }

    return updated;
  }),

  // ─── list — odemeleri listele (RLS kapsami; danisan kendi, egitmen kendi) ──
  list: protectedProcedure.input(listInput).query(async ({ ctx, input }) => {
    const conditions = [];
    if (input.danisanId) conditions.push(eq(odeme.danisanId, input.danisanId));
    if (input.status) conditions.push(eq(odeme.status, input.status));

    const rows = await ctx.db
      .select()
      .from(odeme)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(odeme.createdAt))
      .limit(input.limit);

    return rows;
  }),

  // ─── getById — tekil detay (RLS sahiplik kontrolunu yapar) ────────────────
  getById: protectedProcedure.input(idInput).query(async ({ ctx, input }) => {
    const [item] = await ctx.db.select().from(odeme).where(eq(odeme.id, input.id)).limit(1);

    if (!item) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Odeme bulunamadi." });
    }

    return item;
  }),

  // ─── getDailyKasa — gunluk kasa ozeti (egitmen/admin) ─────────────────────
  // RLS sayesinde yalnizca egitmenin kendi odemeleri toplama dahil olur.
  getDailyKasa: egitmenProcedure.input(dailyKasaInput).query(async ({ ctx, input }) => {
    const targetDate = input.date ? new Date(input.date) : new Date();
    if (Number.isNaN(targetDate.getTime())) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Gecersiz tarih." });
    }

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const payments = await ctx.db
      .select()
      .from(odeme)
      .where(and(gte(odeme.createdAt, startOfDay), lte(odeme.createdAt, endOfDay)));

    const summary = {
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      freeAmount: 0,
      byMethod: { nakit: 0, kart: 0, havale: 0, eft: 0 },
      byStatus: { paid: 0, pending: 0, partial: 0, free: 0 },
      count: payments.length,
    };

    for (const p of payments) {
      const amount = Number(p.amount) || 0;
      const paid = Number(p.paidAmount ?? 0) || 0;

      summary.totalAmount += amount;
      summary.paidAmount += paid;

      // Acik bakiye: bekleyen tam tutar, kismi odemede kalan, ucretsizde tutar.
      if (p.status === "free") {
        summary.freeAmount += amount;
      } else if (p.status === "pending") {
        summary.pendingAmount += amount;
      } else if (p.status === "partial") {
        summary.pendingAmount += amount - paid;
      }

      // Status dagilimi (adet).
      if (p.status && p.status in summary.byStatus) {
        summary.byStatus[p.status] += 1;
      }

      // Odeme yontemi bazinda (yalnizca gercekten odenmis tutar).
      if (p.method && p.method in summary.byMethod && paid > 0) {
        summary.byMethod[p.method] += paid;
      }
    }

    return summary;
  }),
});
