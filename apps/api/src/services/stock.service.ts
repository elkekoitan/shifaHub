/**
 * Stock Service — ShifaHub
 * Stok business logic: CRUD, hareket, kritik uyari, son kullanma takibi
 */

import { eq, and, lte, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { stok, stokHareket } from "../db/schema/stok.js";
import { NotFoundError, ValidationError, ForbiddenError } from "../lib/errors.js";
import { createNotification } from "./notification.service.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateStockInput {
  egitmenId: string;
  name: string;
  category: string;
  quantity: number;
  unit?: string;
  minimumLevel?: number;
  unitPrice?: number;
  expiryDate?: Date;
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
  const { egitmenId, name, quantity, ...rest } = input;

  if (quantity < 0) throw new ValidationError("Miktar negatif olamaz");

  const [created] = await db
    .insert(stok)
    .values({
      egitmenId,
      name,
      quantity,
      ...rest,
    })
    .returning();

  if (!created) throw new Error("Stok olusturulamadi");
  return created;
}

export async function updateStock(
  stokId: string,
  egitmenId: string,
  data: Partial<CreateStockInput>,
) {
  const [existing] = await db.select().from(stok).where(eq(stok.id, stokId)).limit(1);
  if (!existing) throw new NotFoundError("Stok kalemi bulunamadi");
  if (existing.egitmenId !== egitmenId)
    throw new ForbiddenError("Bu stoku guncelleme yetkiniz yok");

  const [updated] = await db
    .update(stok)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(stok.id, stokId))
    .returning();

  return updated;
}

export async function deleteStock(stokId: string, egitmenId: string) {
  const [existing] = await db.select().from(stok).where(eq(stok.id, stokId)).limit(1);
  if (!existing) throw new NotFoundError("Stok kalemi bulunamadi");
  if (existing.egitmenId !== egitmenId) throw new ForbiddenError("Bu stoku silme yetkiniz yok");

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

  // Stok guncelle
  await db.update(stok).set({ quantity: newQty, updatedAt: new Date() }).where(eq(stok.id, stokId));

  // Hareket kaydet
  const [hareket] = await db
    .insert(stokHareket)
    .values({ stokId, userId, type, quantity, reason, tedaviId })
    .returning();

  // Kritik stok bildirimi
  if (type === "cikis" && newQty <= (stokItem.minimumLevel ?? 5)) {
    await createNotification(
      stokItem.egitmenId,
      "sistem",
      `Kritik Stok: ${stokItem.name}`,
      `${stokItem.name} stoku kritik seviyeye dustu: ${newQty} ${stokItem.unit ?? "adet"} kaldi.`,
      "/egitmen/stok",
    );
  }

  return { hareket, newQty };
}

// ─── Kritik ve Son Kullanma ───────────────────────────────────────────────────

export async function getCriticalStock(egitmenId: string) {
  const results = await db.select().from(stok).where(eq(stok.egitmenId, egitmenId));

  return results.filter((s) => s.minimumLevel !== null && s.quantity <= (s.minimumLevel ?? 5));
}

export async function getExpiringSoon(egitmenId: string, daysAhead = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + daysAhead);

  return await db
    .select()
    .from(stok)
    .where(and(eq(stok.egitmenId, egitmenId), lte(stok.expiryDate, cutoff)));
}

export async function listStock(egitmenId: string) {
  const results = await db
    .select()
    .from(stok)
    .where(eq(stok.egitmenId, egitmenId))
    .orderBy(desc(stok.updatedAt));

  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  return results.map((s) => ({
    ...s,
    isCritical: s.minimumLevel !== null && s.quantity <= (s.minimumLevel ?? 5),
    isExpired: s.expiryDate ? s.expiryDate < now : false,
    isExpiringSoon: s.expiryDate ? s.expiryDate <= thirtyDaysLater && s.expiryDate >= now : false,
  }));
}

export async function listStockMovements(stokId: string, egitmenId: string) {
  const [stokItem] = await db.select().from(stok).where(eq(stok.id, stokId)).limit(1);
  if (!stokItem) throw new NotFoundError("Stok kalemi bulunamadi");
  if (stokItem.egitmenId !== egitmenId) throw new ForbiddenError("Bu stoka erisim yetkiniz yok");

  return await db
    .select()
    .from(stokHareket)
    .where(eq(stokHareket.stokId, stokId))
    .orderBy(desc(stokHareket.createdAt));
}
