import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit config. Migrations are GENERATED and committed (not `push`ed).
 * RLS policies + pgcrypto live in hand-written SQL migrations under ./drizzle.
 */
export default defineConfig({
  schema: "./src/schema/*.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});
