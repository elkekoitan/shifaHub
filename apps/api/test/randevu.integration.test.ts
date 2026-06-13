import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import EmbeddedPostgres from "embedded-postgres";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { schema } from "@shifahub/db";
import { appRouter, createCallerFactory, type AuthUser, type Context } from "@shifahub/trpc";

/**
 * P3 router gate: drives the randevu router through the real tRPC + RLS stack.
 * Proves cross-tenant isolation end-to-end (danışan A never sees danışan B's
 * appointments), the appointment state machine, and double-booking detection.
 */

const here = dirname(fileURLToPath(import.meta.url));
const ENC_KEY = "shifahub-dev-encryption-key-32b!";
const PORT = 54331;

let pg: EmbeddedPostgres;
let sql: postgres.Sql;
let db: Context["db"];

const createCaller = createCallerFactory(appRouter);
const caller = (user: AuthUser | null) => createCaller({ user, db, encKey: ENC_KEY, meta: {} });

async function register(email: string, role: "danisan" | "egitmen"): Promise<AuthUser> {
  const res = await caller(null).auth.register({
    email,
    password: "supersecret",
    firstName: "T",
    lastName: "U",
    role,
  });
  return res.user;
}

let danisanA: AuthUser;
let danisanB: AuthUser;
let egitmenE: AuthUser;
const tomorrow = (hour: number) => {
  const d = new Date(Date.now() + 86_400_000);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
};

beforeAll(async () => {
  pg = new EmbeddedPostgres({
    databaseDir: resolve(here, "..", "pg_data_randevu"),
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

  danisanA = await register("randevu-a@shifahub.test", "danisan");
  danisanB = await register("randevu-b@shifahub.test", "danisan");
  egitmenE = await register("randevu-e@shifahub.test", "egitmen");
}, 240_000);

afterAll(async () => {
  if (sql) await sql.end();
  if (pg) await pg.stop();
});

describe("randevu cross-tenant RLS", () => {
  it("each danışan sees only their own appointments", async () => {
    await caller(danisanA).randevu.create({ egitmenId: egitmenE.id, scheduledAt: tomorrow(9) });
    await caller(danisanB).randevu.create({ egitmenId: egitmenE.id, scheduledAt: tomorrow(11) });

    const aList = await caller(danisanA).randevu.list({ limit: 50 });
    const bList = await caller(danisanB).randevu.list({ limit: 50 });
    expect(aList.length).toBe(1);
    expect(bList.length).toBe(1);
    expect(aList[0]!.danisanId).toBe(danisanA.id);
    expect(bList[0]!.danisanId).toBe(danisanB.id);

    // The eğitmen sees BOTH (egitmenId = E on each).
    const eList = await caller(egitmenE).randevu.list({ limit: 50 });
    expect(eList.length).toBe(2);
  });
});

describe("randevu state machine", () => {
  it("enforces valid transitions and danışan-can-only-cancel", async () => {
    const appt = await caller(danisanA).randevu.create({
      egitmenId: egitmenE.id,
      scheduledAt: tomorrow(14),
    });
    expect(appt.status).toBe("requested");

    // Invalid: requested -> treated (only confirmed/cancelled allowed).
    await expect(
      caller(egitmenE).randevu.updateStatus({ randevuId: appt.id, status: "treated" }),
    ).rejects.toThrow(/gecilemez/);

    // Danışan may not confirm — only cancel.
    await expect(
      caller(danisanA).randevu.updateStatus({ randevuId: appt.id, status: "confirmed" }),
    ).rejects.toThrow(/yalnizca/);

    // Valid: eğitmen confirms.
    const confirmed = await caller(egitmenE).randevu.updateStatus({
      randevuId: appt.id,
      status: "confirmed",
    });
    expect(confirmed.randevu.status).toBe("confirmed");
  });
});

describe("randevu double-booking", () => {
  it("rejects an overlapping appointment for the same eğitmen", async () => {
    await caller(danisanA).randevu.create({ egitmenId: egitmenE.id, scheduledAt: tomorrow(16) });
    // danışan B tries the same slot with the same eğitmen.
    await expect(
      caller(danisanB).randevu.create({ egitmenId: egitmenE.id, scheduledAt: tomorrow(16) }),
    ).rejects.toThrow(/zaman diliminde/);
  });
});
