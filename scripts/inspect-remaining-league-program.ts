/** Read-only: current 2026/27 matches + dependent counts. */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "fs";
import { SEASON_2026_27_ID } from "../src/lib/season/season-operations-2026-27";
import { formatTimeNl } from "../src/lib/utils/format-date";
import { matchCalendarDateAmsterdam } from "../src/lib/season/season-2026-27-schedule";

for (const f of [".env.local", ".env"]) {
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]!]) process.env[m[1]!] = m[2]!.replace(/^"|"$/g, "");
  }
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("missing supabase env");
  const sb = createClient(url, key, { auth: { persistSession: false } });

  const { data: matches, error } = await sb
    .from("matches")
    .select(
      "id,season_id,opponent,kickoff_at,is_home,match_type,location,status,goals_for,goals_against,lineup_status,notes,wotm_player_id",
    )
    .eq("season_id", SEASON_2026_27_ID)
    .order("kickoff_at", { ascending: true });
  if (error) throw error;

  const ids = (matches ?? []).map((m) => m.id);
  const empty = "00000000-0000-0000-0000-000000000000";
  const [lineup, goals, cards, subs, stats, roster, pos] = await Promise.all([
    sb.from("match_lineup_entries").select("id,match_id").in("match_id", ids.length ? ids : [empty]),
    sb.from("match_goal_events").select("id,match_id").in("match_id", ids.length ? ids : [empty]),
    sb.from("match_card_events").select("id,match_id").in("match_id", ids.length ? ids : [empty]),
    sb.from("match_substitutions").select("id,match_id").in("match_id", ids.length ? ids : [empty]),
    sb.from("match_player_stats").select("match_id,player_id").in("match_id", ids.length ? ids : [empty]),
    sb.from("match_matchday_roster").select("match_id,player_id").in("match_id", ids.length ? ids : [empty]),
    sb.from("match_position_changes").select("id,match_id").in("match_id", ids.length ? ids : [empty]),
  ]);

  const countBy = (rows: { match_id: string }[] | null) => {
    const m = new Map<string, number>();
    for (const r of rows ?? []) m.set(r.match_id, (m.get(r.match_id) ?? 0) + 1);
    return m;
  };
  const lineupN = countBy(lineup.data);
  const goalN = countBy(goals.data);

  console.log(
    JSON.stringify(
      {
        matchCount: matches?.length ?? 0,
        matches: (matches ?? []).map((m) => ({
          date: matchCalendarDateAmsterdam(m.kickoff_at),
          time: formatTimeNl(m.kickoff_at),
          opponent: m.opponent,
          home: m.is_home,
          type: m.match_type,
          status: m.status,
          location: m.location,
          score: `${m.goals_for}-${m.goals_against}`,
          lineup_status: m.lineup_status,
          lineup: lineupN.get(m.id) ?? 0,
          goals: goalN.get(m.id) ?? 0,
          id: m.id,
        })),
        totals: {
          lineup: lineup.data?.length ?? 0,
          goals: goals.data?.length ?? 0,
          cards: cards.data?.length ?? 0,
          subs: subs.data?.length ?? 0,
          stats: stats.data?.length ?? 0,
          roster: roster.data?.length ?? 0,
          positionChanges: pos.data?.length ?? 0,
        },
        errors: [lineup.error, goals.error, cards.error, subs.error, stats.error, roster.error, pos.error]
          .filter(Boolean)
          .map((e) => e?.message),
      },
      null,
      2,
    ),
  );
}

void main();
