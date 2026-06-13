import {
  pgTable,
  uuid,
  varchar,
  text,
  date,
  boolean,
  integer,
  jsonb,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { bytea, timestamps } from "./_shared";
import { users } from "./users";

export const genderEnum = pgEnum("gender", ["erkek", "kadin"]);
export const bloodTypeEnum = pgEnum("blood_type", [
  "A_pozitif",
  "A_negatif",
  "B_pozitif",
  "B_negatif",
  "AB_pozitif",
  "AB_negatif",
  "O_pozitif",
  "O_negatif",
]);

export const danisan = pgTable(
  "danisan",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Kisisel bilgiler
    tcKimlikEncrypted: bytea("tc_kimlik_encrypted"), // pgcrypto AES-256
    birthDate: date("birth_date"),
    gender: genderEnum("gender"),
    bloodType: bloodTypeEnum("blood_type"),
    occupation: varchar("occupation", { length: 100 }),
    address: text("address"),
    city: varchar("city", { length: 50 }),
    emergencyContact: varchar("emergency_contact", { length: 100 }),
    emergencyPhone: varchar("emergency_phone", { length: 20 }),

    // Saglik gecmisi (anamnez)
    chronicDiseases: jsonb("chronic_diseases").$type<string[]>().default([]),
    allergies: jsonb("allergies").$type<string[]>().default([]),
    currentMedications: jsonb("current_medications").$type<string[]>().default([]),
    previousSurgeries: jsonb("previous_surgeries").$type<string[]>().default([]),
    familyHistory: jsonb("family_history").$type<string[]>().default([]),

    // GETAT ozgu
    previousTreatments: jsonb("previous_treatments").$type<string[]>().default([]),
    mainComplaints: jsonb("main_complaints").$type<string[]>().default([]),

    // Diger
    height: integer("height"), // cm
    weight: integer("weight"), // kg
    smokingStatus: boolean("smoking_status").notNull().default(false),
    alcoholStatus: boolean("alcohol_status").notNull().default(false),
    pregnancyStatus: boolean("pregnancy_status").notNull().default(false),
    notes: text("notes"),
    profileImageUrl: varchar("profile_image_url", { length: 500 }),

    ...timestamps,
  },
  (t) => [index("danisan_user_id_idx").on(t.userId)],
);

export type Danisan = typeof danisan.$inferSelect;
export type NewDanisan = typeof danisan.$inferInsert;
