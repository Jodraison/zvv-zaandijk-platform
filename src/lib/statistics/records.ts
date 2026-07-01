import type { ClubDatabase, Match, PlayerSeasonRankingRow } from "@/types";
import { matchResult } from "@/lib/queries/matches";
import { teamAttendanceSummary } from "@/lib/queries/training-fitness";
import { fitnessTotalSeconds } from "@/lib/fitness-analytics";
import { formatSprintSecondsNl } from "@/lib/import/fitness-time";
import { formatDateNL } from "@/lib/utils/format-date";
import type { TeamSeasonSummary } from "@/lib/statistics/team-season-summary";

export type RecordEntry = {
  label: string;
  valueLabel: string;
  detailLabel: string | null;
};

export type TeamRecords = {
  biggestWin: RecordEntry | null;
  biggestLoss: RecordEntry | null;
  mostGoalsInMatch: RecordEntry | null;
  longestWinStreak: RecordEntry | null;
  longestUnbeatenStreak: RecordEntry | null;
  cleanSheets: RecordEntry | null;
};

export type PlayerRecords = {
  mostGoals: RecordEntry | null;
  mostAssists: RecordEntry | null;
  mostMotm: RecordEntry | null;
  mostMatches: RecordEntry | null;
  bestTrainingAttendance: RecordEntry | null;
  fastestSprint: RecordEntry | null;
};

export type SeasonRecords = {
  team: TeamRecords;
  players: PlayerRecords;
};

function verifiedPlayedMatches(db: ClubDatabase, seasonId: string): Match[] {
  if (!seasonId) return [];
  return db.matches.filter(
    (m) => m.season_id === seasonId && m.status === "played" && (m.integrity_state ?? "verified") === "verified",
  );
}

function matchOpponent(m: Match): string {
  return m.opponent?.trim() || "Tegenstander";
}

function matchScoreLabel(m: Match): string {
  return `${m.goals_for} : ${m.goals_against}`;
}

function matchDetail(m: Match): string {
  return `vs ${matchOpponent(m)} · ${formatDateNL(m.kickoff_at)}`;
}

function longestStreak(
  matches: Match[],
  db: ClubDatabase,
  include: (result: "W" | "D" | "L") => boolean,
): number {
  const sorted = [...matches].sort((a, b) => a.kickoff_at.localeCompare(b.kickoff_at));
  let best = 0;
  let current = 0;

  for (const match of sorted) {
    const result = matchResult(db, match);
    if (result && include(result)) {
      current += 1;
      if (current > best) best = current;
    } else {
      current = 0;
    }
  }

  return best;
}

function streakLabel(count: number): string {
  return count === 1 ? "1 wedstrijd" : `${count} wedstrijden`;
}

function pickBestMatch(
  matches: Match[],
  db: ClubDatabase,
  label: string,
  score: (match: Match, result: "W" | "D" | "L") => number | null,
): RecordEntry | null {
  let best: Match | null = null;
  let bestScore = -1;

  for (const match of matches) {
    const result = matchResult(db, match);
    if (!result) continue;
    const value = score(match, result);
    if (value == null || value < 0) continue;
    if (value > bestScore) {
      bestScore = value;
      best = match;
    }
  }

  if (!best) return null;

  return {
    label,
    valueLabel: matchScoreLabel(best),
    detailLabel: matchDetail(best),
  };
}

function pickPlayerRecord(
  ranking: PlayerSeasonRankingRow[],
  label: string,
  score: (row: PlayerSeasonRankingRow) => number,
  formatValue: (value: number) => string,
): RecordEntry | null {
  if (ranking.length === 0) return null;

  const sorted = [...ranking].sort((a, b) => {
    const delta = score(b) - score(a);
    if (delta !== 0) return delta;
    if (a.shirt_number !== b.shirt_number) return a.shirt_number - b.shirt_number;
    return a.full_name.localeCompare(b.full_name, "nl");
  });

  const best = sorted[0];
  const value = score(best);
  if (value <= 0) return null;

  return {
    label,
    valueLabel: formatValue(value),
    detailLabel: best.full_name,
  };
}

function buildTeamRecords(db: ClubDatabase, seasonId: string, teamSummary: TeamSeasonSummary): TeamRecords {
  const matches = verifiedPlayedMatches(db, seasonId);

  const biggestWin = pickBestMatch(matches, db, "Grootste overwinning", (match, result) =>
    result === "W" ? match.goals_for - match.goals_against : null,
  );

  const biggestLoss = pickBestMatch(matches, db, "Grootste nederlaag", (match, result) =>
    result === "L" ? match.goals_against - match.goals_for : null,
  );

  const mostGoalsInMatch = pickBestMatch(matches, db, "Meeste goals in één wedstrijd", (match) => match.goals_for);

  const winStreak = longestStreak(matches, db, (result) => result === "W");
  const unbeatenStreak = longestStreak(matches, db, (result) => result === "W" || result === "D");

  return {
    biggestWin,
    biggestLoss,
    mostGoalsInMatch,
    longestWinStreak:
      winStreak > 0
        ? {
            label: "Langste winstreeks",
            valueLabel: streakLabel(winStreak),
            detailLabel: "Aaneengesloten overwinningen",
          }
        : null,
    longestUnbeatenStreak:
      unbeatenStreak > 0
        ? {
            label: "Langste ongeslagen reeks",
            valueLabel: streakLabel(unbeatenStreak),
            detailLabel: "Winst of gelijkspel",
          }
        : null,
    cleanSheets:
      teamSummary.cleanSheets > 0
        ? {
            label: "Clean sheets",
            valueLabel: String(teamSummary.cleanSheets),
            detailLabel: "Dit seizoen",
          }
        : null,
  };
}

