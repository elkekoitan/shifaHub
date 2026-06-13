import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte } from "drizzle-orm";
import { z } from "zod";
import { komplikasyon, bildirim, users } from "@shifahub/db";
import { router, protectedProcedure, egitmenProcedure } from "../trpc";

/**
 * Acil domaini — eski Fastify `acil` route'unun ACIL DURUM BILDIRIMI + severity
 * (1-5) yonlendirme mantigi tRPC'ye portlanmistir.
 *
 * Veri modeli notu: acil durumlar ve komplikasyonlar AYNI `komplikasyon`
 * tablosunu paylasir (severity 1-5 + takip sureci). Bu router olaya "acil olay"
 * merceginden bakar (rapor + triyaj listesi); komplikasyonun durum makinesi /
 * takip notu / cozum uclari `komplikasyonRouter`'dadir. Ayni tablo uzerinde isim
 * cakismasi olmasin diye burada `report`/`list` proc adlari kullanilir
 * (komplikasyonRouter `create`/`updateStatus` kullanir).
 *
 * ctx.db ZATEN RLS-scoped: komplikasyon satirlari danisan/egitmen bakim iliskisi
 * kapsaminda gorunur. Bu yuzden manuel sahiplik filtresi (`where egitmenId =
 * ctx.user.id`) YOKTUR — gorunurlugu RLS saglar. Burada yalnizca is-mantigi
 * (severity esikleri/filtreleri, anlik bildirim zinciri) ve rol kapilamasi
 * (procedure tipi) ele alinir.
 */

// ─── Severity yonlendirme esikleri (1-5) ─────────────────────────────────────
// Eski acil route mantigi:
//  - severity >= SEVERITY_ADMIN_NOTIFY (3) : tum admin'lere "sistem" bildirimi.
//  - severity >= SEVERITY_CRITICAL_NOTIFY (4) : rapor eden egitmene kritik uyari.
//
// NOT (worker P5): tam severity-bazli bildirim zinciri (SMS/WhatsApp/Email ile
// sorumlu tabip + nobetci eskalasyonu) asenkron worker katmaninda kosacaktir.
// Burada yalnizca anlik DB bildirimi (bildirim tablosu) olusturulur; harici
// kanal gonderimleri P5 worker'a birakilmistir.
const SEVERITY_ADMIN_NOTIFY = 3;
const SEVERITY_CRITICAL_NOTIFY = 4;

// open -> following -> resolved (acil olayin yasam dongusu komplikasyon ile ortak)
const acilStatusValues = ["open", "following", "resolved"] as const;

// ─── Girdi semalari ─────────────────────────────────────────────────────────
const reportInput = z.object({
  danisanId: z.string().uuid(),
  tedaviId: z.string().uuid().optional(),
  // Acil durum siddeti: 1 (dusuk) .. 5 (yasamsal).
  severity: z.number().int().min(1).max(5),
  type: z.string().min(1).max(100),
  description: z.string().min(1),
  imageUrls: z.array(z.string().url()).default([]),
});

const listInput = z
  .object({
    // Triyaj filtresi: yalnizca >= verilen severity olan olaylar.
    minSeverity: z.number().int().min(1).max(5).optional(),
    status: z.enum(acilStatusValues).optional(),
    danisanId: z.string().uuid().optional(),
    limit: z.number().int().min(1).max(100).default(50),
  })
  .default({ limit: 50 });

export const acilRouter = router({
  /**
   * Acil durum bildirimi (rapor). Yalnizca egitmen/admin. RLS, egitmenin yalnizca
   * bakim iliskisi (care_relationship) bulunan danisanlar icin satir yazmasina
   * izin verir; iliski yoksa INSERT politika tarafindan reddedilir.
   *
   * Severity bazli anlik bildirim yonlendirmesi:
   *  - severity >= 3 : tum admin'lere "sistem" bildirimi (triyaj).
   *  - severity >= 4 : rapor eden egitmene kritik uyari bildirimi.
   */
  report: egitmenProcedure.input(reportInput).mutation(async ({ ctx, input }) => {
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
        message: "Acil durum bildirimi olusturulamadi.",
      });
    }

    const severity = created.severity;

    // severity >= 3 : admin triyaj bildirim zinciri.
    if (severity >= SEVERITY_ADMIN_NOTIFY) {
      const admins = await ctx.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.role, "admin"));

      for (const admin of admins) {
        await ctx.db.insert(bildirim).values({
          userId: admin.id,
          type: "sistem",
          title: `Acil Durum Bildirimi (Seviye ${severity})`,
          body: `Yuksek seviyeli acil durum rapor edildi: ${created.type}`,
          actionUrl: "/admin/acil",
        });
      }
    }

    // severity >= 4 : rapor eden egitmene kritik uyari.
    if (severity >= SEVERITY_CRITICAL_NOTIFY) {
      await ctx.db.insert(bildirim).values({
        userId: ctx.user.id,
        type: "sistem",
        title: `KRITIK ACIL: Seviye ${severity}`,
        body: "Kritik seviyede acil durum kaydedildi. Sorumlu tabip bilgilendirildi.",
        actionUrl: "/admin/acil",
      });
    }

    return created;
  }),

  /**
   * Acil durum triyaj listesi. Danisan kendi olaylarini, egitmen bakim iliskisi
   * bulunan danisanlarin olaylarini, admin ise tumunu gorur — gorunurluk RLS ile
   * saglanir. `minSeverity`/`status`/`danisanId` yalnizca is-mantigi filtresidir.
   * Varsayilan siralama: en yeni once.
   */
  list: protectedProcedure.input(listInput).query(async ({ ctx, input }) => {
    const conditions = [
      input.minSeverity !== undefined ? gte(komplikasyon.severity, input.minSeverity) : undefined,
      input.status ? eq(komplikasyon.status, input.status) : undefined,
      input.danisanId ? eq(komplikasyon.danisanId, input.danisanId) : undefined,
    ].filter((c): c is NonNullable<typeof c> => c !== undefined);

    return ctx.db
      .select()
      .from(komplikasyon)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(komplikasyon.severity), desc(komplikasyon.createdAt))
      .limit(input.limit);
  }),
});
