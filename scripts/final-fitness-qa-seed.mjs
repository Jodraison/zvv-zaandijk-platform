/**
 * Final closure: dump fitness tables + seed two [QA] published sessions (A/B).
 * Uses env NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (never printed).
 *
 * Run: node --env-file=.env.local scripts/final-fitness-qa-seed.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
if (!url.includes("othxhnkwkygggkktvosp")) {
  console.error("Refusing seed: URL is not the known ZVV project ref");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const SEASON = "c0ffee00-0002-4000-8000-000000000001";
const SESSION_A = "a0000001-0000-4000-8000-0000000000a1";
const SESSION_B = "a0000001-0000-4000-8000-0000000000b2";
const NOTE = "[QA] Fitness Operations validatie — verwijderen vóór livegang";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupDir = join(".review-backups", `final-ops-${stamp}`);
mkdirSync(backupDir, { recursive: true });

async function dump(table) {
  const { data, error } = await sb.from(table).select("*");
  if (error) throw error;
  writeFileSync(join(backupDir, `${table}.json`), JSON.stringify(data, null, 2));
  return data?.length ?? 0;
}

const counts = {
  fitness_tests: await dump("fitness_tests"),
  fitness_test_sessions: await dump("fitness_test_sessions"),
  fitness_test_results: await dump("fitness_test_results"),
  fitness_score_configs: await dump("fitness_score_configs"),
};
writeFileSync(
  join(backupDir, "manifest.json"),
  JSON.stringify(
    {
      created_at: new Date().toISOString(),
      project_ref: "othxhnkwkygggkktvosp",
      purpose: "pre-QA-seed restore dump for final football operations closure",
      counts,
      session_ids: { A: SESSION_A, B: SESSION_B },
    },
    null,
    2,
  ),
);
console.log("backup", backupDir, counts);

const { data: roster, error: rosterErr } = await sb
  .from("player_season_memberships")
  .select("player_id, shirt_number, players!inner(full_name, is_guest)")
  .eq("season_id", SEASON)
  .eq("is_guest", false);
if (rosterErr) throw rosterErr;
const players = (roster ?? [])
  .filter((r) => !r.players?.is_guest)
  .sort((a, b) => (a.shirt_number ?? 99) - (b.shirt_number ?? 99));
if (players.length < 10) {
  console.error("Roster too small", players.length);
  process.exit(1);
}
console.log("roster", players.length);

// Cleanup prior QA sessions if re-run
await sb.from("fitness_test_results").delete().in("session_id", [SESSION_A, SESSION_B]);
await sb.from("fitness_test_sessions").delete().in("id", [SESSION_A, SESSION_B]);

const now = new Date().toISOString();
const sessions = [
  {
    id: SESSION_A,
    season_id: SEASON,
    test_on: "2026-08-30",
    protocol_code: "four_part_v1",
    status: "published",
    note: NOTE,
    score_config_id: "a1000000-0000-4000-8000-000000000001",
    created_at: now,
    updated_at: now,
    published_at: now,
  },
  {
    id: SESSION_B,
    season_id: SEASON,
    test_on: "2026-10-11",
    protocol_code: "four_part_v1",
    status: "published",
    note: NOTE,
    score_config_id: "a1000000-0000-4000-8000-000000000001",
    created_at: now,
    updated_at: now,
    published_at: now,
  },
];
{
  const { error } = await sb.from("fitness_test_sessions").insert(sessions);
  if (error) throw error;
}

function resultsFor(sessionId, invert) {
  return players.map((p, i) => {
    // Player index 0 absent on session A only; index 1 partial (sprint only)
    if (i === 0 && sessionId === SESSION_A) {
      return {
        session_id: sessionId,
        player_id: p.player_id,
        flying_sprint_30m_seconds: null,
        agility_10_20_10_seconds: null,
        plank_seconds: null,
        six_minute_run_meters: null,
        participation_status: "absent",
        participation_reason: "Afwezig [QA]",
        note: NOTE,
      };
    }
    if (i === 1) {
      return {
        session_id: sessionId,
        player_id: p.player_id,
        flying_sprint_30m_seconds: 5.2,
        agility_10_20_10_seconds: null,
        plank_seconds: null,
        six_minute_run_meters: null,
        participation_status: "partial",
        participation_reason: "Gedeeltelijk [QA]",
        note: NOTE,
      };
    }
    // Deterministic spread; invert winners between A/B
    const rankBias = invert ? players.length - 1 - i : i;
    const sprint = Math.round((4.4 + rankBias * 0.08) * 100) / 100;
    const agility = Math.round((15.8 + rankBias * 0.15) * 100) / 100;
    const plank = 180 - rankBias * 4;
    const run = 1500 - rankBias * 18;
    return {
      session_id: sessionId,
      player_id: p.player_id,
      flying_sprint_30m_seconds: sprint,
      agility_10_20_10_seconds: agility,
      plank_seconds: plank,
      six_minute_run_meters: run,
      participation_status: "complete",
      participation_reason: null,
      note: NOTE,
    };
  });
}

{
  const rows = [...resultsFor(SESSION_A, false), ...resultsFor(SESSION_B, true)];
  const { error } = await sb.from("fitness_test_results").insert(rows);
  if (error) throw error;
  console.log("inserted results", rows.length);
}

const { count: legacyAfter } = await sb.from("fitness_tests").select("*", { count: "exact", head: true });
writeFileSync(
  join(backupDir, "seed-result.json"),
  JSON.stringify(
    {
      session_a: SESSION_A,
      session_b: SESSION_B,
      test_on_a: "2026-08-30",
      test_on_b: "2026-10-11",
      expected_next_after_b: "2026-11-22",
      players: players.length,
      legacy_fitness_tests_after: legacyAfter,
      note: NOTE,
    },
    null,
    2,
  ),
);
console.log("seed ok", { SESSION_A, SESSION_B, players: players.length, legacyAfter });
