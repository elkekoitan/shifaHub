import { TRPCError } from "@trpc/server";
import { desc, eq, ilike, or } from "drizzle-orm";
import { danisan, users, decrypt, encrypt } from "@shifahub/db";
import { z } from "zod";
import { protectedProcedure, egitmenProcedure, router } from "../trpc";

/** Anamnez/saglik gecmisi alanlari: string[] jsonb kolonlari icin ortak sema. */
const stringArray = z.array(z.string().trim().min(1)).max(100);

const genderSchema = z.enum(["erkek", "kadin"]);
const bloodTypeSchema = z.enum([
  "A_pozitif",
  "A_negatif",
  "B_pozitif",
  "B_negatif",
  "AB_pozitif",
  "AB_negatif",
  "O_pozitif",
  "O_negatif",
]);

/**
 * Profil upsert girdisi. Tum alanlar opsiyonel — kullanici profilini parca
 * parca doldurabilir. `tcKimlik` plaintext alinir, DB'ye pgcrypto ile sifreli
 * (bytea) yazilir; asla plaintext olarak saklanmaz.
 */
const upsertProfileSchema = z.object({
  tcKimlik: z
    .string()
    .trim()
    .regex(/^\d{11}$/, "TC kimlik numarasi 11 haneli olmalidir.")
    .nullable()
    .optional(),
  birthDate: z.string().date().nullable().optional(),
  gender: genderSchema.nullable().optional(),
  bloodType: bloodTypeSchema.nullable().optional(),
  occupation: z.string().trim().max(100).nullable().optional(),
  address: z.string().trim().max(1000).nullable().optional(),
  city: z.string().trim().max(50).nullable().optional(),
  emergencyContact: z.string().trim().max(100).nullable().optional(),
  emergencyPhone: z.string().trim().max(20).nullable().optional(),
  chronicDiseases: stringArray.optional(),
  allergies: stringArray.optional(),
  currentMedications: stringArray.optional(),
  previousSurgeries: stringArray.optional(),
  familyHistory: stringArray.optional(),
  previousTreatments: stringArray.optional(),
  mainComplaints: stringArray.optional(),
  height: z.number().int().min(0).max(300).nullable().optional(),
  weight: z.number().int().min(0).max(700).nullable().optional(),
  smokingStatus: z.boolean().optional(),
  alcoholStatus: z.boolean().optional(),
  pregnancyStatus: z.boolean().optional(),
  notes: z.string().trim().max(5000).nullable().optional(),
  profileImageUrl: z.string().trim().url().max(500).nullable().optional(),
});

/** Sifreli `tcKimlikEncrypted` haric tum danisan kolonlari + cozulmus tcKimlik. */
const danisanSelect = {
  id: danisan.id,
  userId: danisan.userId,
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
  profileImageUrl: danisan.profileImageUrl,
  createdAt: danisan.createdAt,
  updatedAt: danisan.updatedAt,
  tcKimlik: decrypt(danisan.tcKimlikEncrypted).as("tc_kimlik"),
} as const;

