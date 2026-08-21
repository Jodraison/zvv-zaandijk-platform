/**
 * Training calendar + fitness "Vandaag" recovery.
 * Run: npm run test:training-calendar-date-recovery
 */
import assert from "node:assert/strict";
import {
  SEASON_2026_27_ID,
  clubLocalDateTimeToIso,
  generateMonWedDates,
  isTodayInClubTimezone,
  seasonOperations2026_27,
  todayInClubTz,
} from "@/lib/season/season-operations-2026-27";
import { computeCountdown } from "@/lib/operations/countdown";
import { nextTrainingSession } from "@/lib/operations/next-events";
import {
  ensureRegularTrainingSessionsForSeason,
  planRegularTrainingSessions,
} from "@/lib/training/regular-training-calendar";
import { trainingDateKeyAmsterdam } from "@/lib/training/manual-training";
import type { ClubDatabase, TrainingSession } from "@/types";

const ops = seasonOperations2026_27;
const now21 = new Date("2026-08-21T10:00:00+02:00");

assert.deepEqual(ops.trainingSchedule.weekdays, [1, 3]);
assert.equal(ops.trainingSchedule.startsAt, "20:00");
assert.equal(planRegularTrainingSessions(SEASON_2026_27_ID)[0]?.session_at, clubLocalDateTimeToIso("2026-08-10", "20:00"));

{
  const dates = generateMonWedDates("2026-08-10", "2026-09-09");
  assert.ok(dates.includes("2026-08-24"));
  assert.ok(dates.includes("2026-08-26"));
  assert.ok(dates.includes("2026-08-31"));
  assert.ok(dates.includes("2026-09-02"));
  assert.ok(!dates.includes("2026-08-11"));
  assert.ok(!dates.includes("2026-08-13"));
  assert.ok(!dates.includes("2026-08-25"));
}

{
  const hist: TrainingSession[] = [
    {
      id: "s10",
      season_id: SEASON_2026_27_ID,
      title: "Reguliere training",
      session_at: clubLocalDateTimeToIso("2026-08-10", "20:00"),
      location: "20:00–21:00",
      status: "completed",
    },
    {
      id: "s12",
      season_id: SEASON_2026_27_ID,
      title: "Reguliere training",
      session_at: clubLocalDateTimeToIso("2026-08-12", "20:00"),
      location: "20:00–21:00",
      status: "completed",
    },
    {
      id: "s17",
      season_id: SEASON_2026_27_ID,
      title: "Training",
      session_at: clubLocalDateTimeToIso("2026-08-17", "20:00"),
      location: null,
      status: "completed",
    },
    {
      id: "s19",
      season_id: SEASON_2026_27_ID,
      title: "Reguliere training",
      session_at: clubLocalDateTimeToIso("2026-08-19", "20:00"),
      location: "20:00–21:00",
      status: "completed",
    },
    {
      id: "extra",
      season_id: SEASON_2026_27_ID,
      title: "Extra training",
      session_at: clubLocalDateTimeToIso("2026-08-25", "19:30"),
      location: "19:30–20:45 · extra",
      status: "scheduled",
    },
    {
      id: "cancel",
      season_id: SEASON_2026_27_ID,
      title: "Afgelast",
      session_at: clubLocalDateTimeToIso("2026-08-26", "20:00"),
      location: "20:00–21:00",
      status: "cancelled",
    },
  ];
  const attendance = [
    { session_id: "s10", player_id: "p1" },
    { session_id: "s12", player_id: "p1" },
    { session_id: "s17", player_id: "p1" },
    { session_id: "s19", player_id: "p1" },
  ];
  let seq = 0;
  const first = ensureRegularTrainingSessionsForSeason(hist, SEASON_2026_27_ID, attendance, () => `gen-${++seq}`);
  assert.equal(first.preservedIds.length, 6);
  assert.equal(first.cancelledPreserved, 1);
  assert.equal(first.attendancePreserved, 4);
  assert.ok(first.inserted.every((s) => s.status === "scheduled"));
  assert.ok(first.inserted.every((s) => s.title === "Reguliere training"));
  const keys = first.sessions.filter((s) => s.season_id === SEASON_2026_27_ID).map((s) => trainingDateKeyAmsterdam(s.session_at));
  assert.equal(new Set(keys).size, keys.length);
  assert.ok(keys.includes("2026-08-24"));
  assert.ok(!first.inserted.some((s) => trainingDateKeyAmsterdam(s.session_at) === "2026-08-26"));
  assert.equal(first.sessions.find((s) => s.id === "extra")?.title, "Extra training");
  assert.equal(first.sessions.find((s) => s.id === "cancel")?.status, "cancelled");

  const second = ensureRegularTrainingSessionsForSeason(first.sessions, SEASON_2026_27_ID, attendance, () => `dup-${++seq}`);
  assert.equal(second.inserted.length, 0);
  assert.equal(second.sessions.length, first.sessions.length);

  const db: ClubDatabase = {
    seasons: [],
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
    training_sessions: first.sessions,
    training_attendance: [],
    fitness_tests: [],
    fitness_test_sessions: [],
    fitness_test_results: [],
    fitness_score_configs: [],
    team_photo_url: null,
  };
  const next = nextTrainingSession(db, SEASON_2026_27_ID, now21);
  assert.equal(trainingDateKeyAmsterdam(next.session?.session_at ?? ""), "2026-08-24");
  assert.equal(next.suggestedDate, null);
}

{
  assert.equal(isTodayInClubTimezone("2026-09-02", now21), false);
  assert.equal(isTodayInClubTimezone("2026-08-21", now21), true);
  assert.equal(isTodayInClubTimezone("2026-09-02", new Date("2026-09-02T09:00:00+02:00")), true);
  assert.equal(isTodayInClubTimezone("2026-09-02", new Date("2026-09-01T21:30:00.000Z")), false);
  assert.equal(isTodayInClubTimezone("2026-09-02", new Date("2026-09-01T22:30:00.000Z")), true);
  assert.equal(isTodayInClubTimezone("2026-09-02", new Date("2026-09-01T23:30:00.000Z")), true);
  assert.equal(todayInClubTz(new Date("2026-12-31T23:30:00+01:00")), "2026-12-31");
  assert.equal(todayInClubTz(new Date("2026-12-31T23:30:00.000Z")), "2027-01-01");
  assert.equal(isTodayInClubTimezone("2026-03-29", new Date("2026-03-29T00:30:00+01:00")), true);
  const cd = computeCountdown("2026-09-02", now21);
  assert.notEqual(cd.state, "today");
  assert.notEqual(cd.urgency, "today");
  assert.ok(/Over|week|dag/i.test(cd.primaryLabel));
  const todayCd = computeCountdown("2026-08-21", now21);
  assert.equal(todayCd.state, "today");
}

console.log("PASS test:training-calendar-date-recovery");
