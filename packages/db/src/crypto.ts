import { sql, type AnyColumn, type SQL } from "drizzle-orm";

/**
 * KVKK column-level encryption via pgcrypto (AES-256 / `pgp_sym_*`).
 *
 * The symmetric key is NEVER stored in the database, embedded in SQL text, or
 * logged. It is read at query time from the transaction-local GUC `app.enc_key`,
 * which `setSessionContext` (see ./rls) sets per request from the `ENCRYPTION_KEY`
 * secret. A lost key means unrecoverable data; a leaked key means full exposure —
 * back it up separately from the DB and rotate per the runbook.
 */

/** Encrypt a plaintext value for storage in a `bytea` column. NULL-safe. */
export function encrypt(value: string | null | undefined): SQL {
  return sql`pgp_sym_encrypt(${value ?? null}::text, current_setting('app.enc_key'))`;
}

/** Decrypt a `bytea` column back to text. NULL-safe. */
export function decrypt(column: AnyColumn | SQL): SQL<string | null> {
  return sql`pgp_sym_decrypt(${column}, current_setting('app.enc_key'))`;
}

/** Last 4 digits of a phone/TC for display (stored alongside the ciphertext). */
export function last4(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 4 ? digits.slice(-4) : null;
}
