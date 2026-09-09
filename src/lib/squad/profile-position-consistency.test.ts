/**
 * Profielpositie: linie-enum moet bij display-code passen.
 * Profile ≠ match role.
 * Run: npx tsx src/lib/squad/profile-position-consistency.test.ts
 */
import assert from "node:assert/strict";
import {
  expectedLineForDisplayPosition,
  isProfilePositionConsistent,
  profilePositionConflict,
} from "@/lib/squad/profile-position-consistency";
import {
  SEASON_2026_27_SQUAD_POSITIONS,
  bindingByName,
} from "@/lib/squad/season-2026-27-positions";
import { isPlayerCleanSheetEligibleInMatch } from "@/lib/statistics/clean-sheets";
import { aggregateSeasonMatchStats, playerTotalsFromAggregate } from "@/lib/queries/season-match-stats";
import { SEASON_2026_27_ID } from "@/lib/season/season-operations-2026-27";
import type { ClubDatabase, Match, MatchLineupEntry, Player, PlayerSeasonMembership } from "@/types";

assert.equal(expectedLineForDisplayPosition("SP"), "ATT");
assert.equal(expectedLineForDisplayPosition("GK"), "GK");
assert.equal(expectedLineForDisplayPosition("LM-RM"), "MID");
assert.equal(expectedLineForDisplayPosition("LM-SP"), "ATT");
assert.equal(expectedLineForDisplayPosition("CB"), "DEF");
assert.equal(isProfilePositionConsistent("GK", "SP"), false);
assert.equal(isProfilePositionConsistent("ATT", "SP"), true);
assert.equal(isProfilePositionConsistent("MID", "LM-RM"), true);
assert.deepEqual(profilePositionConflict("GK", "SP"), {
  line: "GK",
  display: "SP",
  expectedLine: "ATT",
});
assert.equal(profilePositionConflict("ATT", "SP"), null);

const emie = bindingByName("Emie Agema");
assert.ok(emie, "Emie hoort in de bindende selectie");
assert.equal(emie!.display_position, "SP");
assert.equal(emie!.line, "ATT");

for (const b of SEASON_2026_27_SQUAD_POSITIONS) {
  assert.equal(
    isProfilePositionConsistent(b.line, b.display_position),
    true,
    `${b.full_name}: ${b.line} vs ${b.display_position}`,
  );
}

function emptyDb(partial: Partial<ClubDatabase>): ClubDatabase {
  return {
    seasons: [],
    players: [],
    player_season_memberships: [],
    matches: [],
    match_matchday_roster: [],
    match_lineup_entries: [],
    match_player_stats: [],
    match_goal_events: [],
    match_position_changes: [],
    match_card_events: [],
    match_substitutions: [],
    training_sessions: [],
    training_attendance: [],
    fitness_tests: [],
    fitness_test_sessions: [],
    fitness_test_results: [],
    fitness_score_configs: [],
    team_photo_url: null,
    ...partial,
  };
}

const player: Player = {
  id: "p-emie",
  full_name: "Emie Agema",
  photo_url: null,
  is_guest: false,
  role_label: null,
  tagline: null,
  bio: null,
  birth_date: null,
};
const match: Match = {
  id: "m-sp",
  season_id: SEASON_2026_27_ID,
  opponent: "Test",
  kickoff_at: "2026-09-01T14:00:00.000Z",
  is_home: true,
  match_type: "competition",
  location: null,
  referee: null,
  notes: null,
  goals_for: 3,
  goals_against: 0,
  status: "played",
  wotm_player_id: null,
  integrity_state: "verified",
  data_scope: "production",
};
const lineup: MatchLineupEntry[] = [
  {
    id: "l-sp",
    match_id: match.id,
    player_id: player.id,
    role: "starter",
    position: "SP",
    absence_reason: null,
    sort_order: 0,
  },
];

function mem(position: PlayerSeasonMembership["position"], display_position: string): PlayerSeasonMembership {
  return {
    id: "mem-emie",
    player_id: player.id,
    season_id: SEASON_2026_27_ID,
    shirt_number: 17,
    position,
    display_position,
    is_captain: false,
    is_vice_captain: false,
    is_guest: false,
  };
}

function csForProfile(position: PlayerSeasonMembership["position"], display_position: string) {
  const db = emptyDb({
    seasons: [
      {
        id: SEASON_2026_27_ID,
        name: "2026/27",
        starts_on: "2026-08-01",
        ends_on: "2027-06-30",
        is_active: true,
      },
    ],
    players: [player],
    player_season_memberships: [mem(position, display_position)],
    matches: [match],
    match_lineup_entries: lineup,
  });
  return {
    eligible: isPlayerCleanSheetEligibleInMatch(db, SEASON_2026_27_ID, match.id, player.id),
    total: playerTotalsFromAggregate(aggregateSeasonMatchStats(db, SEASON_2026_27_ID), player.id)
      .clean_sheets_total,
  };
}

const wrong = csForProfile("GK", "SP");
const fixed = csForProfile("ATT", "SP");
assert.equal(wrong.eligible, false);
assert.equal(fixed.eligible, false);
assert.equal(wrong.total, fixed.total);
assert.equal(fixed.total, 0);

console.log("profile-position-consistency.test.ts: ok");
