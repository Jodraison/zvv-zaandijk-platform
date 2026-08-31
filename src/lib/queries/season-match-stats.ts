import type { ClubDatabase } from "@/types";
import { isProductionMatch } from "@/lib/match/match-data-scope";
import { wotmPlayerIdsForMatch } from "@/lib/match/wotm-winners";
import {
  isPlayerCleanSheetEligibleInMatch,
  isPlayerCleanSheetSeason,
} from "@/lib/statistics/clean-sheets";

/**
 * Enige bron voor seizoens-totalen per speelster uit wedstrijddata:
 * - goals / assists: aggregatie van `match_goal_events` over geverifieerde gespeelde wedstrijden
 * - MVP: aantal `match_wotm_winners` / `wotm_player_ids` over geverifieerde gespeelde wedstrijden (elke winnaar +1)
 * - matches_played: distinct `match_id` waarin speelster een bijdrage heeft (goal/assist/MVP)
 * - clean sheets (vanaf 2026/27): keeper/verdediger meegespeeld + goals_against === 0
 *
 * Alleen `data_scope=production` (of afgeleide production). Demo/qa tellen nooit mee.
 */
export type SeasonMatchAggregates = {
  goals: Map<string, number>;
  assists: Map<string, number>;
  /** per speler: wedstrijden waarin een stats-rij bestaat */
  matchesPlayed: Map<string, Set<string>>;
  mvp: Map<string, number>;
  /** per speler: wedstrijden zonder tegengoals (GK/DEF, vanaf 2026/27) */
  cleanSheets: Map<string, number>;
};

export function aggregateSeasonMatchStats(db: ClubDatabase, seasonId: string): SeasonMatchAggregates {
  const playedMatches = db.matches.filter(
    (m) =>
      m.season_id === seasonId &&
      m.status === "played" &&
      (m.integrity_state ?? "verified") === "verified" &&
      isProductionMatch(m),
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
    for (const id of wotmPlayerIdsForMatch(db, m)) {
      const w = db.players.find((p) => p.id === id);
      if (w?.is_guest) continue;
      mvp.set(id, (mvp.get(id) ?? 0) + 1);
      let set = matchesPlayed.get(id);
      if (!set) {
        set = new Set();
        matchesPlayed.set(id, set);
      }
      set.add(m.id);
    }
  }

  const cleanSheets = new Map<string, number>();
  if (isPlayerCleanSheetSeason(db, seasonId)) {
    for (const m of playedMatches) {
      if (m.goals_against !== 0) continue;
      const credited = new Set<string>();
      for (const e of db.match_lineup_entries.filter((row) => row.match_id === m.id)) {
        if (credited.has(e.player_id)) continue;
        const pl = db.players.find((p) => p.id === e.player_id);
        if (pl?.is_guest) continue;
        if (!isPlayerCleanSheetEligibleInMatch(db, seasonId, m.id, e.player_id)) continue;
        credited.add(e.player_id);
        cleanSheets.set(e.player_id, (cleanSheets.get(e.player_id) ?? 0) + 1);
      }
      // Invallers die niet in lineup_entries staan (zeldzaam) via substituties.
      for (const s of db.match_substitutions.filter((row) => row.match_id === m.id)) {
        if (credited.has(s.player_in_id)) continue;
        const pl = db.players.find((p) => p.id === s.player_in_id);
        if (pl?.is_guest) continue;
        if (!isPlayerCleanSheetEligibleInMatch(db, seasonId, m.id, s.player_in_id)) continue;
        credited.add(s.player_in_id);
        cleanSheets.set(s.player_in_id, (cleanSheets.get(s.player_in_id) ?? 0) + 1);
      }
    }
  }

  return { goals, assists, matchesPlayed, mvp, cleanSheets };
}

export function playerTotalsFromAggregate(agg: SeasonMatchAggregates, playerId: string) {
  return {
    goals_total: agg.goals.get(playerId) ?? 0,
    assists_total: agg.assists.get(playerId) ?? 0,
    wotm_total: agg.mvp.get(playerId) ?? 0,
    matches_played: agg.matchesPlayed.get(playerId)?.size ?? 0,
    clean_sheets_total: agg.cleanSheets.get(playerId) ?? 0,
  };
}
