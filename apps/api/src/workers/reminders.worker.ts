import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { and, eq, gt, lte, inArray } from "drizzle-orm";
import { db, randevu, bildirim } from "@shifahub/db";

const QUEUE_NAME = "reminders";
const SCAN_EVERY_MS = 10 * 60 * 1000; // her 10 dakikada bir tara

type Log = (msg: string) => void;

/**
 * Yaklaşan randevular için uygulama-içi bildirim üreten BullMQ worker'ı.
 *
 * Bu bir SİSTEM işidir: RLS GUC'ları olmadan, taban `db` (superuser) bağlantısıyla
 * tüm randevuları tarar — danışan/eğitmen kapsamına bakmaz. SMS/e-posta/WhatsApp
 * kanalları anahtar geldiğinde buraya eklenir; şimdilik `bildirim` tablosuna yazar.
 */
export async function startReminderWorker(redisUrl: string, log: Log) {
  const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });
  const queue = new Queue(QUEUE_NAME, { connection });

  // Tekrarlayan tarama — sabit jobId idempotent kılar (her boot'ta çoğalmaz).
  await queue.add(
    "scan",
    {},
    {
      repeat: { every: SCAN_EVERY_MS },
      jobId: "reminder-scan",
      removeOnComplete: true,
      removeOnFail: 20,
    },
  );

  const worker = new Worker(
    QUEUE_NAME,
    async () => {
      const now = new Date();
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const in1h = new Date(now.getTime() + 60 * 60 * 1000);
      const active: ("requested" | "confirmed" | "reminded")[] = [
        "requested",
        "confirmed",
        "reminded",
      ];

      const due24 = await db
        .select()
        .from(randevu)
        .where(
          and(
            eq(randevu.reminder24hSent, false),
            gt(randevu.scheduledAt, now),
            lte(randevu.scheduledAt, in24h),
            inArray(randevu.status, active),
          ),
        );
      for (const r of due24) {
        await db.insert(bildirim).values({
          userId: r.danisanId,
          type: "randevu_hatirlatma",
          title: "Randevu hatırlatması",
          body: `${r.treatmentType ?? "Randevu"} randevunuz 24 saat içinde.`,
          actionUrl: "/danisan/randevu",
        });
        await db.update(randevu).set({ reminder24hSent: true }).where(eq(randevu.id, r.id));
      }

      const due1 = await db
        .select()
        .from(randevu)
        .where(
          and(
            eq(randevu.reminder1hSent, false),
            gt(randevu.scheduledAt, now),
            lte(randevu.scheduledAt, in1h),
            inArray(randevu.status, active),
          ),
        );
      for (const r of due1) {
        await db.insert(bildirim).values({
          userId: r.danisanId,
          type: "randevu_hatirlatma",
          title: "Randevunuz yaklaşıyor",
          body: `${r.treatmentType ?? "Randevu"} randevunuza 1 saatten az kaldı.`,
          actionUrl: "/danisan/randevu",
        });
        await db.update(randevu).set({ reminder1hSent: true }).where(eq(randevu.id, r.id));
      }

      log(`[reminders] tarama: 24h=${due24.length} 1h=${due1.length} bildirim üretildi`);
      return { reminded24h: due24.length, reminded1h: due1.length };
    },
    { connection },
  );

  worker.on("failed", (_job, err) => log(`[reminders] iş başarısız: ${err.message}`));
  log("[reminders] worker başlatıldı (10 dk tarama aralığı)");
  return { queue, worker, connection };
}
