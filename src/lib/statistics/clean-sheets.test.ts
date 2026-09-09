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
import { computePlayerSlotIntervals } from "@/lib/match/match-shape";

assert.equal(isCleanSheetEligibleSlot("GK"), true);
assert.equal(isCleanSheetEligibleSlot("LCB"), true);
assert.equal(isCleanSheetEligibleSlot("RB"), true);
assert.equal(isCleanSheetEligibleSlot("CAM"), false);
assert.equal(isCleanSheetEligibleSlot("RCVM"), false);
assert.equal(isCleanSheetEligibleSlot("RM"), false);
assert.equal(isCleanSheetEligibleSlot("CVM"), false);
assert.equal(isCleanSheetEligibleSlot("SP"), false);
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

// Profiel GK→ATT mag match-role clean sheets niet wijzigen.
const dbEmieGkProfile = emptyDb({
  ...dbRoles,
  player_season_memberships: roleMems.map((m) =>
    m.player_id === emie.id ? { ...m, position: "GK", display_position: "SP" } : m,
  ),
});
assert.equal(
  isPlayerCleanSheetEligibleInMatch(dbEmieGkProfile, SEASON_2026_27_ID, matchRole.id, emie.id),
  isPlayerCleanSheetEligibleInMatch(dbRoles, SEASON_2026_27_ID, matchRole.id, emie.id),
);
assert.equal(
  playerTotalsFromAggregate(aggregateSeasonMatchStats(dbEmieGkProfile, SEASON_2026_27_ID), emie.id)
    .clean_sheets_total,
  playerTotalsFromAggregate(aggregateSeasonMatchStats(dbRoles, SEASON_2026_27_ID), emie.id)
    .clean_sheets_total,
);
assert.equal(
  playerTotalsFromAggregate(aggregateSeasonMatchStats(dbRoles, SEASON_2026_27_ID), andrada.id)
    .clean_sheets_total,
  playerTotalsFromAggregate(aggregateSeasonMatchStats(dbEmieGkProfile, SEASON_2026_27_ID), andrada.id)
    .clean_sheets_total,
);

function csMatch(id: string): Match {
  return { ...matchClean, id };
}

function starter(matchId: string, playerId: string, position: string, sort: number): MatchLineupEntry {
  return {
    id: `${matchId}-${playerId}`,
    match_id: matchId,
    player_id: playerId,
    role: "starter",
    position,
    absence_reason: null,
    sort_order: sort,
  };
}

const dionneP: Player = { ...mid, id: "p-dionne", full_name: "Dionne van Dijk" };
const reneeP: Player = { ...mid, id: "p-renee", full_name: "Renée Koopman" };
const andradaP: Player = { ...cb, id: "p-andrada-cs", full_name: "Andrada Timmer" };
const spP: Player = { ...mid, id: "p-sp", full_name: "SP Test" };
const memMid = (id: string, playerId: string, display: string): PlayerSeasonMembership => ({
  id,
  player_id: playerId,
  season_id: SEASON_2026_27_ID,
  shirt_number: 10,
  position: "MID",
  display_position: display,
  is_captain: false,
  is_vice_captain: false,
  is_guest: false,
});

// CASE A — Dionne 0–45 RCVM, 45–90 RM, 0 GA → geen CS
{
  const m = csMatch("cs-a");
  const dbA = emptyDb({
    seasons: [seasonNew],
    players: [dionneP],
    player_season_memberships: [memMid("mem-d-a", dionneP.id, "CVM")],
    matches: [m],
    match_lineup_entries: [starter(m.id, dionneP.id, "RCVM", 0)],
    match_position_changes: [
      {
        id: "a-pos",
        match_id: m.id,
        player_id: dionneP.id,
        minute: 45,
        stoppage_time: 0,
        from_slot: "RCVM",
        to_slot: "RM",
        change_group_id: null,
        notes: null,
        sort_order: 0,
      },
    ],
  });
  const histA = computePlayerSlotIntervals(dbA, m.id, 90).filter((h) => h.player_id === dionneP.id);
  assert.deepEqual(
    histA.map((h) => ({ slot: h.slot, from: h.from_minute, to: h.to_minute })),
    [
      { slot: "RCVM", from: 0, to: 45 },
      { slot: "RM", from: 45, to: null },
    ],
  );
  assert.equal(isPlayerCleanSheetEligibleInMatch(dbA, SEASON_2026_27_ID, m.id, dionneP.id), false);
  assert.equal(playerTotalsFromAggregate(aggregateSeasonMatchStats(dbA, SEASON_2026_27_ID), dionneP.id).clean_sheets_total, 0);
}

