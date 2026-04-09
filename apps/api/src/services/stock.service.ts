/**
 * Stock Service — ShifaHub
 * Stok business logic: CRUD, hareket, kritik uyari, son kullanma takibi
 * NOT: stok tablosunda egitmenId alani YOK — yetki kontrolu route seviyesinde yapilir
 */

import { eq, lte, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { stok, stokHareket } from "../db/schema/stok.js";
import { ValidationError, NotFoundError } from "../lib/errors.js";
import { createNotification } from "./notification.service.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateStockInput {
  name: string;
  category: string;
  quantity: number;
  unit?: string;
  minimumLevel?: number;
  unitPrice?: number;
  expiryDate?: string;
  description?: string;
}

export interface StockMovementInput {
  stokId: string;
  userId: string;
  type: "giris" | "cikis";
  quantity: number;
  reason?: string;
  tedaviId?: string;
}

// ─── Stok CRUD ────────────────────────────────────────────────────────────────

export async function createStock(input: CreateStockInput) {
  const { name, quantity, category, unit, minimumLevel, unitPrice, expiryDate } = input;

  if (quantity < 0) throw new ValidationError("Miktar negatif olamaz");

  const [created] = await db
    .insert(stok)
    .values({
      name,
      category: category as "kupa" | "suluk" | "sarf" | "bitkisel" | "igne" | "diger",
      quantity,
      unit: unit ?? "adet",
      minimumLevel: minimumLevel ?? 5,
      unitPrice: unitPrice?.toString(),
      expiryDate: expiryDate ?? undefined,
    })
    .returning();

  if (!created) throw new Error("Stok olusturulamadi");
  return created;
}

export async function updateStock(stokId: string, data: Partial<CreateStockInput>) {
  const [existing] = await db.select().from(stok).where(eq(stok.id, stokId)).limit(1);
  if (!existing) throw new NotFoundError("Stok kalemi bulunamadi");

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (data.name !== undefined) updateData.name = data.name;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.quantity !== undefined) updateData.quantity = data.quantity;
  if (data.unit !== undefined) updateData.unit = data.unit;
  if (data.minimumLevel !== undefined) updateData.minimumLevel = data.minimumLevel;
  if (data.unitPrice !== undefined) updateData.unitPrice = data.unitPrice.toString();
  if (data.expiryDate !== undefined) updateData.expiryDate = data.expiryDate;

  const [updated] = await db.update(stok).set(updateData).where(eq(stok.id, stokId)).returning();

  return updated;
}

export async function deleteStock(stokId: string) {
  const [existing] = await db.select().from(stok).where(eq(stok.id, stokId)).limit(1);
  if (!existing) throw new NotFoundError("Stok kalemi bulunamadi");

  // Once iliskili hareket kayitlarini sil (FK constraint)
  await db.delete(stokHareket).where(eq(stokHareket.stokId, stokId));
  await db.delete(stok).where(eq(stok.id, stokId));
}

// ─── Stok Hareketi ───────────────────────────────────────────────────────────

export async function recordStockMovement(input: StockMovementInput) {
  const { stokId, userId, type, quantity, reason, tedaviId } = input;

  if (quantity <= 0) throw new ValidationError("Hareket miktari pozitif olmali");

  const [stokItem] = await db.select().from(stok).where(eq(stok.id, stokId)).limit(1);
  if (!stokItem) throw new NotFoundError("Stok kalemi bulunamadi");

  if (type === "cikis" && stokItem.quantity < quantity) {
    throw new ValidationError(
      `Yetersiz stok: ${stokItem.name} (mevcut: ${stokItem.quantity}, istenen: ${quantity})`,
    );
  }

  const newQty = type === "giris" ? stokItem.quantity + quantity : stokItem.quantity - quantity;

  await db.update(stok).set({ quantity: newQty, updatedAt: new Date() }).where(eq(stok.id, stokId));

  const [hareket] = await db
    .insert(stokHareket)
    .values({ stokId, userId, type, quantity, reason, tedaviId })
    .returning();

  // Kritik stok bildirimi — userId'ye gonder (egitmen)
  if (type === "cikis" && newQty <= (stokItem.minimumLevel ?? 5)) {
    await createNotification(
      userId,
      "sistem",
      `Kritik Stok: ${stokItem.name}`,
      `${stokItem.name} stoku kritik seviyeye dustu: ${newQty} ${stokItem.unit ?? "adet"} kaldi.`,
      "/egitmen/stok",
    );
  }

  return { hareket, newQty };
}

// ─── Listeleme ────────────────────────────────────────────────────────────────

export async function listAllStock() {
  const results = await db.select().from(stok).orderBy(desc(stok.updatedAt));

  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  return results.map((s) => ({
    ...s,
    isCritical: s.minimumLevel !== null && s.quantity <= (s.minimumLevel ?? 5),
    isExpired: s.expiryDate ? new Date(s.expiryDate) < now : false,
    isExpiringSoon: s.expiryDate
      ? new Date(s.expiryDate) <= thirtyDaysLater && new Date(s.expiryDate) >= now
      : false,
  }));
}

export async function getCriticalStock() {
  const results = await db.select().from(stok);
  return results.filter((s) => s.minimumLevel !== null && s.quantity <= (s.minimumLevel ?? 5));
}

export async function getExpiringSoon(daysAhead = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + daysAhead);

  return await db
    .select()
    .from(stok)
    .where(lte(stok.expiryDate, cutoff.toISOString().split("T")[0]!));
}

export async function listStockMovements(stokId: string) {
  const [stokItem] = await db.select().from(stok).where(eq(stok.id, stokId)).limit(1);
  if (!stokItem) throw new NotFoundError("Stok kalemi bulunamadi");

  return await db
    .select()
    .from(stokHareket)
    .where(eq(stokHareket.stokId, stokId))
    .orderBy(desc(stokHareket.createdAt));
}
