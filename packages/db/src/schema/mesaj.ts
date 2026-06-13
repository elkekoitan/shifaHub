import { pgTable, uuid, text, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { timestamps } from "./_shared";
import { users } from "./users";

export const mesaj = pgTable(
  "mesaj",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id),
    receiverId: uuid("receiver_id")
      .notNull()
      .references(() => users.id),
    content: text("content").notNull(),
    isRead: boolean("is_read").notNull().default(false),
    readAt: timestamp("read_at"),
    ...timestamps,
  },
  (t) => [
    index("mesaj_sender_id_idx").on(t.senderId),
    index("mesaj_receiver_id_idx").on(t.receiverId),
  ],
);

export type Mesaj = typeof mesaj.$inferSelect;
export type NewMesaj = typeof mesaj.$inferInsert;
