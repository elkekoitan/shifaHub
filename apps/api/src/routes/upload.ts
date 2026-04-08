import type { FastifyInstance } from "fastify";
import multipart from "@fastify/multipart";
import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { requireAuth, getUser } from "../middleware/auth.js";
import { createAuditLog } from "../middleware/audit.js";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "/tmp/shifahub-uploads";

export async function uploadRoutes(app: FastifyInstance) {
  await app.register(multipart, { limits: { fileSize: 100 * 1024 * 1024 } }); // 100MB max

  // POST /api/upload - Dosya yukle
  app.post("/api/upload", { preHandler: requireAuth() }, async (request, reply) => {
    const { sub } = getUser(request);

    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ success: false, error: "Dosya bulunamadi" });
    }

    const ext = data.filename.split(".").pop() || "bin";
    const allowedExts = ["jpg", "jpeg", "png", "gif", "webp", "heif", "pdf", "docx", "mp3", "wav", "m4a", "ogg", "mp4", "webm"];
    if (!allowedExts.includes(ext.toLowerCase())) {
      return reply.status(400).send({ success: false, error: `Desteklenmeyen dosya formati: .${ext}` });
    }

    const fileId = randomUUID();
    const fileName = `${fileId}.${ext}`;
    const userDir = join(UPLOAD_DIR, sub);

    await mkdir(userDir, { recursive: true });

    const buffer = await data.toBuffer();
    const filePath = join(userDir, fileName);
    await writeFile(filePath, buffer);

    const fileUrl = `/api/upload/files/${sub}/${fileName}`;

    await createAuditLog({
      userId: sub,
      action: "create",
      tableName: "upload",
      recordId: fileId,
      description: `Dosya yuklendi: ${data.filename} (${(buffer.length / 1024).toFixed(1)} KB)`,
      request,
    });

    return reply.send({
      success: true,
      data: {
        id: fileId,
        fileName: data.filename,
        fileUrl,
        size: buffer.length,
        mimeType: data.mimetype,
      },
    });
  });

  // GET /api/upload/files/:userId/:fileName - Dosya getir
  app.get("/api/upload/files/:userId/:fileName", async (request, reply) => {
    const { userId, fileName } = request.params as { userId: string; fileName: string };
    const filePath = join(UPLOAD_DIR, userId, fileName);

    try {
      const { createReadStream } = await import("fs");
      const stream = createReadStream(filePath);
      const ext = fileName.split(".").pop() || "";
      const mimeTypes: Record<string, string> = {
        jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif",
        webp: "image/webp", pdf: "application/pdf", mp3: "audio/mpeg",
        wav: "audio/wav", mp4: "video/mp4", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      };
      reply.header("Content-Type", mimeTypes[ext] || "application/octet-stream");
      return reply.send(stream);
    } catch {
      return reply.status(404).send({ success: false, error: "Dosya bulunamadi" });
    }
  });
}
