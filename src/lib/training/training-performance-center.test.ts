/**
 * Training Performance Center + absence-reason contract.
 * Run: npm run test:training-performance-center
 */
import assert from "node:assert/strict";
import { SEASON_2026_27_ID, clubLocalDateTimeToIso } from "@/lib/season/season-operations-2026-27";
import {
  ABSENCE_REASONS,
  absenceReasonLabelNl,
  isAbsenceReason,
  parseAbsenceReason,
  serializeAbsenceReason,
} from "@/lib/training/absence-reason";
import {
  attendanceTier,
  buildTrainingPerformanceCenter,
  publicTrainingPerformanceView,
  sortAttendanceRanking,
} from "@/lib/training/training-performance";
import { attendanceSessionCountLabel } from "@/components/training/player-attendance-rank";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ClubDatabase } from "@/types";

assert.deepEqual([...ABSENCE_REASONS], ["private", "sick", "injured", "work_school", "vacation", "no_reason"]);
assert.equal(isAbsenceReason("vacation"), true);
assert.equal(parseAbsenceReason(null, true), null);
assert.equal(serializeAbsenceReason(true, "sick"), null);
assert.equal(serializeAbsenceReason(true, "vacation"), null);
assert.equal(serializeAbsenceReason(false, "vacation"), "vacation");
assert.equal(parseAbsenceReason("vacation", false), "vacation");
assert.equal(parseAbsenceReason(null, false), "no_reason");
assert.equal(parseAbsenceReason("injured", false), "injured");
assert.equal(parseAbsenceReason("private", false), "private");
assert.equal(parseAbsenceReason("sick", false), "sick");
assert.equal(parseAbsenceReason("work_school", false), "work_school");
assert.equal(parseAbsenceReason("unknown", false), "no_reason");
assert.equal(absenceReasonLabelNl("work_school"), "Werk/School");
assert.equal(absenceReasonLabelNl("vacation"), "Vakantie");
assert.equal(attendanceTier(100), "constant");
assert.equal(attendanceTier(80), "strong");
assert.equal(attendanceTier(60), "mixed");
assert.equal(attendanceTier(40), "limited");

