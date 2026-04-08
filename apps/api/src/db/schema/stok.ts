import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  numeric,
  date,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const stockCategoryEnum = pgEnum("stock_category", [
  "kupa",
  "suluk",
  "sarf",
  "bitkisel",
  "igne",
  "diger",
]);

export const stok = pgTable("stok", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  category: stockCategoryEnum("category").notNull(),
  quantity: integer("quantity").notNull().default(0),
  unit: varchar("unit", { length: 20 }).notNull().default("adet"),
  minimumLevel: integer("minimum_level").default(5),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }),
  batchNumber: varchar("batch_number", { length: 50 }),
  expiryDate: date("expiry_date"),
  supplier: varchar("supplier", { length: 200 }),
  location: varchar("location", { length: 100 }),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const stokHareket = pgTable("stok_hareket", {
  id: uuid("id").primaryKey().defaultRandom(),
  stokId: uuid("stok_id").notNull().references(() => stok.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  type: varchar("type", { length: 10 }).notNull(), // "giris" | "cikis"
  quantity: integer("quantity").notNull(),
  reason: varchar("reason", { length: 200 }),
  tedaviId: uuid("tedavi_id"), // otomatik dusme icin
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Stok = typeof stok.$inferSelect;
export type StokHareket = typeof stokHareket.$inferSelect;
