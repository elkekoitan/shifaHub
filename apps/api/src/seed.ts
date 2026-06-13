import "dotenv/config";
import argon2 from "argon2";
import { and, eq } from "drizzle-orm";
import { db, sql, users, danisan, egitmen, kvkkConsent } from "@shifahub/db";
import type { UserRole } from "@shifahub/shared";

/**
 * Idempotent demo seed. Runs as the DB owner (superuser bypasses RLS), so the
 * profile rows insert directly. Safe to run on every boot — existing users are
 * skipped. Demo-only credentials.
 */
interface DemoUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

const DEMO: DemoUser[] = [
  {
    email: "turhanhamza@gmail.com",
    password: "admin123",
    firstName: "Turhan",
    lastName: "Hamza",
    role: "admin",
  },
  {
    email: "demo.egitmen@shifahub.app",
    password: "egitmen123",
    firstName: "Demo",
    lastName: "Egitmen",
    role: "egitmen",
  },
  {
    email: "demo.danisan@shifahub.app",
    password: "danisan123",
    firstName: "Demo",
    lastName: "Danisan",
    role: "danisan",
  },
];

async function main() {
  for (const u of DEMO) {
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, u.email));
    if (existing.length > 0) {
      console.log("[seed] mevcut:", u.email);
      continue;
    }
    const passwordHash = await argon2.hash(u.password, { type: argon2.argon2id });
    const [created] = await db
      .insert(users)
      .values({
        email: u.email,
        passwordHash,
        role: u.role,
        firstName: u.firstName,
        lastName: u.lastName,
        isEmailVerified: true,
      })
      .returning({ id: users.id });
    if (!created) continue;

    if (u.role === "danisan") {
      await db.insert(danisan).values({ userId: created.id });
    } else if (u.role === "egitmen") {
      await db.insert(egitmen).values({
        userId: created.id,
        approvalStatus: "approved",
        specialties: ["hacamat_kuru", "hacamat_yas", "sujok"],
        clinicName: "Demo Şifa Kliniği",
        clinicCity: "İstanbul",
      });
    }
    console.log("[seed] olusturuldu:", u.email, `(${u.role})`);
  }

  // Demo danisan icin 'saglik_verisi_isleme' rizasi (idempotent + mevcut
  // kullaniciya backfill) — consent-gate demo tedavi/tahlil akisini kirmasin.
  const [demoDan] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, "demo.danisan@shifahub.app"));
  if (demoDan) {
    const existingConsent = await db
      .select({ id: kvkkConsent.id })
      .from(kvkkConsent)
      .where(
        and(
          eq(kvkkConsent.userId, demoDan.id),
          eq(kvkkConsent.purpose, "saglik_verisi_isleme"),
          eq(kvkkConsent.status, "active"),
        ),
      );
    if (existingConsent.length === 0) {
      await db.insert(kvkkConsent).values({
        userId: demoDan.id,
        purpose: "saglik_verisi_isleme",
        description:
          "Saglik verilerinizin (ozel nitelikli kisisel veri) tedavi sureci kapsaminda islenmesine acik riza. (Demo)",
        status: "active",
      });
      console.log("[seed] demo danisan saglik verisi rizasi eklendi");
    }
  }

  await sql.end();
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("[seed] HATA", e);
    process.exit(1);
  });
