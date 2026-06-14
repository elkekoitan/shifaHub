/**
 * Ödeme gateway soyutlaması. "Kim kime nasıl": **danışan → klinik (eğitmen)**,
 * online kart ödemesi bir gateway üzerinden.
 *
 * Şu an yerleşik **DemoGateway** (anahtar gerektirmez; ShifaHub'ın kendi demo
 * ödeme sayfasına yönlendirir) çalışır. Gerçek iyzico/PayTR entegrasyonu, anahtar
 * geldiğinde `getPaymentGateway()` içinde env ile devreye alınır — router/akış
 * değişmeden, yalnız bu modül genişletilerek.
 */

export interface CheckoutInput {
  odemeId: string;
  amount: number;
  description: string;
}

export interface CheckoutResult {
  /** "demo" | "iyzico" | "paytr" */
  provider: string;
  /** Gateway işlem referansı (DB'de provider_ref olarak saklanır). */
  ref: string;
  /** Danışanın yönlendirileceği ödeme adresi. Göreli (demo) ya da mutlak (gerçek gateway). */
  redirectUrl: string;
}

export interface PaymentGateway {
  readonly provider: string;
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;
}

/**
 * Yerleşik demo gateway — gerçek para hareketi YOK. Danışanı ShifaHub'ın kendi
 * demo ödeme sayfasına (`/danisan/odeme/<id>/ode`) yönlendirir; orada onaylanınca
 * `confirmDemo` ödemeyi "paid" yapar. Canlı veri demo olduğundan güvenlidir.
 */
class DemoGateway implements PaymentGateway {
  readonly provider = "demo";
  async createCheckout({ odemeId }: CheckoutInput): Promise<CheckoutResult> {
    const ref = `demo_${odemeId.replace(/-/g, "").slice(0, 12)}`;
    return { provider: "demo", ref, redirectUrl: `/danisan/odeme/${odemeId}/ode?ref=${ref}` };
  }
}

let cached: PaymentGateway | null = null;

/**
 * Aktif ödeme gateway'ini döndürür. IYZICO_API_KEY/PAYTR_MERCHANT gibi anahtarlar
 * tanımlıysa gerçek sağlayıcı (henüz eklenmedi) seçilir; aksi hâlde DemoGateway.
 */
export function getPaymentGateway(): PaymentGateway {
  if (cached) return cached;
  // Gelecek: if (process.env.IYZICO_API_KEY) cached = new IyzicoGateway(...)
  cached = new DemoGateway();
  return cached;
}
