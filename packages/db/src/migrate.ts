import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

/**
 * Applies committed migrations (table DDL + the hand-written RLS/pgcrypto
 * migration) in journal order. Runs as the OWNER/admin role — never the
 * restricted app role — because it creates roles, policies, and extensions.
 * Use MIGRATE_DATABASE_URL in prod (owner) distinct from the app's DATABASE_URL
 * (non-superuser, RLS-enforced).
 */
const url = process.env.MIGRATE_DATABASE_URL ?? process.env.DATABASE_URL;
if (!url) {
  throw new Error("MIGRATE_DATABASE_URL or DATABASE_URL is required");
}

const sql = postgres(url, { max: 1 });
const db = drizzle(sql);

await migrate(db, { migrationsFolder: "./drizzle" });
await sql.end();
console.log("[db] migrations applied");
