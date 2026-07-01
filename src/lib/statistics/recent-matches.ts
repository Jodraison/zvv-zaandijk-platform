import type { ClubDatabase, Match } from "@/types";
import { matchResult, seasonMatches } from "@/lib/queries/matches";
import { resolveMatchScore } from "@/lib/domain/match-score";
import { formatKickoffShortNl } from "@/lib/utils/format-date";

const RECENT_LIMIT = 5;

export type RecentMatchPreview = {
  matchId: string;
  dateLabel: string;
  opponent: string;
  venueLabel: "Thuis" | "Uit";
  scoreLabel: string;
  result: "W" | "G" | "V";
  resultLabel: "Winst" | "Gelijk" | "Verlies";
  badgeTone: "win" | "loss" | "draw";
};

function isOfficialPlayed(m: Match): boolean {
  return m.status === "played" && (m.integrity_state ?? "verified") === "verified";
}

function toResultDisplay(r: "W" | "D" | "L"): Pick<RecentMatchPreview, "result" | "resultLabel" | "badgeTone"> {
  if (r === "W") return { result: "W", resultLabel: "Winst", badgeTone: "win" };
  if (r === "L") return { result: "V", resultLabel: "Verlies", badgeTone: "loss" };
  return { result: "G", resultLabel: "Gelijk", badgeTone: "draw" };
}

function buildPreview(db: ClubDatabase, m: Match): RecentMatchPreview | null {
  const r = matchResult(db, m);
  if (!r) return null;

  try {
    resolveMatchScore(m);
  } catch {
    return null;
  }

  return {
    matchId: m.id,
    dateLabel: formatKickoffShortNl(m.kickoff_at),
    opponent: m.opponent?.trim() || "Tegenstander",
    venueLabel: m.is_home ? "Thuis" : "Uit",
    scoreLabel: `${m.goals_for} : ${m.goals_against}`,
    ...toResultDisplay(r),
  };
}

/**
 * Meest recente geverifieerde gespeelde wedstrijden voor Statistics Center.
 * Gebruikt `seasonMatches` + bestaande score-/resultaathelpers — geen eigen aggregatie.
 */
export function getRecentMatches(
  db: ClubDatabase,
  seasonId: string,
  now = new Date(),
  limit: number = RECENT_LIMIT,
): RecentMatchPreview[] {
  if (!seasonId) return [];

  const t = now.getTime();
  const played = seasonMatches(db, seasonId)
    .filter(isOfficialPlayed)
    .filter((m) => new Date(m.kickoff_at).getTime() <= t)
    .slice(0, limit);

  return played
    .map((m) => buildPreview(db, m))
    .filter((p): p is RecentMatchPreview => p !== null);
}
