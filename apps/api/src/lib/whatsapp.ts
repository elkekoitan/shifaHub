/**
 * WhatsApp gönderimi — Evolution API (`sendText`) üzerinden. Eğitmen/sistem
 * bildirimleri (randevu hatırlatma, onay vb.) danışanın telefonuna WhatsApp olarak
 * iletilebilir. Yapılandırma env'den gelir (EVOLUTION_URL/KEY/INSTANCE).
 */
const EVO_URL = process.env.EVOLUTION_URL;
const EVO_KEY = process.env.EVOLUTION_KEY;
const EVO_INSTANCE = process.env.EVOLUTION_INSTANCE ?? "shifahub";

export function whatsappConfigured(): boolean {
  return Boolean(EVO_URL && EVO_KEY);
}

/** Türk telefon numarasını WhatsApp formatına çevirir (905XXXXXXXXX). */
export function toWaNumber(phone: string): string | null {
  const d = phone.replace(/\D/g, "");
  if (d.startsWith("90") && d.length === 12) return d; // 905XXXXXXXXX
  if (d.startsWith("0") && d.length === 11) return `9${d}`; // 05XXXXXXXXX → 905…
  if (d.length === 10 && d.startsWith("5")) return `90${d}`; // 5XXXXXXXXX → 905…
  return d.length >= 11 ? d : null;
}

/** Tek bir WhatsApp metin mesajı gönderir. Yapılandırılmamışsa sessizce false döner. */
export async function sendWhatsApp(phone: string, text: string): Promise<boolean> {
  if (!whatsappConfigured()) return false;
  const number = toWaNumber(phone);
  if (!number) return false;
  try {
    const res = await fetch(`${EVO_URL}/message/sendText/${EVO_INSTANCE}`, {
      method: "POST",
      headers: { apikey: EVO_KEY ?? "", "Content-Type": "application/json" },
      body: JSON.stringify({ number, text }),
    });
    if (!res.ok) {
      console.warn(`[whatsapp] gönderim başarısız HTTP ${res.status}`);
      return false;
    }
    return true;
  } catch (e) {
    console.warn(`[whatsapp] hata: ${e instanceof Error ? e.message : e}`);
    return false;
  }
}
