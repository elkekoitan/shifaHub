import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  pgEnum,
  inet,
} from "drizzle-orm/pg-core";

export const auditActionEnum = pgEnum("audit_action", [
  "create", "read", "update", "delete",
  "login", "logout", "export", "consent_granted", "consent_revoked",
]);

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id"),
  action: auditActionEnum("action").notNull(),
  tableName: varchar("table_name", { length: 50 }),
  recordId: uuid("record_id"),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  ipAddress: inet("ip_address"),
  userAgent: text("user_agent"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AuditLog = typeof auditLog.$inferSelect;
export type NewAuditLog = typeof auditLog.$inferInsert;
