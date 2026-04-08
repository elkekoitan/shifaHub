import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "requested",
  "confirmed",
  "reminded",
  "arrived",
  "treated",
  "completed",
  "cancelled",
  "no_show",
]);

export const randevu = pgTable("randevu", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Iliskiler
  danisanId: uuid("danisan_id").notNull().references(() => users.id),
  egitmenId: uuid("egitmen_id").notNull().references(() => users.id),

  // Zaman
  scheduledAt: timestamp("scheduled_at").notNull(),
  duration: integer("duration").notNull().default(60), // dakika
  endAt: timestamp("end_at"),

  // Durum
  status: appointmentStatusEnum("status").notNull().default("requested"),
  statusChangedAt: timestamp("status_changed_at"),

  // Hicri takvim
  hijriDate: varchar("hijri_date", { length: 30 }), // "17 Ramazan 1447"
  isSunnahDay: varchar("is_sunnah_day", { length: 5 }), // "true"/"false"

  // Tedavi bilgisi
  treatmentType: varchar("treatment_type", { length: 50 }),
  complaints: text("complaints"),
  notes: text("notes"),

  // Iptal
  cancelledBy: uuid("cancelled_by"),
  cancelReason: text("cancel_reason"),

  // Hatirlatma
  reminder24hSent: varchar("reminder_24h_sent", { length: 5 }).default("false"),
  reminder1hSent: varchar("reminder_1h_sent", { length: 5 }).default("false"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Randevu = typeof randevu.$inferSelect;
export type NewRandevu = typeof randevu.$inferInsert;
