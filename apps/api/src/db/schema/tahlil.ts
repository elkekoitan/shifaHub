import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const tahlil = pgTable("tahlil", {
  id: uuid("id").primaryKey().defaultRandom(),
  danisanId: uuid("danisan_id").notNull().references(() => users.id),
  egitmenId: uuid("egitmen_id"), // tahlili isteyen egitmen

  // Tahlil bilgileri
  testDate: timestamp("test_date").notNull(),
  testType: varchar("test_type", { length: 100 }).notNull(), // hemogram, biyokimya, tiroid, vs.
  labName: varchar("lab_name", { length: 200 }),

  // Degerler
  values: jsonb("values").$type<{
    name: string;
    value: number;
    unit: string;
    referenceMin?: number;
    referenceMax?: number;
    isOutOfRange?: boolean;
  }[]>().default([]),

  // Dosya
  fileUrl: varchar("file_url", { length: 500 }), // MinIO'da tahlil PDF/gorsel
  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Tahlil = typeof tahlil.$inferSelect;
export type NewTahlil = typeof tahlil.$inferInsert;
