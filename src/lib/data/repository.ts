import type { ClubDatabase } from "@/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadClubDatabaseFromSupabase } from "@/lib/data/supabase-db";
import { applyClubDatabaseDiff } from "@/lib/data/apply-club-database-diff";

export type ReadDbForWriteResult = { db: ClubDatabase; schemaVersion: number };

const AUTH_DEBUG = process.env.SUPABASE_DEBUG_AUTH === "1" || process.env.SUPABASE_DEBUG_AUTH === "true";

async function logSupabaseReadContext(
  label: string,
  client: Awaited<ReturnType<typeof createSupabaseServerClient>>,
): Promise<void> {
  if (!AUTH_DEBUG) return;
  try {
    const {
      data: { user },
      error: authErr,
    } = await client.auth.getUser();
    let profileRole: string | null | undefined;
    let profErrMsg: string | undefined;
    if (user) {
      const { data: profile, error: pErr } = await client.from("profiles").select("role").eq("id", user.id).maybeSingle();
      profileRole = profile?.role;
      profErrMsg = pErr?.message;
    }
    console.log(`[SUPABASE_DEBUG_AUTH][${label}]`, {
      client: "createSupabaseServerClient (anon + cookies)",
      authGetUserError: authErr?.message ?? null,
      sessionUserId: user?.id ?? null,
      profileRole: profileRole ?? null,
      profileQueryError: profErrMsg ?? null,
    });
  } catch (e) {
    console.warn(`[SUPABASE_DEBUG_AUTH][${label}] context logging failed`, e);
  }
}

/**
 * Leest de volledige clubdataset uit Supabase.
 * Bij laadfout → throw (error boundary / foutpagina).
 */
export async function readDb(): Promise<ClubDatabase> {
  const client = await createSupabaseServerClient();
  await logSupabaseReadContext("readDb", client);
  const { database } = await loadClubDatabaseFromSupabase(client, "readDb");
  return database;
}

/** Zelfde load als readDb, plus schema_version voor optimistic locking bij schrijven. */
export async function readDbForWrite(): Promise<ReadDbForWriteResult> {
  const client = await createSupabaseServerClient();
  await logSupabaseReadContext("readDbForWrite", client);
  const { database, schemaVersion } = await loadClubDatabaseFromSupabase(client, "readDbForWrite");
  return { db: database, schemaVersion };
}

/**
 * Past alleen verschillen tussen twee snapshots toe (rij-niveau), daarna optimistic lock op `club_profile`.
 */
export async function writeClubDatabaseDiff(
  before: ClubDatabase,
  after: ClubDatabase,
  expectedSchemaVersion: number,
): Promise<void> {
  const client = await createSupabaseServerClient();
  await logSupabaseReadContext("writeClubDatabaseDiff", client);
  await applyClubDatabaseDiff(client, before, after, expectedSchemaVersion);
}

export function defaultSeasonId(db: ClubDatabase): string {
  const active = db.seasons.find((s) => s.is_active);
  return active?.id ?? db.seasons[0]?.id ?? "";
}
