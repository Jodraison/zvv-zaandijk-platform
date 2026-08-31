/**
 * Past migratie 028 toe (match_wotm_winners) en bewaart een review-backup.
 * Gebruikt Supabase Management API (SUPABASE_ACCESS_TOKEN) — geen DATABASE_URL nodig.
 */
import "../src/scripts/load-platform-env";
import { readFileSync, mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";

function projectRef(): string {
  const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const ref = publicUrl.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/i)?.[1];
  if (!ref) throw new Error("Kon project-ref niet afleiden uit NEXT_PUBLIC_SUPABASE_URL.");
  return ref;
}

async function runSql<T = unknown>(query: string): Promise<T> {
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  if (!token) throw new Error("SUPABASE_ACCESS_TOKEN ontbreekt.");
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef()}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Management API ${res.status}: ${text.slice(0, 400)}`);
  }
  return JSON.parse(text) as T;
}

async function main() {
  const outDir = resolve(process.cwd(), ".review-backups/wotm-multi-028");
  mkdirSync(outDir, { recursive: true });

  const before = await runSql<
    { match_id: string; kickoff_at: string; opponent: string; wotm_player_id: string; full_name: string | null }[]
  >(`
    SELECT m.id::text AS match_id, m.kickoff_at::text, m.opponent, m.wotm_player_id::text, p.full_name
    FROM public.matches m
    LEFT JOIN public.players p ON p.id = m.wotm_player_id
    WHERE m.wotm_player_id IS NOT NULL
    ORDER BY m.kickoff_at DESC
  `);
  writeFileSync(resolve(outDir, "legacy-potm-before.json"), JSON.stringify(before, null, 2), "utf8");

  const migration = readFileSync(resolve(process.cwd(), "supabase/migrations/028_match_wotm_winners.sql"), "utf8");
  await runSql(migration);

  const after = await runSql<{ match_id: string; player_id: string; full_name: string | null }[]>(`
    SELECT w.match_id::text, w.player_id::text, p.full_name
    FROM public.match_wotm_winners w
    LEFT JOIN public.players p ON p.id = w.player_id
    ORDER BY w.match_id, w.player_id
  `);
  writeFileSync(resolve(outDir, "junction-after.json"), JSON.stringify(after, null, 2), "utf8");

  const missing = before.filter((row) => !after.some((a) => a.match_id === row.match_id && a.player_id === row.wotm_player_id));
  const extras = after.filter((row) => !before.some((b) => b.match_id === row.match_id && b.wotm_player_id === row.player_id));
  const integrity = await runSql<{ conname: string; contype: string }[]>(`
    SELECT conname, contype
    FROM pg_constraint
    WHERE conrelid = 'public.match_wotm_winners'::regclass
      AND contype IN ('p', 'f', 'u')
    ORDER BY contype, conname
  `);
  const rls = await runSql<{ relrowsecurity: boolean }[]>(`
    SELECT relrowsecurity FROM pg_class WHERE oid = 'public.match_wotm_winners'::regclass
  `);

  const report = {
    at: new Date().toISOString(),
    legacy_count: before.length,
    junction_count: after.length,
    missing_after_backfill: missing,
    extras_after_backfill: extras,
    constraints: integrity,
    rls_enabled: rls[0]?.relrowsecurity ?? false,
  };
  writeFileSync(resolve(outDir, "migration-verify.json"), JSON.stringify(report, null, 2), "utf8");

  if (missing.length > 0) {
    throw new Error(`Backfill verloor ${missing.length} POTM-rij(en).`);
  }
  console.log(JSON.stringify({
    ok: true,
    legacy_count: before.length,
    junction_count: after.length,
    extras: extras.length,
    rls_enabled: report.rls_enabled,
    constraints: integrity,
  }, null, 2));
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
