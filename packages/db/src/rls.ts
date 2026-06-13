import { sql } from "drizzle-orm";

/** The identity a request runs under; drives RLS policies + the pgcrypto key. */
export interface SessionIdentity {
  userId: string | null;
  role: string | null;
  /** 32-byte pgcrypto key from the ENCRYPTION_KEY secret. */
  encKey: string;
}

/**
 * Minimal surface of a Drizzle transaction handle we need. Kept structural so
 * tests and the P3 request context can both call it without generic friction.
 */
export interface Executor {
  execute(query: SQL): Promise<unknown>;
}
type SQL = ReturnType<typeof sql>;

/**
 * Set the transaction-local GUCs that RLS policies and pgcrypto read. MUST be
 * the first statement inside every request transaction. Uses `set_config(..., true)`
 * so the settings are scoped to the current transaction only (never leak across
 * pooled connections).
 */
export function setSessionContext(tx: Executor, id: SessionIdentity): Promise<unknown> {
  return tx.execute(sql`
    select
      set_config('app.current_user_id', ${id.userId ?? ""}, true),
      set_config('app.current_user_role', ${id.role ?? ""}, true),
      set_config('app.enc_key', ${id.encKey}, true)
  `);
}
