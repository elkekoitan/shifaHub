import { pgTable, uuid, integer, text, index } from "drizzle-orm/pg-core";
import { timestamps } from "./_shared";
import { users } from "./users";

/**
 * Danışan geri bildirimi — memnuniyet puanı (1-5) + serbest yorum. İsteğe bağlı
 * `egitmenId` ile eğitmene özel; boşsa genel platform geri bildirimi (admin görür).
 * RLS: danışan kendi yazar/görür, eğitmen hakkındakini görür, admin hepsini.
 */
export const geriBildirim = pgTable(
  "geri_bildirim",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    danisanId: uuid("danisan_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    egitmenId: uuid("egitmen_id").references(() => users.id, { onDelete: "set null" }),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    ...timestamps,
  },
  (t) => [
    index("geri_bildirim_danisan_idx").on(t.danisanId),
    index("geri_bildirim_egitmen_idx").on(t.egitmenId),
  ],
);

export type GeriBildirim = typeof geriBildirim.$inferSelect;
export type NewGeriBildirim = typeof geriBildirim.$inferInsert;
