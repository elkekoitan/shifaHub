import { TRPCError } from "@trpc/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { auditLog, danisan, decrypt, kvkkConsent, users } from "@shifahub/db";
import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "../trpc";

/**
 * KVKK uyum router'i.
 *
 * Iki sorumluluk alani:
 *  1. Acik riza (consent) yonetimi — kullanici her isleme amaci icin ayri riza
 *     verir/geri ceker. `kvkk_consent` RLS (user_id) ile kapsanir; kullanici
 *     yalnizca kendi rizalarini gorur/degistirir, manuel ownership filtresi
 *     gerekmez.
 *  2. Veri sahibi haklari — kendi verisini disa aktarma (export) ve silinme
 *     talebi (erasure / unutulma hakki).
 *
 * Audit log okuma yalnizca admin'e aciktir (denetim izi mahremiyeti).
 *
 * `ctx.db` zaten RLS-scoped ve enc-key GUC'li bir transaction; sifreli kolonlar
 * `decrypt()` ile cozulur.
 */

/**
 * Gecerli KVKK isleme amaclari. `kvkk_consent.purpose` (varchar 100) icin
 * kapali liste — sema enum degil, dogrulamayi burada yapariz.
 */
const consentPurposeSchema = z.enum([
  "saglik_verisi_isleme",
  "iletisim",
  "pazarlama",
  "ucuncu_taraf_paylasim",
]);

type ConsentPurpose = z.infer<typeof consentPurposeSchema>;

/** Her amac icin varsayilan riza metni (description NOT NULL). */
const PURPOSE_DESCRIPTIONS: Record<ConsentPurpose, string> = {
  saglik_verisi_isleme:
    "Saglik verilerinizin (ozel nitelikli kisisel veri) tedavi sureci kapsaminda islenmesine acik riza.",
  iletisim:
    "Randevu, hatirlatma ve bilgilendirme amaciyla sizinle iletisime gecilmesine acik riza.",
  pazarlama: "Kampanya, duyuru ve pazarlama amacli iletilerin tarafiniza gonderilmesine acik riza.",
  ucuncu_taraf_paylasim:
    "Verilerinizin yasal yukumluluk disinda ucuncu taraflarla paylasilmasina acik riza.",
};

/** Riza kaydinin disa aktarilabilir/listeleyici goruntusu. */
const consentSelect = {
  id: kvkkConsent.id,
  purpose: kvkkConsent.purpose,
  description: kvkkConsent.description,
  version: kvkkConsent.version,
  status: kvkkConsent.status,
  grantedAt: kvkkConsent.grantedAt,
  revokedAt: kvkkConsent.revokedAt,
  expiresAt: kvkkConsent.expiresAt,
  isDigitallySigned: kvkkConsent.isDigitallySigned,
  createdAt: kvkkConsent.createdAt,
} as const;

