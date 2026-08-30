/**
 * Fitheidstest 2 sep → 7 sep: zelfde sessie, geen duplicaat, training intact.
 * Run: npm run test:fitness-reschedule
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ClubDatabase } from "@/types";
import { SEASON_2026_27_ID, seasonOperations2026_27 } from "@/lib/season/season-operations-2026-27";
import { nextFitnessMoment } from "@/lib/operations/next-events";
import { computeCountdown } from "@/lib/operations/countdown";
import { buildHomeTeamSpotlight } from "@/lib/home/team-spotlight";
import { formatHumanDateNL } from "@/lib/utils/format-date";
import { generateMonWedDates } from "@/lib/season/season-operations-2026-27";
import { clubLocalDateTimeToIso } from "@/lib/season/season-operations-2026-27";
import { FITNESS_PROTOCOL_CODE } from "@/lib/fitness/protocol";

const root = process.cwd();
const SESSION_ID = "83ff1fbe-fcb0-4803-81f7-f05aa84e79bb";
const nowAug30 = new Date("2026-08-30T12:00:00+02:00");

function emptyDb(): ClubDatabase {
  return {
    seasons: [
      {
        id: SEASON_2026_27_ID,
        name: "2026/27 Competitie",
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

const movedSession = {
  id: SESSION_ID,
  season_id: SEASON_2026_27_ID,
  test_on: "2026-09-07",
  protocol_code: FITNESS_PROTOCOL_CODE,
  status: "draft" as const,
  note: "Verplaatst wegens weer (17 augustus → 2 september)",
  score_config_id: null,
  created_at: "2026-07-30T12:42:26.534Z",
  updated_at: "2026-08-30T06:00:00.000Z",
  published_at: null,
  created_by: null,
  published_by: null,
};

{
  assert.equal(seasonOperations2026_27.fitness.firstTestOn, "2026-09-07");
  assert.equal(seasonOperations2026_27.fitness.proposedCycle[0], "2026-09-07");
  assert.ok(!seasonOperations2026_27.fitness.proposedCycle.includes("2026-09-02"));
}

{
  const before = {
    id: SESSION_ID,
    test_on: "2026-09-02",
    status: "draft",
    results: [{ id: "r1", session_id: SESSION_ID }],
  };
  const after = {
    id: SESSION_ID,
    test_on: "2026-09-07",
    status: before.status,
    results: before.results,
  };
  assert.equal(after.id, before.id);
  assert.equal(after.test_on, "2026-09-07");
  assert.notEqual(after.test_on, "2026-09-02");
  assert.equal(after.results.length, before.results.length);
  assert.ok(after.results.every((r) => r.session_id === SESSION_ID));
}

{
  const db = emptyDb();
  db.fitness_test_sessions = [movedSession];
  db.fitness_test_results = [
    {
      id: "r1",
      session_id: SESSION_ID,
      player_id: "p1",
      flying_sprint_30m_seconds: null,
      agility_10_20_10_seconds: null,
      plank_seconds: null,
      six_minute_run_meters: null,
      participation_status: "pending",
      participation_reason: null,
      note: null,
      created_at: "2026-08-01T00:00:00.000Z",
      updated_at: "2026-08-01T00:00:00.000Z",
    },
  ];
  const sameDay = db.fitness_test_sessions.filter((s) => s.test_on === "2026-09-07");
  assert.equal(sameDay.length, 1);
  assert.equal(sameDay[0]!.id, SESSION_ID);
  assert.equal(db.fitness_test_sessions.filter((s) => s.test_on === "2026-09-02").length, 0);
  assert.equal(db.fitness_test_results.filter((r) => r.session_id === SESSION_ID).length, 1);
  assert.equal(db.fitness_test_results.filter((r) => !db.fitness_test_sessions.some((s) => s.id === r.session_id)).length, 0);

  const next = nextFitnessMoment(db, SEASON_2026_27_ID, nowAug30);
  assert.equal(next.date, "2026-09-07");
  assert.notEqual(next.date, "2026-09-02");
  assert.equal(next.plannedSession?.id, SESSION_ID);

  const spotlight = buildHomeTeamSpotlight(db, SEASON_2026_27_ID, nowAug30);
  assert.ok(spotlight.fitness);
  assert.match(spotlight.fitness!.detail, /Maandag 7 september/i);
  assert.doesNotMatch(spotlight.fitness!.detail, /2 september|Vandaag/i);

  const emptyFallback = nextFitnessMoment(emptyDb(), SEASON_2026_27_ID, nowAug30);
  assert.equal(emptyFallback.date, "2026-09-07");
}

{
  const dates = generateMonWedDates("2026-09-07", "2026-09-07");
  assert.deepEqual(dates, ["2026-09-07"]);
  const kickoff = clubLocalDateTimeToIso("2026-09-07", "20:00");
  assert.equal(kickoff, "2026-09-07T18:00:00.000Z");
}

{
  const cd = computeCountdown("2026-09-07", nowAug30);
  assert.notEqual(cd.state, "today");
  assert.notEqual(cd.urgency, "today");
  assert.doesNotMatch(cd.primaryLabel, /Vandaag/i);
  assert.equal(formatHumanDateNL("2026-09-07", { includeYear: false }).toLowerCase().includes("maandag 7 september") || formatHumanDateNL("2026-09-07").toLowerCase().includes("7 september"), true);
}

{
  const home = readFileSync(join(root, "src/app/(site)/page.tsx"), "utf8");
  const spotlight = readFileSync(join(root, "src/lib/home/team-spotlight.ts"), "utf8");
  const beheer = readFileSync(join(root, "src/app/(site)/beheer/page.tsx"), "utf8");
  const beheerFit = readFileSync(join(root, "src/app/(site)/beheer/fitheid/page.tsx"), "utf8");
  const publicFit = readFileSync(join(root, "src/app/(site)/fitheid/page.tsx"), "utf8");
  const ranking = readFileSync(join(root, "src/app/(site)/ranking/page.tsx"), "utf8");
  const ops = readFileSync(join(root, "src/lib/season/season-operations-2026-27.ts"), "utf8");
  const birthdays = readFileSync(join(root, "src/lib/players/birthdays.ts"), "utf8");
  const birthdayUi = readFileSync(join(root, "src/components/home/home-team-spotlight.tsx"), "utf8");

  assert.match(spotlight, /nextFitnessMoment/);
  assert.match(home, /buildHomeTeamSpotlight/);
  assert.match(beheer, /nextFitnessMoment/);
  assert.match(beheerFit, /nextFitnessMoment/);
  assert.match(publicFit, /nextFitnessMoment/);
  assert.match(ranking, /nextFitnessMoment/);
  assert.doesNotMatch(ranking, /2026-09-02/);
  assert.match(ops, /firstTestOn:\s*"2026-09-07"/);
  assert.doesNotMatch(ops, /firstTestOn:\s*"2026-09-02"/);
  assert.match(birthdayUi, /home-next-birthday/);
  assert.match(birthdays, /nextBirthdayOccurrence/);
}

console.log("fitness-reschedule-2026-09-07.test.ts: ok");
