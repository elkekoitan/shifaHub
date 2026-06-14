import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import EmbeddedPostgres from "embedded-postgres";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

/**
 * P2 hard gate: proves the KVKK compliance layer actually enforces at runtime
 * against a REAL Postgres (embedded, local, isolated — never the live DB):
 *   1. pgcrypto round-trip + ciphertext-at-rest + wrong-key failure
 *   2. RLS cross-tenant denial (danışan ↔ danışan)
 *   3. RLS care-relationship gating (eğitmen sees a danışan only with active care)
 *   4. audit_log append-only under the app role
 *
 * The setup runs as the superuser (RLS bypassed); the assertions run after
 * `SET LOCAL ROLE shifahub_app` (non-superuser, NOBYPASSRLS) so policies apply.
 */

const here = dirname(fileURLToPath(import.meta.url));
const ENC_KEY = "shifahub-dev-encryption-key-32b!";
const PORT = 54329;

let pg: EmbeddedPostgres;
let sql: postgres.Sql;

/** Drop to the RLS-enforced app role and set the request GUCs (transaction-local). */
async function actAs(tx: postgres.TransactionSql, userId: string | null, role: string) {
  await tx`set local role shifahub_app`;
  await tx`select set_config('app.current_user_id', ${userId ?? ""}, true),
                  set_config('app.current_user_role', ${role}, true),
                  set_config('app.enc_key', ${ENC_KEY}, true)`;
}

let danisanA = "";
let danisanB = "";
let egitmenC = "";

beforeAll(async () => {
  pg = new EmbeddedPostgres({
    databaseDir: resolve(here, "..", "pg_data"),
    user: "postgres",
    password: "postgres",
    port: PORT,
    persistent: false,
    // System locale is Turkish (non-ASCII); initdb rejects it. Force C/UTF8.
    initdbFlags: ["--locale=C", "--encoding=UTF8"],
  });
  await pg.initialise();
  await pg.start();
  await pg.createDatabase("shifahub_test");

  const url = `postgresql://postgres:postgres@localhost:${PORT}/shifahub_test`;
  const migrator = postgres(url, { max: 1 });
  await migrate(drizzle(migrator), {
    migrationsFolder: resolve(here, "..", "drizzle"),
  });
  await migrator.end();

  sql = postgres(url, { max: 4 });

  // Seed as superuser (RLS bypassed). enc_key set for the encrypted insert.
  await sql.begin(async (tx) => {
    await tx`select set_config('app.enc_key', ${ENC_KEY}, true)`;
    const [a] =
      await tx`insert into users (email, password_hash, role, first_name, last_name, tc_kimlik_encrypted)
      values ('a@shifahub.test','h','danisan','Danisan','A', pgp_sym_encrypt('11111111110', current_setting('app.enc_key'))) returning id`;
    const [b] = await tx`insert into users (email, password_hash, role, first_name, last_name)
      values ('b@shifahub.test','h','danisan','Danisan','B') returning id`;
    const [c] = await tx`insert into users (email, password_hash, role, first_name, last_name)
      values ('c@shifahub.test','h','egitmen','Egitmen','C') returning id`;
    danisanA = a!.id;
    danisanB = b!.id;
    egitmenC = c!.id;

    await tx`insert into danisan (user_id) values (${danisanA})`;
    await tx`insert into danisan (user_id) values (${danisanB})`;

    // Two appointments, one per danışan, both with egitmenC.
    await tx`insert into randevu (danisan_id, egitmen_id, scheduled_at) values (${danisanA}, ${egitmenC}, now())`;
    await tx`insert into randevu (danisan_id, egitmen_id, scheduled_at) values (${danisanB}, ${egitmenC}, now())`;
  });
}, 240_000);

afterAll(async () => {
  if (sql) await sql.end();
  if (pg) await pg.stop();
});

