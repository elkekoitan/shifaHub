import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const priorityEnum = pgEnum("complaint_priority", ["1", "2", "3", "4"]);
// 1=Acil, 2=Yuksek, 3=Normal, 4=Takip

export const protokol = pgTable("protokol", {
  id: uuid("id").primaryKey().defaultRandom(),
  danisanId: uuid("danisan_id").notNull().references(() => users.id),
  egitmenId: uuid("egitmen_id").notNull().references(() => users.id),

  // Protokol bilgileri
  title: varchar("title", { length: 200 }),
  status: varchar("status", { length: 20 }).default("active"), // active, completed, paused

  // Sikayetler ve tedavi plani
  complaints: jsonb("complaints").$type<Array<{
    description: string;
    priority: number; // 1-Acil, 2-Yuksek, 3-Normal, 4-Takip
    treatmentMethod: string; // hacamat, solucan, sujok, vs.
    estimatedSessions: number;
    sessionInterval: string; // "haftalik", "2 haftalik", "aylik"
    order: number; // tedavi sirasi
    status: string; // pending, in_progress, completed
  }>>().default([]),

  // Destekleyici uygulamalar
  supportingTreatments: jsonb("supporting_treatments").$type<string[]>().default([]),
  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Protokol = typeof protokol.$inferSelect;
