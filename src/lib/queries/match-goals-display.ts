import type { ClubDatabase, Match } from "@/types";

/**
 * Voor gespeelde wedstrijden met minstens één stats-rij: som goals (zelfde bron als ranking).
 * Zonder stats: fallback naar `matches.goals_for` (bijv. direct na seed vóór import).
 */
export function zaandijkGoalsForDisplayed(m: Match, db: ClubDatabase): number {
  if (m.status !== "played") return m.goals_for;
  const stats = db.match_player_stats.filter((s) => s.match_id === m.id);
  if (stats.length === 0) return m.goals_for;
  return stats.reduce((a, s) => a + s.goals, 0);
}