describe("pgcrypto encryption", () => {
  it("stores ciphertext at rest and decrypts with the right key", async () => {
    const [raw] = await sql`select tc_kimlik_encrypted from users where id = ${danisanA}`;
    expect(raw!.tc_kimlik_encrypted).toBeInstanceOf(Buffer);
    // At rest it must NOT contain the plaintext.
    expect((raw!.tc_kimlik_encrypted as Buffer).toString("utf8")).not.toContain("11111111110");

    const [dec] =
      await sql`select pgp_sym_decrypt(tc_kimlik_encrypted, ${ENC_KEY}) as tc from users where id = ${danisanA}`;
    expect(dec!.tc).toBe("11111111110");
  });

  it("fails to decrypt with the wrong key", async () => {
    await expect(
      sql`select pgp_sym_decrypt(tc_kimlik_encrypted, ${"wrong-key-wrong-key-wrong-key-32"}) as tc from users where id = ${danisanA}`,
    ).rejects.toThrow();
  });
});

describe("RLS cross-tenant denial", () => {
  it("danışan A sees only their own danışan row", async () => {
    const rows = await sql.begin(async (tx) => {
      await actAs(tx, danisanA, "danisan");
      return tx`select user_id from danisan`;
    });
    expect(rows.length).toBe(1);
    expect(rows[0]!.user_id).toBe(danisanA);
  });

  it("danışan A cannot see danışan B's appointments", async () => {
    const rows = await sql.begin(async (tx) => {
      await actAs(tx, danisanA, "danisan");
      return tx`select danisan_id from randevu`;
    });
    expect(rows.length).toBe(1);
    expect(rows[0]!.danisan_id).toBe(danisanA);
  });

  it("admin sees all danışan rows", async () => {
    const rows = await sql.begin(async (tx) => {
      await actAs(tx, egitmenC, "admin");
      return tx`select user_id from danisan`;
    });
    expect(rows.length).toBe(2);
  });
});

describe("RLS care-relationship gating", () => {
  it("eğitmen WITHOUT an active care relationship sees no danışan rows", async () => {
    const rows = await sql.begin(async (tx) => {
      await actAs(tx, egitmenC, "egitmen");
      return tx`select user_id from danisan`;
    });
    expect(rows.length).toBe(0);
  });

  it("eğitmen WITH an active care relationship sees that danışan", async () => {
    // Establish care as admin (allowed by care_rel WITH CHECK admin).
    await sql.begin(async (tx) => {
      await actAs(tx, egitmenC, "admin");
      await tx`insert into care_relationship (danisan_id, egitmen_id, status) values (${danisanA}, ${egitmenC}, 'active')`;
    });

    const rows = await sql.begin(async (tx) => {
      await actAs(tx, egitmenC, "egitmen");
      return tx`select user_id from danisan`;
    });
    expect(rows.length).toBe(1);
    expect(rows[0]!.user_id).toBe(danisanA);
  });
});

describe("audit_log append-only", () => {
  it("allows insert and admin read but denies update", async () => {
    await sql.begin(async (tx) => {
      await actAs(tx, danisanA, "danisan");
      await tx`insert into audit_log (user_id, action, table_name) values (${danisanA}, 'login', 'users')`;
    });

    const rows = await sql.begin(async (tx) => {
      await actAs(tx, egitmenC, "admin");
      return tx`select id from audit_log`;
    });
    expect(rows.length).toBeGreaterThanOrEqual(1);

    // No UPDATE policy + FORCE RLS => update affects 0 rows (silently filtered).
    const updated = await sql.begin(async (tx) => {
      await actAs(tx, egitmenC, "admin");
      return tx`update audit_log set action = 'logout' returning id`;
    });
    expect(updated.length).toBe(0);
  });
});

