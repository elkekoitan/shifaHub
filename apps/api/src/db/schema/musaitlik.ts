import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const musaitlik = pgTable("musaitlik", {
  id: uuid("id").primaryKey().defaultRandom(),
  egitmenId: uuid("egitmen_id").notNull().references(() => users.id),

  // Haftalik program
  dayOfWeek: integer("day_of_week").notNull(), // 0=Pazar, 1=Pazartesi, ..., 6=Cumartesi
  startTime: varchar("start_time", { length: 5 }).notNull(), // "09:00"
  endTime: varchar("end_time", { length: 5 }).notNull(), // "18:00"
  slotDuration: integer("slot_duration").notNull().default(60), // dakika
  isActive: boolean("is_active").default(true),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Ozel gun bloklari (tatil, izin, vs.)
export const blockedSlot = pgTable("blocked_slot", {
  id: uuid("id").primaryKey().defaultRandom(),
  egitmenId: uuid("egitmen_id").notNull().references(() => users.id),
  startAt: timestamp("start_at").notNull(),
  endAt: timestamp("end_at").notNull(),
  reason: varchar("reason", { length: 200 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Musaitlik = typeof musaitlik.$inferSelect;
export type BlockedSlot = typeof blockedSlot.$inferSelect;
