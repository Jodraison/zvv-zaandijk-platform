import type { ClubDatabase, Match } from "@/types";
import { matchResult } from "@/lib/queries/matches";

/**
 * Canonieke teamseizoensaggregatie voor het Statistiekcentrum.
 * Gebruikt dezelfde geverifieerde gespeelde wedstrijden als `aggregateSeasonMatchStats`.
 */
export type TeamSeasonSummary = {
  seasonId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  cleanSheets: number;
  winPercentage: number;
  averageGoalsFor: number;
  averageGoalsAgainst: number;
  homePlayed: number;
  awayPlayed: number;
  homeWon: number;
  awayWon: number;
};

function verifiedPlayedMatches(db: ClubDatabase, seasonId: string): Match[] {
  if (!seasonId) return [];
  return db.matches.filter(
    (m) => m.season_id === seasonId && m.status === "played" && (m.integrity_state ?? "verified") === "verified",
  );
}

function emptySummary(seasonId: string): TeamSeasonSummary {
  return {
    seasonId,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
    cleanSheets: 0,
    winPercentage: 0,
    averageGoalsFor: 0,
    averageGoalsAgainst: 0,
    homePlayed: 0,
    awayPlayed: 0,
    homeWon: 0,
    awayWon: 0,
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function getTeamSeasonSummary(db: ClubDatabase, seasonId: string): TeamSeasonSummary {
  if (!seasonId) return emptySummary("");

  const matches = verifiedPlayedMatches(db, seasonId);
  if (matches.length === 0) return emptySummary(seasonId);

  let won = 0;
  let drawn = 0;
  let lost = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;
  let cleanSheets = 0;
  let homePlayed = 0;
  let awayPlayed = 0;
  let homeWon = 0;
  let awayWon = 0;

  for (const m of matches) {
    goalsFor += m.goals_for;
    goalsAgainst += m.goals_against;
    if (m.goals_against === 0) cleanSheets += 1;

    const result = matchResult(db, m);
    if (result === "W") {
      won += 1;
      if (m.is_home) homeWon += 1;
      else awayWon += 1;
    } else if (result === "D") {
      drawn += 1;
    } else if (result === "L") {
      lost += 1;
    }

    if (m.is_home) homePlayed += 1;
    else awayPlayed += 1;
  }

  const played = matches.length;
  const goalDifference = goalsFor - goalsAgainst;
  const points = won * 3 + drawn;

  return {
    seasonId,
    played,
    won,
    drawn,
    lost,
    goalsFor,
    goalsAgainst,
    goalDifference,
    points,
    cleanSheets,
    winPercentage: played ? round1((won / played) * 100) : 0,
    averageGoalsFor: played ? round2(goalsFor / played) : 0,
    averageGoalsAgainst: played ? round2(goalsAgainst / played) : 0,
    homePlayed,
    awayPlayed,
    homeWon,
    awayWon,
  };
}
