/**
 * OpenRouter chat client (ücretsiz modeller) — fallback routing'li.
 *
 * Bir model yanıt vermezse (HTTP hatası, zaman aşımı, boş yanıt veya — JSON
 * modunda — geçersiz JSON) sıradaki modele otomatik geçer. Anahtar + zincir
 * env'den gelir (OPENROUTER_API_KEY / OPENROUTER_MODELS / OPENROUTER_MODEL).
 */
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Öncelik sırası: hızlı + kaliteli + Türkçe-güçlü önce, dayanıklı yedekler sonra.
 * Hepsi ücretsiz ve son 2 ay (zamanlı test edildi). İlk başarılı yanıt kazanır.
 */
const DEFAULT_MODELS = [
  "nex-agi/nex-n2-pro:free", // ~2 sn, Türkçe + temiz JSON
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", // ~2-3 sn yedek (chat)
  "openrouter/owl-alpha", // son çare
];

/** Pozitif tamsayı env okur; geçersiz/boş ise varsayılana düşer (NaN→0 tuzağını önler). */
function envInt(name: string, fallback: number): number {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

/** Tek model denemesi için zaman aşımı (ms). */
const ATTEMPT_TIMEOUT_MS = envInt("OPENROUTER_TIMEOUT_MS", 25000);
/** Tüm zincir için toplam duvar-saati sınırı (ms) — istemciyi/proxy'yi kilitlemeyi önler. */
const TOTAL_TIMEOUT_MS = envInt("OPENROUTER_TOTAL_TIMEOUT_MS", 40000);

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatOpts {
  maxTokens?: number;
  temperature?: number;
  /** JSON modu: yanıt JSON.parse ile doğrulanır; geçersizse model elenir. */
  json?: boolean;
  /** Bu çağrı için model zincirini geçersiz kıl (örn. JSON için güvenilir alt küme). */
  models?: string[];
}

/** OpenRouter 429 (hesap geneli ücretsiz limit) — zinciri kısa devre yapmak için ayrı tip. */
class RateLimitError extends Error {}

function dedupe(list: string[]): string[] {
  return [...new Set(list.map((m) => m.trim()).filter(Boolean))];
}

/** ```json ... ``` çitlerini temizler. */
function stripJsonFences(s: string): string {
  return s
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

/**
 * Çağrılacak model zinciri.
 * Öncelik: opts.models > OPENROUTER_MODELS (virgüllü) > OPENROUTER_MODEL (tekil,
 * varsayılanların başına) > yalnız varsayılanlar. Hepsi sırayı koruyarak tekilleştirilir.
 */
function modelChain(override?: string[]): string[] {
  if (override && override.length > 0) return dedupe(override);

  const multi = process.env.OPENROUTER_MODELS?.split(",");
  if (multi && multi.length > 0) {
    const cleaned = dedupe(multi);
    if (cleaned.length > 0) return cleaned;
  }

  const single = process.env.OPENROUTER_MODEL?.trim();
  if (single) return dedupe([single, ...DEFAULT_MODELS]);

  return [...DEFAULT_MODELS];
}

/**
 * Tek modele istek atar; başarısızsa (HTTP/timeout/boş/geçersiz-JSON) hata fırlatır.
 * 429'da RateLimitError fırlatır. `budgetMs` toplam süre bütçesini sınırlar.
 */
async function callModel(
  key: string,
  model: string,
  messages: ChatMessage[],
  opts: ChatOpts | undefined,
  budgetMs: number,
): Promise<string> {
  const controller = new AbortController();
  const timeout = Math.max(1, Math.min(ATTEMPT_TIMEOUT_MS, budgetMs));
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://shifahub.com.tr",
        "X-Title": "ShifaHub",
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: opts?.maxTokens ?? 800,
        temperature: opts?.temperature ?? 0.4,
      }),
    });

    if (res.status === 429) throw new RateLimitError("rate limit (429)");
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`HTTP ${res.status}: ${t.slice(0, 160)}`);
    }

    const data = (await res.json()) as {
      choices?: {
        message?: { content?: string; reasoning_content?: string; reasoning?: string };
      }[];
    };
    // Reasoning modelleri yanıtı reasoning_content/reasoning alanına koyabilir.
    const m = data.choices?.[0]?.message;
    const content = (m?.content ?? m?.reasoning_content ?? m?.reasoning ?? "").trim();
    if (!content) throw new Error("boş yanıt");

    if (opts?.json) {
      const stripped = stripJsonFences(content);
      JSON.parse(stripped); // geçersiz JSON → fırlatır → zincirde ilerle
      return stripped;
    }
    return content;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Mesajları model zincirinden geçirir. İlk başarılı yanıtı döndürür; her
 * başarısızlıkta sonraki modele geçer. Toplam süre aşılırsa veya 429 görülürse
 * durur. Hepsi başarısızsa, ayrıntıyı SADECE sunucu loglarına yazıp istemciye
 * genel bir mesaj fırlatır (upstream gövdesi/anahtar asla istemciye sızmaz).
 */
export async function chat(messages: ChatMessage[], opts?: ChatOpts): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    console.error("[kulliyat-ai] OPENROUTER_API_KEY tanımlı değil.");
    throw new Error("Külliyat asistanı şu an yapılandırılmamış.");
  }

  const chain = modelChain(opts?.models);
  const errors: string[] = [];
  const deadline = Date.now() + TOTAL_TIMEOUT_MS;

  for (const model of chain) {
    const budget = deadline - Date.now();
    if (budget <= 0) {
      errors.push("toplam süre aşıldı");
      break;
    }
    try {
      return await callModel(key, model, messages, opts, budget);
    } catch (e) {
      if (e instanceof RateLimitError) {
        // Tüm ücretsiz modeller aynı hesap limitine tabi — hepsini yormak anlamsız.
        errors.push(`${model} → 429`);
        console.warn(`[kulliyat-ai] ${model} rate-limit (429) — zincir kısa devre`);
        break;
      }
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`${model} → ${msg}`);
      // Anahtarı ASLA loglama; sadece model + neden.
      console.warn(`[kulliyat-ai] ${model} başarısız, yedeğe geçiliyor — ${msg}`);
    }
  }

  console.warn(`[kulliyat-ai] tüm modeller başarısız: ${errors.join(" | ")}`);
  throw new Error("Külliyat asistanı şu an yanıt veremiyor, lütfen biraz sonra tekrar deneyin.");
}
