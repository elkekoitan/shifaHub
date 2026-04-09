// Fastify global error handler — AppError'lari yakalar, diger hatalari 500 olarak dondurur

import type { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from "fastify";
import { AppError } from "./errors.js";
import { ZodError } from "zod";

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler(
    (
      error: FastifyError | AppError | ZodError | Error,
      request: FastifyRequest,
      reply: FastifyReply,
    ) => {
      // AppError — bilinçli is hatasi
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
          success: false,
          error: error.message,
          code: error.code,
          ...(error.details ? { details: error.details } : {}),
        });
      }

      // ZodError — validasyon hatasi
      if (error instanceof ZodError) {
        const messages = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
        return reply.status(400).send({
          success: false,
          error: "Gecersiz veri formati",
          code: "VALIDATION_ERROR",
          details: messages,
        });
      }

      // Fastify hatasi (rate limit, schema validation vb.)
      if ("statusCode" in error && typeof error.statusCode === "number") {
        return reply.status(error.statusCode).send({
          success: false,
          error: error.message,
          code: "FASTIFY_ERROR",
        });
      }

      // Bilinmeyen hata — 500
      app.log.error(error, "Beklenmeyen hata");
      return reply.status(500).send({
        success: false,
        error: "Sunucu hatasi olustu",
        code: "INTERNAL_ERROR",
      });
    },
  );
}
