import type { Match } from "@/types";
import { TEAM_LABEL } from "@/constants/club";

export type MatchScoreResolved = {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  result: "win" | "loss" | "draw";
};

export function resolveMatchScore(match: Match): MatchScoreResolved {
  if (!match) throw new Error("Match required");

  const { goals_for, goals_against, is_home, opponent } = match;
  if (goals_for == null || goals_against == null) {
    throw new Error("Invalid match score data");
  }

  const safeOpponent = opponent?.trim() || "Tegenstander";
  const homeTeam = is_home ? TEAM_LABEL : safeOpponent;
  const awayTeam = is_home ? safeOpponent : TEAM_LABEL;
  const homeScore = is_home ? goals_for : goals_against;
  const awayScore = is_home ? goals_against : goals_for;
  const result = goals_for > goals_against ? "win" : goals_for < goals_against ? "loss" : "draw";

  if ((result === "win" && goals_for <= goals_against) || (result === "loss" && goals_for >= goals_against)) {
    throw new Error("MATCH RESULT INTEGRITY VIOLATION");
  }

  if (process.env.NODE_ENV !== "production") {
    if (result === "loss" && homeScore > awayScore && homeTeam === TEAM_LABEL) {
      console.error("UI SCORE MISMATCH DETECTED", match);
    }
  }

  return { homeTeam, awayTeam, homeScore, awayScore, result };
}
