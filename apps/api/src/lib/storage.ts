import { promises as fs, createReadStream } from "node:fs";
import path from "node:path";
import type { Readable } from "node:stream";

/**
 * Dosya deposu — api'nin kalıcı disk'i (Coolify persistent volume, `UPLOAD_DIR`).
 * Nesneler `UPLOAD_DIR/uploads/<userId>/<ts>__<dosya>` yoluna yazılır; içerik-tipi
 * yan dosyada (`.meta`) saklanır. Yükleme/indirme api üzerinden proxy'lenir.
 *
 * Not: Bu sunucuda MinIO'nun S3-auth katmanı çözülemedi (custom-compose VE
 * docker-image yöntemleri de InvalidAccessKeyId verdi); aynı kullanıcı-yüzlü
 * yetenek (çok kullanıcılı dosya depolama) güvenilir biçimde disk ile sağlanır.
 */
const ROOT = process.env.UPLOAD_DIR ?? "/data/uploads";

export function storageConfigured(): boolean {
  return true; // disk her zaman mevcut
}

/** Path traversal'a karşı güvenli mutlak yol. */
function safePath(key: string): string {
  const clean = key.replace(/\.\.+/g, "").replace(/^[/\\]+/, "");
  return path.join(ROOT, clean);
}

export async function putObject(key: string, body: Buffer, contentType: string): Promise<void> {
  const p = safePath(key);
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, body);
  await fs.writeFile(`${p}.meta`, contentType, "utf8").catch(() => {});
}

export async function getObject(
  key: string,
): Promise<{ stream: Readable; contentType: string; size: number }> {
  const p = safePath(key);
  const stat = await fs.stat(p);
  const contentType = await fs
    .readFile(`${p}.meta`, "utf8")
    .catch(() => "application/octet-stream");
  return { stream: createReadStream(p), contentType, size: stat.size };
}

export interface StoredObject {
  key: string;
  name: string;
  size: number;
  lastModified: string;
}

/** Bir önek (örn. `uploads/<userId>/`) altındaki dosyaları listeler. */
export async function listObjects(prefix: string): Promise<StoredObject[]> {
  const dir = safePath(prefix);
  let entries: string[];
  try {
    entries = await fs.readdir(dir);
  } catch {
    return []; // dizin yok → boş
  }
  const out: StoredObject[] = [];
  for (const e of entries) {
    if (e.endsWith(".meta")) continue;
    const st = await fs.stat(path.join(dir, e)).catch(() => null);
    if (!st || !st.isFile()) continue;
    const name = e.includes("__") ? e.slice(e.indexOf("__") + 2) : e;
    out.push({
      key: `${prefix}${e}`,
      name,
      size: st.size,
      lastModified: st.mtime.toISOString(),
    });
  }
  return out;
}