// CASE B — Renée 25–45 RB, 45–90 RCVM → wel CS
{
  const m = csMatch("cs-b");
  const dbB = emptyDb({
    seasons: [seasonNew],
    players: [reneeP],
    player_season_memberships: [memMid("mem-r-b", reneeP.id, "RM")],
    matches: [m],
    match_lineup_entries: [
      starter(m.id, "p-out-rb", "RB", 0),
      { ...starter(m.id, reneeP.id, null as unknown as string, 1), role: "bench", position: null },
    ],
    match_substitutions: [
      {
        id: "b-sub",
        match_id: m.id,
        player_in_id: reneeP.id,
        player_out_id: "p-out-rb",
        minute: 25,
        to_slot: null,
        stoppage_time: 0,
        sort_order: 0,
        change_group_id: null,
        notes: null,
      },
    ],
    match_position_changes: [
      {
        id: "b-pos",
        match_id: m.id,
        player_id: reneeP.id,
        minute: 45,
        stoppage_time: 0,
        from_slot: "RB",
        to_slot: "RCVM",
        change_group_id: null,
        notes: null,
        sort_order: 0,
      },
    ],
  });
  const histB = computePlayerSlotIntervals(dbB, m.id, 90).filter((h) => h.player_id === reneeP.id);
  assert.ok(histB.some((h) => h.slot === "RB" && h.from_minute === 25 && h.to_minute === 45));
  assert.ok(histB.some((h) => h.slot === "RCVM" && h.from_minute === 45));
  assert.equal(isPlayerCleanSheetEligibleInMatch(dbB, SEASON_2026_27_ID, m.id, reneeP.id), true);
}

// CASE C — Andrada 0–45 RM, 45–90 RB → wel CS
{
  const m = csMatch("cs-c");
  const dbC = emptyDb({
    seasons: [seasonNew],
    players: [andradaP],
    player_season_memberships: [memMid("mem-a-c", andradaP.id, "LM-RM")],
    matches: [m],
    match_lineup_entries: [starter(m.id, andradaP.id, "RM", 0)],
    match_position_changes: [
      {
        id: "c-pos",
        match_id: m.id,
        player_id: andradaP.id,
        minute: 45,
        stoppage_time: 0,
        from_slot: "RM",
        to_slot: "RB",
        change_group_id: null,
        notes: null,
        sort_order: 0,
      },
    ],
  });
  assert.equal(isPlayerCleanSheetEligibleInMatch(dbC, SEASON_2026_27_ID, m.id, andradaP.id), true);
}

