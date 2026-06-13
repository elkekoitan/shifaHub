import { pgTable, uuid, pgEnum, index, unique } from "drizzle-orm/pg-core";
import { users } from "./users";
import { timestamps } from "./_shared";

export const careRelationshipStatusEnum = pgEnum("care_relationship_status", ["active", "ended"]);

/**
 * Explicit care relationship between an eğitmen and a danışan. This is the
 * gate RLS uses to decide whether an eğitmen may read a danışan's clinical rows
 * (tedavi, tahlil, protokol, full danışan detail). The old code derived this
 * implicitly from the existence of an appointment; modelling it explicitly makes
 * the RLS `EXISTS` policies simple and auditable. A row is created when an
 * appointment is confirmed and set to `ended` when care concludes.
 */
export const careRelationship = pgTable(
  "care_relationship",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    danisanId: uuid("danisan_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    egitmenId: uuid("egitmen_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: careRelationshipStatusEnum("status").notNull().default("active"),
    ...timestamps,
  },
  (t) => [
    index("care_rel_danisan_idx").on(t.danisanId),
    index("care_rel_egitmen_idx").on(t.egitmenId),
    unique("care_rel_unique").on(t.danisanId, t.egitmenId),
  ],
);

export type CareRelationship = typeof careRelationship.$inferSelect;
export type NewCareRelationship = typeof careRelationship.$inferInsert;
