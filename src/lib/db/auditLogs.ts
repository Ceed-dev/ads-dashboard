import { FieldValue } from "firebase-admin/firestore";
import { collections } from "@/lib/firebase/admin";

export type AuditAction =
  | "advertiser.create"
  | "advertiser.update"
  | "advertiser.suspend"
  | "ad.create"
  | "ad.update"
  | "ad.publish"
  | "ad.pause"
  | "ad.archive"
  | "ad.duplicate";

export type AuditEntityType = "advertiser" | "ad" | "adminUser";

export interface CreateAuditLogInput {
  actorUid: string;
  actorEmail: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(input: CreateAuditLogInput): Promise<string> {
  const docRef = collections.auditLogs.doc();

  await docRef.set({
    actorUid: input.actorUid,
    actorEmail: input.actorEmail,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    before: input.before || null,
    after: input.after || null,
    meta: {
      createdAt: FieldValue.serverTimestamp(),
    },
  });

  return docRef.id;
}

/**
 * Helper to log advertiser mutations
 */
export async function logAdvertiserMutation(
  action: "advertiser.create" | "advertiser.update" | "advertiser.suspend",
  actorUid: string,
  actorEmail: string,
  entityId: string,
  before?: Record<string, unknown>,
  after?: Record<string, unknown>
): Promise<void> {
  await createAuditLog({
    actorUid,
    actorEmail,
    action,
    entityType: "advertiser",
    entityId,
    before,
    after,
  });
}

/**
 * Helper to log ad mutations
 */
export async function logAdMutation(
  action: "ad.create" | "ad.update" | "ad.publish" | "ad.pause" | "ad.archive" | "ad.duplicate",
  actorUid: string,
  actorEmail: string,
  entityId: string,
  before?: Record<string, unknown>,
  after?: Record<string, unknown>
): Promise<void> {
  await createAuditLog({
    actorUid,
    actorEmail,
    action,
    entityType: "ad",
    entityId,
    before,
    after,
  });
}
