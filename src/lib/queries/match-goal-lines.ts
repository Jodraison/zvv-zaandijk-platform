import type { ClubDatabase } from "@/types";

export type MatchGoalLine = {
  scorerName: string;
  assistName: string | null;
  /** Weergave-minuut (geen echte wedstrijdklok in data — wel visuele tijdlijn). */
  displayMinute: number;
};

function timelineMinutes(count: number, index: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 34;
  const spread = 78;
  const step = spread / Math.max(count - 1, 1);
  return Math.min(90, Math.max(1, Math.round(8 + index * step)));
}

/** Doelpunten voor wedstrijdpagina: uitsluitend uit canonical events (met assist). */
export function matchGoalLines(db: ClubDatabase, matchId: string): MatchGoalLine[] {
  const events = db.match_goal_events
    .filter((e) => e.match_id === matchId)
    .sort((a, b) => a.sort_order - b.sort_order);
  if (events.length > 0) {
    const n = events.length;
    return events.map((e, i) => {
      const scorerName = db.players.find((p) => p.id === e.scorer_player_id)?.full_name ?? "—";
      const assistName = e.assist_player_id
        ? db.players.find((p) => p.id === e.assist_player_id)?.full_name ?? null
        : null;
      return { scorerName, assistName, displayMinute: timelineMinutes(n, i) };
    });
  }

  return [];
}
