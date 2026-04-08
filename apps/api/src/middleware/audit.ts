import type { FastifyRequest } from "fastify";
import { db } from "../db/index.js";
import { auditLog } from "../db/schema/audit_log.js";

type AuditAction = "create" | "read" | "update" | "delete" | "login" | "logout" | "export" | "consent_granted" | "consent_revoked";

export async function createAuditLog(params: {
  userId?: string;
  action: AuditAction;
  tableName?: string;
  recordId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  description?: string;
  request?: FastifyRequest;
}) {
  await db.insert(auditLog).values({
    userId: params.userId,
    action: params.action,
    tableName: params.tableName,
    recordId: params.recordId,
    oldValues: params.oldValues,
    newValues: params.newValues,
    ipAddress: params.request?.ip,
    userAgent: params.request?.headers["user-agent"] || undefined,
    description: params.description,
  });
}
