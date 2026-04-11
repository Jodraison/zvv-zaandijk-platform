import "./load-platform-env";
import { createClient } from "@supabase/supabase-js";
import { assertSupabaseServiceRoleEnv, getServiceRoleKey, getSupabaseUrl } from "@/lib/supabase/env-validate";

type GoalEventInput = { scorer_player_id: string; assist_player_id: string | null };

function parseEvents(raw: string): GoalEventInput[] {
  const t = raw.trim();
  if (!t) throw new Error("events input ontbreekt");
  if (t.startsWith("[")) {
    const v = JSON.parse(t) as unknown;
    if (!Array.isArray(v)) throw new Error("events_json must be an array");
    return v.map((row, i) => {
      const r = row as Record<string, unknown>;
      const scorer = String(r.scorer_player_id ?? "").trim();
      const assistRaw = r.assist_player_id;
      const assist = assistRaw == null || String(assistRaw).trim() === "" ? null : String(assistRaw).trim();
      if (!scorer) throw new Error(`events_json[${i}].scorer_player_id ontbreekt`);
      if (assist && assist === scorer) throw new Error(`events_json[${i}] assist gelijk aan scorer`);
      return { scorer_player_id: scorer, assist_player_id: assist };
    });
  }
  return t.split(",").map((part, i) => {
    const [scorerRaw, assistRaw] = part.split("|");
    const scorer = (scorerRaw ?? "").trim();
    const assist = (assistRaw ?? "").trim();
    if (!scorer) throw new Error(`events spec item ${i + 1}: scorer ontbreekt`);
    if (assist && assist === scorer) throw new Error(`events spec item ${i + 1}: assist gelijk aan scorer`);
    return { scorer_player_id: scorer, assist_player_id: assist || null };
  });
}

function aggregate(events: GoalEventInput[]) {
  const map = new Map<string, { goals: number; assists: number }>();
  for (const e of events) {
    const g = map.get(e.scorer_player_id) ?? { goals: 0, assists: 0 };
    g.goals += 1;
    map.set(e.scorer_player_id, g);
    if (e.assist_player_id) {
      const a = map.get(e.assist_player_id) ?? { goals: 0, assists: 0 };
      a.assists += 1;
      map.set(e.assist_player_id, a);
    }
  }
  return [...map.entries()].map(([player_id, v]) => ({ player_id, goals: v.goals, assists: v.assists }));
}

async function main() {
  assertSupabaseServiceRoleEnv();
  const client = createClient(getSupabaseUrl(), getServiceRoleKey());
  const [matchId, eventsJson, expectedMvpId] = process.argv.slice(2);
  if (!matchId?.trim()) {
    throw new Error("Gebruik: npm run repair:one-match -- <match_id> '<events_json>' [expected_mvp_player_id]");
  }
  if (!eventsJson?.trim()) {
    throw new Error("events input is verplicht.");
  }
  const events = parseEvents(eventsJson);

  const { data: match, error: mErr } = await client
    .from("matches")
    .select("id,opponent,status,goals_for,wotm_player_id,integrity_state")
    .eq("id", matchId)
    .maybeSingle();
  if (mErr) throw mErr;
  if (!match) throw new Error("Match niet gevonden.");
  if (match.status !== "played") throw new Error("Alleen played matches kunnen zo gerepareerd worden.");
  if (expectedMvpId && match.wotm_player_id !== expectedMvpId) {
    throw new Error(`MVP mismatch: db=${match.wotm_player_id ?? "null"} expected=${expectedMvpId}`);
  }

  const eventGoalCount = events.length;
  const eventAssistCount = events.filter((e) => !!e.assist_player_id).length;
  if (Number(match.goals_for ?? 0) !== eventGoalCount) {
    throw new Error(`goals_for mismatch: match.goals_for=${match.goals_for} events=${eventGoalCount}`);
  }

  const payload = events.map((e, i) => ({
    match_id: matchId,
    scorer_player_id: e.scorer_player_id,
    assist_player_id: e.assist_player_id,
    sort_order: i,
  }));

  const { error: delEventsErr } = await client.from("match_goal_events").delete().eq("match_id", matchId);
  if (delEventsErr) throw delEventsErr;
  const { error: delStatsErr } = await client.from("match_player_stats").delete().eq("match_id", matchId);
  if (delStatsErr) throw delStatsErr;
  if (payload.length > 0) {
    const { error: insEventsErr } = await client.from("match_goal_events").insert(payload as never[]);
    if (insEventsErr) throw insEventsErr;
  }

  const rows = aggregate(events).map((r) => ({ match_id: matchId, ...r }));
  if (rows.length > 0) {
    const { error: insStatsErr } = await client.from("match_player_stats").insert(rows as never[]);
    if (insStatsErr) throw insStatsErr;
  }

  const derivedGoalCount = rows.reduce((a, r) => a + r.goals, 0);
  const derivedAssistCount = rows.reduce((a, r) => a + r.assists, 0);
  const valid =
    !!match.wotm_player_id &&
    Number(match.goals_for ?? 0) === eventGoalCount &&
    derivedGoalCount === eventGoalCount &&
    derivedAssistCount === eventAssistCount;
  const integrity_state = valid ? "verified" : "invalid";
  const { error: upErr } = await client.from("matches").update({ integrity_state }).eq("id", matchId);
  if (upErr) throw upErr;

  console.log(
    JSON.stringify(
      {
        match_id: matchId,
        opponent: match.opponent,
        integrity_state,
        event_goal_count: eventGoalCount,
        event_assist_count: eventAssistCount,
        derived_goal_count: derivedGoalCount,
        derived_assist_count: derivedAssistCount,
        mvp_player_id: match.wotm_player_id,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
