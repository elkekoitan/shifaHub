import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { loggerConfig } from "./lib/logger.js";
import { authRoutes } from "./routes/auth.js";
import { danisanRoutes } from "./routes/danisan.js";
import { adminRoutes } from "./routes/admin.js";
import { mfaRoutes } from "./routes/mfa.js";
import { emailVerifyRoutes } from "./routes/email-verify.js";
import { egitmenRoutes } from "./routes/egitmen.js";
import { randevuRoutes } from "./routes/randevu.js";
import { tedaviRoutes } from "./routes/tedavi.js";
import { mesajRoutes } from "./routes/mesaj.js";
import { stokRoutes } from "./routes/stok.js";
import { odemeRoutes } from "./routes/odeme.js";
import { acilRoutes } from "./routes/acil.js";
import { protokolRoutes } from "./routes/protokol.js";
import { uploadRoutes } from "./routes/upload.js";

const app = Fastify({
  logger: loggerConfig,
});

// Plugins
await app.register(cors, {
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
});

await app.register(helmet);

await app.register(rateLimit, {
  max: 100,
  timeWindow: "1 minute",
});

// Routes
await app.register(authRoutes);
await app.register(danisanRoutes);
await app.register(adminRoutes);
await app.register(mfaRoutes);
await app.register(emailVerifyRoutes);
await app.register(egitmenRoutes);
await app.register(randevuRoutes);
await app.register(tedaviRoutes);
await app.register(mesajRoutes);
await app.register(stokRoutes);
await app.register(odemeRoutes);
await app.register(acilRoutes);
await app.register(protokolRoutes);
await app.register(uploadRoutes);

// Health check
app.get("/health", async () => ({
  status: "ok",
  service: "shifahub-api",
  timestamp: new Date().toISOString(),
  version: process.env.npm_package_version || "0.0.1",
}));

// Start server
const PORT = Number(process.env.PORT) || 4000;
const HOST = process.env.HOST || "0.0.0.0";

try {
  await app.listen({ port: PORT, host: HOST });
  app.log.info(`ShifaHub API running at http://${HOST}:${PORT}`);

  // T-028: Randevu hatirlati cron (5 dakikada bir)
  setInterval(async () => {
    try {
      const { db: cronDb } = await import("./db/index.js");
      const { randevu: randevuTable } = await import("./db/schema/randevu.js");
      const { bildirim: bildirimTable } = await import("./db/schema/bildirim.js");
      const { eq, and, gte, lte } = await import("drizzle-orm");

      const now = new Date();
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const in1h = new Date(now.getTime() + 60 * 60 * 1000);

      // 24h hatirlati
      const upcoming24h = await cronDb.select().from(randevuTable)
        .where(and(
          gte(randevuTable.scheduledAt, now),
          lte(randevuTable.scheduledAt, in24h),
          eq(randevuTable.reminder24hSent, "false"),
        ));

      for (const r of upcoming24h) {
        await cronDb.insert(bildirimTable).values({
          userId: r.danisanId,
          type: "randevu_hatirlatma",
          title: "Randevu Hatirlatma (24 saat)",
          body: `Yarinki randevunuzu unutmayin: ${new Date(r.scheduledAt).toLocaleString("tr-TR")}`,
          actionUrl: "/danisan/randevu",
        });
        await cronDb.update(randevuTable).set({ reminder24hSent: "true" }).where(eq(randevuTable.id, r.id));
      }

      // 1h hatirlati
      const upcoming1h = await cronDb.select().from(randevuTable)
        .where(and(
          gte(randevuTable.scheduledAt, now),
          lte(randevuTable.scheduledAt, in1h),
          eq(randevuTable.reminder1hSent, "false"),
        ));

      for (const r of upcoming1h) {
        await cronDb.insert(bildirimTable).values({
          userId: r.danisanId,
          type: "randevu_hatirlatma",
          title: "Randevu Hatirlatma (1 saat)",
          body: `Randevunuz 1 saat icinde: ${new Date(r.scheduledAt).toLocaleString("tr-TR")}`,
          actionUrl: "/danisan/randevu",
        });
        await cronDb.update(randevuTable).set({ reminder1hSent: "true" }).where(eq(randevuTable.id, r.id));
      }

      if (upcoming24h.length > 0 || upcoming1h.length > 0) {
        app.log.info(`Hatirlatma: ${upcoming24h.length} (24h) + ${upcoming1h.length} (1h) gonderildi`);
      }
    } catch (err) {
      app.log.error(err, "Hatirlatma cron hatasi");
    }
  }, 5 * 60 * 1000); // 5 dakikada bir

} catch (err) {
  app.log.error(err);
  process.exit(1);
}
