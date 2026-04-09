/**
 * Billing Service — ShifaHub
 * Odeme business logic: CRUD, gunluk kasa, istatistik
 */

import { eq, and, gte, lte, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { odeme } from "../db/schema/odeme.js";
import { NotFoundError, ValidationError, ForbiddenError } from "../lib/errors.js";
import { createNotification } from "./notification.service.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreatePaymentInput {
  danisanId: string;
  egitmenId: string;
  tedaviId?: string;
  amount: number;
  paidAmount?: number;
  method?: "nakit" | "kart" | "havale" | "eft";
  status?: "paid" | "pending" | "partial" | "free";
  description?: string;
}

export interface UpdatePaymentInput {
  paymentId: string;
  actorId: string;
  actorRole: string;
  paidAmount?: number;
  method?: string;
  status?: string;
  description?: string;
}

// ─── Gunluk Kasa ─────────────────────────────────────────────────────────────

export async function getDailyKasa(egitmenId: string, date?: Date) {
  const targetDate = date ?? new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const results = await db
    .select()
    .from(odeme)
    .where(
      and(
        eq(odeme.egitmenId, egitmenId),
        gte(odeme.createdAt, startOfDay),
        lte(odeme.createdAt, endOfDay),
      ),
    );

  const totalAmount = results.reduce((acc, o) => acc + Number(o.amount ?? 0), 0);
  const paidAmount = results
    .filter((o) => o.status === "paid")
    .reduce((acc, o) => acc + Number(o.paidAmount ?? o.amount ?? 0), 0);
  const pendingAmount = results
    .filter((o) => o.status === "pending")
    .reduce((acc, o) => acc + Number(o.amount ?? 0), 0);
  const freeAmount = results
    .filter((o) => o.status === "free")
    .reduce((acc, o) => acc + Number(o.amount ?? 0), 0);

  const byMethod = {
    nakit: results
      .filter((o) => o.method === "nakit")
      .reduce((acc, o) => acc + Number(o.paidAmount ?? o.amount ?? 0), 0),
    kart: results
      .filter((o) => o.method === "kart")
      .reduce((acc, o) => acc + Number(o.paidAmount ?? o.amount ?? 0), 0),
    havale: results
      .filter((o) => o.method === "havale")
      .reduce((acc, o) => acc + Number(o.paidAmount ?? o.amount ?? 0), 0),
    eft: results
      .filter((o) => o.method === "eft")
      .reduce((acc, o) => acc + Number(o.paidAmount ?? o.amount ?? 0), 0),
  };

  const byStatus = {
    paid: results.filter((o) => o.status === "paid").length,
    pending: results.filter((o) => o.status === "pending").length,
    partial: results.filter((o) => o.status === "partial").length,
    free: results.filter((o) => o.status === "free").length,
  };

  return {
    totalAmount,
    paidAmount,
    pendingAmount,
    freeAmount,
    byMethod,
    byStatus,
    count: results.length,
  };
}

// ─── Odeme CRUD ───────────────────────────────────────────────────────────────

export async function createPayment(input: CreatePaymentInput) {
  const { danisanId, egitmenId, amount, paidAmount, method, status, description, tedaviId } = input;

  if (amount < 0) throw new ValidationError("Tutar negatif olamaz");

  const [created] = await db
    .insert(odeme)
    .values({
      danisanId,
      egitmenId,
      tedaviId,
      amount: amount.toFixed(2),
      paidAmount: (paidAmount ?? (status === "paid" ? amount : 0)).toFixed(2),
      method: method ?? "nakit",
      status: status ?? "pending",
      description,
    })
    .returning();

  if (!created) throw new Error("Odeme olusturulamadi");

  // Danisana bildirim
  if (status === "paid") {
    await createNotification(
      danisanId,
      "sistem",
      "Odeme Alindi",
      `₺${amount.toFixed(2)} tutarinda odemeniz alindi.`,
      "/danisan/tedavi",
    );
  }

  return created;
}

export async function updatePayment(input: UpdatePaymentInput) {
  const { paymentId, actorId, actorRole, ...updates } = input;

  const [existing] = await db.select().from(odeme).where(eq(odeme.id, paymentId)).limit(1);
  if (!existing) throw new NotFoundError("Odeme bulunamadi");

  // Yetki: admin ve egitmen degistirebilir
  if (actorRole === "egitmen" && existing.egitmenId !== actorId) {
    throw new ForbiddenError("Bu odemeyi guncelleme yetkiniz yok");
  }

  const [updated] = await db
    .update(odeme)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(odeme.id, paymentId))
    .returning();

  return updated;
}

export async function listPayments(egitmenId: string, danisanId?: string) {
  const conditions = [eq(odeme.egitmenId, egitmenId)];
  if (danisanId) conditions.push(eq(odeme.danisanId, danisanId));

  const results = await db
    .select()
    .from(odeme)
    .where(and(...conditions))
    .orderBy(desc(odeme.createdAt))
    .limit(200);

  return results;
}

// ─── Istatistik ───────────────────────────────────────────────────────────────

export async function getPaymentStats(egitmenId: string) {
  const thisMonthStart = new Date();
  thisMonthStart.setDate(1);
  thisMonthStart.setHours(0, 0, 0, 0);

  const allPayments = await db.select().from(odeme).where(eq(odeme.egitmenId, egitmenId));

  const thisMonthPayments = allPayments.filter((p) => p.createdAt && p.createdAt >= thisMonthStart);

  const totalRevenue = allPayments
    .filter((p) => p.status === "paid")
    .reduce((acc, p) => acc + Number(p.paidAmount ?? p.amount ?? 0), 0);

  const monthlyRevenue = thisMonthPayments
    .filter((p) => p.status === "paid")
    .reduce((acc, p) => acc + Number(p.paidAmount ?? p.amount ?? 0), 0);

  const pendingTotal = allPayments
    .filter((p) => p.status === "pending")
    .reduce((acc, p) => acc + Number(p.amount ?? 0), 0);

  return { totalRevenue, monthlyRevenue, pendingTotal, totalPayments: allPayments.length };
}
