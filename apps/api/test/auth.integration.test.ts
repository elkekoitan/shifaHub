import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import EmbeddedPostgres from "embedded-postgres";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { schema } from "@shifahub/db";
import { appRouter, createCallerFactory, type AuthUser, type Context } from "@shifahub/trpc";

/**
 * P3 foundation gate: drives the auth router through the real tRPC stack
 * (createCaller -> withRls transaction -> RLS-enforced Postgres). register
 * succeeding proves the RLS middleware sets the GUCs correctly, because it
 * inserts into the RLS-protected `danisan` table.
 */

const here = dirname(fileURLToPath(import.meta.url));
const ENC_KEY = "shifahub-dev-encryption-key-32b!";
const PORT = 54330;

let pg: EmbeddedPostgres;
let sql: postgres.Sql;
let db: Context["db"];

const createCaller = createCallerFactory(appRouter);
const caller = (user: AuthUser | null) => createCaller({ user, db, encKey: ENC_KEY, meta: {} });

beforeAll(async () => {
  pg = new EmbeddedPostgres({
    databaseDir: resolve(here, "..", "pg_data"),
    user: "postgres",
    password: "postgres",
    port: PORT,
    persistent: false,
    initdbFlags: ["--locale=C", "--encoding=UTF8"],
  });
  await pg.initialise();
  await pg.start();
  await pg.createDatabase("shifahub_test");

  const url = `postgresql://postgres:postgres@localhost:${PORT}/shifahub_test`;
  const migrator = postgres(url, { max: 1 });
  await migrate(drizzle(migrator), {
    migrationsFolder: resolve(here, "..", "..", "..", "packages", "db", "drizzle"),
  });
  await migrator.end();

  sql = postgres(url, { max: 4 });
  db = drizzle(sql, { schema }) as unknown as Context["db"];
}, 240_000);

afterAll(async () => {
  if (sql) await sql.end();
  if (pg) await pg.stop();
});

describe("auth.register", () => {
  it("creates a danışan + profile row and returns tokens", async () => {
    const res = await caller(null).auth.register({
      email: "danisan@shifahub.test",
      password: "supersecret",
      firstName: "Deniz",
      lastName: "Yıldız",
      role: "danisan",
    });
    expect(res.user.email).toBe("danisan@shifahub.test");
    expect(res.user.role).toBe("danisan");
    expect(res.accessToken).toBeTypeOf("string");
    expect(res.refreshToken).toBeTypeOf("string");

    // The RLS-protected danisan profile row was inserted (proves middleware GUCs).
    const rows = await sql`select user_id from danisan where user_id = ${res.user.id}`;
    expect(rows.length).toBe(1);
  });

  it("rejects a duplicate email", async () => {
    await expect(
      caller(null).auth.register({
        email: "danisan@shifahub.test",
        password: "supersecret",
        firstName: "X",
        lastName: "Y",
        role: "danisan",
      }),
    ).rejects.toThrow(/zaten kayitli/);
  });
});

describe("auth.login + me", () => {
  it("rejects a wrong password", async () => {
    await expect(
      caller(null).auth.login({ email: "danisan@shifahub.test", password: "wrong" }),
    ).rejects.toThrow();
  });

  it("logs in and returns the current user via me", async () => {
    const login = await caller(null).auth.login({
      email: "danisan@shifahub.test",
      password: "supersecret",
    });
    expect(login.user.role).toBe("danisan");

    const me = await caller(login.user).auth.me();
    expect(me.email).toBe("danisan@shifahub.test");
    expect(me.id).toBe(login.user.id);
  });
});

describe("auth.refresh", () => {
  it("exchanges a refresh token for new tokens", async () => {
    const reg = await caller(null).auth.register({
      email: "egitmen@shifahub.test",
      password: "supersecret",
      firstName: "Eğitmen",
      lastName: "Test",
      role: "egitmen",
    });
    const refreshed = await caller(null).auth.refresh({ refreshToken: reg.refreshToken });
    expect(refreshed.accessToken).toBeTypeOf("string");

    // egitmen profile row created (egitmen table has no RLS).
    const rows = await db
      .select()
      .from(schema.egitmen)
      .where(eq(schema.egitmen.userId, reg.user.id));
    expect(rows.length).toBe(1);
  });
});
