/**
 * Season 2026/27 operational calendar + gates.
 * Run: npx tsx src/lib/season/season-operations.test.ts
 */
import assert from "node:assert/strict";
import {
  SEASON_2026_27_ID,
  seasonOperations2026_27,
  nextScheduledTrainingMoment,
  generateMonWedDates,
  trainingKickoffIso,
  trainingEndIso,
  assertTrainingDateAllowed,
  assertFitnessTestDateAllowed,
  clubLocalDateTimeToIso,
} from "@/lib/season/season-operations-2026-27";
import { nextFitnessMoment, nextTrainingSession } from "@/lib/operations/next-events";
import { expectedFitnessTestDate } from "@/lib/operations/countdown";
import { latestPublishedFitnessSession } from "@/lib/fitness/session-ranking";
import type { ClubDatabase } from "@/types";

const ops = seasonOperations2026_27;

assert.equal(ops.operationalStartOn, "2026-08-10");
assert.equal(ops.operationalEndOn, "2027-06-30");
assert.equal(ops.fitness.firstTestOn, "2026-09-02");
assert.equal(ops.fitness.intervalWeeks, 6);
assert.deepEqual(ops.trainingSchedule.weekdays, [1, 3]);
assert.equal(ops.trainingSchedule.startsAt, "20:00");
assert.equal(ops.trainingSchedule.endsAt, "21:00");

{
  const before = new Date("2026-07-30T10:00:00+02:00");
  const n = nextScheduledTrainingMoment(before, ops);
  assert.equal(n.date, "2026-08-10");
  assert.equal(n.iso, trainingKickoffIso("2026-08-10", ops));
  assert.equal(n.endIso, trainingEndIso("2026-08-10", ops));
  // 20:00 Europe/Amsterdam in CEST = 18:00 UTC
  assert.equal(n.iso, "2026-08-10T18:00:00.000Z");
  assert.equal(n.endIso, "2026-08-10T19:00:00.000Z");
}

{
  // After first training kickoff → next is Wednesday 19 Aug 20:00
  const afterMon = new Date("2026-08-17T18:30:00.000Z");
  const n = nextScheduledTrainingMoment(afterMon, ops);
  assert.equal(n.date, "2026-08-19");
  assert.equal(n.iso, "2026-08-19T18:00:00.000Z");
}

{
  const dates = generateMonWedDates("2026-08-17", "2026-08-26");
  assert.deepEqual(dates, ["2026-08-17", "2026-08-19", "2026-08-24", "2026-08-26"]);
  assert.ok(!dates.some((d) => d.startsWith("2026-01")));
}

{
  // Winter time: 2026-10-26 CET (UTC+1) → 20:00 = 19:00 UTC
  assert.equal(clubLocalDateTimeToIso("2026-11-02", "20:00"), "2026-11-02T19:00:00.000Z");
  // Summer time CEST
  assert.equal(clubLocalDateTimeToIso("2026-08-17", "20:00"), "2026-08-17T18:00:00.000Z");
}

{
  assert.equal(assertTrainingDateAllowed(SEASON_2026_27_ID, "2026-08-09").ok, false);
  assert.equal(assertTrainingDateAllowed(SEASON_2026_27_ID, "2026-08-10").ok, true);
  assert.equal(assertTrainingDateAllowed(SEASON_2026_27_ID, "2026-08-17").ok, true);
  // Fitheid mag binnen het operationele seizoen (vanaf 10 aug); firstTestOn is de fallback-datum.
  assert.equal(assertFitnessTestDateAllowed(SEASON_2026_27_ID, "2026-08-09").ok, false);
  assert.equal(assertFitnessTestDateAllowed(SEASON_2026_27_ID, "2026-08-10").ok, true);
  assert.equal(assertFitnessTestDateAllowed(SEASON_2026_27_ID, "2026-09-02").ok, true);
}

function emptyDb(): ClubDatabase {
  return {
    seasons: [
      {
        id: SEASON_2026_27_ID,
        name: "2026/27",
        starts_on: "2026-08-01",
        ends_on: "2027-06-30",
        is_active: true,
      },
    ],
    players: [],
    player_season_memberships: [],
    matches: [],
    match_matchday_roster: [],
    match_lineup_entries: [],
    match_player_stats: [],
    match_goal_events: [],
    match_card_events: [],
    match_substitutions: [],
    match_position_changes: [],
    training_sessions: [],
    training_attendance: [],
    fitness_tests: [],
    fitness_test_sessions: [],
    fitness_test_results: [],
    fitness_score_configs: [],
    team_photo_url: null,
  };
}

