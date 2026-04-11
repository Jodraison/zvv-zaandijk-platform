import type { ClubDatabase } from "@/types";
import { matchResult } from "@/lib/queries/matches";

export type PlayerDisputeMatchRow = {
  match_id: string;
  season_id: string;
  kickoff_at: string;
  opponent: string;
  is_home: boolean;
  result: "W" | "D" | "L";
  goals: number;
  assists: number;
  is_mvp: boolean;
  is_guest_involved: boolean;
  source_goal_events: {
    sort_order: number;
    scorer_player_id: string;
    scorer_name: string;
    assist_player_id: string | null;
    assist_name: string | null;
    involvement: "goal" | "assist";
  }[];
};

export type PlayerDisputeBreakdown = {
  player_id: string;
  goals_total: number;
  assists_total: number;
  mvp_total: number;
  matches_contributing: number;
  rows: PlayerDisputeMatchRow[];
};

export function buildPlayerDisputeBreakdown(
  db: ClubDatabase,
  playerId: string,
  seasonId?: string,
): PlayerDisputeBreakdown {
  const playerById = new Map(db.players.map((p) => [p.id, p]));
  const matches = db.matches
    .filter((m) => m.status === "played" && (m.integrity_state ?? "verified") === "verified")
    .filter((m) => (seasonId ? m.season_id === seasonId : true));

  const rows: PlayerDisputeMatchRow[] = [];

  for (const match of matches) {
    const events = db.match_goal_events
      .filter((e) => e.match_id === match.id)
      .sort((a, b) => a.sort_order - b.sort_order);
    const sourceEvents = events
      .filter((e) => e.scorer_player_id === playerId || e.assist_player_id === playerId)
      .map((e) => {
        const scorer = playerById.get(e.scorer_player_id)?.full_name ?? "Onbekend";
        const assist = e.assist_player_id ? (playerById.get(e.assist_player_id)?.full_name ?? "Onbekend") : null;
        return {
          sort_order: e.sort_order,
          scorer_player_id: e.scorer_player_id,
          scorer_name: scorer,
          assist_player_id: e.assist_player_id,
          assist_name: assist,
          involvement: e.scorer_player_id === playerId ? ("goal" as const) : ("assist" as const),
        };
      });
    const goals = sourceEvents.filter((e) => e.involvement === "goal").length;
    const assists = sourceEvents.filter((e) => e.involvement === "assist").length;
    const isMvp = match.wotm_player_id === playerId;
    if (goals === 0 && assists === 0 && !isMvp) continue;

    const guestInRoster = db.match_matchday_roster.some((r) => r.match_id === match.id && r.player_id === playerId);
    const playerIsGuest = !!playerById.get(playerId)?.is_guest;
    rows.push({
      match_id: match.id,
      season_id: match.season_id,
      kickoff_at: match.kickoff_at,
      opponent: match.opponent,
      is_home: match.is_home,
      result: matchResult(db, match) ?? "D",
      goals,
      assists,
      is_mvp: isMvp,
      is_guest_involved: playerIsGuest || guestInRoster,
      source_goal_events: sourceEvents,
    });

  }

  rows.sort((a, b) => +new Date(b.kickoff_at) - +new Date(a.kickoff_at));
  return {
    player_id: playerId,
    goals_total: rows.reduce((acc, r) => acc + r.goals, 0),
    assists_total: rows.reduce((acc, r) => acc + r.assists, 0),
    mvp_total: rows.reduce((acc, r) => acc + (r.is_mvp ? 1 : 0), 0),
    matches_contributing: rows.length,
    rows,
  };
}
