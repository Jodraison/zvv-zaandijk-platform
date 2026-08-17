/**
 * Regressie: handmatig trainingsbeheer (create/update/cancel/delete/stats).
 * Run: npm run test:manual-training-management
 */
import assert from "node:assert/strict";
import {
  classifyTrainingSessions,
  findSessionsOnDate,
  parseManualTrainingInput,
  parseTrainingLocationMeta,
  sessionHasAttendance,
  trainingDateKeyAmsterdam,
  trainingTimeLabelAmsterdam,
} from "@/lib/training/manual-training";
import { resolveTrainingOperationalStatus, sessionsCountingForAttendance } from "@/lib/training/training-status";
import { SEASON_2026_27_ID, assertTrainingDateAllowed, clubLocalDateTimeToIso } from "@/lib/season/season-operations-2026-27";
import { nextTrainingSession } from "@/lib/operations/next-events";
import { computeTrainingAttendanceStats } from "@/lib/queries/training-attendance-stats";
import { roleHasCapability } from "@/lib/auth/capabilities";
import type { ClubDatabase, TrainingSession } from "@/types";

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
    players: [
      { id: "p1", full_name: "Speelster Een", is_guest: false, photo_url: null, birth_date: null },
      { id: "p2", full_name: "Speelster Twee", is_guest: false, photo_url: null, birth_date: null },
      { id: "g1", full_name: "Gast", is_guest: true, photo_url: null, birth_date: null },
    ],
    player_season_memberships: [
      {
        id: "m1",
        player_id: "p1",
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
        player_id: "p2",
        season_id: SEASON_2026_27_ID,
        shirt_number: 2,
        position: "DEF",
        display_position: "DEF",
        is_captain: false,
        is_vice_captain: false,
        is_guest: false,
      },
      {
        id: "mg",
        player_id: "g1",
        season_id: SEASON_2026_27_ID,
        shirt_number: 99,
        position: "ATT",
        display_position: "ATT",
        is_captain: false,
        is_vice_captain: false,
        is_guest: true,
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

{
  const built = parseManualTrainingInput({
    season_id: SEASON_2026_27_ID,
    date_ymd: "2026-08-25",
    start_hhmm: "19:30",
    end_hhmm: "20:45",
    title: "Extra training",
    note: "inhaal",
  });
  assert.equal(built.season_id, SEASON_2026_27_ID);
  assert.equal(built.session_at, clubLocalDateTimeToIso("2026-08-25", "19:30"));
  assert.equal(built.session_at, "2026-08-25T17:30:00.000Z");
  assert.equal(built.status, "scheduled");
  assert.equal(built.title, "Extra training");
  assert.match(built.location ?? "", /19:30–20:45/);
  assert.match(built.location ?? "", /inhaal/);
  assert.equal(trainingDateKeyAmsterdam(built.session_at), "2026-08-25");
  assert.match(trainingTimeLabelAmsterdam(built.session_at), /^19:30–/);
  const meta = parseTrainingLocationMeta(built.location);
  assert.equal(meta.start, "19:30");
  assert.equal(meta.end, "20:45");
  assert.equal(meta.note, "inhaal");
  console.log("ok parse/timezone/defaults");
}

{
  const db = emptyDb();
  const s: TrainingSession = {
    id: "s-new",
    season_id: SEASON_2026_27_ID,
    title: "Extra training",
    session_at: clubLocalDateTimeToIso("2026-08-25", "19:30"),
    location: "19:30–20:45",
    status: "scheduled",
  };
  db.training_sessions.push(s);
  assert.equal(sessionHasAttendance(db.training_attendance, s.id), false);
  assert.equal(db.training_attendance.length, 0);
  const items = classifyTrainingSessions(db.training_sessions, db.training_attendance, 2, new Date("2026-08-20T12:00:00+02:00"));
  assert.equal(items.length, 1);
  assert.equal(items[0]!.bucket, "upcoming");
  assert.equal(items[0]!.statusLabel, "Gepland");
  console.log("ok no auto attendance / guests excluded from expected");
}

{
  const db = emptyDb();
  db.training_sessions = [
    {
      id: "s10",
      season_id: SEASON_2026_27_ID,
      title: "Reguliere training",
      session_at: clubLocalDateTimeToIso("2026-08-10", "20:00"),
      location: "20:00–21:00",
      status: "scheduled",
    },
    {
      id: "s12",
      season_id: SEASON_2026_27_ID,
      title: "Reguliere training",
      session_at: clubLocalDateTimeToIso("2026-08-12", "20:00"),
      location: "20:00–21:00",
      status: "scheduled",
    },
    {
      id: "s17",
      season_id: SEASON_2026_27_ID,
      title: "Reguliere training",
      session_at: clubLocalDateTimeToIso("2026-08-17", "20:00"),
      location: "20:00–21:00",
      status: "scheduled",
    },
    {
      id: "hist",
      season_id: "old-season",
      title: "Historie",
      session_at: "2025-05-01T18:00:00.000Z",
      location: null,
      status: "completed",
    },
  ];
  assert.equal(findSessionsOnDate(db.training_sessions, SEASON_2026_27_ID, "2026-08-10").length, 1);
  assert.equal(findSessionsOnDate(db.training_sessions, SEASON_2026_27_ID, "2026-08-12").length, 1);
  assert.equal(findSessionsOnDate(db.training_sessions, SEASON_2026_27_ID, "2026-08-17").length, 1);
  assert.ok(db.training_sessions.some((s) => s.id === "hist"));
  assert.equal(assertTrainingDateAllowed(SEASON_2026_27_ID, "2026-08-10").ok, true);
  console.log("ok 10/12/17 + historie");
}

{
  const db = emptyDb();
  db.training_sessions = [
    {
      id: "s10",
      season_id: SEASON_2026_27_ID,
      title: "Reguliere training",
      session_at: clubLocalDateTimeToIso("2026-08-10", "20:00"),
      location: "20:00–21:00",
      status: "scheduled",
    },
    {
      id: "s17",
      season_id: SEASON_2026_27_ID,
      title: "Reguliere training",
      session_at: clubLocalDateTimeToIso("2026-08-17", "20:00"),
      location: "20:00–21:00",
      status: "scheduled",
    },
  ];
  const now = new Date("2026-08-12T15:00:00+02:00");
  const items = classifyTrainingSessions(db.training_sessions, db.training_attendance, 2, now);
  const open = items.filter((i) => i.bucket === "open");
  const upcoming = items.filter((i) => i.bucket === "upcoming");
  assert.equal(open.length, 1);
  assert.equal(open[0]!.dateKey, "2026-08-10");
  assert.match(open[0]!.statusLabel, /Aanwezigheid/);
  assert.equal(upcoming.some((i) => i.dateKey === "2026-08-17"), true);
  const op17 = resolveTrainingOperationalStatus(db.training_sessions[1]!, { now, expectedSquadCount: 2 });
  assert.equal(op17.status, "gepland");

  const next = nextTrainingSession(db, SEASON_2026_27_ID, now);
  assert.equal(next.attendanceMissing, true);
  assert.equal(next.session?.id, "s10");
  console.log("ok overview + open task");
}

{
  const sess: TrainingSession = {
    id: "s-move",
    season_id: SEASON_2026_27_ID,
    title: "Reguliere training",
    session_at: clubLocalDateTimeToIso("2026-08-12", "20:00"),
    location: "20:00–21:00",
    status: "scheduled",
  };
  const moved = parseManualTrainingInput({
    season_id: SEASON_2026_27_ID,
    date_ymd: "2026-08-11",
    start_hhmm: "20:00",
    end_hhmm: "21:00",
    title: "Reguliere training",
  });
  sess.session_at = moved.session_at;
  sess.location = moved.location;
  assert.equal(trainingDateKeyAmsterdam(sess.session_at), "2026-08-11");

  sess.status = "cancelled";
  const op = resolveTrainingOperationalStatus(sess, { expectedSquadCount: 2 });
  assert.equal(op.status, "afgelast");
  assert.equal(op.countsForAttendance, false);
  console.log("ok wijzigen + afgelasten");
}

{
  assert.equal(roleHasCapability("owner", "system_admin"), true);
  assert.equal(roleHasCapability("team_manager", "system_admin"), false);
  assert.equal(roleHasCapability("team_manager", "manage_training"), true);
  console.log("ok delete capability");
}

{
  const db = emptyDb();
  const scheduled: TrainingSession = {
    id: "s-empty",
    season_id: SEASON_2026_27_ID,
    title: "Extra training",
    session_at: clubLocalDateTimeToIso("2026-08-10", "20:00"),
    location: "20:00–21:00",
    status: "scheduled",
  };
  const registered: TrainingSession = {
    id: "s-reg",
    season_id: SEASON_2026_27_ID,
    title: "Extra training",
    session_at: clubLocalDateTimeToIso("2026-08-11", "19:30"),
    location: "19:30–20:45 · handmatig",
    status: "completed",
  };
  db.training_sessions = [scheduled, registered];
  db.training_attendance = [
    { session_id: "s-reg", player_id: "p1", present: true, note: null },
    { session_id: "s-reg", player_id: "p2", present: false, note: null },
  ];
  const now = new Date("2026-08-12T22:00:00+02:00");
  const counting = sessionsCountingForAttendance(db.training_sessions, db.training_attendance, 2, now);
  assert.equal(counting.length, 1);
  assert.equal(counting[0]!.id, "s-reg");
  const stats = computeTrainingAttendanceStats(db, SEASON_2026_27_ID, "season", now);
  const p1 = stats.find((r) => r.player_id === "p1");
  assert.equal(p1?.present_count, 1);
  assert.equal(p1?.total_sessions, 1);
  assert.ok(!stats.some((r) => r.player_id === "g1"));
  console.log("ok stats contract");
}

console.log("PASS test:manual-training-management");
