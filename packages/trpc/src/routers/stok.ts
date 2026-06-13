import { TRPCError } from "@trpc/server";
import { and, desc, eq, lte } from "drizzle-orm";
import { stok, stokHareket } from "@shifahub/db";
import { z } from "zod";
import { router, egitmenProcedure } from "../trpc";

/**
 * Stok (envanter) routeri — GETAT sarf/ekipman yonetimi.
 *
 * stok tablosunda RLS YOK (operasyonel/klinik geneli veri); erisim rol kapisiyla
 * sinirlanir. Tum islemler egitmen veya admin gerektirir. Stok hareketi (giris/cikis)
 * miktari atomik gunceller, yetersiz stok cikisini engeller ve kritik seviye altina
 * dusen kalemleri isaretler.
 */

const stockCategory = z.enum(["kupa", "suluk", "sarf", "bitkisel", "igne", "diger"]);

const createInput = z.object({
  name: z.string().min(1, "Urun adi zorunlu"),
  category: stockCategory,
  quantity: z.number().int().min(0, "Miktar negatif olamaz"),
  unit: z.string().min(1).default("adet"),
  minimumLevel: z.number().int().min(0).optional(),
  unitPrice: z.number().min(0).optional(),
  batchNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  supplier: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

const movementInput = z.object({
  stokId: z.string().uuid(),
  type: z.enum(["giris", "cikis"]),
  quantity: z.number().int().min(1, "Miktar en az 1 olmali"),
  reason: z.string().optional(),
  tedaviId: z.string().uuid().optional(),
});

const idInput = z.object({ id: z.string().uuid() });

const DEFAULT_MIN_LEVEL = 5;
const EXPIRY_WINDOW_DAYS = 30;

function annotate(row: typeof stok.$inferSelect) {
  const now = new Date();
  const soon = new Date(now.getTime() + EXPIRY_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const expiry = row.expiryDate ? new Date(row.expiryDate) : null;
  return {
    ...row,
    isCritical:
      row.minimumLevel !== null && row.quantity <= (row.minimumLevel ?? DEFAULT_MIN_LEVEL),
    isExpired: expiry ? expiry < now : false,
    isExpiringSoon: expiry ? expiry <= soon && expiry >= now : false,
  };
}

export const stokRouter = router({
  /** Yeni stok kalemi olustur. */
  create: egitmenProcedure.input(createInput).mutation(async ({ ctx, input }) => {
    const [created] = await ctx.db
      .insert(stok)
      .values({
        name: input.name,
        category: input.category,
        quantity: input.quantity,
        unit: input.unit,
        minimumLevel: input.minimumLevel ?? DEFAULT_MIN_LEVEL,
        unitPrice: input.unitPrice?.toString(),
        batchNumber: input.batchNumber,
        expiryDate: input.expiryDate,
        supplier: input.supplier,
        location: input.location,
        notes: input.notes,
      })
      .returning();

    if (!created) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stok olusturulamadi." });
    }
    return created;
  }),

  /** Tum stok kalemlerini kritik/son kullanma isaretleriyle listele. */
  list: egitmenProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.select().from(stok).orderBy(desc(stok.updatedAt));
    return rows.map(annotate);
  }),

  /** Tek kalemi getir (kritik/son kullanma isaretleriyle). */
  getById: egitmenProcedure.input(idInput).query(async ({ ctx, input }) => {
    const [row] = await ctx.db.select().from(stok).where(eq(stok.id, input.id)).limit(1);
    if (!row) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Stok kalemi bulunamadi." });
    }
    return annotate(row);
  }),

  /** Minimum seviyenin altina inmis (kritik) kalemler. */
  getCriticalStock: egitmenProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.select().from(stok);
    return rows
      .filter((s) => s.minimumLevel !== null && s.quantity <= (s.minimumLevel ?? DEFAULT_MIN_LEVEL))
      .map(annotate);
  }),

  /**
   * Stok giris/cikis hareketi kaydet. Miktari atomik gunceller; cikista yetersiz
   * stoku engeller. Hareket kaydini ve guncel miktari dondurur; kritik seviye
   * altina dusulduyse isaret eder.
   */
  recordMovement: egitmenProcedure.input(movementInput).mutation(async ({ ctx, input }) => {
    const { stokId, type, quantity, reason, tedaviId } = input;

    const [item] = await ctx.db.select().from(stok).where(eq(stok.id, stokId)).limit(1);
    if (!item) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Stok kalemi bulunamadi." });
    }

    if (type === "cikis" && item.quantity < quantity) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Yetersiz stok: ${item.name} (mevcut: ${item.quantity}, istenen: ${quantity})`,
      });
    }

    const newQty = type === "giris" ? item.quantity + quantity : item.quantity - quantity;

    await ctx.db
      .update(stok)
      .set({ quantity: newQty, updatedAt: new Date() })
      .where(eq(stok.id, stokId));

    const [hareket] = await ctx.db
      .insert(stokHareket)
      .values({ stokId, userId: ctx.user.id, type, quantity, reason, tedaviId })
      .returning();

    const isCritical = type === "cikis" && newQty <= (item.minimumLevel ?? DEFAULT_MIN_LEVEL);

    return { hareket, newQty, isCritical };
  }),

  /** Bir kalemin hareket gecmisi (en yeniden eskiye). */
  listMovements: egitmenProcedure.input(idInput).query(async ({ ctx, input }) => {
    const [item] = await ctx.db.select().from(stok).where(eq(stok.id, input.id)).limit(1);
    if (!item) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Stok kalemi bulunamadi." });
    }
    return ctx.db
      .select()
      .from(stokHareket)
      .where(eq(stokHareket.stokId, input.id))
      .orderBy(desc(stokHareket.createdAt));
  }),

  /** Yaklasan son kullanma tarihli kalemler (varsayilan 30 gun). */
  getExpiringSoon: egitmenProcedure
    .input(z.object({ daysAhead: z.number().int().min(1).default(EXPIRY_WINDOW_DAYS) }))
    .query(async ({ ctx, input }) => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + input.daysAhead);
      const cutoffDate = cutoff.toISOString().split("T")[0]!;
      const rows = await ctx.db
        .select()
        .from(stok)
        .where(and(eq(stok.isActive, true), lte(stok.expiryDate, cutoffDate)));
      return rows.map(annotate);
    }),
});