describe("KVKK consent-gate (user_has_active_consent)", () => {
  it("returns false when the danışan has no active health-data consent", async () => {
    const [r] =
      await sql`select user_has_active_consent(${danisanB}::uuid, 'saglik_verisi_isleme') as ok`;
    expect(r!.ok).toBe(false);
  });

  it("returns true after consent, even when queried by the eğitmen (RLS-bypassing SECURITY DEFINER)", async () => {
    // Danışan grants their own consent (RLS WITH CHECK: user_id = self).
    await sql.begin(async (tx) => {
      await actAs(tx, danisanA, "danisan");
      await tx`insert into kvkk_consent (user_id, purpose, description, status)
               values (${danisanA}, 'saglik_verisi_isleme', 'test riza', 'active')`;
    });

    // The eğitmen cannot SELECT the consent row directly (RLS hides it)...
    const direct = await sql.begin(async (tx) => {
      await actAs(tx, egitmenC, "egitmen");
      return tx`select id from kvkk_consent where user_id = ${danisanA}`;
    });
    expect(direct.length).toBe(0);

    // ...but the SECURITY DEFINER gate function still confirms it (boolean only).
    const gated = await sql.begin(async (tx) => {
      await actAs(tx, egitmenC, "egitmen");
      return tx`select user_has_active_consent(${danisanA}::uuid, 'saglik_verisi_isleme') as ok`;
    });
    expect(gated[0]!.ok).toBe(true);
  });

  it("returns false after the consent is revoked", async () => {
    await sql.begin(async (tx) => {
      await actAs(tx, danisanA, "danisan");
      await tx`update kvkk_consent set status = 'revoked', revoked_at = now()
               where user_id = ${danisanA} and purpose = 'saglik_verisi_isleme'`;
    });
    const [r] =
      await sql`select user_has_active_consent(${danisanA}::uuid, 'saglik_verisi_isleme') as ok`;
    expect(r!.ok).toBe(false);
  });
});

describe("geri_bildirim RLS", () => {
  it("danışan kendi geri bildirimini yazar ve görür; başkasınınkini görmez", async () => {
    await sql.begin(async (tx) => {
      await actAs(tx, danisanA, "danisan");
      await tx`insert into geri_bildirim (danisan_id, rating, comment) values (${danisanA}, 5, 'harika')`;
    });

    const own = await sql.begin(async (tx) => {
      await actAs(tx, danisanA, "danisan");
      return tx`select id from geri_bildirim`;
    });
    expect(own.length).toBe(1);

    const other = await sql.begin(async (tx) => {
      await actAs(tx, danisanB, "danisan");
      return tx`select id from geri_bildirim`;
    });
    expect(other.length).toBe(0);
  });

  it("danışan başkası adına geri bildirim yazamaz (WITH CHECK reddi)", async () => {
    await expect(
      sql.begin(async (tx) => {
        await actAs(tx, danisanB, "danisan");
        await tx`insert into geri_bildirim (danisan_id, rating) values (${danisanA}, 3)`;
      }),
    ).rejects.toThrow();
  });
});

describe("KVKK rıza-çekme cascade (apply_consent_revocation)", () => {
  it("bekleyen randevuyu iptal eder + bakım ilişkisini sonlandırır (yalnızca p_user)", async () => {
    // Ön koşul: danisanA'nın 'requested' randevusu + 'active' care_relationship var.
    const [beforeRnd] = await sql`select status from randevu where danisan_id = ${danisanA}`;
    const [beforeCare] =
      await sql`select status from care_relationship where danisan_id = ${danisanA} and egitmen_id = ${egitmenC}`;
    expect(beforeRnd!.status).toBe("requested");
    expect(beforeCare!.status).toBe("active");

    const [res] = await sql`select apply_consent_revocation(${danisanA}::uuid) as result`;
    const r = res!.result as { cancelledRandevu: number; endedCare: number };
    expect(r.cancelledRandevu).toBe(1);
    expect(r.endedCare).toBe(1);

    const [afterRnd] =
      await sql`select status, cancel_reason from randevu where danisan_id = ${danisanA}`;
    const [afterCare] =
      await sql`select status from care_relationship where danisan_id = ${danisanA}`;
    expect(afterRnd!.status).toBe("cancelled");
    expect(afterRnd!.cancel_reason).toContain("KVKK");
    expect(afterCare!.status).toBe("ended");

    // danisanB etkilenmemeli (fonksiyon yalnızca p_user'a dokunur).
    const [bRnd] = await sql`select status from randevu where danisan_id = ${danisanB}`;
    expect(bRnd!.status).toBe("requested");
  });
});
