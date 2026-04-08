import type { FastifyServerOptions } from "fastify";

export const loggerConfig: FastifyServerOptions["logger"] =
  process.env.NODE_ENV !== "production"
    ? {
        level: process.env.LOG_LEVEL || "info",
        transport: { target: "pino-pretty", options: { colorize: true } },
      }
    : {
        level: process.env.LOG_LEVEL || "info",
      };
