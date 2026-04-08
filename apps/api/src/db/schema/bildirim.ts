import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const notificationTypeEnum = pgEnum("notification_type", [
  "randevu_hatirlatma",
  "randevu_onay",
  "randevu_iptal",
  "tedavi_ozeti",
  "tahlil_sonucu",
  "mesaj",
  "egitmen_onay",
  "sistem",
  "kvkk",
]);

export const bildirim = pgTable("bildirim", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  body: text("body"),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  actionUrl: varchar("action_url", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Bildirim = typeof bildirim.$inferSelect;
export type NewBildirim = typeof bildirim.$inferInsert;
