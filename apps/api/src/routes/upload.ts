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

    let buffer = await data.toBuffer();

    // KVKK uyumluluk: EXIF metadata temizleme
    // Gorsel dosyalardan (JPEG/PNG) EXIF verilerini cikararak konum, cihaz bilgisi vb.
    // kisisel verilerin saklanmasini engelle.
    // JPEG dosyalarda EXIF segmentlerini (APP1/0xFFE1) silerek temizleme yapilir.
    // PNG dosyalarda tEXt/iTXt/zTXt chunk'lari atlanir.
    const imageExts = ["jpg", "jpeg", "png"];
    if (imageExts.includes(ext.toLowerCase())) {
      buffer = stripExifData(buffer, ext.toLowerCase());
    }

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
  app.get<{ Params: { userId: string; fileName: string } }>("/api/upload/files/:userId/:fileName", async (request, reply) => {
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

/**
 * KVKK uyumluluk: EXIF metadata temizleme
 * JPEG dosyalardan APP1 (EXIF) segmentlerini siler.
 * PNG dosyalardan tEXt, iTXt, zTXt metadata chunk'larini siler.
 * Bu sayede konum bilgisi, cihaz modeli, tarih vb. kisisel veriler
 * yuklenen gorsellerde saklanmaz.
 */
function stripExifData(buffer: Buffer, ext: string): Buffer {
  try {
    if (ext === "jpg" || ext === "jpeg") {
      return stripJpegExif(buffer);
    }
    if (ext === "png") {
      return stripPngMetadata(buffer);
    }
  } catch {
    // EXIF temizleme basarisiz olursa orijinal buffer'i dondur
  }
  return buffer;
}

function stripJpegExif(buffer: Buffer): Buffer {
  // JPEG dosya SOI (0xFFD8) ile baslamali
  if (buffer.length < 2 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return buffer;
  }

  const result: Buffer[] = [Buffer.from([0xff, 0xd8])];
  let offset = 2;

  while (offset < buffer.length - 1) {
    if (buffer[offset] !== 0xff) break;

    const marker = buffer[offset + 1]!;

    // SOS (Start of Scan) - bundan sonra gorsel data baslar, kopyala
    if (marker === 0xda) {
      result.push(buffer.subarray(offset));
      break;
    }

    // EOI marker
    if (marker === 0xd9) {
      result.push(Buffer.from([0xff, 0xd9]));
      break;
    }

    // Segment uzunlugunu oku
    if (offset + 3 >= buffer.length) break;
    const segLength = buffer.readUInt16BE(offset + 2);

    // APP1 (0xFFE1 = EXIF) segmentini atla, digerlerini kopyala
    if (marker === 0xe1) {
      offset += 2 + segLength;
      continue;
    }

    result.push(buffer.subarray(offset, offset + 2 + segLength));
    offset += 2 + segLength;
  }

  return Buffer.concat(result);
}

function stripPngMetadata(buffer: Buffer): Buffer {
  // PNG signature (8 byte)
  if (buffer.length < 8) return buffer;

  const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (!buffer.subarray(0, 8).equals(PNG_SIG)) return buffer;

  const result: Buffer[] = [PNG_SIG];
  let offset = 8;

  // Metadata chunk tipleri - bunlari atla
  const metaChunks = ["tEXt", "iTXt", "zTXt", "eXIf"];

  while (offset + 8 <= buffer.length) {
    const chunkLength = buffer.readUInt32BE(offset);
    const chunkType = buffer.subarray(offset + 4, offset + 8).toString("ascii");
    const totalChunkSize = 4 + 4 + chunkLength + 4; // length + type + data + crc

    if (offset + totalChunkSize > buffer.length) break;

    // Metadata chunk'larini atla
    if (!metaChunks.includes(chunkType)) {
      result.push(buffer.subarray(offset, offset + totalChunkSize));
    }

    offset += totalChunkSize;

    // IEND chunk'tan sonra dur
    if (chunkType === "IEND") break;
  }

  return Buffer.concat(result);
}