function buildPlayerRecords(
  db: ClubDatabase,
  seasonId: string,
  ranking: PlayerSeasonRankingRow[],
  training: ReturnType<typeof teamAttendanceSummary>,
): PlayerRecords {
  const mostGoals = pickPlayerRecord(ranking, "Meeste goals", (row) => row.goals_total, (value) => String(value));
  const mostAssists = pickPlayerRecord(ranking, "Meeste assists", (row) => row.assists_total, (value) => String(value));
  const mostMotm = pickPlayerRecord(ranking, "Meeste MOTM", (row) => row.wotm_total, (value) => String(value));
  const mostMatches = pickPlayerRecord(
    ranking,
    "Meeste wedstrijden",
    (row) => row.matches_played,
    (value) => String(value),
  );

  const bestTraining = [...training.perPlayer]
    .filter((player) => player.pct > 0)
    .sort((a, b) => b.pct - a.pct || a.shirt_number - b.shirt_number)[0];

  const bestTrainingAttendance = bestTraining
    ? {
        label: "Beste trainingsopkomst",
        valueLabel: `${bestTraining.pct}%`,
        detailLabel: bestTraining.name,
      }
    : null;

  let fastestSprint: RecordEntry | null = null;
  if (seasonId) {
    const tests = db.fitness_tests.filter((test) => test.season_id === seasonId && test.test_type === "sprint_20_40_60");
    if (tests.length > 0) {
      let bestTest = tests[0];
      let bestSeconds = fitnessTotalSeconds(bestTest);
      for (const test of tests.slice(1)) {
        const seconds = fitnessTotalSeconds(test);
        if (seconds < bestSeconds) {
          bestTest = test;
          bestSeconds = seconds;
        }
      }
      const playerName = db.players.find((player) => player.id === bestTest.player_id)?.full_name ?? "Onbekend";
      fastestSprint = {
        label: "Snelste sprinttest",
        valueLabel: formatSprintSecondsNl(bestSeconds),
        detailLabel: playerName,
      };
    }
  }

  return {
    mostGoals,
    mostAssists,
    mostMotm,
    mostMatches,
    bestTrainingAttendance,
    fastestSprint,
  };
}

/**
 * Dynamische seizoensrecords uit bestaande canonieke data.
 * Geen opslag — afgeleid uit ranking, teamsummary, wedstrijden, training en fitheid.
 */
export function getSeasonRecords(
  db: ClubDatabase,
  seasonId: string,
  ranking: PlayerSeasonRankingRow[],
  teamSummary: TeamSeasonSummary,
  training: ReturnType<typeof teamAttendanceSummary>,
): SeasonRecords {
  return {
    team: buildTeamRecords(db, seasonId, teamSummary),
    players: buildPlayerRecords(db, seasonId, ranking, training),
  };
}

export function hasSeasonRecords(records: SeasonRecords): boolean {
  const teamValues = Object.values(records.team);
  const playerValues = Object.values(records.players);
  return [...teamValues, ...playerValues].some((entry) => entry != null);
}

export type RecordListItem = {
  key: string;
  label: string;
  entry: RecordEntry | null;
};

export function listTeamRecordItems(team: TeamRecords): RecordListItem[] {
  return [
    { key: "biggestWin", label: "Grootste overwinning", entry: team.biggestWin },
    { key: "biggestLoss", label: "Grootste nederlaag", entry: team.biggestLoss },
    { key: "mostGoalsInMatch", label: "Meeste goals in één wedstrijd", entry: team.mostGoalsInMatch },
    { key: "longestWinStreak", label: "Langste winstreeks", entry: team.longestWinStreak },
    { key: "longestUnbeatenStreak", label: "Langste ongeslagen reeks", entry: team.longestUnbeatenStreak },
    { key: "cleanSheets", label: "Clean sheets", entry: team.cleanSheets },
  ];
}

export function listPlayerRecordItems(players: PlayerRecords): RecordListItem[] {
  return [
    { key: "mostGoals", label: "Meeste goals", entry: players.mostGoals },
    { key: "mostAssists", label: "Meeste assists", entry: players.mostAssists },
    { key: "mostMotm", label: "Meeste MOTM", entry: players.mostMotm },
    { key: "mostMatches", label: "Meeste wedstrijden", entry: players.mostMatches },
    { key: "bestTrainingAttendance", label: "Beste trainingsopkomst", entry: players.bestTrainingAttendance },
    { key: "fastestSprint", label: "Snelste sprinttest", entry: players.fastestSprint },
  ];
}
