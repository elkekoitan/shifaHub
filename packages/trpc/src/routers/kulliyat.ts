import { z } from "zod";
import { protectedProcedure, egitmenProcedure, router } from "../trpc";
import { chat } from "../lib/ai";

/**
 * Külliyat — GETAT bilgi asistanı (OpenRouter, ücretsiz model). Tıbbi teşhis
 * koymaz; bilgilendirir ve uzman eğitmene yönlendirir. Terminoloji: ASLA
 * doktor/hasta; eğitmen/danışan.
 */
const GETAT_SYSTEM = `Sen ShifaHub'ın Külliyat asistanısın — GETAT (Geleneksel ve Tamamlayıcı Tıp) alanında uzman, Kur'an ve sünnet kaynaklarına saygılı, modern araştırmaları da dikkate alan bir danışmansın.
Kurallar:
- ASLA "doktor"/"hasta" deme; "eğitmen"/"uygulama uzmanı" ve "danışan" kullan.
- Hacamat (kuru/yaş), sülük (hirudoterapi), sujok, refleksoloji, fitoterapi gibi yöntemlerde bilgi ver.
- Hacamat sünnet günleri: Hicri ayın 17, 19 ve 21. günleri.
- Tıbbi TEŞHİS KOYMA, ilaç/doz önerme; bilgilendirici ol, gerektiğinde uzman bir eğitmene yönlendir.
- Acil/ciddi belirtilerde mutlaka hekime/sağlık kuruluşuna başvurmayı öner.
- Kısa, net, anlaşılır Türkçe yanıt ver.`;

export const kulliyatRouter = router({
  /** Danışan/eğitmen GETAT sorusu sorar. */
  ask: protectedProcedure
    .input(z.object({ question: z.string().trim().min(3).max(1000) }))
    .mutation(async ({ input }) => {
      const answer = await chat(
        [
          { role: "system", content: GETAT_SYSTEM },
          { role: "user", content: input.question },
        ],
        { maxTokens: 700 },
      );
      return { answer };
    }),

  /** Anamnez/şikayet metninden yapısal çıkarım (NER) — eğitmen. */
  analyzeComplaints: egitmenProcedure
    .input(z.object({ text: z.string().trim().min(3).max(2000) }))
    .mutation(async ({ input }) => {
      const raw = await chat(
        [
          {
            role: "system",
            content:
              'Aşağıdaki danışan anamnezinden yapısal veri çıkar. SADECE geçerli JSON döndür, başka metin YOK. Şema: {"sikayetler":string[],"kronikHastaliklar":string[],"alerjiler":string[],"ilaclar":string[],"onerilenYontemler":string[]}. ' +
              GETAT_SYSTEM,
          },
          { role: "user", content: input.text },
        ],
        { maxTokens: 600, temperature: 0.2 },
      );
      const json = raw.replace(/```json\n?|```/g, "").trim();
      try {
        return JSON.parse(json) as {
          sikayetler: string[];
          kronikHastaliklar: string[];
          alerjiler: string[];
          ilaclar: string[];
          onerilenYontemler: string[];
        };
      } catch {
        return {
          sikayetler: [],
          kronikHastaliklar: [],
          alerjiler: [],
          ilaclar: [],
          onerilenYontemler: [],
          _raw: raw,
        };
      }
    }),
});
