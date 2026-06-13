import { customType, timestamp } from "drizzle-orm/pg-core";

/**
 * Postgres `bytea`. Used for every pgcrypto-encrypted column (TC kimlik, phone,
 * special-category health data). Drizzle has no native bytea, so we declare it.
 */
export const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

/**
 * Standard audit timestamps attached to every table. `updatedAt` auto-bumps on
 * update (the old schema left it stale).
 */
export const timestamps = {
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
};
