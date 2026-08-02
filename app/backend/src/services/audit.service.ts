import { prisma } from "../db.js";

type AuditInput = {
  organizationId: string;
  userId: string;
  entityType: string;
  entityId: string;
  action: string;
  before?: unknown;
  after?: unknown;
};

export async function recordAudit(input: AuditInput) {
  return prisma.auditLog.create({
    data: {
      organizationId: input.organizationId,
      userId: input.userId,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      beforeJson: input.before === undefined ? undefined : JSON.parse(JSON.stringify(input.before)),
      afterJson: input.after === undefined ? undefined : JSON.parse(JSON.stringify(input.after))
    }
  });
}
