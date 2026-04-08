import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const tedavi = pgTable("tedavi", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Iliskiler
  danisanId: uuid("danisan_id").notNull().references(() => users.id),
  egitmenId: uuid("egitmen_id").notNull().references(() => users.id),
  randevuId: uuid("randevu_id"), // opsiyonel randevu baglantisi

  // Tedavi bilgileri
  treatmentType: varchar("treatment_type", { length: 50 }).notNull(),
  sessionNumber: integer("session_number").default(1),
  treatmentDate: timestamp("treatment_date").notNull(),

  // Sikayetler (oncelik bazli, max 5)
  complaints: jsonb("complaints").$type<{
    priority: number;
    description: string;
    bodyArea?: string;
  }[]>().default([]),

  // Bulgular
  findings: text("findings"),
  vitalSigns: jsonb("vital_signs").$type<{
    bloodPressure?: string;
    pulse?: number;
    temperature?: number;
    weight?: number;
  }>(),

  // Uygulanan tedavi
  appliedTreatment: text("applied_treatment"),
  treatmentDetails: jsonb("treatment_details").$type<{
    cupsUsed?: number;
    cupsLocations?: string[];
    leechCount?: number;
    needlePoints?: string[];
    herbsUsed?: string[];
    duration?: number;
  }>(),

  // Oncesi/Sonrasi
  beforeNotes: text("before_notes"),
  afterNotes: text("after_notes"),
  beforeImageUrls: jsonb("before_image_urls").$type<string[]>().default([]),
  afterImageUrls: jsonb("after_image_urls").$type<string[]>().default([]),

  // Oneriler
  recommendations: text("recommendations"),
  nextSessionDate: timestamp("next_session_date"),
  nextSessionNotes: text("next_session_notes"),

  // Kontraendikasyonlar
  contraindications: jsonb("contraindications").$type<string[]>().default([]),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Tedavi = typeof tedavi.$inferSelect;
export type NewTedavi = typeof tedavi.$inferInsert;
