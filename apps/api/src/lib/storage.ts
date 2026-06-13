import { Client } from "minio";
import type { Readable } from "node:stream";

/**
 * MinIO (S3-uyumlu) nesne deposu. api ↔ MinIO bağlantısı sunucu-taraflıdır
 * (http:9000). Yüklemeler/indirmeler api üzerinden proxy'lenir; tarayıcı asla
 * MinIO'ya doğrudan bağlanmaz (mixed-content + presigned-imza sorunlarından kaçınılır).
 */
const BUCKET = process.env.MINIO_BUCKET ?? "shifahub";

let _client: Client | null = null;
let _bucketReady = false;

export function storageConfigured(): boolean {
  return Boolean(process.env.MINIO_ENDPOINT && process.env.MINIO_ACCESS_KEY);
}

function client(): Client {
  if (_client) return _client;
  const endPoint = process.env.MINIO_ENDPOINT;
  if (!endPoint) throw new Error("MINIO_ENDPOINT tanımlı değil.");
  _client = new Client({
    endPoint,
    port: Number(process.env.MINIO_PORT ?? 9000),
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey: process.env.MINIO_ACCESS_KEY ?? "",
    secretKey: process.env.MINIO_SECRET_KEY ?? "",
  });
  return _client;
}

async function ensureBucket(): Promise<void> {
  if (_bucketReady) return;
  const c = client();
  if (!(await c.bucketExists(BUCKET).catch(() => false))) {
    await c.makeBucket(BUCKET);
  }
  _bucketReady = true;
}

export async function putObject(key: string, body: Buffer, contentType: string): Promise<void> {
  await ensureBucket();
  await client().putObject(BUCKET, key, body, body.length, { "Content-Type": contentType });
}

export async function getObject(
  key: string,
): Promise<{ stream: Readable; contentType: string; size: number }> {
  await ensureBucket();
  const c = client();
  const stat = await c.statObject(BUCKET, key);
  const stream = await c.getObject(BUCKET, key);
  return {
    stream,
    contentType: stat.metaData?.["content-type"] ?? "application/octet-stream",
    size: stat.size,
  };
}

export interface StoredObject {
  key: string;
  name: string;
  size: number;
  lastModified: string;
}

/** Bir önek altındaki nesneleri listeler (örn. `uploads/<userId>/`). */
export async function listObjects(prefix: string): Promise<StoredObject[]> {
  await ensureBucket();
  const c = client();
  return new Promise((resolve, reject) => {
    const out: StoredObject[] = [];
    const stream = c.listObjectsV2(BUCKET, prefix, true);
    stream.on("data", (o) => {
      if (!o.name) return;
      // Anahtar: uploads/<userId>/<ts>__<dosyaadi> → görünen ad: <dosyaadi>
      const tail = o.name.split("/").pop() ?? o.name;
      const name = tail.includes("__") ? tail.slice(tail.indexOf("__") + 2) : tail;
      out.push({
        key: o.name,
        name,
        size: o.size ?? 0,
        lastModified: (o.lastModified ?? new Date(0)).toISOString(),
      });
    });
    stream.on("error", reject);
    stream.on("end", () => resolve(out));
  });
}