// CASE D — 60–90 SP → geen CS, ook niet via profiel GK
{
  const m = csMatch("cs-d");
  const dbD = emptyDb({
    seasons: [seasonNew],
    players: [spP],
    player_season_memberships: [
      { ...memMid("mem-sp", spP.id, "SP"), position: "GK", display_position: "SP" },
    ],
    matches: [m],
    match_lineup_entries: [
      starter(m.id, "p-starter-sp", "SP", 0),
      { ...starter(m.id, spP.id, null as unknown as string, 1), role: "bench", position: null },
    ],
    match_substitutions: [
      {
        id: "d-sub",
        match_id: m.id,
        player_in_id: spP.id,
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
  assert.equal(isPlayerCleanSheetEligibleInMatch(dbD, SEASON_2026_27_ID, m.id, spP.id), false);
}

// CASE E — atomic rotation maakt geen spookintervals
{
  const m = csMatch("cs-e");
  const group = "g-45";
  const dbE = emptyDb({
    seasons: [seasonNew],
    players: [reneeP, dionneP, andradaP],
    player_season_memberships: [
      memMid("mem-e-r", reneeP.id, "RM"),
      memMid("mem-e-d", dionneP.id, "CVM"),
      memMid("mem-e-a", andradaP.id, "LM-RM"),
    ],
    matches: [m],
    match_lineup_entries: [
      starter(m.id, reneeP.id, "RB", 0),
      starter(m.id, dionneP.id, "RCVM", 1),
      starter(m.id, andradaP.id, "RM", 2),
    ],
    match_position_changes: [
      { id: "e1", match_id: m.id, player_id: reneeP.id, minute: 45, stoppage_time: 0, from_slot: "RB", to_slot: "RCVM", change_group_id: group, notes: null, sort_order: 0 },
      { id: "e2", match_id: m.id, player_id: dionneP.id, minute: 45, stoppage_time: 0, from_slot: "RCVM", to_slot: "RM", change_group_id: group, notes: null, sort_order: 1 },
      { id: "e3", match_id: m.id, player_id: andradaP.id, minute: 45, stoppage_time: 0, from_slot: "RM", to_slot: "RB", change_group_id: group, notes: null, sort_order: 2 },
    ],
  });
  const hist = computePlayerSlotIntervals(dbE, m.id, 90);
  const of = (id: string) => hist.filter((h) => h.player_id === id).map((h) => h.slot);
  assert.deepEqual(of(dionneP.id), ["RCVM", "RM"]);
  assert.ok(!of(dionneP.id).includes("RB"));
  assert.deepEqual(of(andradaP.id), ["RM", "RB"]);
  assert.ok(!of(andradaP.id).includes("RCVM"));
  assert.deepEqual(of(reneeP.id), ["RB", "RCVM"]);
  assert.ok(!of(reneeP.id).includes("RM"));
  assert.equal(isPlayerCleanSheetEligibleInMatch(dbE, SEASON_2026_27_ID, m.id, dionneP.id), false);
  assert.equal(isPlayerCleanSheetEligibleInMatch(dbE, SEASON_2026_27_ID, m.id, reneeP.id), true);
  assert.equal(isPlayerCleanSheetEligibleInMatch(dbE, SEASON_2026_27_ID, m.id, andradaP.id), true);
}

// CASE F — lone occupied-slot move (Krommenie 74') mag Dionne geen spook-RB geven
{
  const m = csMatch("cs-f");
  const dbF = emptyDb({
    seasons: [seasonNew],
    players: [dionneP, andradaP],
    player_season_memberships: [
      memMid("mem-f-d", dionneP.id, "CVM"),
      memMid("mem-f-a", andradaP.id, "LM-RM"),
    ],
    matches: [m],
    match_lineup_entries: [
      starter(m.id, andradaP.id, "RB", 0),
      starter(m.id, dionneP.id, "RM", 1),
    ],
    match_position_changes: [
      {
        id: "f-lone",
        match_id: m.id,
        player_id: andradaP.id,
        minute: 74,
        stoppage_time: 0,
        from_slot: "RB",
        to_slot: "RM",
        change_group_id: null,
        notes: null,
        sort_order: 0,
      },
    ],
  });
  const histF = computePlayerSlotIntervals(dbF, m.id, 90);
  assert.equal(
    histF.some((h) => h.player_id === dionneP.id && h.slot === "RB"),
    false,
  );
  assert.equal(isPlayerCleanSheetEligibleInMatch(dbF, SEASON_2026_27_ID, m.id, dionneP.id), false);
  assert.equal(isPlayerCleanSheetEligibleInMatch(dbF, SEASON_2026_27_ID, m.id, andradaP.id), true);
}

console.log("clean-sheets.test.ts: ok");
