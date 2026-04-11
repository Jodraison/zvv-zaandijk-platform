import type { ClubDatabase } from "@/types";

/**
 * Enige bron voor seizoens-totalen per speelster uit wedstrijddata:
 * - goals / assists: aggregatie van `match_goal_events` over geverifieerde gespeelde wedstrijden
 * - MVP: aantal `matches` met status played en `wotm_player_id` = speelster
 * - matches_played: distinct `match_id` waarin speelster een bijdrage heeft (goal/assist/MVP)
 *
 * Geen aparte totalen-tabel; altijd hieruit of via `computeRanking` die deze aggregate gebruikt.
 */
export type SeasonMatchAggregates = {
  goals: Map<string, number>;
  assists: Map<string, number>;
  /** per speler: wedstrijden waarin een stats-rij bestaat */
  matchesPlayed: Map<string, Set<string>>;
  mvp: Map<string, number>;
};

export function aggregateSeasonMatchStats(db: ClubDatabase, seasonId: string): SeasonMatchAggregates {
  const playedMatches = db.matches.filter(
    (m) => m.season_id === seasonId && m.status === "played" && (m.integrity_state ?? "verified") === "verified",
  );
  const playedMatchIds = new Set(playedMatches.map((m) => m.id));

  const goals = new Map<string, number>();
  const assists = new Map<string, number>();
  const matchesPlayed = new Map<string, Set<string>>();

  for (const e of db.match_goal_events) {
    if (!playedMatchIds.has(e.match_id)) continue;
    const scorer = db.players.find((p) => p.id === e.scorer_player_id);
    if (!scorer?.is_guest) {
      goals.set(e.scorer_player_id, (goals.get(e.scorer_player_id) ?? 0) + 1);
      let set = matchesPlayed.get(e.scorer_player_id);
      if (!set) {
        set = new Set();
        matchesPlayed.set(e.scorer_player_id, set);
      }
      set.add(e.match_id);
    }
    if (e.assist_player_id) {
      const assister = db.players.find((p) => p.id === e.assist_player_id);
      if (!assister?.is_guest) {
        assists.set(e.assist_player_id, (assists.get(e.assist_player_id) ?? 0) + 1);
        let set = matchesPlayed.get(e.assist_player_id);
        if (!set) {
          set = new Set();
          matchesPlayed.set(e.assist_player_id, set);
        }
        set.add(e.match_id);
      }
    }
  }

  const mvp = new Map<string, number>();
  for (const m of playedMatches) {
    if (!m.wotm_player_id) continue;
    const w = db.players.find((p) => p.id === m.wotm_player_id);
    if (w?.is_guest) continue;
    const id = m.wotm_player_id;
    mvp.set(id, (mvp.get(id) ?? 0) + 1);
    let set = matchesPlayed.get(id);
    if (!set) {
      set = new Set();
      matchesPlayed.set(id, set);
    }
    set.add(m.id);
  }

  return { goals, assists, matchesPlayed, mvp };
}

export function playerTotalsFromAggregate(agg: SeasonMatchAggregates, playerId: string) {
  return {
    goals_total: agg.goals.get(playerId) ?? 0,
    assists_total: agg.assists.get(playerId) ?? 0,
    wotm_total: agg.mvp.get(playerId) ?? 0,
    matches_played: agg.matchesPlayed.get(playerId)?.size ?? 0,
  };
}
