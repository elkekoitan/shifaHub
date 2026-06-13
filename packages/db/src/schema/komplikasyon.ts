import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { timestamps } from "./_shared";
import { users } from "./users";
import { tedavi } from "./tedavi";

/**
 * Komplikasyon raporlari. Bir tedavi sonrasi olusan yan etki/komplikasyonun
 * siddeti (severity 1-5) ve takip surecini kayit altina alir.
 */
export const komplikasyon = pgTable(
  "komplikasyon",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    danisanId: uuid("danisan_id")
      .notNull()
      .references(() => users.id),
    egitmenId: uuid("egitmen_id")
      .notNull()
      .references(() => users.id),
    tedaviId: uuid("tedavi_id").references(() => tedavi.id),

    severity: integer("severity").notNull(), // 1-5
    type: varchar("type", { length: 100 }).notNull(),
    description: text("description").notNull(),
    imageUrls: jsonb("image_urls").$type<string[]>().default([]),

    // Takip
    status: varchar("status", { length: 20 }).notNull().default("open"), // open, following, resolved
    followUp24h: text("follow_up_24h"),
    followUp48h: text("follow_up_48h"),
    followUp1w: text("follow_up_1w"),
    resolvedAt: timestamp("resolved_at"),
    resolution: text("resolution"),

    ...timestamps,
  },
  (t) => [
    index("komplikasyon_danisan_idx").on(t.danisanId),
    index("komplikasyon_egitmen_idx").on(t.egitmenId),
    index("komplikasyon_tedavi_idx").on(t.tedaviId),
  ],
);

export type Komplikasyon = typeof komplikasyon.$inferSelect;
export type NewKomplikasyon = typeof komplikasyon.$inferInsert;
