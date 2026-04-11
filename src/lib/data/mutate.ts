import type { ClubDatabase } from "@/types";
import { readDbForWrite, writeClubDatabaseDiff } from "./repository";
import { revalidateClubDataAfterMutation } from "./revalidate-club";
import { assertAdminServerAction } from "@/lib/auth/require-admin";
import { logAdminAction } from "@/lib/auth/admin-log";

export type AdminAuditMeta = {
  action: string | (() => string);
  entity: string | (() => string);
  /** Vaste id of resolver na `fn` (bijv. nieuwe UUID binnen de draft). */
  entity_id?: string | null | (() => string | null | undefined);
  before_snapshot?: unknown | (() => unknown);
  after_snapshot?: unknown | (() => unknown);
  verification?: unknown | (() => unknown);
};

function resolveEntityId(v: AdminAuditMeta["entity_id"]): string | null {
  if (v === undefined || v === null) return null;
  if (typeof v === "function") return v() ?? null;
  return v;
}

function resolveAny(v: unknown | (() => unknown) | undefined): unknown {
  if (typeof v === "function") return (v as () => unknown)();
  return v;
}

function cloneClubDatabase(db: ClubDatabase): ClubDatabase {
  return structuredClone(db);
}

/**
 * Admin-only mutatie: snapshot vóór/na, alleen gewijzigde rijen naar Supabase, optimistic lock op schema_version, auditlog.
 */
export async function mutateDb(fn: (draft: ClubDatabase) => void, audit: AdminAuditMeta): Promise<void> {
  const { userId } = await assertAdminServerAction();
  const { db, schemaVersion } = await readDbForWrite();
  const before = cloneClubDatabase(db);
  fn(db);
  await writeClubDatabaseDiff(before, db, schemaVersion);
  revalidateClubDataAfterMutation();
  void logAdminAction({
    userId,
    action: String(resolveAny(audit.action) ?? ""),
    entity: String(resolveAny(audit.entity) ?? ""),
    entity_id: resolveEntityId(audit.entity_id),
    before_snapshot: resolveAny(audit.before_snapshot),
    after_snapshot: resolveAny(audit.after_snapshot),
    verification: resolveAny(audit.verification),
  });
}
