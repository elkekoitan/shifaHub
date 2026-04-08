import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import argon2 from "argon2";
import * as schema from "./schema/index.js";

const connectionString = process.env.DATABASE_URL!;
if (!connectionString) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function seed() {
  console.log("🌱 Seeding database...");

  // Admin kullanici
  const adminPassword = await argon2.hash("admin123");
  const [admin] = await db
    .insert(schema.users)
    .values({
      email: "turhanhamza@gmail.com",
      passwordHash: adminPassword,
      role: "admin",
      firstName: "Turhan",
      lastName: "Hamza",
      isEmailVerified: true,
      isActive: true,
    })
    .onConflictDoNothing({ target: schema.users.email })
    .returning();

  if (admin) {
    console.log(`✅ Admin olusturuldu: ${admin.email} (ID: ${admin.id})`);

    // KVKK consent
    await db.insert(schema.kvkkConsent).values({
      userId: admin.id,
      purpose: "saglik_verisi_isleme",
      description: "Platform yonetimi icin veri isleme rizasi",
      version: 1,
    });
    console.log("✅ Admin KVKK consent olusturuldu");

    // Audit log
    await db.insert(schema.auditLog).values({
      userId: admin.id,
      action: "create",
      tableName: "users",
      recordId: admin.id,
      description: "Seed: Admin kullanici olusturuldu",
    });
  } else {
    console.log("ℹ️ Admin zaten mevcut: turhanhamza@gmail.com");
  }

  // Demo egitmen
  const egitmenPassword = await argon2.hash("egitmen123");
  const [egitmen] = await db
    .insert(schema.users)
    .values({
      email: "demo.egitmen@shifahub.app",
      passwordHash: egitmenPassword,
      role: "egitmen",
      firstName: "Ahmet",
      lastName: "Yilmaz",
      phone: "05321234567",
      isEmailVerified: true,
      isActive: true,
    })
    .onConflictDoNothing({ target: schema.users.email })
    .returning();

  if (egitmen) {
    console.log(`✅ Demo egitmen olusturuldu: ${egitmen.email}`);

    await db.insert(schema.egitmen).values({
      userId: egitmen.id,
      certificateNumber: "GETAT-2024-001",
      certificateIssuer: "Saglik Bakanligi",
      specialties: ["hacamat_kuru", "hacamat_yas", "solucan"],
      clinicName: "Sifa Merkezi",
      clinicCity: "Istanbul",
      approvalStatus: "approved",
      defaultSessionDuration: "60",
      workingHoursStart: "09:00",
      workingHoursEnd: "18:00",
      workingDays: [1, 2, 3, 4, 5],
    });
    console.log("✅ Egitmen profili olusturuldu");

    // Musaitlik
    for (const day of [1, 2, 3, 4, 5]) {
      await db.insert(schema.musaitlik).values({
        egitmenId: egitmen.id,
        dayOfWeek: day,
        startTime: "09:00",
        endTime: "18:00",
        slotDuration: 60,
        isActive: true,
      });
    }
    console.log("✅ Egitmen musaitlik ayarlandi (Pzt-Cum 09:00-18:00)");

    // Demo stok
    const stokItems = [
      { name: "Cam Kupa 5cm", category: "kupa" as const, quantity: 20, unit: "adet", minimumLevel: 5 },
      { name: "Cam Kupa 7cm", category: "kupa" as const, quantity: 15, unit: "adet", minimumLevel: 5 },
      { name: "Tibbi Suluk", category: "suluk" as const, quantity: 50, unit: "adet", minimumLevel: 10 },
      { name: "Steril Eldiven (M)", category: "sarf" as const, quantity: 100, unit: "cift", minimumLevel: 20 },
      { name: "Dezenfektan 500ml", category: "sarf" as const, quantity: 8, unit: "sise", minimumLevel: 3 },
      { name: "Corek Otu Yagi 100ml", category: "bitkisel" as const, quantity: 12, unit: "sise", minimumLevel: 3 },
    ];

    for (const item of stokItems) {
      await db.insert(schema.stok).values(item);
    }
    console.log(`✅ ${stokItems.length} stok kalemi eklendi`);
  }

  // Demo danisan
  const danisanPassword = await argon2.hash("danisan123");
  const [danisan] = await db
    .insert(schema.users)
    .values({
      email: "demo.danisan@shifahub.app",
      passwordHash: danisanPassword,
      role: "danisan",
      firstName: "Ayse",
      lastName: "Demir",
      phone: "05339876543",
      isEmailVerified: true,
      isActive: true,
    })
    .onConflictDoNothing({ target: schema.users.email })
    .returning();

  if (danisan) {
    console.log(`✅ Demo danisan olusturuldu: ${danisan.email}`);

    await db.insert(schema.danisan).values({
      userId: danisan.id,
      birthDate: "1990-05-15",
      gender: "kadin",
      bloodType: "A_pozitif",
      city: "Istanbul",
      occupation: "Ogretmen",
      chronicDiseases: ["migren"],
      allergies: ["penisilin"],
      mainComplaints: ["kronik bas agrisi", "boyun tutulmasi"],
      height: 165,
      weight: 62,
    });
    console.log("✅ Danisan profili olusturuldu");

    // KVKK consent
    await db.insert(schema.kvkkConsent).values({
      userId: danisan.id,
      purpose: "saglik_verisi_isleme",
      description: "Saglik verilerimin ShifaHub platformunda islenmesini kabul ediyorum",
      version: 1,
    });
  }

  console.log("\n🎉 Seed tamamlandi!");
  console.log("---");
  console.log("Admin:   turhanhamza@gmail.com / admin123");
  console.log("Egitmen: demo.egitmen@shifahub.app / egitmen123");
  console.log("Danisan: demo.danisan@shifahub.app / danisan123");

  await client.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed hatasi:", err);
  process.exit(1);
});
