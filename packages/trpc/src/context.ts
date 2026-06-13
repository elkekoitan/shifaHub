import type { Database } from "@shifahub/db";
import type { UserRole } from "@shifahub/shared";

/** The authenticated principal resolved from the request JWT. */
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

/**
 * Per-request tRPC context. The `withRls` middleware replaces `db` with a
 * transaction-scoped handle that has `SET LOCAL ROLE shifahub_app` +
 * `app.current_user_id / role / enc_key` GUCs applied, so RLS policies and
 * pgcrypto operate under the caller's identity.
 */
export interface Context {
  user: AuthUser | null;
  db: Database;
  /** 32-byte pgcrypto key (from the ENCRYPTION_KEY secret). */
  encKey: string;
  /** Client IP + UA for audit logging. */
  meta?: {
    ip?: string;
    userAgent?: string;
  };
}