{
  const db = emptyDb();
  const now = new Date("2026-07-30T10:00:00+02:00");
  const t = nextTrainingSession(db, SEASON_2026_27_ID, now);
  assert.equal(t.suggestedDate, "2026-08-10");
  assert.ok(!t.suggestedDate?.startsWith("2026-01"));

  const f = nextFitnessMoment(db, SEASON_2026_27_ID, now);
  assert.equal(f.kind, "planned_config");
  assert.equal(f.date, "2026-09-02");
  assert.equal(f.isFirstSeasonTest, true);
  assert.equal(latestPublishedFitnessSession(db, SEASON_2026_27_ID, now), null);
}

{
  // QA / future published must not create ranking
  const db = emptyDb();
  db.fitness_test_sessions = [
    {
      id: "qa1",
      season_id: SEASON_2026_27_ID,
      test_on: "2026-08-30",
      protocol_code: "four_part_v1",
      status: "published",
      note: "[QA] fake",
      score_config_id: null,
      created_at: "2026-07-01T12:00:00Z",
      updated_at: "2026-07-01T12:00:00Z",
      published_at: "2026-07-01T18:00:00Z",
      created_by: null,
      published_by: null,
    },
  ];
  const now = new Date("2026-09-01T10:00:00+02:00");
  assert.equal(latestPublishedFitnessSession(db, SEASON_2026_27_ID, now), null);
  const f = nextFitnessMoment(db, SEASON_2026_27_ID, now);
  assert.equal(f.kind, "planned_config");
}

{
  // After real published → +42 days
  const db = emptyDb();
  db.fitness_test_sessions = [
    {
      id: "real1",
      season_id: SEASON_2026_27_ID,
      test_on: "2026-08-17",
      protocol_code: "four_part_v1",
      status: "published",
      note: null,
      score_config_id: null,
      created_at: "2026-08-17T12:00:00Z",
      updated_at: "2026-08-17T12:00:00Z",
      published_at: "2026-08-17T20:00:00Z",
      created_by: null,
      published_by: null,
    },
  ];
  const now = new Date("2026-08-18T10:00:00+02:00");
  const f = nextFitnessMoment(db, SEASON_2026_27_ID, now);
  assert.equal(f.kind, "expected");
  assert.equal(f.date, expectedFitnessTestDate("2026-08-17", 6));
  assert.equal(f.date, "2026-09-28");
}

{
  // Draft has priority over config
  const db = emptyDb();
  db.fitness_test_sessions = [
    {
      id: "d1",
      season_id: SEASON_2026_27_ID,
      test_on: "2026-08-19",
      protocol_code: "four_part_v1",
      status: "draft",
      note: null,
      score_config_id: null,
      created_at: "2026-08-01T12:00:00Z",
      updated_at: "2026-08-01T12:00:00Z",
      published_at: null,
      created_by: null,
      published_by: null,
    },
  ];
  const f = nextFitnessMoment(db, SEASON_2026_27_ID, new Date("2026-08-10T10:00:00+02:00"));
  assert.equal(f.kind, "draft");
  assert.equal(f.date, "2026-08-19");
}

{
  // Milestones
  assert.ok(ops.milestones.some((m) => m.on === "2026-08-08"));
  assert.ok(ops.milestones.some((m) => m.on === "2026-09-02"));
  assert.ok(ops.milestones.some((m) => m.from === "2026-08-29" && m.to === "2026-08-30"));
  assert.ok(ops.milestones.some((m) => m.from === "2026-09-19" && m.to === "2026-09-20"));
}

{
  // Season end: last Wed on/before 30 Jun 2027 is 30 Jun 2027 (Wednesday)
  const dates = generateMonWedDates("2027-06-28", "2027-06-30");
  assert.deepEqual(dates, ["2027-06-28", "2027-06-30"]);
}

console.log("season-operations.test.ts: ok");
