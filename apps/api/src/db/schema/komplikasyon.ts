import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const severityEnum = pgEnum("severity_level", ["1", "2", "3", "4", "5"]);

export const komplikasyon = pgTable("komplikasyon", {
  id: uuid("id").primaryKey().defaultRandom(),
  danisanId: uuid("danisan_id").notNull().references(() => users.id),
  egitmenId: uuid("egitmen_id").notNull().references(() => users.id),
  tedaviId: uuid("tedavi_id"),

  severity: severityEnum("severity").notNull(),
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

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Komplikasyon = typeof komplikasyon.$inferSelect;
