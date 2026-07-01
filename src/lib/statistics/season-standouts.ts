import type { PlayerSeasonRankingRow } from "@/types";

export type SeasonStandoutLeader = {
  playerId: string;
  playerName: string;
  value: number;
};

export type SeasonStandouts = {
  topScorer: SeasonStandoutLeader | null;
  assistLeader: SeasonStandoutLeader | null;
  motmLeader: SeasonStandoutLeader | null;
};

function pickLeader(
  rows: PlayerSeasonRankingRow[],
  score: (r: PlayerSeasonRankingRow) => number,
): SeasonStandoutLeader | null {
  if (rows.length === 0) return null;

  const sorted = [...rows].sort((a, b) => {
    const d = score(b) - score(a);
    if (d !== 0) return d;
    if (a.shirt_number !== b.shirt_number) return a.shirt_number - b.shirt_number;
    return a.full_name.localeCompare(b.full_name, "nl");
  });

  const best = sorted[0];
  const value = score(best);
  if (value <= 0) return null;

  return {
    playerId: best.player_id,
    playerName: best.full_name,
    value,
  };
}

/**
 * Leiders per categorie uit de canonieke ranking (`computeRanking`).
 * Geen eigen aggregatie — alleen selectie op bestaande totalen.
 */
export function getSeasonStandouts(ranking: PlayerSeasonRankingRow[]): SeasonStandouts {
  return {
    topScorer: pickLeader(ranking, (r) => r.goals_total),
    assistLeader: pickLeader(ranking, (r) => r.assists_total),
    motmLeader: pickLeader(ranking, (r) => r.wotm_total),
  };
}
