import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const approvalStatusEnum = pgEnum("approval_status", [
  "pending", "approved", "rejected",
]);

export const egitmen = pgTable("egitmen", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Sertifika bilgileri
  certificateNumber: varchar("certificate_number", { length: 50 }),
  certificateIssuer: varchar("certificate_issuer", { length: 200 }),
  certificateDate: timestamp("certificate_date"),
  certificateFileUrl: varchar("certificate_file_url", { length: 500 }),

  // Uzmanlik alanlari
  specialties: jsonb("specialties").$type<string[]>().default([]),
  // hacamat_kuru, hacamat_yas, solucan, sujok, refleksoloji, akupunktur, fitoterapi, vs.

  // Klinik bilgileri
  clinicName: varchar("clinic_name", { length: 200 }),
  clinicAddress: text("clinic_address"),
  clinicCity: varchar("clinic_city", { length: 50 }),
  clinicPhone: varchar("clinic_phone", { length: 20 }),

  // Sorumlu tabip
  supervisingPhysicianId: uuid("supervising_physician_id"),
  supervisingPhysicianName: varchar("supervising_physician_name", { length: 100 }),

  // Onay durumu
  approvalStatus: approvalStatusEnum("approval_status").default("pending"),
  approvedBy: uuid("approved_by"),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),

  // Musaitlik
  defaultSessionDuration: varchar("default_session_duration", { length: 10 }).default("60"),
  workingDays: jsonb("working_days").$type<number[]>().default([1, 2, 3, 4, 5]),
  workingHoursStart: varchar("working_hours_start", { length: 5 }).default("09:00"),
  workingHoursEnd: varchar("working_hours_end", { length: 5 }).default("18:00"),

  // Profil
  bio: text("bio"),
  profileImageUrl: varchar("profile_image_url", { length: 500 }),
  isActive: boolean("is_active").default(true),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Egitmen = typeof egitmen.$inferSelect;
export type NewEgitmen = typeof egitmen.$inferInsert;