export const kvkkRouter = router({
  // --- Acik riza yonetimi -------------------------------------------------

  /**
   * Bir isleme amaci icin acik riza ver. Ayni amac icin halihazirda aktif bir
   * riza varsa CONFLICT doner (tekrar riza yerine once geri cekilmeli). Aktif
   * olmayan (revoked/expired) eski kayit varsa yeni surum numarasiyla yeni bir
   * aktif riza olusturulur.
   */
  grantConsent: protectedProcedure
    .input(
      z.object({
        purpose: consentPurposeSchema,
        expiresAt: z.string().datetime().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [active] = await ctx.db
        .select({ id: kvkkConsent.id })
        .from(kvkkConsent)
        .where(and(eq(kvkkConsent.purpose, input.purpose), eq(kvkkConsent.status, "active")))
        .limit(1);
      if (active) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Bu amac icin zaten aktif bir riza bulunuyor.",
        });
      }

      // Yeni surum: ayni amaca ait en yuksek surumun bir fazlasi.
      const [latest] = await ctx.db
        .select({ version: kvkkConsent.version })
        .from(kvkkConsent)
        .where(eq(kvkkConsent.purpose, input.purpose))
        .orderBy(desc(kvkkConsent.version))
        .limit(1);
      const nextVersion = (latest?.version ?? 0) + 1;

      const [created] = await ctx.db
        .insert(kvkkConsent)
        .values({
          userId: ctx.user.id,
          purpose: input.purpose,
          description: PURPOSE_DESCRIPTIONS[input.purpose],
          version: nextVersion,
          status: "active",
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        })
        .returning(consentSelect);
      if (!created) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Riza kaydedilemedi.",
        });
      }

      // KVKK denetim izi: riza verme olayi.
      await ctx.db.insert(auditLog).values({
        userId: ctx.user.id,
        action: "consent_granted",
        tableName: "kvkk_consent",
        recordId: created.id,
        description: `Acik riza verildi: ${input.purpose}`,
      });

      return created;
    }),

  /**
   * Bir isleme amaci icin verilen acik rizayi geri cek. Aktif riza yoksa
   * NOT_FOUND doner. Geri cekme; kaydin durumunu `revoked` yapar ve `revokedAt`
   * damgalar (silmez — denetim izi korunur).
   */
  revokeConsent: protectedProcedure
    .input(z.object({ purpose: consentPurposeSchema }))
    .mutation(async ({ ctx, input }) => {
      const [active] = await ctx.db
        .select({ id: kvkkConsent.id })
        .from(kvkkConsent)
        .where(and(eq(kvkkConsent.purpose, input.purpose), eq(kvkkConsent.status, "active")))
        .limit(1);
      if (!active) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bu amac icin geri cekilecek aktif riza bulunamadi.",
        });
      }

      const [updated] = await ctx.db
        .update(kvkkConsent)
        .set({ status: "revoked", revokedAt: new Date() })
        .where(eq(kvkkConsent.id, active.id))
        .returning(consentSelect);

      await ctx.db.insert(auditLog).values({
        userId: ctx.user.id,
        action: "consent_revoked",
        tableName: "kvkk_consent",
        recordId: active.id,
        description: `Acik riza geri cekildi: ${input.purpose}`,
      });

      return updated!;
    }),

  /**
   * Kullanicinin tum riza kayitlari (en yeni once). RLS yalnizca kendi
   * kayitlarini getirir.
   */
  listConsents: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.select(consentSelect).from(kvkkConsent).orderBy(desc(kvkkConsent.createdAt));
  }),

  /**
   * Belirli bir amac icin su an gecerli (aktif) bir riza var mi? UI'da gate'ler
   * icin kullanilir. `consent` aktif kaydin ozetini doner, yoksa null.
   */
  checkConsent: protectedProcedure
    .input(z.object({ purpose: consentPurposeSchema }))
    .query(async ({ ctx, input }) => {
      const [active] = await ctx.db
        .select(consentSelect)
        .from(kvkkConsent)
        .where(and(eq(kvkkConsent.purpose, input.purpose), eq(kvkkConsent.status, "active")))
        .limit(1);
      return { hasConsent: Boolean(active), consent: active ?? null };
    }),

  // --- Veri sahibi haklari ------------------------------------------------

  /**
   * Veri tasinabilirligi / erisim hakki: kullanicinin kendisine ait tum kisisel
   * veriyi tek pakette toplar. Hesap, danisan profili (TC sifreli kolondan
   * cozulur) ve riza gecmisi dahildir. RLS her sorguyu kendi verisiyle sinirlar.
   * Bu islem audit log'a `export` olarak yazilir.
   */
  exportMyData: protectedProcedure.query(async ({ ctx }) => {
    const [account] = await ctx.db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        firstName: users.firstName,
        lastName: users.lastName,
        phoneLast4: users.phoneLast4,
        isEmailVerified: users.isEmailVerified,
        isPhoneVerified: users.isPhoneVerified,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);
    if (!account) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Hesap bulunamadi." });
    }

    // Danisan profili (varsa). TC sifreli kolondan plaintext'e cozulur.
    const [profile] = await ctx.db
      .select({
        id: danisan.id,
        tcKimlik: decrypt(danisan.tcKimlikEncrypted).as("tc_kimlik"),
        birthDate: danisan.birthDate,
        gender: danisan.gender,
        bloodType: danisan.bloodType,
        occupation: danisan.occupation,
        address: danisan.address,
        city: danisan.city,
        emergencyContact: danisan.emergencyContact,
        emergencyPhone: danisan.emergencyPhone,
        chronicDiseases: danisan.chronicDiseases,
        allergies: danisan.allergies,
        currentMedications: danisan.currentMedications,
        previousSurgeries: danisan.previousSurgeries,
        familyHistory: danisan.familyHistory,
        previousTreatments: danisan.previousTreatments,
        mainComplaints: danisan.mainComplaints,
        height: danisan.height,
        weight: danisan.weight,
        smokingStatus: danisan.smokingStatus,
        alcoholStatus: danisan.alcoholStatus,
        pregnancyStatus: danisan.pregnancyStatus,
        notes: danisan.notes,
        createdAt: danisan.createdAt,
        updatedAt: danisan.updatedAt,
      })
      .from(danisan)
      .limit(1);

    const consents = await ctx.db
      .select(consentSelect)
      .from(kvkkConsent)
      .orderBy(desc(kvkkConsent.createdAt));

    // KVKK denetim izi: veri disa aktarma olayi.
    await ctx.db.insert(auditLog).values({
      userId: ctx.user.id,
      action: "export",
      tableName: "users",
      recordId: ctx.user.id,
      description: "Veri sahibi kendi verisini disa aktardi (KVKK erisim hakki).",
    });

    return {
      exportedAt: new Date(),
      account,
      profile: profile ?? null,
      consents,
    };
  }),

  /**
   * Silinme (unutulma) hakki talebi. Hard-delete ANINDA yapilmaz: saglik verisi
   * KVKK/mevzuat geregi 20-30 yil saklama yukumlulugune tabidir, bu yuzden talep
   * once denetim izine kaydedilir ve uyum incelemesine alinir. Talep audit
   * log'a yazilir; uygun rizalar `revoked` isaretlenir.
   */
  requestErasure: protectedProcedure
    .input(
      z.object({
        reason: z.string().trim().min(1).max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Pazarlama/iletisim gibi yasal saklama disindaki aktif rizalari geri cek.
      await ctx.db
        .update(kvkkConsent)
        .set({ status: "revoked", revokedAt: new Date() })
        .where(eq(kvkkConsent.status, "active"));

      const [logged] = await ctx.db
        .insert(auditLog)
        .values({
          userId: ctx.user.id,
          action: "delete",
          tableName: "users",
          recordId: ctx.user.id,
          description: input.reason
            ? `Silinme talebi (KVKK unutulma hakki). Gerekce: ${input.reason}`
            : "Silinme talebi (KVKK unutulma hakki).",
        })
        .returning({ id: auditLog.id, createdAt: auditLog.createdAt });

      return {
        requestId: logged!.id,
        requestedAt: logged!.createdAt,
        status: "pending_review" as const,
        message:
          "Silinme talebiniz alindi ve uyum incelemesine gonderildi. Saglik verileri yasal saklama suresine tabi oldugundan inceleme sonrasi islenecektir.",
      };
    }),

  // --- Denetim (yalnizca admin) -------------------------------------------

  /**
   * Audit log okuma — yalnizca admin. Sayfali, en yeni once. Istege bagli
   * `userId`/`action`/`tableName` filtreleri ile daraltilabilir.
   */
  listAuditLogs: adminProcedure
    .input(
      z.object({
        userId: z.string().uuid().optional(),
        action: z
          .enum([
            "create",
            "read",
            "update",
            "delete",
            "login",
            "logout",
            "export",
            "consent_granted",
            "consent_revoked",
          ])
          .optional(),
        tableName: z.string().trim().max(50).optional(),
        limit: z.number().int().min(1).max(100).default(30),
        offset: z.number().int().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input.userId) conditions.push(eq(auditLog.userId, input.userId));
      if (input.action) conditions.push(eq(auditLog.action, input.action));
      if (input.tableName) conditions.push(eq(auditLog.tableName, input.tableName));
      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const rows = await ctx.db
        .select({
          id: auditLog.id,
          userId: auditLog.userId,
          action: auditLog.action,
          tableName: auditLog.tableName,
          recordId: auditLog.recordId,
          description: auditLog.description,
          ipAddress: auditLog.ipAddress,
          createdAt: auditLog.createdAt,
        })
        .from(auditLog)
        .where(where)
        .orderBy(desc(auditLog.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const [{ total } = { total: 0 }] = await ctx.db
        .select({ total: sql<number>`count(*)::int` })
        .from(auditLog)
        .where(where);

      return { items: rows, total, limit: input.limit, offset: input.offset };
    }),
});
