// Odeme (billing) domain — saf tutar matematigi. tRPC odeme routeri buradan
// import eder (tek kaynak). Para alanlari numeric(10,2); matematik Number ile,
// yazim toFixed(2) ile.

/** Gecerli odeme durumlari (zod enum + DB icin tuple). */
export const PAYMENT_STATUS_VALUES = ["paid", "pending", "partial", "free"] as const;

export type PaymentStatus = (typeof PAYMENT_STATUS_VALUES)[number];

/**
 * Odenen ve toplam tutardan odeme durumunu otomatik belirler. `"free"` yalnizca
 * elle verildiyse korunur; tam odeme `"paid"`, kismi `"partial"`, aksi `"pending"`.
 */
export function deriveStatus(
  amount: number,
  paidAmount: number,
  explicit?: PaymentStatus,
): PaymentStatus {
  if (explicit === "free") return "free";
  if (paidAmount >= amount && amount > 0) return "paid";
  if (paidAmount > 0 && paidAmount < amount) return "partial";
  return explicit ?? "pending";
}
