/**
 * Tijdelijke wedstrijd-fixtures: altijd opruimen in finally, ook bij falende tests.
 * Mag nooit permanente records in de actieve seizoen-DB achterlaten.
 */

import { randomUUID } from "node:crypto";
import type { ClubDatabase, Match } from "@/types";
import { QA_FIXTURE_NOTES_MARKER } from "@/lib/match/qa-fixture-patterns";

export type TemporaryMatchSeed = {
  season_id: string;
  opponent?: string;
  kickoff_at?: string;
  status?: Match["status"];
  match_type?: Match["match_type"];
  is_home?: boolean;
};

export function buildTemporaryMatch(seed: TemporaryMatchSeed): Match {
  const id = randomUUID();
  const stamp = Date.now();
  return {
    id,
    season_id: seed.season_id,
    opponent: seed.opponent ?? `QA Temp ${stamp}`,
    kickoff_at: seed.kickoff_at ?? new Date(Date.now() + 7 * 86400000).toISOString(),
    is_home: seed.is_home ?? true,
    goals_for: 0,
    goals_against: 0,
    status: seed.status ?? "scheduled",
    wotm_player_id: null,
    match_type: seed.match_type ?? "friendly",
    location: null,
    referee: null,
    notes: QA_FIXTURE_NOTES_MARKER,
    data_scope: "qa",
    lineup_status: "draft",
    lineup_confirmed_at: null,
  };
}

/**
 * In-memory fixture helper (unit/integration tests zonder productiedata).
 * Voor runtime screenshots: gebruik deleteMatchAdminAction / SQL cleanup in finally.
 */
export async function withTemporaryMatchFixture<T>(
  db: ClubDatabase,
  seed: TemporaryMatchSeed,
  fn: (match: Match, db: ClubDatabase) => Promise<T> | T,
): Promise<T> {
  const match = buildTemporaryMatch(seed);
  db.matches = [...db.matches, match];
  try {
    return await fn(match, db);
  } finally {
    const id = match.id;
    db.matches = db.matches.filter((m) => m.id !== id);
    db.match_lineup_entries = db.match_lineup_entries.filter((e) => e.match_id !== id);
    db.match_matchday_roster = db.match_matchday_roster.filter((e) => e.match_id !== id);
    db.match_goal_events = db.match_goal_events.filter((e) => e.match_id !== id);
    db.match_card_events = db.match_card_events.filter((e) => e.match_id !== id);
    db.match_substitutions = db.match_substitutions.filter((e) => e.match_id !== id);
    db.match_position_changes = (db.match_position_changes ?? []).filter((e) => e.match_id !== id);
    db.match_player_stats = db.match_player_stats.filter((e) => e.match_id !== id);
  }
}

export type CreatedMatchCleanup = {
  matchId: string;
  cleanup: () => Promise<void>;
};

/**
 * Registreer een live aangemaakte match-id voor screenshot/capture scripts.
 * Caller moet cleanup() in finally aanroepen.
 */
export function registerLiveMatchCleanup(
  matchId: string,
  deleteFn: (id: string) => Promise<void>,
): CreatedMatchCleanup {
  return {
    matchId,
    cleanup: async () => {
      await deleteFn(matchId);
    },
  };
}
