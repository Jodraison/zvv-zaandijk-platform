/**
 * Multi Player of the Match — canonical array + ranking contract.
 * Run: npm run test:wotm-winners
 */
import assert from "node:assert/strict";
import type { ClubDatabase, Match, Player, PlayerSeasonMembership, Season } from "@/types";
import { computeRanking } from "@/lib/queries/ranking";
import { aggregateSeasonMatchStats, playerTotalsFromAggregate } from "@/lib/queries/season-match-stats";
import { buildPlayerDetail } from "@/lib/queries/player-detail";
import {
  applyWotmPlayerIds,
  formatWotmNamesNl,
  hydrateMatchWotmFromTable,
  matchHasWotm,
  primaryWotmPlayerId,
  replaceMatchWotmWinners,
  uniquePlayerIds,
  wotmHeadingNl,
  wotmIdsFromAdminPayload,
  wotmPlayerIdsOf,
} from "@/lib/match/wotm-winners";

console.log("→ test:wotm-winners");

assert.deepEqual(uniquePlayerIds(["a", "a", "", "b", null]), ["a", "b"]);
assert.deepEqual(wotmIdsFromAdminPayload({ wotm_player_ids: ["m", "d"], wotm_player_id: "m" }), ["m", "d"]);
assert.equal(formatWotmNamesNl(["Mandy Kalmeijer", "Danique"]), "Mandy Kalmeijer & Danique");
assert.equal(formatWotmNamesNl(["A", "B", "C"]), "A, B en C");
assert.equal(wotmHeadingNl(1), "Speelster van de wedstrijd");
assert.equal(wotmHeadingNl(2), "Speelsters van de wedstrijd");

const single: Match = {
  id: "m-old",
  season_id: "s1",
  opponent: "Andijk",
  kickoff_at: "2026-05-01T12:00:00.000Z",
  is_home: true,
  match_type: "competition",
  location: null,
  referee: null,
  notes: null,
  goals_for: 2,
  goals_against: 1,
  status: "played",
  wotm_player_id: "p-a",
};
assert.deepEqual(wotmPlayerIdsOf(single), ["p-a"]);
assert.equal(primaryWotmPlayerId(single), "p-a");
assert.equal(matchHasWotm(single, "p-a"), true);

applyWotmPlayerIds(single, ["p-a", "p-b", "p-a"]);
assert.deepEqual(single.wotm_player_ids, ["p-a", "p-b"]);
assert.equal(single.wotm_player_id, "p-a");

const SEASON: Season = {
  id: "s1",
  name: "2026/27",
  starts_on: "2026-08-01",
  ends_on: "2027-06-30",
  is_active: true,
};

function player(id: string, name: string): Player {
  return {
    id,
    full_name: name,
    photo_url: null,
    is_guest: false,
    role_label: null,
    tagline: null,
    bio: null,
    birth_date: null,
  };
}

function mem(playerId: string): PlayerSeasonMembership {
  return {
    id: `mem-${playerId}`,
    player_id: playerId,
    season_id: "s1",
    shirt_number: 1,
    position: "MID",
    display_position: "CM",
    is_captain: false,
    is_vice_captain: false,
    is_guest: false,
  };
}

function match(partial: Partial<Match> & Pick<Match, "id" | "kickoff_at">): Match {
  return {
    season_id: "s1",
    opponent: "Test",
    is_home: true,
    match_type: "competition",
    location: null,
    referee: null,
    notes: null,
    goals_for: 1,
    goals_against: 0,
    status: "played",
    wotm_player_id: null,
    wotm_player_ids: [],
    integrity_state: "verified",
    ...partial,
  };
}

