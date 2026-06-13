import { pgTable, uuid, varchar, text, jsonb, inet, pgEnum, index } from "drizzle-orm/pg-core";
import { timestamps } from "./_shared";
import { users } from "./users";

export const auditActionEnum = pgEnum("audit_action", [
  "create",
  "read",
  "update",
  "delete",
  "login",
  "logout",
  "export",
  "consent_granted",
  "consent_revoked",
]);

/**
 * APPEND-ONLY uyum (KVKK) denetim tablosu. Her veri erisiminde kayit yazilir;
 * kayitlar guncellenmez/silinmez. `userId` system kaynakli olaylar icin
 * nullable (kullanici silinse de denetim izi korunur -> onDelete set null).
 */
export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: auditActionEnum("action").notNull(),
    tableName: varchar("table_name", { length: 50 }),
    recordId: uuid("record_id"),
    oldValues: jsonb("old_values"),
    newValues: jsonb("new_values"),
    ipAddress: inet("ip_address"),
    userAgent: text("user_agent"),
    description: text("description"),
    ...timestamps,
  },
  (t) => [
    index("audit_log_user_id_idx").on(t.userId),
    index("audit_log_table_name_idx").on(t.tableName),
    index("audit_log_created_at_idx").on(t.createdAt),
  ],
);

export type AuditLog = typeof auditLog.$inferSelect;
export type NewAuditLog = typeof auditLog.$inferInsert;
