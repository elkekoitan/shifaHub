import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { bytea, timestamps } from "./_shared";

export const userRoleEnum = pgEnum("user_role", ["danisan", "egitmen", "admin", "tabip"]);

/**
 * Auth root table. PII is encrypted at rest: the full phone/TC live in `bytea`
 * pgcrypto columns; only the last 4 digits are kept in plaintext for UI display
 * (per the KVKK rule "son 4 hane UI'da, tam numara DB'de sifreli").
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").notNull().default("danisan"),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),

    // KVKK: encrypted PII + plaintext last-4 for display.
    phoneLast4: varchar("phone_last4", { length: 4 }),
    phoneEncrypted: bytea("phone_encrypted"),
    tcKimlikEncrypted: bytea("tc_kimlik_encrypted"),

    isEmailVerified: boolean("is_email_verified").notNull().default(false),
    isPhoneVerified: boolean("is_phone_verified").notNull().default(false),
    isMfaEnabled: boolean("is_mfa_enabled").notNull().default(false),
    mfaSecret: text("mfa_secret"),
    isActive: boolean("is_active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at"),
    ...timestamps,
  },
  (t) => [index("users_role_idx").on(t.role)],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
