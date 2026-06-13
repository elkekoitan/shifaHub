import type { Database } from "@shifahub/db";
import type { UserRole } from "@shifahub/shared";

/** The authenticated principal resolved from the request JWT (P3). */
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

/**
 * Per-request tRPC context. In P3, `db` becomes a request-scoped handle bound to
 * a transaction with `SET LOCAL app.current_user_id / role / enc_key` so that
 * RLS policies and pgcrypto operate under the caller's identity.
 */
export interface Context {
  user: AuthUser | null;
  db: Database;
  /** Client IP + UA for audit logging (P3). */
  meta?: {
    ip?: string;
    userAgent?: string;
  };
}
