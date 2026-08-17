/**
 * Wedstrijdlifecycle: plannen ≠ voorbereiden ≠ afronden.
 * Een geplande wedstrijd mag wekenlang zonder opstelling bestaan.
 */

import type { Match, MatchLineupEntry } from "@/types";

export const MATCH_PLANNING_REQUIRED_FIELDS = [
  "opponent",
  "kickoff_at",
  "is_home",
  "match_type",
] as const;

export const MATCH_PLANNING_OPTIONAL_FIELDS = ["location", "notes", "referee"] as const;

export type MatchPrepStatus = "lineup_not_prepared" | "lineup_prepared";
export type MatchAftermathStatus = "to_finish" | "finished";

export function matchLineupIsPrepared(
  match: Pick<Match, "lineup_status">,
  lineupEntries: Pick<MatchLineupEntry, "role">[] = [],
): boolean {
  if (match.lineup_status === "confirmed") return true;
  return lineupEntries.some((e) => e.role === "starter");
}

export function matchPrepStatus(
  match: Pick<Match, "lineup_status">,
  lineupEntries: Pick<MatchLineupEntry, "role">[] = [],
): MatchPrepStatus {
  return matchLineupIsPrepared(match, lineupEntries) ? "lineup_prepared" : "lineup_not_prepared";
}

export function matchPrepLabel(status: MatchPrepStatus): string {
  return status === "lineup_prepared" ? "Opstelling voorbereid" : "Opstelling nog niet voorbereid";
}

export function matchAftermathStatus(match: Pick<Match, "status" | "integrity_state">): MatchAftermathStatus | null {
  if (match.status !== "played") return null;
  return match.integrity_state === "verified" ? "finished" : "to_finish";
}

export function matchAftermathLabel(status: MatchAftermathStatus): string {
  return status === "finished" ? "Afgerond" : "Nog af te ronden";
}

/** Herinnering, geen blocker: alleen binnen 48 uur vóór kickoff. */
export function shouldRemindLineupUnprepared(
  match: Pick<Match, "status" | "kickoff_at" | "lineup_status">,
  lineupEntries: Pick<MatchLineupEntry, "role">[] = [],
  now = new Date(),
): boolean {
  if (match.status !== "scheduled") return false;
  if (matchLineupIsPrepared(match, lineupEntries)) return false;
  const kick = new Date(match.kickoff_at).getTime();
  if (Number.isNaN(kick) || kick <= now.getTime()) return false;
  return kick - now.getTime() <= 48 * 60 * 60 * 1000;
}

/**
 * Planning-save met lege lineup mag een bestaande opstelling niet wissen.
 * Alleen herschrijven wanneer de trainer bewust lineup-rijen meestuurt.
 */
export function shouldPreserveExistingLineup(input: {
  status: string;
  incomingLineupCount: number;
  existingLineupCount: number;
}): boolean {
  if (input.status === "played") return false;
  return input.incomingLineupCount === 0 && input.existingLineupCount > 0;
}

export function isPlanningOnlySave(status: string): boolean {
  return status === "scheduled" || status === "postponed" || status === "cancelled";
}
