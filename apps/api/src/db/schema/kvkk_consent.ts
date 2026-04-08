import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const consentStatusEnum = pgEnum("consent_status", [
  "active", "revoked", "expired",
]);

export const kvkkConsent = pgTable("kvkk_consent", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Riza detaylari
  purpose: varchar("purpose", { length: 100 }).notNull(),
  // saglik_verisi_isleme, iletisim, pazarlama, ucuncu_taraf_paylasim
  description: text("description").notNull(),
  version: integer("version").notNull().default(1),
  status: consentStatusEnum("status").notNull().default("active"),

  // Zaman bilgileri
  grantedAt: timestamp("granted_at").defaultNow().notNull(),
  revokedAt: timestamp("revoked_at"),
  expiresAt: timestamp("expires_at"),

  // Dogrulama
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  isDigitallySigned: boolean("is_digitally_signed").default(false),
  signatureData: text("signature_data"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type KvkkConsent = typeof kvkkConsent.$inferSelect;
export type NewKvkkConsent = typeof kvkkConsent.$inferInsert;
