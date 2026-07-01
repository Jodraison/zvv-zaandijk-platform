import type { ClubDatabase } from "@/types";
import { getTeamSeasonSummary } from "@/lib/statistics/team-season-summary";

export type SeasonHistoryRow = {
  seasonId: string;
  seasonName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  goalDifferenceLabel: string;
  points: number;
  isActive: boolean;
};

function formatGoalDifference(value: number): string {
  if (value > 0) return `+${value}`;
  return String(value);
}

/**
 * Historische teamstatistieken per seizoen via `getTeamSeasonSummary`.
 * Geen eigen aggregatie — alleen mapping en sortering.
 */
export function getSeasonHistory(db: ClubDatabase): SeasonHistoryRow[] {
  const seasons = [...db.seasons].sort((a, b) => b.starts_on.localeCompare(a.starts_on));

  return seasons.map((season) => {
    const summary = getTeamSeasonSummary(db, season.id);

    return {
      seasonId: season.id,
      seasonName: season.name,
      played: summary.played,
      won: summary.won,
      drawn: summary.drawn,
      lost: summary.lost,
      goalsFor: summary.goalsFor,
      goalsAgainst: summary.goalsAgainst,
      goalDifference: summary.goalDifference,
      goalDifferenceLabel: formatGoalDifference(summary.goalDifference),
      points: summary.points,
      isActive: season.is_active,
    };
  });
}
