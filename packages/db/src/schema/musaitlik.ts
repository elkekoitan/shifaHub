import { pgTable, uuid, varchar, timestamp, integer, boolean, index } from "drizzle-orm/pg-core";
import { timestamps } from "./_shared";
import { users } from "./users";

export const musaitlik = pgTable(
  "musaitlik",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    egitmenId: uuid("egitmen_id")
      .notNull()
      .references(() => users.id),

    // Haftalik program
    dayOfWeek: integer("day_of_week").notNull(), // 0=Pazar, 1=Pazartesi, ..., 6=Cumartesi
    startTime: varchar("start_time", { length: 5 }).notNull(), // "09:00"
    endTime: varchar("end_time", { length: 5 }).notNull(), // "18:00"
    slotDuration: integer("slot_duration").notNull().default(60), // dakika
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (t) => [index("musaitlik_egitmen_id_idx").on(t.egitmenId)],
);

// Ozel gun bloklari (tatil, izin, vs.)
export const blockedSlot = pgTable(
  "blocked_slot",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    egitmenId: uuid("egitmen_id")
      .notNull()
      .references(() => users.id),
    startAt: timestamp("start_at").notNull(),
    endAt: timestamp("end_at").notNull(),
    reason: varchar("reason", { length: 200 }),
    ...timestamps,
  },
  (t) => [index("blocked_slot_egitmen_id_idx").on(t.egitmenId)],
);

export type Musaitlik = typeof musaitlik.$inferSelect;
export type NewMusaitlik = typeof musaitlik.$inferInsert;
export type BlockedSlot = typeof blockedSlot.$inferSelect;
export type NewBlockedSlot = typeof blockedSlot.$inferInsert;
