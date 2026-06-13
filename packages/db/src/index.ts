import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Create a raw postgres-js client. `prepare: false` is required for
 * transaction-pooled connections (PgBouncer / Coolify) and keeps per-request
 * `SET LOCAL` GUCs (RLS + pgcrypto key) scoped correctly in P3.
 */
export function createSqlClient(connectionString: string = process.env.DATABASE_URL ?? "") {
  return postgres(connectionString, { max: 10, prepare: false });
}

/** Shared app-wide SQL client + Drizzle instance. */
export const sql = createSqlClient();
export const db = drizzle(sql, { schema });

export type Database = typeof db;
export type SqlClient = typeof sql;

export { schema };
export * from "./schema";
export * from "./crypto";
export * from "./rls";
