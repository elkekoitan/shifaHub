import { TRPCError } from "@trpc/server";
import { and, desc, eq, or, sql } from "drizzle-orm";
import { mesaj, bildirim, users } from "@shifahub/db";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

/**
 * Mesaj domaini — eski Fastify route (apps/api/src/routes/mesaj.ts) mantigi
 * tRPC'ye portlanmistir. ctx.db ZATEN RLS-scoped: cagiranin gonderici ya da
 * alici olmadigi mesaj satiri sorgulara dusmez/degistirilemez. Bu yuzden manuel
 * `where senderId = ctx.user.id OR receiverId = ctx.user.id` sahiplik filtresi
 * YOKTUR — yalnizca is-mantigi filtreleri (karsi taraf secimi, okunmamis vb.)
 * burada ele alinir.
 */

// ─── Girdi semalari ─────────────────────────────────────────────────────────
const sendInput = z.object({
  receiverId: z.string().uuid(),
  content: z.string().trim().min(1, "Mesaj bos olamaz.").max(4000),
});

const conversationInput = z.object({
  userId: z.string().uuid(),
  limit: z.number().int().min(1).max(200).default(50),
});

const listInput = z.object({
  limit: z.number().int().min(1).max(200).default(50),
});

const markReadInput = z.object({
  mesajId: z.string().uuid(),
});

export const mesajRouter = router({
  // ─── send — gonderici daima ctx.user; aliciya bildirim olusturulur ─────────
  send: protectedProcedure.input(sendInput).mutation(async ({ ctx, input }) => {
    if (input.receiverId === ctx.user.id) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Kendinize mesaj gonderemezsiniz.",
      });
    }

    const [created] = await ctx.db
      .insert(mesaj)
      .values({
        senderId: ctx.user.id,
        receiverId: input.receiverId,
        content: input.content,
      })
      .returning();

    if (!created) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Mesaj gonderilemedi.",
      });
    }

    // Aliciya yeni mesaj bildirimi (eski route ile ayni davranis).
    await ctx.db.insert(bildirim).values({
      userId: input.receiverId,
      type: "mesaj",
      title: "Yeni Mesaj",
      body: input.content.slice(0, 100),
      actionUrl: "/mesaj",
    });

    return created;
  }),

  // ─── conversation — iki taraf arasindaki mesaj gecmisi (RLS sahiplik) ──────
  conversation: protectedProcedure.input(conversationInput).query(async ({ ctx, input }) => {
    // Sahiplik filtresi RLS'te; burada yalnizca karsi tarafi (is-mantigi) suzeriz:
    // ctx.user ile input.userId arasinda her iki yondeki mesajlar.
    const rows = await ctx.db
      .select()
      .from(mesaj)
      .where(or(eq(mesaj.senderId, input.userId), eq(mesaj.receiverId, input.userId)))
      .orderBy(desc(mesaj.createdAt))
      .limit(input.limit);

    return rows;
  }),

  // ─── list — kullanicinin konusmalari, her karsi taraf icin son mesaj ───────
  list: protectedProcedure.input(listInput).query(async ({ ctx, input }) => {
    // RLS sayesinde yalnizca ctx.user'in taraf oldugu mesajlar gelir.
    const rows = await ctx.db
      .select()
      .from(mesaj)
      .orderBy(desc(mesaj.createdAt))
      .limit(input.limit);

    // Her karsi taraf icin yalnizca en yeni mesaji tut (konusma listesi).
    const seen = new Set<string>();
    const conversations: typeof rows = [];
    for (const m of rows) {
      const otherId = m.senderId === ctx.user.id ? m.receiverId : m.senderId;
      if (seen.has(otherId)) continue;
      seen.add(otherId);
      conversations.push(m);
    }

    // Karsi taraf isimlerini tek sorguda topla (N+1 kacinma).
    const otherIds = [...seen];
    const nameMap = new Map<string, { firstName: string; lastName: string }>();
    if (otherIds.length > 0) {
      const people = await ctx.db
        .select({ id: users.id, firstName: users.firstName, lastName: users.lastName })
        .from(users)
        .where(or(...otherIds.map((id) => eq(users.id, id))));
      for (const p of people) {
        nameMap.set(p.id, { firstName: p.firstName, lastName: p.lastName });
      }
    }

    return conversations.map((m) => {
      const otherId = m.senderId === ctx.user.id ? m.receiverId : m.senderId;
      return {
        ...m,
        otherUserId: otherId,
        otherFirstName: nameMap.get(otherId)?.firstName ?? "",
        otherLastName: nameMap.get(otherId)?.lastName ?? "",
      };
    });
  }),

  // ─── unreadCount — kullaniciya gelen okunmamis mesaj sayisi ────────────────
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    // RLS yalnizca ctx.user'in taraf oldugu satirlari gosterir; is-mantigi
    // olarak yalnizca aliciSI ctx.user olan ve okunmamis mesajlari sayariz.
    const [row] = await ctx.db
      .select({ value: sql<number>`count(*)::int` })
      .from(mesaj)
      .where(and(eq(mesaj.receiverId, ctx.user.id), eq(mesaj.isRead, false)));

    return { count: row?.value ?? 0 };
  }),

  // ─── markRead — tekil mesaji okundu isaretle ───────────────────────────────
  markRead: protectedProcedure.input(markReadInput).mutation(async ({ ctx, input }) => {
    // RLS: gorulemeyen satir sorguya dusmez. Is-mantigi: yalnizca aliciSI
    // ctx.user olan mesaj okundu sayilabilir (gonderen kendi mesajini okumaz).
    const [updated] = await ctx.db
      .update(mesaj)
      .set({ isRead: true, readAt: new Date() })
      .where(and(eq(mesaj.id, input.mesajId), eq(mesaj.receiverId, ctx.user.id)))
      .returning();

    if (!updated) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Mesaj bulunamadi." });
    }

    return updated;
  }),

  // ─── markConversationRead — bir kisiden gelen tum mesajlari okundu yap ──────
  markConversationRead: protectedProcedure
    .input(conversationInput.pick({ userId: true }))
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.db
        .update(mesaj)
        .set({ isRead: true, readAt: new Date() })
        .where(
          and(
            eq(mesaj.senderId, input.userId),
            eq(mesaj.receiverId, ctx.user.id),
            eq(mesaj.isRead, false),
          ),
        )
        .returning({ id: mesaj.id });

      return { updated: updated.length };
    }),
});
