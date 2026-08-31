/** Read-only: laatste gespeelde wedstrijd + of Mandy/Danique in die context zitten. */
import "../src/scripts/load-platform-env";
import { createClient } from "@supabase/supabase-js";

const LAST_MATCH = "c1ccbec0-3619-4c5f-adb0-3111b6055a7e";
const DANIQUE = "f1000001-0000-4000-8000-000000000011";
const MANDY = "f1000001-0000-4000-8000-00000000000a";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const sb = createClient(url, key, { auth: { persistSession: false } });

  const [match, winners, lineup, roster, stats, events] = await Promise.all([
    sb.from("matches").select("id,opponent,kickoff_at,status,is_home,wotm_player_id,season_id").eq("id", LAST_MATCH).maybeSingle(),
    sb.from("match_wotm_winners").select("player_id").eq("match_id", LAST_MATCH),
    sb.from("match_lineup_entries").select("player_id,role").eq("match_id", LAST_MATCH),
    sb.from("match_matchday_roster").select("player_id").eq("match_id", LAST_MATCH),
    sb.from("match_player_stats").select("player_id,goals,assists").eq("match_id", LAST_MATCH),
    sb.from("match_goal_events").select("scorer_player_id,assist_player_id").eq("match_id", LAST_MATCH),
  ]);

  const ids = new Set<string>();
  for (const r of lineup.data ?? []) ids.add(r.player_id);
  for (const r of roster.data ?? []) ids.add(r.player_id);
  for (const r of stats.data ?? []) ids.add(r.player_id);
  for (const r of events.data ?? []) {
    ids.add(r.scorer_player_id);
    if (r.assist_player_id) ids.add(r.assist_player_id);
  }

  console.log(JSON.stringify({
    match: match.data,
    match_error: match.error?.message ?? null,
    current_winners: winners.data ?? [],
    winners_error: winners.error?.message ?? null,
    lineup_count: lineup.data?.length ?? 0,
    danique_in_context: ids.has(DANIQUE),
    mandy_in_context: ids.has(MANDY),
    danique_lineup: (lineup.data ?? []).find((r) => r.player_id === DANIQUE) ?? null,
    mandy_lineup: (lineup.data ?? []).find((r) => r.player_id === MANDY) ?? null,
    context_player_count: ids.size,
  }, null, 2));
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
