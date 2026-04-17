import { database } from "@packages/db";

type AuditAction =
  | "claim.approve"
  | "claim.reject"
  | "user.role_change"
  | "profile.link"
  | "profile.merge"
  | "organization.create"
  | "organization.delete"
  | "grant.status_change"
  | "bounty.status_change"
  | "import.trigger";

interface AuditLogOptions {
  action: AuditAction;
  actorId: string;
  targetId: string;
  targetType: string;
  metadata?: Record<string, unknown>;
}

/**
 * Create an audit log entry for sensitive operations.
 */
export async function auditLog({
  action,
  actorId,
  targetId,
  targetType,
  metadata,
}: AuditLogOptions): Promise<void> {
  await database.auditLog.create({
    data: {
      action,
      actorId,
      targetId,
      targetType,
      metadata: metadata ?? undefined,
    },
  });
}
