import { z } from "zod";
import { and, eq, gte, inArray } from "drizzle-orm";
import { danisan, randevu, users } from "@shifahub/db";
import {
  checkContraindications,
  upcomingSunnahDays,
  TREATMENT_LABELS,
  APPOINTMENT_STATUS_LABELS,
} from "@shifahub/shared";
import { protectedProcedure, egitmenProcedure, router } from "../trpc";
import { chat } from "../lib/ai";
import { retrieveKb, SUNNET_GUNU_BILGISI, KULLIYAT_KB, type KbEntry } from "../lib/kulliyat-kb";

/**
 * ShifaHub Asistanı — bütünsel şifa bilgi asistanı (OpenRouter, ücretsiz model).
 *
 * RAG'dan daha gelişmiş, **agentic + temellendirilmiş** mimari:
 *   1. Niyet/varlık sınıflama (kod, deterministik) — hangi araçlar gerekli?
 *   2. Araç çalıştırma — küratörlü bilgi tabanı (retrieve), yaklaşan sünnet günleri
 *      (Hicri hesap), kişiselleştirilmiş kontrendikasyon (danışanın profili) ve
 *      yaklaşan randevular (canlı veri).
 *   3. Temellendirilmiş sentez — model YALNIZ toplanan bağlamdan yanıtlar (uydurma yok).
 *
 * Marka: "ShifaHub Asistanı" (GETAT etiketi kullanıcıya gösterilmez). Tıbbi teşhis
 * koymaz; bilgilendirir ve uzman eğitmene yönlendirir. Terminoloji: ASLA doktor/hasta.
 */
const SHIFAHUB_SYSTEM = `Sen ShifaHub Asistanısın — bütünsel ve geleneksel şifa yöntemlerinde bilgilendiren, sıcak ama temkinli bir rehbersin. Kur'an ve sünnetin tavsiyelerine saygılı, modern sağlık bilgisini de gözeten bir dil kullanırsın.

KURALLAR:
- YALNIZCA sana verilen "BAĞLAM" bölümündeki bilgilere ve genel sağlık okuryazarlığına dayan. Bağlamda olmayan bir yöntem/iddia için "elimde kesin bilgi yok, bir eğitmene danışmanı öneririm" de.
- ASLA "doktor"/"hasta" deme; "eğitmen"/"uygulama uzmanı" ve "danışan" kullan.
- ASLA tıbbi TEŞHİS koyma, ilaç/doz önerme. Bilgilendirici ol; gerektiğinde uzman bir eğitmene yönlendir.
- Acil/ciddi belirtilerde (göğüs ağrısı, nefes darlığı, kontrolsüz kanama, bilinç bulanıklığı vb.) derhâl bir sağlık kuruluşuna başvurmayı söyle.
- Danışanın kişisel verisi (kontrendikasyon/randevu) bağlamda verilmişse onu dikkate al ve kişisel, nazik konuş.
- Kısa, net, anlaşılır Türkçe; gerekirse maddeler. En fazla 4-5 cümle veya 4-5 madde.`;

/** Soruda geçen tedavi tipini KB anahtarlarından + tedavi etiketlerinden tespit eder. */
function detectTreatmentType(q: string): { key: string; entry?: KbEntry } | null {
  const lc = q.toLocaleLowerCase("tr");
  // Önce tedavi tipi anahtarları (BASE_PRICES anahtarları = kanonik tip kodları)
  const aliasMap: Record<string, string[]> = {
    hacamat_yas: ["yaş hacamat", "yas hacamat", "kanlı hacamat", "kanli hacamat"],
    hacamat_kuru: ["kuru hacamat", "kupa hacamat"],
    solucan: ["sülük", "suluk", "hirudoterapi", "solucan"],
    sujok: ["sujok", "su jok"],
    refleksoloji: ["refleksoloji", "ayak masaj"],
    fitoterapi: ["fitoterapi", "bitkisel"],
    akupunktur: ["akupunktur", "iğne"],
    ozon: ["ozon"],
    kupa: ["kuru kupa", "kupa terapi"],
  };
  for (const [key, aliases] of Object.entries(aliasMap)) {
    if (aliases.some((a) => lc.includes(a))) {
      const entry = KULLIYAT_KB.find((e) =>
        e.anahtarlar.some((k) => aliases.includes(k) || lc.includes(k)),
      );
      return { key, entry };
    }
  }
  // Genel "hacamat" → varsayılan yaş hacamat (kontrendikasyon açısından en kapsamlı)
  if (lc.includes("hacamat") || lc.includes("hijama")) {
    return { key: "hacamat_yas", entry: KULLIYAT_KB.find((e) => e.id === "hacamat") };
  }
  return null;
}