export const danisanRouter = router({
  /**
   * Giris yapan kullanicinin kendi danisan profili. RLS sadece kullanicinin
   * kendi satirini getirir; ayrica ownership filtresi gerekmez. TC sifreli
   * kolondan cozulerek plaintext doner.
   */
  me: protectedProcedure.query(async ({ ctx }) => {
    const [profile] = await ctx.db.select(danisanSelect).from(danisan).limit(1);
    if (!profile) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Danisan profili bulunamadi." });
    }
    return profile;
  }),

  /**
   * Telegram bağlama derin-bağlantısı. `t.me/<bot>?start=<userId>` ile danışan
   * `/start` gönderir, bot sohbet kimliğini kaydeder. Bot adı (env) yoksa null.
   */
  telegramLink: protectedProcedure.query(({ ctx }) => {
    const username = process.env.TELEGRAM_BOT_USERNAME;
    return { url: username ? `https://t.me/${username}?start=${ctx.user.id}` : null };
  }),

  /**
   * Kullanici kendi danisan profilini olusturur/gunceller (upsert). Satir yoksa
   * kayit/kayit yapildigi onbilgi (auth.register) varsayilir; yine de yoksa
   * burada olusturulur. RLS WITH CHECK userId'yi kapsar.
   */
  updateProfile: protectedProcedure.input(upsertProfileSchema).mutation(async ({ ctx, input }) => {
    const { tcKimlik, ...rest } = input;

    // Yalnizca gonderilen alanlari yaz; tcKimlik gonderildiyse sifrele.
    const writableValues: Record<string, unknown> = { ...rest };
    if (tcKimlik !== undefined) {
      writableValues.tcKimlikEncrypted = encrypt(tcKimlik);
    }

    const [existing] = await ctx.db.select({ id: danisan.id }).from(danisan).limit(1);

    if (!existing) {
      const [created] = await ctx.db
        .insert(danisan)
        .values({ ...writableValues, userId: ctx.user.id })
        .returning({ id: danisan.id });
      if (!created) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Profil olusturulamadi.",
        });
      }
      const [profile] = await ctx.db
        .select(danisanSelect)
        .from(danisan)
        .where(eq(danisan.id, created.id))
        .limit(1);
      return profile!;
    }

    await ctx.db.update(danisan).set(writableValues).where(eq(danisan.id, existing.id));
    const [profile] = await ctx.db
      .select(danisanSelect)
      .from(danisan)
      .where(eq(danisan.id, existing.id))
      .limit(1);
    return profile!;
  }),

  /**
   * Egitmen/admin icin danisan listesi (en yeni 50). RLS, cagiranin
   * erisebilecegi danisanlari zaten kapsar; manuel iliski filtresi gerekmez.
   * Telefonun yalnizca son 4 hanesi (phoneLast4) doner — tam numara DB'de
   * sifreli kalir (KVKK).
   */
  list: egitmenProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        id: danisan.id,
        userId: danisan.userId,
        firstName: users.firstName,
        lastName: users.lastName,
        phoneLast4: users.phoneLast4,
        city: danisan.city,
        gender: danisan.gender,
        bloodType: danisan.bloodType,
        chronicDiseases: danisan.chronicDiseases,
        mainComplaints: danisan.mainComplaints,
        createdAt: danisan.createdAt,
      })
      .from(danisan)
      .innerJoin(users, eq(danisan.userId, users.id))
      .orderBy(desc(danisan.createdAt))
      .limit(50);
  }),

  /**
   * Egitmen/admin icin danisan arama (ad/soyad/sehir). RLS gorunurlugu kapsar.
   * En fazla 50 sonuc.
   */
  search: egitmenProcedure
    .input(z.object({ query: z.string().trim().min(1).max(100) }))
    .query(async ({ ctx, input }) => {
      const term = `%${input.query}%`;
      return ctx.db
        .select({
          id: danisan.id,
          userId: danisan.userId,
          firstName: users.firstName,
          lastName: users.lastName,
          phoneLast4: users.phoneLast4,
          city: danisan.city,
          gender: danisan.gender,
          bloodType: danisan.bloodType,
          chronicDiseases: danisan.chronicDiseases,
          mainComplaints: danisan.mainComplaints,
          createdAt: danisan.createdAt,
        })
        .from(danisan)
        .innerJoin(users, eq(danisan.userId, users.id))
        .where(
          or(ilike(users.firstName, term), ilike(users.lastName, term), ilike(danisan.city, term)),
        )
        .orderBy(desc(danisan.createdAt))
        .limit(50);
    }),

  /**
   * Egitmen/admin icin tek bir danisanin tam profili (userId ile). RLS,
   * cagiranin erisemeyecegi danisani gizler — manuel iliski/yetki kontrolu
   * gerekmez. TC sifreli kolondan cozulur.
   */
  byUserId: egitmenProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [profile] = await ctx.db
        .select(danisanSelect)
        .from(danisan)
        .where(eq(danisan.userId, input.userId))
        .limit(1);
      if (!profile) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Danisan bulunamadi." });
      }
      return profile;
    }),
});
