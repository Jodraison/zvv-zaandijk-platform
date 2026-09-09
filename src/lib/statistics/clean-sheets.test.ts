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

// Profile ATT / SP may never earn a clean sheet from membership when match slots exist.
const emie: Player = { ...mid, id: "p-emie", full_name: "Emie Agema" };
const andrada: Player = { ...cb, id: "p-andrada", full_name: "Andrada Timmer" };
const jelisa: Player = { ...gk, id: "p-jelisa", full_name: "Jelisa" };
const matchRole = { ...matchClean, id: "match-roles" };
const roleMems: PlayerSeasonMembership[] = [
  {
    id: "mem-emie",
    player_id: emie.id,
    season_id: SEASON_2026_27_ID,
    shirt_number: 9,
    position: "ATT",
    display_position: "SP",
    is_captain: false,
    is_vice_captain: false,
    is_guest: false,
  },
  {
    id: "mem-andrada",
    player_id: andrada.id,
    season_id: SEASON_2026_27_ID,
    shirt_number: 2,
    position: "MID",
    display_position: "RM",
    is_captain: false,
    is_vice_captain: false,
    is_guest: false,
  },
  {
    id: "mem-jelisa",
    player_id: jelisa.id,
    season_id: SEASON_2026_27_ID,
    shirt_number: 1,
    position: "GK",
    display_position: "GK",
    is_captain: false,
    is_vice_captain: false,
    is_guest: false,
  },
];
const roleLineup: MatchLineupEntry[] = [
  {
    id: "rl-j",
    match_id: matchRole.id,
    player_id: jelisa.id,
    role: "starter",
    position: "GK",
    absence_reason: null,
    sort_order: 0,
  },
  {
    id: "rl-a",
    match_id: matchRole.id,
    player_id: andrada.id,
    role: "starter",
    position: "RB",
    absence_reason: null,
    sort_order: 1,
  },
  {
    id: "rl-e",
    match_id: matchRole.id,
    player_id: emie.id,
    role: "starter",
    position: "SP",
    absence_reason: null,
    sort_order: 2,
  },
];
const dbRoles = emptyDb({
  seasons: [seasonNew],
  players: [emie, andrada, jelisa],
  player_season_memberships: roleMems,
  matches: [matchRole],
  match_lineup_entries: roleLineup,
});
assert.equal(isPlayerCleanSheetEligibleInMatch(dbRoles, SEASON_2026_27_ID, matchRole.id, emie.id), false);
assert.equal(isPlayerCleanSheetEligibleInMatch(dbRoles, SEASON_2026_27_ID, matchRole.id, andrada.id), true);
assert.equal(isPlayerCleanSheetEligibleInMatch(dbRoles, SEASON_2026_27_ID, matchRole.id, jelisa.id), true);
assert.equal(playerTotalsFromAggregate(aggregateSeasonMatchStats(dbRoles, SEASON_2026_27_ID), emie.id).clean_sheets_total, 0);
assert.equal(playerTotalsFromAggregate(aggregateSeasonMatchStats(dbRoles, SEASON_2026_27_ID), andrada.id).clean_sheets_total, 1);

// RB → RM later still counts: defensive minutes were played.
const dbMoved = emptyDb({
  ...dbRoles,
  match_position_changes: [
    {
      id: "pc-andrada",
      match_id: matchRole.id,
      player_id: andrada.id,
      minute: 70,
      stoppage_time: 0,
      from_slot: "RB",
      to_slot: "RM",
      change_group_id: null,
      notes: null,
      sort_order: 0,
    },
  ],
});
assert.equal(isPlayerCleanSheetEligibleInMatch(dbMoved, SEASON_2026_27_ID, matchRole.id, andrada.id), true);

// Profile DEF but only played SP in a slotted match → no credit.
const defAsSp: Player = { ...cb, id: "p-def-sp", full_name: "Def als SP" };
const dbProfileIgnored = emptyDb({
  seasons: [seasonNew],
  players: [defAsSp],
  player_season_memberships: [
    {
      id: "mem-def-sp",
      player_id: defAsSp.id,
      season_id: SEASON_2026_27_ID,
      shirt_number: 5,
      position: "DEF",
      display_position: "CB",
      is_captain: false,
      is_vice_captain: false,
      is_guest: false,
    },
  ],
  matches: [matchRole],
  match_lineup_entries: [
    {
      id: "rl-def-sp",
      match_id: matchRole.id,
      player_id: defAsSp.id,
      role: "starter",
      position: "SP",
      absence_reason: null,
      sort_order: 0,
    },
  ],
});
assert.equal(isPlayerCleanSheetEligibleInMatch(dbProfileIgnored, SEASON_2026_27_ID, matchRole.id, defAsSp.id), false);

// Membership line GK must not credit a sub who inherited a SP slot.
const dbSubSp = emptyDb({
  seasons: [seasonNew],
  players: [emie, jelisa],
  player_season_memberships: [
    roleMems[0]!,
    { ...roleMems[0]!, id: "mem-emie-gk", position: "GK", display_position: "SP" },
    roleMems[2]!,
  ],
  matches: [matchRole],
  match_lineup_entries: [
    {
      id: "rl-j2",
      match_id: matchRole.id,
      player_id: jelisa.id,
      role: "starter",
      position: "GK",
      absence_reason: null,
      sort_order: 0,
    },
    {
      id: "rl-sp",
      match_id: matchRole.id,
      player_id: "p-starter-sp",
      role: "starter",
      position: "SP",
      absence_reason: null,
      sort_order: 1,
    },
    {
      id: "rl-emie-b",
      match_id: matchRole.id,
      player_id: emie.id,
      role: "bench",
      position: null,
      absence_reason: null,
      sort_order: 2,
    },
  ],
  match_substitutions: [
    {
      id: "sub-emie-sp",
      match_id: matchRole.id,
      player_in_id: emie.id,
      player_out_id: "p-starter-sp",
      minute: 60,
      to_slot: null,
      stoppage_time: 0,
      sort_order: 0,
      change_group_id: null,
      notes: null,
    },
  ],
});
assert.equal(isPlayerCleanSheetEligibleInMatch(dbSubSp, SEASON_2026_27_ID, matchRole.id, emie.id), false);

console.log("clean-sheets.test.ts: ok");
