import "./load-platform-env";
import { createClient } from "@supabase/supabase-js";
import { assertSupabaseServiceRoleEnv, getServiceRoleKey, getSupabaseUrl } from "@/lib/supabase/env-validate";

type RepairRow = {
  match_id: string;
  opponent: string;
  integrity_state: "verified" | "invalid";
  event_goal_count: number;
  event_assist_count: number;
  derived_goal_count: number;
  derived_assist_count: number;
  reason?: string;
};

function aggregateFromEvents(events: { scorer_player_id: string; assist_player_id: string | null }[]) {
  const map = new Map<string, { goals: number; assists: number }>();
  for (const e of events) {
    const scorer = map.get(e.scorer_player_id) ?? { goals: 0, assists: 0 };
    scorer.goals += 1;
    map.set(e.scorer_player_id, scorer);
    if (e.assist_player_id) {
      const assist = map.get(e.assist_player_id) ?? { goals: 0, assists: 0 };
      assist.assists += 1;
      map.set(e.assist_player_id, assist);
    }
  }
  return [...map.entries()].map(([player_id, v]) => ({ player_id, goals: v.goals, assists: v.assists }));
}

async function main() {
  assertSupabaseServiceRoleEnv();
  const client = createClient(getSupabaseUrl(), getServiceRoleKey());
  let seasonId = process.argv[2]?.trim();
  if (!seasonId) {
    const { data: seasons, error: sErr } = await client
      .from("seasons")
      .select("id,is_active,starts_on")
      .order("starts_on", { ascending: false })
      .limit(10);
    if (sErr) throw sErr;
    seasonId = (seasons ?? []).find((s) => s.is_active)?.id ?? seasons?.[0]?.id;
  }
  if (!seasonId) throw new Error("Geen season_id gevonden.");

  const report: RepairRow[] = [];
  const { data: matches, error: mErr } = await client
    .from("matches")
    .select("id,opponent,goals_for,wotm_player_id")
    .eq("season_id", seasonId)
    .eq("status", "played");
  if (mErr) throw mErr;

  for (const match of matches ?? []) {
    const { data: events, error: eErr } = await client
      .from("match_goal_events")
      .select("scorer_player_id,assist_player_id")
      .eq("match_id", match.id);
    if (eErr) throw eErr;
    const rows = aggregateFromEvents(events ?? []);

    const { error: delErr } = await client.from("match_player_stats").delete().eq("match_id", match.id);
    if (delErr) throw delErr;
    if (rows.length > 0) {
      const payload = rows.map((r) => ({ match_id: match.id, ...r }));
      const { error: insErr } = await client.from("match_player_stats").insert(payload as never[]);
      if (insErr) throw insErr;
    }

    const eventGoalCount = (events ?? []).length;
    const eventAssistCount = (events ?? []).filter((e) => !!e.assist_player_id).length;
    const derivedGoalCount = rows.reduce((a, r) => a + r.goals, 0);
    const derivedAssistCount = rows.reduce((a, r) => a + r.assists, 0);
    const valid =
      Number(match.goals_for ?? 0) === eventGoalCount &&
      derivedGoalCount === eventGoalCount &&
      derivedAssistCount === eventAssistCount &&
      !!match.wotm_player_id;
    const integrity = valid ? "verified" : "invalid";
    const { error: upErr } = await client.from("matches").update({ integrity_state: integrity }).eq("id", match.id);
    if (upErr) throw upErr;
    report.push({
      match_id: match.id,
      opponent: match.opponent,
      integrity_state: integrity,
      event_goal_count: eventGoalCount,
      event_assist_count: eventAssistCount,
      derived_goal_count: derivedGoalCount,
      derived_assist_count: derivedAssistCount,
      reason: valid ? undefined : "Mismatch events/stats/goals_for of ontbrekende MVP",
    });
  }

  const invalid = report.filter((r) => r.integrity_state === "invalid");
  console.log(`Season repair klaar voor ${seasonId}. Processed: ${report.length}, invalid: ${invalid.length}`);
  for (const r of invalid) {
    console.log(`INVALID ${r.match_id} ${r.opponent} :: ${r.reason}`);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
