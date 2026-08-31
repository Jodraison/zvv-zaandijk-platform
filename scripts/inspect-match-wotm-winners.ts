/**
 * Read-only: huidige POTM-kolom vs match_wotm_winners + laatste gespeelde wedstrijd.
 * Schrijft geen production-data. Dump naar .review-backups/wotm-multi-028/
 */
import "../src/scripts/load-platform-env";
import { createClient } from "@supabase/supabase-js";
import { mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("missing supabase env");
  const sb = createClient(url, key, { auth: { persistSession: false } });

  const { data: matches, error: matchErr } = await sb
    .from("matches")
    .select("id,opponent,kickoff_at,status,is_home,wotm_player_id,integrity_state")
    .order("kickoff_at", { ascending: false });
  if (matchErr) throw matchErr;

  const { data: players, error: playerErr } = await sb.from("players").select("id,full_name,is_guest");
  if (playerErr) throw playerErr;
  const playerById = new Map((players ?? []).map((p) => [p.id, p.full_name as string]));

  const tableProbe = await sb.from("match_wotm_winners").select("match_id,player_id").limit(5000);
  const tableExists = !tableProbe.error;
  const winners = tableExists ? (tableProbe.data ?? []) : [];

  const withLegacy = (matches ?? []).filter((m) => m.wotm_player_id);
  const rows = withLegacy.map((m) => {
    const related = winners.filter((w) => w.match_id === m.id).map((w) => w.player_id);
    return {
      match_id: m.id,
      kickoff_at: m.kickoff_at,
      opponent: m.opponent,
      status: m.status,
      is_home: m.is_home,
      old_potm_id: m.wotm_player_id,
      old_potm_name: playerById.get(m.wotm_player_id as string) ?? null,
      new_potm_ids: related,
      new_potm_names: related.map((id) => playerById.get(id) ?? id),
    };
  });

  const danique = (players ?? []).filter((p) => /danique/i.test(String(p.full_name)));
  const mandy = (players ?? []).filter((p) => /mandy/i.test(String(p.full_name)));
  const lastPlayed = (matches ?? []).find((m) => m.status === "played");

  const outDir = resolve(process.cwd(), ".review-backups/wotm-multi-028");
  mkdirSync(outDir, { recursive: true });
  const artifact = {
    at: new Date().toISOString(),
    table_exists: tableExists,
    table_error: tableProbe.error?.message ?? null,
    legacy_potm_count: withLegacy.length,
    junction_row_count: winners.length,
    last_played: lastPlayed
      ? {
          match_id: lastPlayed.id,
          opponent: lastPlayed.opponent,
          kickoff_at: lastPlayed.kickoff_at,
          old_potm_id: lastPlayed.wotm_player_id,
          old_potm_name: lastPlayed.wotm_player_id ? playerById.get(lastPlayed.wotm_player_id) ?? null : null,
        }
      : null,
    danique_candidates: danique.map((p) => ({ id: p.id, full_name: p.full_name, is_guest: p.is_guest })),
    mandy_candidates: mandy.map((p) => ({ id: p.id, full_name: p.full_name, is_guest: p.is_guest })),
    historical: rows,
  };
  writeFileSync(resolve(outDir, "pre-migration-audit.json"), JSON.stringify(artifact, null, 2), "utf8");

  console.log(JSON.stringify({
    table_exists: tableExists,
    table_error: tableProbe.error?.message ?? null,
    legacy_potm_count: withLegacy.length,
    junction_row_count: winners.length,
    last_played: artifact.last_played,
    danique_candidates: artifact.danique_candidates,
    mandy_candidates: artifact.mandy_candidates,
  }, null, 2));
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