export const kulliyatRouter = router({
  /** ShifaHub Asistanı'na soru sor — temellendirilmiş, kişiselleştirilmiş yanıt. */
  ask: protectedProcedure
    .input(z.object({ question: z.string().trim().min(3).max(1000) }))
    .mutation(async ({ ctx, input }) => {
      const q = input.question;
      const lc = q.toLocaleLowerCase("tr");
      const sources: string[] = [];
      const contextParts: string[] = [];

      // ── Araç 1: küratörlü bilgi tabanı (retrieval) ──────────────────────────
      const kb = retrieveKb(q, 2);
      for (const e of kb) {
        contextParts.push(
          `[${e.baslik}] ${e.tanim}\n- Faydalanılan durumlar: ${e.endikasyonlar.join("; ")}\n- Gelenek: ${e.gelenek}\n- Dikkat: ${e.dikkat.join(" ")}\n- Seans: ${e.seans}`,
        );
        sources.push(e.baslik);
      }

      // ── Araç 2: yaklaşan sünnet (hacamat) günleri ───────────────────────────
      const asksSunnet =
        /sünnet|sunnet|hangi gün|ne zaman.*hacamat|hacamat.*ne zaman|17|19|21/.test(lc);
      if (asksSunnet) {
        const days = upcomingSunnahDays(new Date(), 3);
        const list = days.map((d) => `${d.iso} (${d.hijriDate})`).join(", ");
        contextParts.push(`[Sünnet günleri] ${SUNNET_GUNU_BILGISI} Yaklaşan günler: ${list}.`);
        sources.push("Sünnet günleri takvimi");
      }

      // ── Araç 3 & 4: kişiselleştirme (yalnızca danışan kendi verisi) ─────────
      const detected = detectTreatmentType(q);
      const asksPersonalFit = /bana uygun|benim için|uygun mu|sakınca|yapabilir miyim|olur mu/.test(
        lc,
      );
      const asksAppointments = /randevu/.test(lc);

      if (ctx.user.role === "danisan") {
        // Kontrendikasyon: danışan "bana uygun mu" + tedavi tipi sorarsa
        if (asksPersonalFit && detected) {
          try {
            const [profil] = await ctx.db
              .select()
              .from(danisan)
              .where(eq(danisan.userId, ctx.user.id))
              .limit(1);
            if (profil) {
              const warnings = checkContraindications(detected.key, profil);
              const label = TREATMENT_LABELS[detected.key] ?? detected.key;
              if (warnings.length > 0) {
                contextParts.push(
                  `[Kişisel değerlendirme — ${label}] Danışanın profiline göre dikkat edilmesi gerekenler:\n${warnings.map((w) => "- " + w).join("\n")}\n(Bu otomatik bir ön kontroldür; kesin değerlendirmeyi eğitmen yapar.)`,
                );
              } else {
                contextParts.push(
                  `[Kişisel değerlendirme — ${label}] Danışanın kayıtlı profilinde bu yöntem için belirgin bir kontrendikasyon işareti görünmüyor. Yine de uygulama öncesi eğitmen değerlendirmesi gerekir.`,
                );
              }
              sources.push("Kişisel kontrendikasyon ön kontrolü");
            }
          } catch {
            // profil okunamazsa kişiselleştirme atlanır (genel yanıt yine verilir)
          }
        }

        // Yaklaşan randevular
        if (asksAppointments) {
          try {
            const rows = await ctx.db
              .select({
                scheduledAt: randevu.scheduledAt,
                status: randevu.status,
                treatmentType: randevu.treatmentType,
                hijriDate: randevu.hijriDate,
                egitmenId: randevu.egitmenId,
              })
              .from(randevu)
              .where(and(eq(randevu.danisanId, ctx.user.id), gte(randevu.scheduledAt, new Date())))
              .orderBy(randevu.scheduledAt)
              .limit(3);
            if (rows.length > 0) {
              const egitmenIds = rows.map((r) => r.egitmenId).filter(Boolean) as string[];
              const egitmenler = egitmenIds.length
                ? await ctx.db
                    .select({ id: users.id, firstName: users.firstName, lastName: users.lastName })
                    .from(users)
                    .where(inArray(users.id, egitmenIds))
                    .limit(10)
                : [];
              const nameOf = (id: string) => {
                const u = egitmenler.find((e) => e.id === id);
                return u ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() : "eğitmen";
              };
              const list = rows
                .map((r) => {
                  const t = r.treatmentType
                    ? (TREATMENT_LABELS[r.treatmentType] ?? r.treatmentType)
                    : "randevu";
                  const st = r.status ? (APPOINTMENT_STATUS_LABELS[r.status] ?? r.status) : "";
                  const d = r.scheduledAt
                    ? new Date(r.scheduledAt).toLocaleString("tr-TR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "";
                  return `- ${d} · ${t} · ${nameOf(r.egitmenId)} · ${st}`;
                })
                .join("\n");
              contextParts.push(`[Yaklaşan randevuların]\n${list}`);
            } else {
              contextParts.push(`[Yaklaşan randevuların] Kayıtlı yaklaşan randevun görünmüyor.`);
            }
            sources.push("Randevu kayıtların");
          } catch {
            // randevu okunamazsa atlanır
          }
        }
      }

      // ── Sentez ──────────────────────────────────────────────────────────────
      const context =
        contextParts.length > 0
          ? contextParts.join("\n\n")
          : "(İlgili özel bağlam bulunamadı — genel ve temkinli bilgilendirme yap, bir eğitmene yönlendir.)";

      const answer = await chat(
        [
          { role: "system", content: SHIFAHUB_SYSTEM },
          {
            role: "user",
            content: `BAĞLAM:\n${context}\n\nSORU: ${q}\n\nYukarıdaki bağlama dayanarak danışana yardımcı, temkinli ve kısa bir yanıt ver.`,
          },
        ],
        { maxTokens: 700, temperature: 0.4 },
      );

      // Sık sorulan takip önerileri (basit, niyet temelli)
      const suggestions: string[] = [];
      if (!asksSunnet) suggestions.push("Hacamat için sünnet günleri ne zaman?");
      if (detected && !asksPersonalFit && ctx.user.role === "danisan")
        suggestions.push(`${TREATMENT_LABELS[detected.key] ?? "Bu yöntem"} bana uygun mu?`);
      if (!asksAppointments && ctx.user.role === "danisan")
        suggestions.push("Yaklaşan randevularım neler?");
      if (suggestions.length === 0) suggestions.push("Sülük tedavisi hangi durumlarda kullanılır?");

      return { answer, sources: [...new Set(sources)], suggestions: suggestions.slice(0, 3) };
    }),

  /** Anamnez/şikayet metninden yapısal çıkarım (NER) — eğitmen. */
  analyzeComplaints: egitmenProcedure
    .input(z.object({ text: z.string().trim().min(3).max(2000) }))
    .mutation(async ({ input }) => {
      // JSON modu: chat() yalnız geçerli JSON döndürür ya da fırlatır — sessiz boş
      // sonuç YOK (eğitmen yanlışlıkla "hiçbir şey bulunmadı" anamnezi okumaz).
      const raw = await chat(
        [
          {
            role: "system",
            content:
              'Aşağıdaki danışan anamnezinden yapısal veri çıkar. SADECE geçerli JSON döndür, başka metin YOK. Şema: {"sikayetler":string[],"kronikHastaliklar":string[],"alerjiler":string[],"ilaclar":string[],"onerilenYontemler":string[]}. ' +
              SHIFAHUB_SYSTEM,
          },
          { role: "user", content: input.text },
        ],
        {
          maxTokens: 600,
          temperature: 0.2,
          json: true,
          models: ["nex-agi/nex-n2-pro:free", "openrouter/owl-alpha"],
        },
      );
      return JSON.parse(raw) as {
        sikayetler: string[];
        kronikHastaliklar: string[];
        alerjiler: string[];
        ilaclar: string[];
        onerilenYontemler: string[];
      };
    }),
});
