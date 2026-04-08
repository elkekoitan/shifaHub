import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { logger } from "./lib/logger.js";
import { authRoutes } from "./routes/auth.js";
import { danisanRoutes } from "./routes/danisan.js";
import { adminRoutes } from "./routes/admin.js";
import { mfaRoutes } from "./routes/mfa.js";
import { emailVerifyRoutes } from "./routes/email-verify.js";
import { egitmenRoutes } from "./routes/egitmen.js";
import { randevuRoutes } from "./routes/randevu.js";

const app = Fastify({
  logger: logger,
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
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
