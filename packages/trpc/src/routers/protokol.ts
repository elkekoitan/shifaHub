import { TRPCError } from "@trpc/server";
import { desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { protokol, users } from "@shifahub/db";
import { router, protectedProcedure, egitmenProcedure } from "../trpc";

// ─── Girdi Semalari ────────────────────────────────────────────────────────────

/**
 * Sikayet onceliklendirme kalemi (jsonb). Protokol semasindaki `complaints`
 * $type sekliyle birebir uyumludur. priority: 1=Acil, 2=Yuksek, 3=Normal,
 * 4=Takip. order alani danisan icin tedavi sirasini belirler.
 */
const complaintSchema = z.object({
  description: z.string().min(1, "Sikayet aciklamasi zorunlu"),
  priority: z.number().int().min(1).max(4),
  treatmentMethod: z.string().min(1, "Tedavi yontemi zorunlu"),
  estimatedSessions: z.number().int().min(0),
  sessionInterval: z.string().min(1, "Seans araligi zorunlu"),
  order: z.number().int().min(0),
  status: z.enum(["pending", "in_progress", "completed"]),
});

const PROTOKOL_STATUSES = ["active", "completed", "paused"] as const;

const createProtokolSchema = z.object({
  danisanId: z.string().uuid("Gecersiz danisan ID"),
  title: z.string().min(1, "Protokol basligi zorunlu").max(200).optional(),
  status: z.enum(PROTOKOL_STATUSES).optional(),
  complaints: z.array(complaintSchema).optional(),
  supportingTreatments: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

const updateProtokolSchema = z.object({
  id: z.string().uuid("Gecersiz protokol ID"),
  title: z.string().min(1).max(200).optional(),
  status: z.enum(PROTOKOL_STATUSES).optional(),
  complaints: z.array(complaintSchema).optional(),
  supportingTreatments: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

// ─── Sikayet Onceliklendirme ──────────────────────────────────────────────────
// Sikayetleri once oncelik (priority kucuk = acil), sonra tedavi sirasi (order)
// gore deterministik olarak siralar. Boylece protokol her zaman acil sikayetler
// once gelecek sekilde tutulur.

type Complaint = z.infer<typeof complaintSchema>;

function prioritizeComplaints(complaints: Complaint[]): Complaint[] {
  return [...complaints].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.order - b.order;
  });
}

// ─── Router ────────────────────────────────────────────────────────────────────

export const protokolRouter = router({
  /**
   * Yeni tedavi protokolu olusturur. Sikayetler oncelik/sira gore siralanir.
   * egitmenId cagiran egitmenden alinir. RLS transaction icinde calistigi icin
   * yazma yalnizca yetkili kapsamda gerceklesir.
   */
  create: egitmenProcedure.input(createProtokolSchema).mutation(async ({ ctx, input }) => {
    const egitmenId = ctx.user.id;
    const {
      danisanId,
      title,
      status = "active",
      complaints = [],
      supportingTreatments = [],
      notes,
    } = input;

    const [created] = await ctx.db
      .insert(protokol)
      .values({
        egitmenId,
        danisanId,
        title,
        status,
        complaints: prioritizeComplaints(complaints),
        supportingTreatments,
        notes,
      })
      .returning();

    if (!created) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Protokol olusturulamadi",
      });
    }

    return created;
  }),

  /**
   * Bir danisanin protokol gecmisi (egitmen adlariyla zenginlestirilmis).
   * RLS, cagiranin gormeye yetkili oldugu satirlari otomatik filtreler;
   * danisan yalnizca kendi protokollerini, egitmen kapsamindakileri gorur.
   */
  list: protectedProcedure
    .input(z.object({ danisanId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const results = await ctx.db
        .select()
        .from(protokol)
        .where(eq(protokol.danisanId, input.danisanId))
        .orderBy(desc(protokol.createdAt));

      // Egitmen adlarini ekle
      const egitmenIds = [...new Set(results.map((p) => p.egitmenId))];
      const egitmenMap = new Map<string, { firstName: string; lastName: string }>();

      if (egitmenIds.length > 0) {
        const egitmenRecords = await ctx.db
          .select({ id: users.id, firstName: users.firstName, lastName: users.lastName })
          .from(users)
          .where(inArray(users.id, egitmenIds));

        for (const e of egitmenRecords) {
          egitmenMap.set(e.id, { firstName: e.firstName, lastName: e.lastName });
        }
      }

      return results.map((p) => ({
        ...p,
        egitmenFirstName: egitmenMap.get(p.egitmenId)?.firstName ?? "",
        egitmenLastName: egitmenMap.get(p.egitmenId)?.lastName ?? "",
      }));
    }),

  /**
   * Tek protokol kaydi. RLS, satira erisim yetkisi yoksa hic dondurmez.
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [result] = await ctx.db
        .select()
        .from(protokol)
        .where(eq(protokol.id, input.id))
        .limit(1);
      if (!result) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Protokol bulunamadi" });
      }
      return result;
    }),

  /**
   * Protokol gunceller. Yalnizca egitmen/admin yazabilir; satir sahipligi
   * RLS tarafindan zorlanir (manuel egitmenId kontrolu gerekmez). Sikayetler
   * gonderilirse yeniden oncelik/sira gore siralanir.
   */
  update: egitmenProcedure.input(updateProtokolSchema).mutation(async ({ ctx, input }) => {
    const { id, complaints, ...rest } = input;

    const values: Partial<typeof protokol.$inferInsert> = {
      ...rest,
      updatedAt: new Date(),
    };
    if (complaints !== undefined) {
      values.complaints = prioritizeComplaints(complaints);
    }

    const [updated] = await ctx.db
      .update(protokol)
      .set(values)
      .where(eq(protokol.id, id))
      .returning();

    if (!updated) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Protokol bulunamadi" });
    }

    return updated;
  }),
});
