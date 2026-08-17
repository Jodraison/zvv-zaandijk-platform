/**
 * Final football operations completion — regressies.
 * Run: npm run test:football-operations-final
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  assertCanPersistCompletedAttendance,
  resolveTrainingOperationalStatus,
  sessionsCountingForAttendance,
} from "@/lib/training/training-status";
import { FORMATION_4231_SLOTS, FORMATION_SLOT_CODES } from "@/lib/match/formation-4231";
import { getMatchShapeAtMinute, validateConfirmedFormation } from "@/lib/match/match-shape";
import { computeTrainingAttendanceStats } from "@/lib/queries/training-attendance-stats";
import type { ClubDatabase, MatchLineupEntry, MatchPositionChange, MatchSubstitution, TrainingSession } from "@/types";

const root = process.cwd();
const now = new Date("2026-07-30T12:00:00+02:00");

// Training — 17 Aug future on 30 Jul
const aug17: TrainingSession = {
  id: "t-aug17",
  season_id: "s1",
  title: "Training",
  session_at: "2026-08-17T18:00:00.000Z", // 20:00 Amsterdam
  location: null,
  status: "scheduled",
};

const futureOp = resolveTrainingOperationalStatus(aug17, {
  now,
  attendanceRowCount: 20,
  expectedSquadCount: 20,
});
assert.equal(futureOp.status, "gepland");
assert.equal(futureOp.label, "Gepland");
assert.equal(futureOp.countsForAttendance, false);
assert.equal(assertCanPersistCompletedAttendance(aug17.session_at, now).ok, false);

// Legacy completed+rows still future → gepland
assert.equal(
  resolveTrainingOperationalStatus({ ...aug17, status: "completed" }, {
    now,
    attendanceRowCount: 20,
    expectedSquadCount: 20,
  }).countsForAttendance,
  false,
);

const historical: TrainingSession = {
  id: "t-past",
  season_id: "s1",
  title: "Training",
  session_at: "2026-07-01T18:00:00.000Z",
  location: null,
  status: "completed",
};
assert.equal(
  resolveTrainingOperationalStatus(historical, {
    now,
    attendanceRowCount: 20,
    expectedSquadCount: 20,
  }).status,
  "geregistreerd",
);

assert.equal(
  resolveTrainingOperationalStatus({ ...aug17, status: "cancelled" }, { now }).status,
  "afgelast",
);

const todayBefore = resolveTrainingOperationalStatus(
  { session_at: "2026-07-30T18:00:00.000Z", status: "scheduled" },
  { now: new Date("2026-07-30T10:00:00+02:00"), attendanceRowCount: 0, expectedSquadCount: 20 },
);
assert.equal(todayBefore.status, "gepland");

const todayAfter = resolveTrainingOperationalStatus(
  { session_at: "2026-07-30T18:00:00.000Z", status: "scheduled" },
  { now: new Date("2026-07-30T22:00:00+02:00"), attendanceRowCount: 0, expectedSquadCount: 20 },
);
assert.equal(todayAfter.status, "klaar_voor_registratie");

// Attendance aggregate ignores future
const dbMini = {
  seasons: [],
  players: Array.from({ length: 2 }, (_, i) => ({
    id: `p${i}`,
    full_name: `P${i}`,
    photo_url: null,
    is_guest: false,
  })),
  player_season_memberships: [
    { id: "m0", player_id: "p0", season_id: "s1", shirt_number: 1, position: "GK", display_position: "GK", is_captain: false, is_vice_captain: false, is_guest: false },
    { id: "m1", player_id: "p1", season_id: "s1", shirt_number: 2, position: "DEF", display_position: "CB", is_captain: false, is_vice_captain: false, is_guest: false },
  ],
  matches: [],
  match_matchday_roster: [],
  match_lineup_entries: [],
  match_player_stats: [],
  match_goal_events: [],
  match_card_events: [],
  match_substitutions: [],
  match_position_changes: [],
  training_sessions: [aug17, historical],
  training_attendance: [
    { session_id: "t-aug17", player_id: "p0", present: true, note: null },
    { session_id: "t-aug17", player_id: "p1", present: true, note: null },
    { session_id: "t-past", player_id: "p0", present: true, note: null },
    { session_id: "t-past", player_id: "p1", present: false, note: null },
  ],
  fitness_tests: [],
  fitness_test_sessions: [],
  fitness_test_results: [],
  fitness_score_configs: [],
  team_photo_url: null,
} as ClubDatabase;

const counted = sessionsCountingForAttendance(dbMini.training_sessions, dbMini.training_attendance, 2, now);
assert.equal(counted.length, 1);
assert.equal(counted[0]!.id, "t-past");
const stats = computeTrainingAttendanceStats(dbMini, "s1", "season", now);
assert.equal(stats.find((r) => r.player_id === "p0")?.total_sessions, 1);
assert.equal(stats.find((r) => r.player_id === "p0")?.attendance_percentage, 100);

// Formation
assert.equal(FORMATION_4231_SLOTS.length, 11);
assert.ok(FORMATION_SLOT_CODES.includes("GK"));
const incomplete = validateConfirmedFormation({ GK: "a" }, []);
assert.equal(incomplete.ok, false);
const full = Object.fromEntries(FORMATION_SLOT_CODES.map((c, i) => [c, `p${i}`]));
assert.equal(validateConfirmedFormation(full, ["bench"]).ok, true);
assert.equal(validateConfirmedFormation(full, ["p0"]).ok, false);

// Reconstruct
const matchId = "m1";
const lineup: MatchLineupEntry[] = FORMATION_SLOT_CODES.map((position, i) => ({
  id: `l${i}`,
  match_id: matchId,
  player_id: `p${i}`,
  role: "starter" as const,
  position,
  absence_reason: null,
  sort_order: i,
}));
lineup.push({
  id: "lb",
  match_id: matchId,
  player_id: "bench",
  role: "bench",
  position: null,
  absence_reason: null,
  sort_order: 99,
});
const subs: MatchSubstitution[] = [
  {
    id: "s1",
    match_id: matchId,
    player_out_id: "p10", // SP
    player_in_id: "bench",
    minute: 58,
    to_slot: "SP",
    stoppage_time: 0,
    sort_order: 0,
    change_group_id: "g1",
    notes: null,
  },
];
const pos: MatchPositionChange[] = [
  {
    id: "c1",
    match_id: matchId,
    player_id: "p7", // LM
    minute: 67,
    stoppage_time: 0,
    from_slot: "LM",
    to_slot: "SP",
    change_group_id: "g1",
    notes: null,
    sort_order: 0,
  },
];
const shapeDb = {
  match_lineup_entries: lineup,
  match_substitutions: subs,
  match_position_changes: pos,
} as unknown as ClubDatabase;

const start = getMatchShapeAtMinute(shapeDb, matchId, 0);
assert.equal(start.slots.SP, "p10");
assert.equal(start.slots.LM, "p7");
const mid = getMatchShapeAtMinute(shapeDb, matchId, 58);
assert.equal(mid.slots.SP, "bench");
const end = getMatchShapeAtMinute(shapeDb, matchId, 90);
assert.equal(end.slots.SP, "p7");
assert.equal(end.slots.LM, "bench");

// Source hygiene
const beheer = readFileSync(join(root, "src/app/(site)/beheer/page.tsx"), "utf8");
assert.ok(beheer.includes("Hier regel je je team"));
assert.ok(!beheer.includes("zonder technische omwegen"));
assert.ok(beheer.includes("Opstelling"));
assert.ok(beheer.includes("Alles is bijgewerkt"));

const profile = readFileSync(join(root, "src/app/(site)/selectie/[playerId]/page.tsx"), "utf8");
assert.ok(profile.includes("from-white") || profile.includes("bg-white"));
assert.ok(!profile.includes("from-[#050b18]"));

const dashTraining = readFileSync(join(root, "src/components/admin/training-attendance-dashboard.tsx"), "utf8");
assert.ok(dashTraining.includes("Gepland"));
assert.ok(!dashTraining.includes("map.set(p.player_id, true)"));

console.log("football-operations-final.test.ts: ok");
