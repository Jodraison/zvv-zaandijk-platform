/**
 * Resterend competitieprogramma 2026/27 — 18 fixtures vanaf 24 oktober.
 * Run: npm run test:remaining-league-program
 */
import assert from "node:assert/strict";
import {
  SEASON_2026_27_PRODUCTION_FIXTURES,
  SEASON_2026_27_REMAINING_LEAGUE_FIXTURES,
  findExistingFixture,
  fixtureKickoffIso,
  matchCalendarDateAmsterdam,
  remainingLeagueHomeAwayCounts,
} from "@/lib/season/season-2026-27-schedule";
import { formatTimeNl } from "@/lib/utils/format-date";
import { nextScheduledMatch } from "@/lib/queries/matches";
import { SEASON_2026_27_ID } from "@/lib/season/season-operations-2026-27";
import type { ClubDatabase, Match } from "@/types";

const specs = SEASON_2026_27_REMAINING_LEAGUE_FIXTURES;

assert.equal(specs.length, 18);
assert.equal(SEASON_2026_27_PRODUCTION_FIXTURES.length, 7);
assert.ok(specs.every((s) => s.matchType === "competition"));
assert.ok(specs.every((s) => s.date >= "2026-10-24"));

const { home, away } = remainingLeagueHomeAwayCounts();
assert.equal(home, 9);
assert.equal(away, 9);

const dates = specs.map((s) => s.date);
assert.deepEqual(dates, [...dates].sort());
assert.equal(new Set(dates).size, 18);

assert.ok(specs.filter((s) => s.date.startsWith("2026-")).every((s) => s.date <= "2026-12-31"));
assert.ok(specs.filter((s) => s.date.startsWith("2027-")).every((s) => s.date >= "2027-01-01"));
assert.equal(specs[0]!.date, "2026-10-24");
assert.equal(specs[6]!.date, "2027-01-23");
const last = specs[17]!;
assert.equal(last.date, "2027-05-22");
assert.equal(last.opponent, "Schagen United VR1");
assert.equal(last.isHome, false);
assert.equal(last.time, "15:00");

for (const spec of specs) {
  const iso = fixtureKickoffIso(spec);
  assert.equal(matchCalendarDateAmsterdam(iso), spec.date, spec.date);
  assert.equal(formatTimeNl(iso), spec.time, `${spec.date} ${spec.time}`);
}

assert.equal(formatTimeNl(fixtureKickoffIso(specs[0]!)), "13:30");
assert.equal(fixtureKickoffIso({ ...specs[0]!, date: "2026-10-24", time: "13:30" }), "2026-10-24T11:30:00.000Z");
assert.equal(formatTimeNl(fixtureKickoffIso(specs[1]!)), "14:00");
assert.equal(matchCalendarDateAmsterdam(fixtureKickoffIso(specs[1]!)), "2026-10-31");
assert.equal(formatTimeNl(fixtureKickoffIso(specs[6]!)), "14:30");
assert.equal(matchCalendarDateAmsterdam(fixtureKickoffIso(specs[6]!)), "2027-01-23");
assert.equal(formatTimeNl(fixtureKickoffIso(last)), "15:00");

const homeOpponents = specs.filter((s) => s.isHome).map((s) => `${s.date}|${s.opponent}`);
assert.deepEqual(homeOpponents, [
  "2026-10-24|V.V. Bergen VR1",
  "2026-11-07|Wieringermeer VR2",
  "2026-11-28|Vrone VR1",
  "2026-12-05|Schagen United VR1",
  "2027-02-06|Wieringermeer VR3",
  "2027-02-13|ZOB VR1",
  "2027-03-13|Sporting Krommenie VR1",
  "2027-04-03|WSV 1930 VR1",
  "2027-04-17|Sporting Andijk VR1",
]);

function emptyDb(): ClubDatabase {
  return {
    seasons: [{ id: SEASON_2026_27_ID, name: "2026/27 Competitie", starts_on: "2026-08-01", ends_on: "2027-06-30", is_active: true }],
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
  };
}

function asMatch(spec: (typeof specs)[number], id: string): Match {
  return {
    id,
    season_id: SEASON_2026_27_ID,
    opponent: spec.opponent,
    kickoff_at: fixtureKickoffIso(spec),
    is_home: spec.isHome,
    match_type: spec.matchType,
    location: spec.location ?? null,
    referee: null,
    notes: null,
    goals_for: 0,
    goals_against: 0,
    status: "scheduled",
    wotm_player_id: null,
    lineup_status: "draft",
    data_scope: "production",
  };
}

{
  const existing = specs.map((s, i) => asMatch(s, `m${i}`));
  for (const spec of specs) {
    const hit = findExistingFixture(existing, spec);
    assert.ok(hit);
    assert.equal(hit!.opponent, spec.opponent);
    const again = findExistingFixture(existing, spec);
    assert.equal(again?.id, hit!.id);
  }
  assert.equal(new Set(existing.map((m) => `${matchCalendarDateAmsterdam(m.kickoff_at)}|${m.opponent}`)).size, 18);
}

{
  const db = emptyDb();
  const early: Match = {
    id: "early",
    season_id: SEASON_2026_27_ID,
    opponent: "Sporting Krommenie VR2",
    kickoff_at: "2026-09-05T13:15:00.000Z",
    is_home: true,
    match_type: "cup",
    location: null,
    referee: null,
    notes: null,
    goals_for: 0,
    goals_against: 0,
    status: "scheduled",
    wotm_player_id: null,
    lineup_status: "draft",
    data_scope: "production",
  };
  db.matches = [early, ...specs.map((s, i) => asMatch(s, `r${i}`))];
  const next = nextScheduledMatch(db, SEASON_2026_27_ID, new Date("2026-08-30T12:00:00+02:00"));
  assert.equal(next?.id, "early");
  assert.equal(next?.opponent, "Sporting Krommenie VR2");
}

{
  assert.ok(specs.every((s) => s.location));
  assert.ok(specs.filter((s) => s.isHome).every((s) => s.location === "Sportpark Schanszicht"));
}

console.log("remaining-league-program-2026-27.test.ts: ok");
