/**
 * Plan empty official fitness session on Monday 26 October 2026.
 * Does not copy Sept 7 scores. Does not invent results.
 */
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { SEASON_2026_27_ID } from "../src/lib/season/season-operations-2026-27";
import { FITNESS_DEFAULT_SCORE_CONFIG_ID, FITNESS_PROTOCOL_CODE } from "../src/lib/fitness/protocol";

for (const f of [
  ".env.local",
  ".env",
  join("C:/Users/jodra/Documents/zvv-app-clean/platform", ".env.local"),
]) {
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]!]) process.env[m[1]!] = m[2]!.replace(/^"|"$/g, "");
  }
}

const PROJECT = "othxhnkwkygggkktvosp";
const TEST_ON = "2026-10-26";

async function main() {
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
if (!url.includes(PROJECT)) throw new Error(`Wrong project: ${url}`);
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing");
const sb = createClient(url, key, { auth: { persistSession: false } });

const { data: existing, error: e1 } = await sb
  .from("fitness_test_sessions")
  .select("id,test_on,status,protocol_code,note,published_at")
  .eq("season_id", SEASON_2026_27_ID)
  .eq("test_on", TEST_ON)
  .eq("protocol_code", FITNESS_PROTOCOL_CODE);
if (e1) throw e1;

const { data: training, error: e2 } = await sb
  .from("training_sessions")
  .select("id,title,session_at,status")
  .eq("season_id", SEASON_2026_27_ID)
  .gte("session_at", "2026-10-26T00:00:00+02:00")
  .lt("session_at", "2026-10-27T00:00:00+02:00");
if (e2) throw e2;

if ((existing?.length ?? 0) > 0) {
  const session = existing![0]!;
  const { count } = await sb
    .from("fitness_test_results")
    .select("id", { count: "exact", head: true })
    .eq("session_id", session.id)
    .or(
      "flying_sprint_30m_seconds.not.is.null,agility_10_20_10_seconds.not.is.null,plank_seconds.not.is.null,six_minute_run_meters.not.is.null",
    );
  console.log(
    JSON.stringify(
      {
        action: "exists",
        session,
        measured_result_count: count ?? 0,
        training_same_day: training ?? [],
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

const sessionId = randomUUID();
const now = new Date().toISOString();
const { data: members, error: e3 } = await sb
  .from("player_season_memberships")
  .select("player_id")
  .eq("season_id", SEASON_2026_27_ID);
if (e3) throw e3;
const memberIds = (members ?? []).map((row) => row.player_id as string);
const { data: playerRows, error: e3b } = await sb.from("players").select("id,is_guest").in("id", memberIds.length ? memberIds : ["00000000-0000-0000-0000-000000000000"]);
if (e3b) throw e3b;
const guestIds = new Set((playerRows ?? []).filter((p) => p.is_guest).map((p) => p.id));
const playerIds = memberIds.filter((id) => !guestIds.has(id));

const { error: insS } = await sb.from("fitness_test_sessions").insert({
  id: sessionId,
  season_id: SEASON_2026_27_ID,
  test_on: TEST_ON,
  protocol_code: FITNESS_PROTOCOL_CODE,
  status: "draft",
  note: "Officiële fitheidstest — 6-minutenloop, 30m sprint (vliegende start), 10–20–10 agility, plank",
  score_config_id: FITNESS_DEFAULT_SCORE_CONFIG_ID,
  created_at: now,
  updated_at: now,
  published_at: null,
  created_by: null,
  published_by: null,
});
if (insS) throw insS;

if (playerIds.length) {
  const rows = playerIds.map((player_id) => ({
    id: randomUUID(),
    session_id: sessionId,
    player_id,
    flying_sprint_30m_seconds: null,
    agility_10_20_10_seconds: null,
    plank_seconds: null,
    six_minute_run_meters: null,
    participation_status: "pending",
    participation_reason: null,
    note: null,
    created_at: now,
    updated_at: now,
  }));
  const { error: insR } = await sb.from("fitness_test_results").insert(rows);
  if (insR) throw insR;
}

const { data: created, error: e4 } = await sb
  .from("fitness_test_sessions")
  .select("id,test_on,status,protocol_code,note,published_at")
  .eq("id", sessionId)
  .single();
if (e4) throw e4;

const { data: measured } = await sb
  .from("fitness_test_results")
  .select("id,flying_sprint_30m_seconds,agility_10_20_10_seconds,plank_seconds,six_minute_run_meters")
  .eq("session_id", sessionId);

const measuredCount = (measured ?? []).filter(
  (r) =>
    r.flying_sprint_30m_seconds != null ||
    r.agility_10_20_10_seconds != null ||
    r.plank_seconds != null ||
    r.six_minute_run_meters != null,
).length;

console.log(
  JSON.stringify(
    {
      action: "created",
      session: created,
      pending_rows: measured?.length ?? 0,
      measured_result_count: measuredCount,
      training_same_day: training ?? [],
    },
    null,
    2,
  ),
);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