function emptyDb(partial: Partial<ClubDatabase>): ClubDatabase {
  return {
    seasons: [SEASON],
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

const mandy = player("p-mandy", "Mandy Kalmeijer");
const danique = player("p-danique", "Danique");
const melissa = player("p-melissa", "Melissa Donkers");

const matchA = match({
  id: "m-a",
  kickoff_at: "2026-08-20T12:00:00.000Z",
  opponent: "Shared",
  wotm_player_ids: ["p-mandy", "p-danique"],
  wotm_player_id: "p-mandy",
});
const matchB = match({
  id: "m-b",
  kickoff_at: "2026-08-27T12:00:00.000Z",
  opponent: "Solo",
  wotm_player_ids: ["p-mandy"],
  wotm_player_id: "p-mandy",
});
const matchEmpty = match({
  id: "m-empty",
  kickoff_at: "2026-08-10T12:00:00.000Z",
  opponent: "Geen MVP",
});
const matchThree = match({
  id: "m-three",
  kickoff_at: "2026-08-05T12:00:00.000Z",
  opponent: "Drie",
  wotm_player_ids: ["p-mandy", "p-danique", "p-melissa"],
  wotm_player_id: "p-mandy",
});

const db = emptyDb({
  players: [mandy, danique, melissa],
  player_season_memberships: [mem("p-mandy"), mem("p-danique"), mem("p-melissa")],
  matches: [matchA, matchB, matchEmpty, matchThree],
  match_wotm_winners: [
    { match_id: "m-a", player_id: "p-mandy" },
    { match_id: "m-a", player_id: "p-danique" },
    { match_id: "m-b", player_id: "p-mandy" },
    { match_id: "m-three", player_id: "p-mandy" },
    { match_id: "m-three", player_id: "p-danique" },
    { match_id: "m-three", player_id: "p-melissa" },
  ],
});

const ranking = computeRanking(db, "s1");
const mandyRow = ranking.find((r) => r.player_id === "p-mandy")!;
const daniqueRow = ranking.find((r) => r.player_id === "p-danique")!;
const melissaRow = ranking.find((r) => r.player_id === "p-melissa")!;
assert.equal(mandyRow.wotm_total, 3, "Mandy: shared + solo + three");
assert.equal(daniqueRow.wotm_total, 2, "Danique: shared + three");
assert.equal(melissaRow.wotm_total, 1);

const rankingAB = computeRanking(
  emptyDb({
    players: [mandy, danique],
    player_season_memberships: [mem("p-mandy"), mem("p-danique")],
    matches: [matchA, matchB],
    match_wotm_winners: [
      { match_id: "m-a", player_id: "p-mandy" },
      { match_id: "m-a", player_id: "p-danique" },
      { match_id: "m-b", player_id: "p-mandy" },
    ],
  }),
  "s1",
);
assert.equal(rankingAB.find((r) => r.player_id === "p-mandy")!.wotm_total, 2);
assert.equal(rankingAB.find((r) => r.player_id === "p-danique")!.wotm_total, 1);

const detail = buildPlayerDetail(db, "p-danique", "s1");
assert.ok(detail);
assert.equal(detail.wotm_total, 2);
assert.equal(detail.recent_matches.some((r) => r.match_id === "m-a" && r.is_wotm), true);

const mutated = emptyDb({
  players: [mandy, danique],
  matches: [match({ id: "m-edit", kickoff_at: "2026-08-01T12:00:00.000Z", wotm_player_id: "p-mandy" })],
});
replaceMatchWotmWinners(mutated, "m-edit", ["p-mandy", "p-danique"]);
assert.deepEqual(wotmPlayerIdsOf(mutated.matches[0]!), ["p-mandy", "p-danique"]);
assert.equal(mutated.match_wotm_winners?.length, 2);
replaceMatchWotmWinners(mutated, "m-edit", ["p-danique"]);
assert.deepEqual(wotmPlayerIdsOf(mutated.matches[0]!), ["p-danique"]);
replaceMatchWotmWinners(mutated, "m-edit", []);
assert.deepEqual(wotmPlayerIdsOf(mutated.matches[0]!), []);
assert.equal(mutated.match_wotm_winners?.length, 0);

const legacyDb = emptyDb({
  matches: [match({ id: "legacy", kickoff_at: "2026-04-01T12:00:00.000Z", wotm_player_id: "p-a", wotm_player_ids: [] })],
  match_wotm_winners: [],
});
hydrateMatchWotmFromTable(legacyDb);
assert.deepEqual(wotmPlayerIdsOf(legacyDb.matches[0]!), ["p-a"]);
assert.equal(legacyDb.match_wotm_winners?.length, 1);

const agg = aggregateSeasonMatchStats(db, "s1");
assert.equal(playerTotalsFromAggregate(agg, "p-mandy").wotm_total, 3);

console.log("wotm-winners.test.ts: ok");
