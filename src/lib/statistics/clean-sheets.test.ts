/**
 * Clean sheets — keepers + verdedigers vanaf 2026/27.
 * Run: npx tsx src/lib/statistics/clean-sheets.test.ts
 */
import assert from "node:assert/strict";
import type { ClubDatabase, Match, MatchLineupEntry, Player, PlayerSeasonMembership, Season } from "@/types";
import { SEASON_2026_27_ID } from "@/lib/season/season-operations-2026-27";
import {
  isCleanSheetEligibleMembership,
  isCleanSheetEligibleSlot,
  isPlayerCleanSheetEligibleInMatch,
  isPlayerCleanSheetSeason,
  shouldShowPlayerCleanSheetsStat,
} from "@/lib/statistics/clean-sheets";
import { aggregateSeasonMatchStats, playerTotalsFromAggregate } from "@/lib/queries/season-match-stats";

assert.equal(isCleanSheetEligibleSlot("GK"), true);
assert.equal(isCleanSheetEligibleSlot("LCB"), true);
assert.equal(isCleanSheetEligibleSlot("RB"), true);
assert.equal(isCleanSheetEligibleSlot("CAM"), false);
assert.equal(isCleanSheetEligibleMembership("GK"), true);
assert.equal(isCleanSheetEligibleMembership("DEF"), true);
assert.equal(isCleanSheetEligibleMembership("MID"), false);
assert.equal(shouldShowPlayerCleanSheetsStat("DEF", "CB", 0), true);
assert.equal(shouldShowPlayerCleanSheetsStat("MID", "CM", 0), false);
assert.equal(shouldShowPlayerCleanSheetsStat("MID", "CM", 2), true);

const seasonOld: Season = {
  id: "season-2025",
  name: "2025/26",
  starts_on: "2025-08-01",
  ends_on: "2026-06-30",
  is_active: false,
};
const seasonNew: Season = {
  id: SEASON_2026_27_ID,
  name: "2026/27",
  starts_on: "2026-08-01",
  ends_on: "2027-06-30",
  is_active: true,
};

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

const gk: Player = {
  id: "p-gk",
  full_name: "Keeper Test",
  photo_url: null,
  is_guest: false,
  role_label: null,
  tagline: null,
  bio: null,
  birth_date: null,
};
const cb: Player = {
  id: "p-cb",
  full_name: "CB Test",
  photo_url: null,
  is_guest: false,
  role_label: null,
  tagline: null,
  bio: null,
  birth_date: null,
};
const mid: Player = {
  id: "p-mid",
  full_name: "Mid Test",
  photo_url: null,
  is_guest: false,
  role_label: null,
  tagline: null,
  bio: null,
  birth_date: null,
};

const mems: PlayerSeasonMembership[] = [
  {
    id: "m1",
    player_id: gk.id,
    season_id: SEASON_2026_27_ID,
    shirt_number: 1,
    position: "GK",
    display_position: "GK",
    is_captain: false,
    is_vice_captain: false,
    is_guest: false,
  },
  {
    id: "m2",
    player_id: cb.id,
    season_id: SEASON_2026_27_ID,
    shirt_number: 4,
    position: "DEF",
    display_position: "CB",
    is_captain: false,
    is_vice_captain: false,
    is_guest: false,
  },
  {
    id: "m3",
    player_id: mid.id,
    season_id: SEASON_2026_27_ID,
    shirt_number: 8,
    position: "MID",
    display_position: "CM",
    is_captain: false,
    is_vice_captain: false,
    is_guest: false,
  },
];

const matchClean: Match = {
  id: "match-cs",
  season_id: SEASON_2026_27_ID,
  opponent: "Test FC",
  kickoff_at: "2026-09-01T14:00:00.000Z",
  is_home: true,
  match_type: "competition",
  location: null,
  referee: null,
  notes: null,
  goals_for: 2,
  goals_against: 0,
  status: "played",
  wotm_player_id: null,
  integrity_state: "verified",
  data_scope: "production",
};

const lineup: MatchLineupEntry[] = [
  {
    id: "l1",
    match_id: matchClean.id,
    player_id: gk.id,
    role: "starter",
    position: "GK",
    absence_reason: null,
    sort_order: 0,
  },
  {
    id: "l2",
    match_id: matchClean.id,
    player_id: cb.id,
    role: "starter",
    position: "LCB",
    absence_reason: null,
    sort_order: 1,
  },
  {
    id: "l3",
    match_id: matchClean.id,
    player_id: mid.id,
    role: "starter",
    position: "CAM",
    absence_reason: null,
    sort_order: 2,
  },
];

const db = emptyDb({
  seasons: [seasonOld, seasonNew],
  players: [gk, cb, mid],
  player_season_memberships: mems,
  matches: [matchClean],
  match_lineup_entries: lineup,
});

assert.equal(isPlayerCleanSheetSeason(db, SEASON_2026_27_ID), true);
assert.equal(isPlayerCleanSheetSeason(db, "season-2025"), false);
assert.equal(isPlayerCleanSheetEligibleInMatch(db, SEASON_2026_27_ID, matchClean.id, gk.id), true);
assert.equal(isPlayerCleanSheetEligibleInMatch(db, SEASON_2026_27_ID, matchClean.id, cb.id), true);
assert.equal(isPlayerCleanSheetEligibleInMatch(db, SEASON_2026_27_ID, matchClean.id, mid.id), false);

const agg = aggregateSeasonMatchStats(db, SEASON_2026_27_ID);
assert.equal(playerTotalsFromAggregate(agg, gk.id).clean_sheets_total, 1);
assert.equal(playerTotalsFromAggregate(agg, cb.id).clean_sheets_total, 1);
assert.equal(playerTotalsFromAggregate(agg, mid.id).clean_sheets_total, 0);

// Goals against > 0 → no clean sheets
const conceded = { ...matchClean, id: "match-ga", goals_against: 1 };
const dbConceded = emptyDb({
  ...db,
  matches: [conceded],
  match_lineup_entries: lineup.map((e) => ({ ...e, id: `${e.id}-ga`, match_id: conceded.id })),
});
const agg2 = aggregateSeasonMatchStats(dbConceded, SEASON_2026_27_ID);
assert.equal(playerTotalsFromAggregate(agg2, gk.id).clean_sheets_total, 0);

// Old season: no player clean sheets even on 0-0
const oldMatch = { ...matchClean, id: "old", season_id: "season-2025" };
const dbOld = emptyDb({
  seasons: [seasonOld],
  players: [gk],
  player_season_memberships: [{ ...mems[0]!, season_id: "season-2025" }],
  matches: [oldMatch],
  match_lineup_entries: [{ ...lineup[0]!, id: "old-l", match_id: "old" }],
});
assert.equal(playerTotalsFromAggregate(aggregateSeasonMatchStats(dbOld, "season-2025"), gk.id).clean_sheets_total, 0);

console.log("clean-sheets.test.ts: ok");
