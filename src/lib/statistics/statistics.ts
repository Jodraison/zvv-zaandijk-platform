/**
 * Single Source of Truth voor alle Statistics Center queries.
 *
 * Publieke façade: delegeert naar bestaande canonieke query-functies en statistiekmodules.
 */

import type { ClubDatabase, PlayerDetailAggregates, PlayerSeasonRankingRow } from "@/types";
import { buildPlayerDetail } from "@/lib/queries/player-detail";
import { computeRanking } from "@/lib/queries/ranking";
import { seasonMatches, teamFormLast5 } from "@/lib/queries/matches";
import { teamAttendanceSummary } from "@/lib/queries/training-fitness";
import { getTeamSeasonSummary, type TeamSeasonSummary } from "@/lib/statistics/team-season-summary";
import { getSeasonStandouts, type SeasonStandouts } from "@/lib/statistics/season-standouts";
import { getRankingPreview, type RankingPreview } from "@/lib/statistics/ranking-preview";
import { getRecentMatches, type RecentMatchPreview } from "@/lib/statistics/recent-matches";
import { getTeamDevelopment, type TeamDevelopment } from "@/lib/statistics/team-development";
import { getSeasonRecords, hasSeasonRecords, listPlayerRecordItems, listTeamRecordItems, type SeasonRecords } from "@/lib/statistics/records";
import { getSeasonHistory, type SeasonHistoryRow } from "@/lib/statistics/season-history";

export type {
  TeamSeasonSummary,
  SeasonStandouts,
  RankingPreview,
  RecentMatchPreview,
  TeamDevelopment,
  SeasonRecords,
  SeasonHistoryRow,
};
export {
  getTeamSeasonSummary,
  getSeasonStandouts,
  getRankingPreview,
  getRecentMatches,
  getTeamDevelopment,
  getSeasonRecords,
  hasSeasonRecords,
  listTeamRecordItems,
  listPlayerRecordItems,
  getSeasonHistory,
};

export type SeasonStatistics = {
  seasonId: string;
  ranking: PlayerSeasonRankingRow[];
  training: ReturnType<typeof teamAttendanceSummary>;
  form: ReturnType<typeof teamFormLast5>;
  matches: ReturnType<typeof seasonMatches>;
};

export type TeamStatistics = {
  seasonId: string;
  form: ReturnType<typeof teamFormLast5>;
  matches: ReturnType<typeof seasonMatches>;
  summary: TeamSeasonSummary;
};

export type PlayerStatistics = PlayerDetailAggregates | null;

export type StatisticsHome = {
  seasonId: string;
  ranking: PlayerSeasonRankingRow[];
  form: ReturnType<typeof teamFormLast5>;
  training: ReturnType<typeof teamAttendanceSummary>;
  teamSummary: TeamSeasonSummary;
  standouts: SeasonStandouts;
  rankingPreview: RankingPreview;
  recentMatches: RecentMatchPreview[];
  teamDevelopment: TeamDevelopment;
  records: SeasonRecords;
  seasonHistory: SeasonHistoryRow[];
};

export function getSeasonStatistics(db: ClubDatabase, seasonId: string): SeasonStatistics {
  if (!seasonId) {
    return {
      seasonId: "",
      ranking: [],
      training: teamAttendanceSummary(db, ""),
      form: [],
      matches: [],
    };
  }

  return {
    seasonId,
    ranking: computeRanking(db, seasonId),
    training: teamAttendanceSummary(db, seasonId),
    form: teamFormLast5(db, seasonId),
    matches: seasonMatches(db, seasonId),
  };
}

export function getPlayerStatistics(
  db: ClubDatabase,
  playerId: string,
  seasonId: string,
): PlayerStatistics {
  return buildPlayerDetail(db, playerId, seasonId);
}

export function getTeamStatistics(db: ClubDatabase, seasonId: string): TeamStatistics {
  return {
    seasonId,
    form: teamFormLast5(db, seasonId),
    matches: seasonMatches(db, seasonId),
    summary: getTeamSeasonSummary(db, seasonId),
  };
}

export function getStatisticsHome(db: ClubDatabase, seasonId: string): StatisticsHome {
  const season = getSeasonStatistics(db, seasonId);
  const teamSummary = getTeamSeasonSummary(db, seasonId);

  return {
    seasonId: season.seasonId,
    ranking: season.ranking,
    form: season.form,
    training: season.training,
    teamSummary,
    standouts: getSeasonStandouts(season.ranking),
    rankingPreview: getRankingPreview(season.ranking),
    recentMatches: getRecentMatches(db, seasonId),
    teamDevelopment: getTeamDevelopment(db, seasonId, season.training),
    records: getSeasonRecords(db, seasonId, season.ranking, teamSummary, season.training),
    seasonHistory: getSeasonHistory(db),
  };
}
