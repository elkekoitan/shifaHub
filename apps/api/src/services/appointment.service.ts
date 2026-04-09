/**
 * Appointment Service — ShifaHub
 * Randevu business logic: state machine, conflict check, notifications
 */

import { eq, and, lt, gt, inArray, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { randevu } from "../db/schema/randevu.js";
import { users } from "../db/schema/users.js";
import { ConflictError, NotFoundError, ValidationError, ForbiddenError } from "../lib/errors.js";
import { notifyAppointmentStatus, createNotification } from "./notification.service.js";

// ─── State Machine ────────────────────────────────────────────────────────────

export const VALID_TRANSITIONS: Record<string, string[]> = {
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

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateAppointmentInput {
  danisanId: string;
  egitmenId: string;
  scheduledAt: Date;
  duration: number;
  treatmentType?: string;
  complaints?: string;
  notes?: string;
}

export interface UpdateStatusInput {
  randevuId: string;
  newStatus: string;
  cancelReason?: string;
  actorId: string;
  actorRole: string;
}

export interface ListAppointmentsInput {
  userId: string;
  role: string;
  status?: string;
  from?: string;
  to?: string;
  limit?: number;
}

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Randevu olustur: catisma kontrolu, kayit, bildirim
 */
export async function createAppointment(input: CreateAppointmentInput) {
  const { danisanId, egitmenId, scheduledAt, duration, treatmentType, complaints, notes } = input;

  // Gecmis tarih kontrolu
  if (scheduledAt <= new Date()) {
    throw new ValidationError("Gecmis bir tarihe randevu olusturulamaz");
  }

  const endAt = new Date(scheduledAt.getTime() + duration * 60 * 1000);

  // Catisma kontrolu: overlap detection
  const conflicts = await db
    .select({ id: randevu.id, status: randevu.status })
    .from(randevu)
    .where(
      and(
        eq(randevu.egitmenId, egitmenId),
        lt(randevu.scheduledAt, endAt),
        gt(randevu.endAt, scheduledAt),
      ),
    );

  const activeConflicts = conflicts.filter(
    (c) => !["cancelled", "no_show"].includes(c.status ?? ""),
  );

  if (activeConflicts.length > 0) {
    throw new ConflictError("Bu zaman diliminde egitmenin zaten bir randevusu var");
  }

  // Kayit
  const [created] = await db
    .insert(randevu)
    .values({
      danisanId,
      egitmenId,
      scheduledAt,
      endAt,
      duration,
      treatmentType,
      complaints,
      notes,
      status: "requested",
    })
    .returning();

  if (!created) {
    throw new Error("Randevu olusturulamadi");
  }

  // Bildirimler
  await Promise.all([
    createNotification(
      egitmenId,
      "randevu_onay",
      "Yeni Randevu Talebi",
      `${scheduledAt.toLocaleDateString("tr-TR")} tarihinde yeni randevu talebi.`,
      "/egitmen/randevu",
    ),
    createNotification(
      danisanId,
      "randevu_onay",
      "Randevu Talebiniz Alindi",
      `${scheduledAt.toLocaleDateString("tr-TR")} tarihli randevunuz onay bekliyor.`,
      "/danisan/randevu",
    ),
  ]);

  return created;
}

/**
 * Randevu durumunu guncelle: yetki + state machine + bildirim
 */
export async function updateAppointmentStatus(input: UpdateStatusInput) {
  const { randevuId, newStatus, cancelReason, actorId, actorRole } = input;

  const [existing] = await db.select().from(randevu).where(eq(randevu.id, randevuId)).limit(1);

  if (!existing) {
    throw new NotFoundError("Randevu bulunamadi");
  }

  // Yetki kontrolu
  if (actorRole === "danisan" && existing.danisanId !== actorId) {
    throw new ForbiddenError("Bu randevuyu degistirme yetkiniz yok");
  }
  if (actorRole === "egitmen" && existing.egitmenId !== actorId) {
    throw new ForbiddenError("Bu randevuyu degistirme yetkiniz yok");
  }
  // Danisan sadece iptal edebilir
  if (actorRole === "danisan" && newStatus !== "cancelled") {
    throw new ForbiddenError("Danisan sadece randevu iptal edebilir");
  }

  // State machine kontrolu
  const allowedTransitions = VALID_TRANSITIONS[existing.status ?? ""] || [];
  if (!allowedTransitions.includes(newStatus)) {
    throw new ValidationError(`"${existing.status}" durumundan "${newStatus}" durumuna gecilemez`);
  }

  // Gec iptal uyarisi
  let cancelWarning: string | undefined;
  if (newStatus === "cancelled" && existing.scheduledAt) {
    const hoursUntil = (existing.scheduledAt.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntil < 24 && hoursUntil > 0) {
      cancelWarning = "UYARI: Randevuya 24 saatten az kalmis. Gec iptal kaydedildi.";
    }
  }

  // Guncelle
  const [updated] = await db
    .update(randevu)
    .set({
      status: newStatus as any,
      statusChangedAt: new Date(),
      updatedAt: new Date(),
      ...(newStatus === "cancelled" && {
        cancelledBy: actorId,
        cancelReason: cancelReason ?? undefined,
      }),
    })
    .where(eq(randevu.id, randevuId))
    .returning();

  // Bildirimler
  await notifyAppointmentStatus(existing.danisanId, existing.egitmenId, newStatus);

  return { updated, cancelWarning };
}

/**
 * Randevu listesi: rol bazli filtreleme + JOIN ile isim bilgisi
 */
export async function listAppointments(input: ListAppointmentsInput) {
  const { userId, role, status, limit = 100 } = input;

  const conditions = [];

  if (role === "danisan") {
    conditions.push(eq(randevu.danisanId, userId));
  } else if (role === "egitmen") {
    conditions.push(eq(randevu.egitmenId, userId));
  }

  if (status) {
    conditions.push(eq(randevu.status, status as any));
  }

  const results = await db
    .select()
    .from(randevu)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(randevu.scheduledAt))
    .limit(limit);

  // Kullanici adlarini tek sorguda cek (N+1 fix)
  const userIds = [...new Set(results.flatMap((r) => [r.danisanId, r.egitmenId]))];
  const userMap = new Map<string, { firstName: string; lastName: string }>();

  if (userIds.length > 0) {
    const userRecords = await db
      .select({ id: users.id, firstName: users.firstName, lastName: users.lastName })
      .from(users)
      .where(inArray(users.id, userIds));

    for (const u of userRecords) {
      userMap.set(u.id, { firstName: u.firstName, lastName: u.lastName });
    }
  }

  return results.map((r) => ({
    ...r,
    danisanFirstName: userMap.get(r.danisanId)?.firstName ?? "",
    danisanLastName: userMap.get(r.danisanId)?.lastName ?? "",
    egitmenFirstName: userMap.get(r.egitmenId)?.firstName ?? "",
    egitmenLastName: userMap.get(r.egitmenId)?.lastName ?? "",
  }));
}

/**
 * Gunluk istatistik ozeti
 */
export async function getDailyStats(egitmenId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 86400000);

  const allAppointments = await db
    .select({ id: randevu.id, status: randevu.status, scheduledAt: randevu.scheduledAt })
    .from(randevu)
    .where(eq(randevu.egitmenId, egitmenId));

  const bugunku = allAppointments.filter((r) => {
    const d = r.scheduledAt ? new Date(r.scheduledAt) : null;
    return d && d >= today && d < tomorrow;
  }).length;

  const onayBekleyen = allAppointments.filter((r) => r.status === "requested").length;
  const arrived = allAppointments.filter((r) => r.status === "arrived").length;

  return { bugunku, onayBekleyen, arrived };
}
