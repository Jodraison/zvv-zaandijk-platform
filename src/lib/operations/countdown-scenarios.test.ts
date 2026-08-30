/**
 * Extra countdown scenarios for Football Operations.
 * Run: npx tsx src/lib/operations/countdown-scenarios.test.ts
 */
import assert from "node:assert/strict";
import { computeCountdown, expectedFitnessTestDate } from "@/lib/operations/countdown";
import { nextFitnessMoment, nextTrainingSession } from "@/lib/operations/next-events";
import { SEASON_2026_27_ID } from "@/lib/season/season-operations-2026-27";
import type { ClubDatabase } from "@/types";

function baseDb(seasonId = "s1"): ClubDatabase {
  return {
    seasons: [{ id: seasonId, name: "T", starts_on: "2026-08-01", ends_on: "2027-06-30", is_active: true }],
    players: [
      {
        id: "p1",
        full_name: "Renée",
        photo_url: null,
        is_guest: false,
        initials: null,
        bio: null,
        preferred_foot: null,
        strengths: null,
        role_label: null,
        tagline: null,
        card_note: null,
      },
    ],
    player_season_memberships: [
      {
        id: "m1",
        player_id: "p1",
        season_id: seasonId,
        shirt_number: 8,
        position: "MID",
        display_position: "",
        is_captain: false,
        is_vice_captain: false,
        is_guest: false,
      },
    ],
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

const now = new Date("2026-07-30T10:00:00");

{
  // 6 weeks
  const r = computeCountdown("2026-09-10T14:30:00", now);
  assert.match(r.primaryLabel, /wek/i);
}

{
  // training past incomplete attendance
  const db = baseDb();
  db.training_sessions = [
    {
      id: "t1",
      season_id: "s1",
      title: "Training",
      session_at: "2026-07-30T08:00:00",
      location: null,
      status: "completed",
    },
  ];
  const n = nextTrainingSession(db, "s1", now);
  assert.equal(n.attendanceMissing, true);
  assert.equal(n.session?.id, "t1");
}

{
  // fitness none (season without ops config)
  const db = baseDb();
  const f = nextFitnessMoment(db, "s1", now);
  assert.equal(f.kind, "none");
}

{
  // 2026/27 without published → planned_config first test
  const db = baseDb(SEASON_2026_27_ID);
  const f = nextFitnessMoment(db, SEASON_2026_27_ID, now);
  assert.equal(f.kind, "planned_config");
  assert.equal(f.date, "2026-09-07");
  assert.equal(f.labelPrefix, "Eerste meting");
}

{
  // fitness expected + 6 weeks (eligible published <= today)
  const db = baseDb();
  db.fitness_test_sessions = [
    {
      id: "fs1",
      season_id: "s1",
      test_on: "2026-06-01",
      protocol_code: "four_part_v1",
      status: "published",
      note: null,
      score_config_id: null,
      created_at: "2026-06-01T12:00:00Z",
      updated_at: "2026-06-01T12:00:00Z",
      published_at: "2026-06-01T18:00:00Z",
      created_by: null,
      published_by: null,
    },
  ];
  const f = nextFitnessMoment(db, "s1", new Date("2026-06-10T10:00:00"));
  assert.equal(f.kind, "expected");
  assert.equal(f.date, expectedFitnessTestDate("2026-06-01"));
  assert.equal(f.date, "2026-07-13");
  assert.equal(f.labelPrefix, "Verwacht");
}

{
  // fitness overdue expected
  const db = baseDb();
  db.fitness_test_sessions = [
    {
      id: "fs1",
      season_id: "s1",
      test_on: "2026-05-01",
      protocol_code: "four_part_v1",
      status: "published",
      note: null,
      score_config_id: null,
      created_at: "2026-05-01T12:00:00Z",
      updated_at: "2026-05-01T12:00:00Z",
      published_at: "2026-05-01T18:00:00Z",
      created_by: null,
      published_by: null,
    },
  ];
  const f = nextFitnessMoment(db, "s1", now);
  assert.equal(f.kind, "overdue_expected");
  assert.equal(f.date, "2026-06-12");
}

{
  // Future published sessions must not drive countdown (today = 2026-07-30)
  const db = baseDb(SEASON_2026_27_ID);
  db.fitness_test_sessions = [
    {
      id: "fsA",
      season_id: SEASON_2026_27_ID,
      test_on: "2026-08-30",
      protocol_code: "four_part_v1",
      status: "published",
      note: null,
      score_config_id: null,
      created_at: "2026-08-30T12:00:00Z",
      updated_at: "2026-08-30T12:00:00Z",
      published_at: "2026-08-30T18:00:00Z",
      created_by: null,
      published_by: null,
    },
    {
      id: "fsC",
      season_id: SEASON_2026_27_ID,
      test_on: "2026-11-01",
      protocol_code: "four_part_v1",
      status: "published",
      note: null,
      score_config_id: null,
      created_at: "2026-11-01T12:00:00Z",
      updated_at: "2026-11-01T12:00:00Z",
      published_at: "2026-11-01T18:00:00Z",
      created_by: null,
      published_by: null,
    },
  ];
  const f = nextFitnessMoment(db, SEASON_2026_27_ID, now);
  assert.equal(f.kind, "planned_config");
  assert.equal(f.date, "2026-09-07");
  assert.equal(f.lastPublished, null);
}

{
  // DST around NL spring forward 2026-03-29
  const before = new Date("2026-03-28T12:00:00");
  const after = new Date("2026-03-30T12:00:00");
  const r1 = computeCountdown("2026-03-29T14:00:00", before);
  const r2 = computeCountdown("2026-03-29T14:00:00", after);
  assert.ok(r1.state === "tomorrow" || r1.state === "today" || r1.state === "future");
  assert.equal(r2.state, "past");
}

console.log("countdown-scenarios.test.ts: ok");
