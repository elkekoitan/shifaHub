import type { FastifyInstance, FastifyRequest } from "fastify";
import multipart from "@fastify/multipart";
import { verifyAccessToken, type AuthUser } from "@shifahub/trpc";
import { putObject, getObject, listObjects, storageConfigured } from "../lib/storage";

const MAX_FILE = 15 * 1024 * 1024; // 15 MB

async function authUser(req: FastifyRequest): Promise<AuthUser | null> {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return null;
  try {
    return await verifyAccessToken(h.slice(7));
  } catch {
    return null;
  }
}

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "dosya";
}

/**
 * Dosya yükleme/listeleme/indirme — tamamı api üzerinden proxy'lenir ve JWT ile
 * korunur. Nesneler kullanıcı önekine yazılır (`uploads/<userId>/…`); kullanıcı
 * yalnızca kendi dosyalarına erişir.
 */
export async function uploadRoutes(app: FastifyInstance): Promise<void> {
  await app.register(multipart, { limits: { fileSize: MAX_FILE } });

  app.post("/upload", async (req, reply) => {
    if (!storageConfigured()) return reply.code(503).send({ error: "Depolama yapılandırılmamış." });
    const user = await authUser(req);
    if (!user) return reply.code(401).send({ error: "Yetkisiz." });

    const data = await req.file();
    if (!data) return reply.code(400).send({ error: "Dosya bulunamadı." });
    const buffer = await data.toBuffer();
    const key = `uploads/${user.id}/${Date.now()}__${sanitize(data.filename)}`;
    await putObject(key, buffer, data.mimetype || "application/octet-stream");
    return reply.send({ key, name: data.filename, size: buffer.length });
  });

  app.get("/uploads", async (req, reply) => {
    if (!storageConfigured()) return reply.send({ files: [] });
    const user = await authUser(req);
    if (!user) return reply.code(401).send({ error: "Yetkisiz." });
    try {
      const files = await listObjects(`uploads/${user.id}/`);
      files.sort((a, b) => b.lastModified.localeCompare(a.lastModified));
      return reply.send({ files });
    } catch (e) {
      // Depolama geçici erişilemezse boş liste (sayfa hata vermez).
      req.log.warn(`[upload] liste başarısız: ${e instanceof Error ? e.message : e}`);
      return reply.send({ files: [] });
    }
  });

  app.get("/uploads/file", async (req, reply) => {
    const user = await authUser(req);
    if (!user) return reply.code(401).send({ error: "Yetkisiz." });
    const key = (req.query as { key?: string }).key;
    if (!key || !key.startsWith(`uploads/${user.id}/`)) {
      return reply.code(403).send({ error: "Erişim yok." });
    }
    try {
      const { stream, contentType, size } = await getObject(key);
      const tail = key.split("/").pop() ?? "dosya";
      const name = tail.includes("__") ? tail.slice(tail.indexOf("__") + 2) : tail;
      reply.header("Content-Type", contentType);
      reply.header("Content-Length", String(size));
      reply.header("Content-Disposition", `inline; filename="${name}"`);
      return reply.send(stream);
    } catch {
      return reply.code(404).send({ error: "Dosya bulunamadı." });
    }
  });
}
