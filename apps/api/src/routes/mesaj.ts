import type { FastifyInstance } from "fastify";
import { eq, or, and, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { mesaj } from "../db/schema/mesaj.js";
import { bildirim } from "../db/schema/bildirim.js";
import { requireAuth, getUser } from "../middleware/auth.js";

export async function mesajRoutes(app: FastifyInstance) {
  // POST /api/mesaj - Mesaj gonder
  app.post("/api/mesaj", { preHandler: requireAuth() }, async (request, reply) => {
    const { sub } = getUser(request);
    const { receiverId, content } = request.body as { receiverId: string; content: string };

    const [created] = await db
      .insert(mesaj)
      .values({ senderId: sub, receiverId, content })
      .returning();

    // Bildirim olustur
    await db.insert(bildirim).values({
      userId: receiverId,
      type: "mesaj",
      title: "Yeni Mesaj",
      body: content.substring(0, 100),
      actionUrl: `/mesaj`,
    });

    return reply.status(201).send({ success: true, data: created });
  });

  // GET /api/mesaj/:userId - Konusma gecmisi
  app.get("/api/mesaj/:userId", { preHandler: requireAuth() }, async (request, reply) => {
    const { sub } = getUser(request);
    const { userId } = request.params as { userId: string };

    const messages = await db
      .select()
      .from(mesaj)
      .where(
        or(
          and(eq(mesaj.senderId, sub), eq(mesaj.receiverId, userId)),
          and(eq(mesaj.senderId, userId), eq(mesaj.receiverId, sub)),
        ),
      )
      .orderBy(desc(mesaj.createdAt))
      .limit(50);

    return reply.send({ success: true, data: messages });
  });

  // GET /api/bildirim - Bildirimler
  app.get("/api/bildirim", { preHandler: requireAuth() }, async (request, reply) => {
    const { sub } = getUser(request);

    const notifications = await db
      .select()
      .from(bildirim)
      .where(eq(bildirim.userId, sub))
      .orderBy(desc(bildirim.createdAt))
      .limit(20);

    return reply.send({ success: true, data: notifications });
  });

  // PATCH /api/bildirim/:id/read - Bildirimi okundu isaretle
  app.patch("/api/bildirim/:id/read", { preHandler: requireAuth() }, async (request, reply) => {
    const { id } = request.params as { id: string };

    await db
      .update(bildirim)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(bildirim.id, id));

    return reply.send({ success: true });
  });
}