function emptyDb(): ClubDatabase {
  return {
    seasons: [{ id: SEASON_2026_27_ID, name: "2026/27", starts_on: "2026-08-01", ends_on: "2027-06-30", is_active: true }],
    players: [
      { id: "p1", full_name: "Anna", photo_url: null, is_guest: false, initials: null, bio: null, preferred_foot: null, strengths: null, role_label: null, tagline: null, card_note: null },
      { id: "p2", full_name: "Bente", photo_url: null, is_guest: false, initials: null, bio: null, preferred_foot: null, strengths: null, role_label: null, tagline: null, card_note: null },
    ],
    player_season_memberships: [
      { id: "m1", player_id: "p1", season_id: SEASON_2026_27_ID, shirt_number: 7, position: "MID", display_position: "8", is_captain: false, is_vice_captain: false, is_guest: false },
      { id: "m2", player_id: "p2", season_id: SEASON_2026_27_ID, shirt_number: 3, position: "DEF", display_position: "4", is_captain: false, is_vice_captain: false, is_guest: false },
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
  const db = emptyDb();
  const s10 = clubLocalDateTimeToIso("2026-08-10", "20:00");
  const s12 = clubLocalDateTimeToIso("2026-08-12", "20:00");
  const s19 = clubLocalDateTimeToIso("2026-08-19", "20:00");
  db.training_sessions = [
    { id: "s10", season_id: SEASON_2026_27_ID, title: "Reguliere training", session_at: s10, location: "20:00–21:00", status: "completed" },
    { id: "s12", season_id: SEASON_2026_27_ID, title: "Reguliere training", session_at: s12, location: "20:00–21:00", status: "completed" },
    { id: "s19", season_id: SEASON_2026_27_ID, title: "Reguliere training", session_at: s19, location: "20:00–21:00", status: "completed" },
  ];
  db.training_attendance = [
    { session_id: "s10", player_id: "p1", present: true, note: null },
    { session_id: "s10", player_id: "p2", present: false, note: null },
    { session_id: "s12", player_id: "p1", present: true, note: null },
    { session_id: "s12", player_id: "p2", present: false, note: "injured" },
    { session_id: "s19", player_id: "p1", present: true, note: null },
    { session_id: "s19", player_id: "p2", present: false, note: "vacation" },
  ];
  const now = new Date("2026-08-21T10:00:00+02:00");
  const center = buildTrainingPerformanceCenter(db, SEASON_2026_27_ID, now);
  assert.equal(center.kpis.registeredSessions, 3);
  assert.equal(center.kpis.averagePct, 50);
  assert.equal(center.kpis.highestPct, 50);
  assert.equal(center.kpis.activeStreak, 3);
  assert.equal(center.kpis.absenceMoments, 3);
  assert.equal(center.absenceTotals.no_reason, 1);
  assert.equal(center.absenceTotals.injured, 1);
  assert.equal(center.absenceTotals.vacation, 1);
  assert.equal(center.ranking[0]!.name, "Anna");
  assert.equal(center.ranking[0]!.present, 3);
  assert.equal(center.ranking[0]!.pct, 100);
  assert.equal(center.adminRanking[0]!.reasons.injured, 0);
  assert.equal(center.adminRanking[0]!.reasons.vacation, 0);
  assert.equal(center.adminRanking[1]!.reasons.injured, 1);
  assert.equal(center.adminRanking[1]!.reasons.vacation, 1);
  assert.equal(center.adminRanking[1]!.withoutReasonCount, 1);

  const pub = publicTrainingPerformanceView(center);
  assert.equal("reasons" in pub.ranking[0]!, false);
  assert.equal("withoutReasonCount" in pub.ranking[0]!, false);
  assert.ok("no_reason" in pub.absenceTotals);
  assert.ok("vacation" in pub.absenceTotals);
  assert.equal(pub.absenceTotals.vacation, 1);
  assert.ok(!JSON.stringify(pub.ranking).includes("injured"));
  assert.ok(!JSON.stringify(pub.ranking).includes("vacation"));
  assert.ok(!JSON.stringify(pub.ranking).includes("Bente ziek"));
}

{
  const sorted = sortAttendanceRanking([
    { pct: 80, present: 4, shirt_number: 9 },
    { pct: 80, present: 4, shirt_number: 2 },
    { pct: 90, present: 3, shirt_number: 1 },
  ]);
  assert.equal(sorted[0]!.shirt_number, 1);
  assert.equal(sorted[1]!.shirt_number, 2);
}

{
  assert.equal(attendanceSessionCountLabel(4, 4), "4 van 4 trainingen");
  assert.equal(attendanceSessionCountLabel(1, 4), "1 van 4 trainingen");
  const src = readFileSync(join(process.cwd(), "src/components/training/player-attendance-rank.tsx"), "utf8");
  assert.match(src, /md:grid-cols-2/);
  assert.match(src, /h-12 w-12 md:h-14 md:w-14/);
  assert.match(src, /photo_url/);
  assert.match(src, /PlayerPhotoAvatar/);
  assert.doesNotMatch(src, /Zeer constant|STERK|Wisselend|Beperkte aanwezigheid|attendanceTierLabelNl/);
  assert.match(src, /data-layout="cards"/);
}

{
  const db = emptyDb();
  db.players = Array.from({ length: 21 }, (_, i) => ({
    id: `p${i + 1}`,
    full_name: `Speelster ${i + 1}`,
    photo_url: i === 0 ? "https://example.com/a.jpg" : null,
    is_guest: false,
    initials: null,
    bio: null,
    preferred_foot: null,
    strengths: null,
    role_label: null,
    tagline: null,
    card_note: null,
  }));
  db.player_season_memberships = db.players.map((p, i) => ({
    id: `m${i + 1}`,
    player_id: p.id,
    season_id: SEASON_2026_27_ID,
    shirt_number: i + 1,
    position: "MID" as const,
    display_position: "8",
    is_captain: false,
    is_vice_captain: false,
    is_guest: false,
  }));
  const at = clubLocalDateTimeToIso("2026-08-10", "20:00");
  db.training_sessions = [
    { id: "s10", season_id: SEASON_2026_27_ID, title: "Reguliere training", session_at: at, location: "20:00–21:00", status: "completed" },
  ];
  db.training_attendance = db.players.map((p, i) => ({
    session_id: "s10",
    player_id: p.id,
    present: i < 11,
    note: i < 11 ? null : null,
  }));
  const center = buildTrainingPerformanceCenter(db, SEASON_2026_27_ID, new Date("2026-08-21T10:00:00+02:00"));
  const pub = publicTrainingPerformanceView(center);
  assert.equal(pub.ranking.length, 21);
  assert.equal(pub.ranking[0]!.photo_url, "https://example.com/a.jpg");
  assert.equal(pub.ranking[0]!.player_id, "p1");
  assert.equal(pub.ranking.filter((r) => r.photo_url == null).length, 20);
  assert.ok(pub.ranking.every((r) => !("reasons" in r)));
  assert.deepEqual([...ABSENCE_REASONS], ["private", "sick", "injured", "work_school", "vacation", "no_reason"]);
}

console.log("PASS test:training-performance-center");
