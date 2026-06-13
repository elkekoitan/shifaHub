import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  numeric,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { timestamps } from "./_shared";
import { users } from "./users";

export const paymentMethodEnum = pgEnum("payment_method", ["nakit", "kart", "havale", "eft"]);

export const paymentStatusEnum = pgEnum("payment_status", ["paid", "pending", "partial", "free"]);

export const odeme = pgTable(
  "odeme",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    danisanId: uuid("danisan_id")
      .notNull()
      .references(() => users.id),
    egitmenId: uuid("egitmen_id")
      .notNull()
      .references(() => users.id),
    tedaviId: uuid("tedavi_id"),

    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    paidAmount: numeric("paid_amount", { precision: 10, scale: 2 }).default("0"),
    method: paymentMethodEnum("method"),
    status: paymentStatusEnum("status").notNull().default("pending"),

    description: text("description"),
    receiptNumber: varchar("receipt_number", { length: 50 }),
    notes: text("notes"),

    paidAt: timestamp("paid_at"),
    ...timestamps,
  },
  (t) => [
    index("odeme_danisan_id_idx").on(t.danisanId),
    index("odeme_egitmen_id_idx").on(t.egitmenId),
    index("odeme_tedavi_id_idx").on(t.tedaviId),
  ],
);

export type Odeme = typeof odeme.$inferSelect;
export type NewOdeme = typeof odeme.$inferInsert;
