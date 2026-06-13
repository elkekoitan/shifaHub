import "dotenv/config";
import { pathToFileURL } from "node:url";
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import { appRouter, type AppRouter } from "@shifahub/trpc";
import { createContext } from "./context";

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
    .then((app) => app.listen({ port: PORT, host: HOST }))
    .then((addr) => console.log(`[shifahub-api] listening on ${addr}`))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

export type { AppRouter };
