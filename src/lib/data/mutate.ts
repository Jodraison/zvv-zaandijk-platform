import type { ClubDatabase } from "@/types";
import { readDbForWrite, writeClubDatabaseDiff } from "./repository";
import { revalidateClubDataAfterMutation } from "./revalidate-club";
import { assertCapability, type Capability } from "@/lib/auth/capabilities";
import { logAdminAction } from "@/lib/auth/admin-log";

export type AdminAuditMeta = {
  action: string | (() => string);
  entity: string | (() => string);
  /** Vaste id of resolver na `fn` (bijv. nieuwe UUID binnen de draft). */
  entity_id?: string | null | (() => string | null | undefined);
  before_snapshot?: unknown | (() => unknown);
  after_snapshot?: unknown | (() => unknown);
  verification?: unknown | (() => unknown);
  /** Vereiste capability; default teamtaken. */
  capability?: Capability;
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
 * Geautoriseerde mutatie: capability-check, snapshot vóór/na, diff naar Supabase, auditlog.
 * Default capability: manage_squad (teambeheerder + owner).
 */
export async function mutateDb(fn: (draft: ClubDatabase) => void, audit: AdminAuditMeta): Promise<void> {
  const { userId } = await assertCapability(audit.capability ?? "manage_squad");
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
