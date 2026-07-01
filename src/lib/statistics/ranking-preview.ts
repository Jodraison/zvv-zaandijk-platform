import type { PlayerSeasonRankingRow } from "@/types";

const PREVIEW_LIMIT = 5;

export type RankingPreviewEntry = {
  rank: number;
  playerId: string;
  playerName: string;
  value: number;
};

export type RankingPreview = {
  topScorers: RankingPreviewEntry[];
  topAssists: RankingPreviewEntry[];
  topMotm: RankingPreviewEntry[];
  mostMatches: RankingPreviewEntry[];
};

function compareByMetric(
  a: PlayerSeasonRankingRow,
  b: PlayerSeasonRankingRow,
  score: (r: PlayerSeasonRankingRow) => number,
): number {
  const d = score(b) - score(a);
  if (d !== 0) return d;
  if (a.shirt_number !== b.shirt_number) return a.shirt_number - b.shirt_number;
  return a.full_name.localeCompare(b.full_name, "nl");
}

function topByMetric(
  rows: PlayerSeasonRankingRow[],
  score: (r: PlayerSeasonRankingRow) => number,
  limit: number,
): RankingPreviewEntry[] {
  if (rows.length === 0) return [];

  const sorted = [...rows].sort((a, b) => compareByMetric(a, b, score));

  return sorted
    .filter((r) => score(r) > 0)
    .slice(0, limit)
    .map((r, index) => ({
      rank: index + 1,
      playerId: r.player_id,
      playerName: r.full_name,
      value: score(r),
    }));
}

/**
 * Compacte ranking-previews uit canonieke `computeRanking`-rijen.
 * Geen eigen aggregatie — alleen sorteren en limiteren op bestaande totalen.
 */
export function getRankingPreview(
  ranking: PlayerSeasonRankingRow[],
  limit: number = PREVIEW_LIMIT,
): RankingPreview {
  return {
    topScorers: topByMetric(ranking, (r) => r.goals_total, limit),
    topAssists: topByMetric(ranking, (r) => r.assists_total, limit),
    topMotm: topByMetric(ranking, (r) => r.wotm_total, limit),
    mostMatches: topByMetric(ranking, (r) => r.matches_played, limit),
  };
}
