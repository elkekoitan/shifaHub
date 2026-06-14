import { Bot } from "grammy";
import { eq } from "drizzle-orm";
import { db, users } from "@shifahub/db";

/**
 * Telegram bot — danışan bildirimleri (randevu hatırlatma vb.). Danışan, uygulamadaki
 * "Telegram'a bağla" derin-bağlantısı (`t.me/<bot>?start=<userId>`) ile `/start` gönderir;
 * bot sohbet kimliğini (`telegram_chat_id`) kaydeder. Bildirimler bu kimliğe iletilir.
 * Yapılandırma env'den (TELEGRAM_BOT_TOKEN). Token yoksa pasiftir.
 */
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
let bot: Bot | null = null;

export function telegramConfigured(): boolean {
  return Boolean(TOKEN);
}

/** Bağlı bir danışana Telegram mesajı gönderir. Pasif/başarısızsa false döner. */
export async function sendTelegram(chatId: string, text: string): Promise<boolean> {
  if (!bot) return false;
  try {
    await bot.api.sendMessage(chatId, text);
    return true;
  } catch (e) {
    console.warn(`[telegram] gönderim hatası: ${e instanceof Error ? e.message : e}`);
    return false;
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Long-polling bot'u başlatır + `/start` bağlama akışını kurar. */
export async function startTelegramBot(log: (msg: string) => void): Promise<void> {
  if (!TOKEN) return;
  bot = new Bot(TOKEN);

  bot.command("start", async (ctx) => {
    const payload = (ctx.match || "").trim();
    const chatId = String(ctx.chat.id);

    if (!UUID_RE.test(payload)) {
      await ctx.reply(
        "ShifaHub'a hoş geldiniz 🌿\nHesabınızı bağlamak için uygulamadaki profil sayfanızdan \"Telegram'a bağla\" bağlantısını kullanın.",
      );
      return;
    }

    // Sistem işlemi: base db (superuser, RLS yok) ile danışanı doğrula + bağla.
    const [u] = await db
      .select({ id: users.id, role: users.role, firstName: users.firstName })
      .from(users)
      .where(eq(users.id, payload))
      .limit(1);

    if (!u || u.role !== "danisan") {
      await ctx.reply("Geçersiz veya süresi dolmuş bağlantı. Lütfen uygulamadan tekrar deneyin.");
      return;
    }

    await db.update(users).set({ telegramChatId: chatId }).where(eq(users.id, u.id));
    await ctx.reply(
      `Merhaba ${u.firstName}! ShifaHub hesabınız Telegram'a bağlandı ✅\nRandevu hatırlatmalarınız artık buradan da gelecek.`,
    );
  });

  bot.catch((err) => log(`[telegram] bot hatası: ${err.message}`));
  // Bloklamayan başlatma (fire-and-forget); long-polling arka planda döner.
  void bot.start({ onStart: () => log("[telegram] bot başlatıldı (long-polling)") });
}
