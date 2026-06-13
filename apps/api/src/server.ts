import "dotenv/config";
import { pathToFileURL } from "node:url";
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import { appRouter, type AppRouter } from "@shifahub/trpc";
import { createContext } from "./context";
import { startReminderWorker } from "./workers/reminders.worker";

const PORT = Number(process.env.PORT ?? 4000);
const HOST = process.env.HOST ?? "0.0.0.0";

export async function buildServer() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? "info",
      transport:
        process.env.NODE_ENV === "production"
          ? undefined
          : { target: "pino-pretty", options: { colorize: true } },
    },
    trustProxy: true,
  });

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN?.split(",") ?? true,
    credentials: true,
  });

  app.get("/health", async () => ({ status: "ok", ts: new Date().toISOString() }));

  await app.register(fastifyTRPCPlugin, {
    prefix: "/trpc",
    trpcOptions: {
      router: appRouter,
      createContext,
    },
  });

  return app;
}

const isMain =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  buildServer()
    .then(async (app) => {
      const addr = await app.listen({ port: PORT, host: HOST });
      console.log(`[shifahub-api] listening on ${addr}`);
      // Fire-and-forget: Redis erişilemese bile API ayakta kalır.
      if (process.env.REDIS_URL) {
        startReminderWorker(process.env.REDIS_URL, (m) => app.log.info(m)).catch((e) =>
          app.log.error(`[reminders] başlatılamadı: ${e instanceof Error ? e.message : e}`),
        );
      } else {
        app.log.warn("[reminders] REDIS_URL yok — hatırlatma worker'ı devre dışı");
      }
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

export type { AppRouter };
