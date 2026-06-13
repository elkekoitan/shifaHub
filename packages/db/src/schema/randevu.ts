import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { timestamps } from "./_shared";
import { users } from "./users";

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "requested",
  "confirmed",
  "reminded",
  "arrived",
  "treated",
  "completed",
  "cancelled",
  "no_show",
  "ertelendi",
]);

export const randevu = pgTable(
  "randevu",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Iliskiler
    danisanId: uuid("danisan_id")
      .notNull()
      .references(() => users.id),
    egitmenId: uuid("egitmen_id")
      .notNull()
      .references(() => users.id),

    // Zaman
    scheduledAt: timestamp("scheduled_at").notNull(),
    duration: integer("duration").notNull().default(60), // dakika
    endAt: timestamp("end_at"),

    // Durum
    status: appointmentStatusEnum("status").notNull().default("requested"),
    statusChangedAt: timestamp("status_changed_at"),

    // Hicri takvim
    hijriDate: varchar("hijri_date", { length: 30 }), // "17 Ramazan 1447"
    isSunnahDay: boolean("is_sunnah_day").default(false),

    // Tedavi bilgisi
    treatmentType: varchar("treatment_type", { length: 50 }),
    complaints: text("complaints"),
    notes: text("notes"),

    // Iptal
    cancelledBy: uuid("cancelled_by"),
    cancelReason: text("cancel_reason"),

    // Hatirlatma
    reminder24hSent: boolean("reminder_24h_sent").notNull().default(false),
    reminder1hSent: boolean("reminder_1h_sent").notNull().default(false),

    ...timestamps,
  },
  (t) => [
    index("randevu_danisan_id_idx").on(t.danisanId),
    index("randevu_egitmen_id_idx").on(t.egitmenId),
  ],
);

export type Randevu = typeof randevu.$inferSelect;
export type NewRandevu = typeof randevu.$inferInsert;
