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
  ADMIN_TIMELINE_DEFAULT,
  attendanceTier,
  buildTrainingPerformanceCenter,
  publicTrainingPerformanceView,
  recentRegisteredMoments,
  shortTrainingDayLabel,
  sortAttendanceRanking,
  trainerTrainingPerformanceView,
  getPlayerAttendanceDistribution,
  attendanceSlicesWithCount,
  attendanceDistributionAriaLabel,
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
  assert.equal(center.adminRanking[0]!.sessions.length, 3);
  assert.equal(center.adminRanking[0]!.sessions.every((s) => s.attended && s.absenceReason === null), true);
  assert.deepEqual(
    center.adminRanking[1]!.sessions.map((s) => [s.dateKey, s.attended, s.absenceReason]),
    [
      ["2026-08-10", false, "no_reason"],
      ["2026-08-12", false, "injured"],
      ["2026-08-19", false, "vacation"],
    ],
  );
  assert.equal(center.ranking[0]!.present, center.adminRanking[0]!.present);
  assert.equal(center.ranking[0]!.total, center.adminRanking[0]!.total);
  assert.equal(center.ranking[0]!.pct, center.adminRanking[0]!.pct);

  const pub = publicTrainingPerformanceView(center);
  assert.equal(pub.trainerView, false);
  assert.equal("reasons" in pub.ranking[0]!, false);
  assert.equal("withoutReasonCount" in pub.ranking[0]!, false);
  assert.ok("no_reason" in pub.absenceTotals);
  assert.ok("vacation" in pub.absenceTotals);
  assert.equal(pub.absenceTotals.vacation, 1);
  assert.ok(!JSON.stringify(pub.ranking).includes("injured"));
  assert.ok(!JSON.stringify(pub.ranking).includes("vacation"));
  assert.ok(!JSON.stringify(pub.ranking).includes("Bente ziek"));
  assert.ok(!JSON.stringify(pub.ranking).includes("sessions"));
  assert.ok(!JSON.stringify(pub.ranking).includes("absenceReason"));
  assert.ok(!JSON.stringify(pub.ranking).includes("Geblesseerd"));
  assert.ok(!JSON.stringify(pub.ranking).includes("Vakantie"));
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
  assert.match(src, /AttendanceDonut/);
  assert.match(src, /trainerView/);
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

{
  const db = emptyDb();
  const dates = ["2026-08-03", "2026-08-05", "2026-08-10", "2026-08-12", "2026-08-17", "2026-08-19"];
  const reasons = ["private", "sick", "injured", "work_school", "vacation", null] as const;
  db.training_sessions = dates.map((d, i) => ({
    id: `s${i}`,
    season_id: SEASON_2026_27_ID,
    title: "Reguliere training",
    session_at: clubLocalDateTimeToIso(d, "20:00"),
    location: "20:00–21:00",
    status: "completed" as const,
  }));
  db.training_sessions.push({
    id: "sfuture",
    season_id: SEASON_2026_27_ID,
    title: "Reguliere training",
    session_at: clubLocalDateTimeToIso("2026-08-24", "20:00"),
    location: "20:00–21:00",
    status: "scheduled",
  });
  db.training_sessions.push({
    id: "sunreg",
    season_id: SEASON_2026_27_ID,
    title: "Reguliere training",
    session_at: clubLocalDateTimeToIso("2026-08-20", "20:00"),
    location: "20:00–21:00",
    status: "scheduled",
  });
  db.training_attendance = [];
  for (const [i] of dates.entries()) {
    db.training_attendance.push({ session_id: `s${i}`, player_id: "p1", present: true, note: null });
    db.training_attendance.push({
      session_id: `s${i}`,
      player_id: "p2",
      present: false,
      note: reasons[i],
    });
  }
  db.training_attendance.push({ session_id: "sfuture", player_id: "p1", present: false, note: "sick" });
  db.training_attendance.push({ session_id: "sfuture", player_id: "p2", present: false, note: "sick" });
  const now = new Date("2026-08-21T10:00:00+02:00");
  const center = buildTrainingPerformanceCenter(db, SEASON_2026_27_ID, now);
  const anna = center.adminRanking.find((r) => r.name === "Anna")!;
  const bente = center.adminRanking.find((r) => r.name === "Bente")!;
  assert.equal(center.kpis.registeredSessions, 6);
  assert.equal(anna.sessions.length, 6);
  assert.equal(anna.present, 6);
  assert.equal(anna.total, 6);
  assert.equal(anna.pct, 100);
  assert.ok(anna.sessions.every((s) => s.attended && s.absenceReason === null));
  assert.equal(bente.present, 0);
  assert.equal(bente.total, 6);
  assert.equal(bente.pct, 0);
  assert.deepEqual(
    bente.sessions.map((s) => s.absenceReason),
    ["private", "sick", "injured", "work_school", "vacation", "no_reason"],
  );
  assert.equal(absenceReasonLabelNl(bente.sessions[0]!.absenceReason), "Privé");
  assert.equal(absenceReasonLabelNl(bente.sessions[1]!.absenceReason), "Ziek");
  assert.equal(absenceReasonLabelNl(bente.sessions[2]!.absenceReason), "Geblesseerd");
  assert.equal(absenceReasonLabelNl(bente.sessions[3]!.absenceReason), "Werk/School");
  assert.equal(absenceReasonLabelNl(bente.sessions[4]!.absenceReason), "Vakantie");
  assert.equal(absenceReasonLabelNl(bente.sessions[5]!.absenceReason), "Geen reden");
  assert.ok(!bente.sessions.some((s) => s.session_id === "sfuture" || s.session_id === "sunreg"));
  assert.ok(!anna.sessions.some((s) => s.dateKey === "2026-08-24"));
  const pubRow = center.ranking.find((r) => r.name === "Bente")!;
  assert.equal(pubRow.present, bente.present);
  assert.equal(pubRow.total, bente.total);
  assert.equal(pubRow.pct, bente.pct);
  assert.equal("sessions" in pubRow, false);
}

{
  const eight = Array.from({ length: 8 }, (_, i) => ({
    session_id: `s${i}`,
    dateKey: `2026-08-${String(i + 3).padStart(2, "0")}`,
    attended: true,
    absenceReason: null,
  }));
  assert.equal(ADMIN_TIMELINE_DEFAULT, 6);
  const { visible, hidden } = recentRegisteredMoments(eight);
  assert.equal(visible.length, 6);
  assert.equal(hidden.length, 2);
  assert.equal(visible[0]!.dateKey, "2026-08-05");
  assert.equal(visible[5]!.dateKey, "2026-08-10");
  assert.equal(shortTrainingDayLabel("2026-08-17"), "17 aug");
}

{
  const adminSrc = readFileSync(join(process.cwd(), "src/components/admin/admin-player-attendance-explain.tsx"), "utf8");
  assert.match(adminSrc, /Aanwezigheid & redenen/);
  assert.match(adminSrc, /md:grid-cols-2/);
  assert.match(adminSrc, /Volledige historie bekijken/);
  assert.match(adminSrc, /Privé|ABSENCE_REASON_LABELS_NL/);
  assert.match(adminSrc, /player-history-expand/);
  const publicSrc = readFileSync(join(process.cwd(), "src/components/training/player-attendance-rank.tsx"), "utf8");
  assert.doesNotMatch(publicSrc, /ABSENCE_REASON_LABELS_NL|Privé|Geblesseerd|Werk\/School/);
  assert.match(publicSrc, /AttendanceDonut/);
  const detailsSrc = readFileSync(join(process.cwd(), "src/components/training/player-attendance-session-details.tsx"), "utf8");
  assert.match(detailsSrc, /Bekijk \{sessions\.length\} trainingen/);
  const donutSrc = readFileSync(join(process.cwd(), "src/components/training/attendance-donut.tsx"), "utf8");
  assert.match(donutSrc, /aria-label/);
  assert.match(donutSrc, /attendanceDistributionAriaLabel/);
  const publicPage = readFileSync(join(process.cwd(), "src/app/(site)/training/page.tsx"), "utf8");
  assert.match(publicPage, /Geen persoonlijke afwezigheidsredenen/);
  assert.match(publicPage, /canViewPlayerAbsenceReasons/);
  assert.match(publicPage, /trainerTrainingPerformanceView/);
  assert.match(publicPage, /force-dynamic/);
  assert.doesNotMatch(publicPage, /adminRanking/);
}

{
  const db = emptyDb();
  db.players.push({
    id: "p3",
    full_name: "Clara",
    photo_url: "https://example.com/c.jpg",
    is_guest: false,
    initials: null,
    bio: null,
    preferred_foot: null,
    strengths: null,
    role_label: null,
    tagline: null,
    card_note: null,
  });
  db.player_season_memberships.push({
    id: "m3",
    player_id: "p3",
    season_id: SEASON_2026_27_ID,
    shirt_number: 11,
    position: "MID",
    display_position: "9",
    is_captain: false,
    is_vice_captain: false,
    is_guest: false,
  });
  const dates = ["2026-08-10", "2026-08-12", "2026-08-17", "2026-08-19"] as const;
  db.training_sessions = dates.map((d, i) => ({
    id: `t${i}`,
    season_id: SEASON_2026_27_ID,
    title: "Reguliere training",
    session_at: clubLocalDateTimeToIso(d, "20:00"),
    location: "20:00–21:00",
    status: "completed" as const,
  }));
  db.training_sessions.push({
    id: "tfuture",
    season_id: SEASON_2026_27_ID,
    title: "Reguliere training",
    session_at: clubLocalDateTimeToIso("2026-08-24", "20:00"),
    location: "20:00–21:00",
    status: "scheduled",
  });
  const marks: Record<string, Array<{ present: boolean; note: string | null }>> = {
    p1: [
      { present: true, note: null },
      { present: false, note: "no_reason" },
      { present: true, note: null },
      { present: true, note: null },
    ],
    p2: [
      { present: true, note: null },
      { present: false, note: "private" },
      { present: false, note: "private" },
      { present: true, note: null },
    ],
    p3: [
      { present: false, note: "sick" },
      { present: false, note: null },
      { present: true, note: null },
      { present: false, note: "no_reason" },
    ],
  };
  db.training_attendance = ["p1", "p2", "p3"].flatMap((pid) =>
    dates.map((_, i) => ({
      session_id: `t${i}`,
      player_id: pid,
      present: marks[pid]![i]!.present,
      note: marks[pid]![i]!.note,
    })),
  );
  const now = new Date("2026-08-21T10:00:00+02:00");
  const center = buildTrainingPerformanceCenter(db, SEASON_2026_27_ID, now);
  const trainer = trainerTrainingPerformanceView(center);
  const pub = publicTrainingPerformanceView(center);
  const dionne = trainer.ranking.find((r) => r.name === "Anna")!;
  const emma = trainer.ranking.find((r) => r.name === "Bente")!;
  const nienke = trainer.ranking.find((r) => r.name === "Clara")!;
  assert.equal(trainer.trainerView, true);
  assert.equal(pub.trainerView, false);
  assert.equal(dionne.present, 3);
  assert.equal(dionne.total, 4);
  assert.equal(dionne.pct, 75);
  assert.equal(dionne.recentSessions.filter((s) => !s.attended).length, 1);
  assert.equal(dionne.recentSessions.find((s) => s.dateKey === "2026-08-12")?.absenceReason, "no_reason");
  assert.ok(dionne.recentSessions.filter((s) => s.attended).every((s) => s.absenceReason === null));
  assert.equal(emma.present, 2);
  assert.equal(emma.pct, 50);
  assert.equal(emma.recentSessions.filter((s) => !s.attended).length, 2);
  assert.equal(emma.recentSessions.find((s) => s.dateKey === "2026-08-12")?.absenceReason, "private");
  assert.equal(emma.recentSessions.find((s) => s.dateKey === "2026-08-17")?.absenceReason, "private");
  assert.equal(nienke.present, 1);
  assert.equal(nienke.pct, 25);
  assert.equal(nienke.recentSessions.filter((s) => !s.attended).length, 3);
  assert.equal(nienke.recentSessions.find((s) => s.dateKey === "2026-08-10")?.absenceReason, "sick");
  assert.equal(nienke.recentSessions.find((s) => s.dateKey === "2026-08-12")?.absenceReason, "no_reason");
  assert.equal(nienke.recentSessions.find((s) => s.dateKey === "2026-08-19")?.absenceReason, "no_reason");
  assert.ok(trainer.ranking.every((r) => !r.recentSessions.some((s) => s.dateKey === "2026-08-24")));
  assert.equal(pub.ranking.find((r) => r.name === "Anna")!.pct, dionne.pct);
  assert.equal(pub.ranking.find((r) => r.name === "Bente")!.present, emma.present);
  assert.ok(pub.ranking.every((r) => !("recentSessions" in r)));
  const pubRankJson = JSON.stringify(pub.ranking);
  assert.equal(pubRankJson.includes("recentSessions"), false);
  assert.equal(pubRankJson.includes("absenceReason"), false);
  assert.equal(pubRankJson.includes("private"), false);
  assert.equal(pubRankJson.includes("sick"), false);
  assert.equal(pubRankJson.includes("Privé"), false);
  assert.equal(pubRankJson.includes("Ziek"), false);
  assert.equal(pub.ranking.find((r) => r.name === "Clara")!.photo_url, "https://example.com/c.jpg");
  const { visible } = recentRegisteredMoments(dionne.recentSessions);
  assert.ok(visible.length <= 6);
  assert.deepEqual(dionne.distribution, {
    total: 4,
    present: 3,
    private: 0,
    sick: 0,
    injured: 0,
    work_school: 0,
    vacation: 0,
    no_reason: 1,
  });
  assert.deepEqual(emma.distribution, {
    total: 4,
    present: 2,
    private: 2,
    sick: 0,
    injured: 0,
    work_school: 0,
    vacation: 0,
    no_reason: 0,
  });
  assert.deepEqual(nienke.distribution, {
    total: 4,
    present: 1,
    private: 0,
    sick: 1,
    injured: 0,
    work_school: 0,
    vacation: 0,
    no_reason: 2,
  });
  assert.deepEqual(
    attendanceSlicesWithCount(dionne.distribution).map((s) => s.key),
    ["present", "no_reason"],
  );
  assert.equal(dionne.distribution.total, dionne.recentSessions.length);
  assert.match(
    attendanceDistributionAriaLabel(dionne.name, dionne.distribution),
    /3 aanwezig.*1 geen reden.*totaal 4 trainingen/i,
  );
  assert.ok(pub.ranking.every((r) => !("distribution" in r)));
  assert.equal(JSON.stringify(pub.ranking).includes("distribution"), false);
}

{
  const sessions = [
    { session_id: "a", dateKey: "2026-08-03", attended: true, absenceReason: null },
    { session_id: "b", dateKey: "2026-08-05", attended: false, absenceReason: "private" as const },
    { session_id: "c", dateKey: "2026-08-10", attended: false, absenceReason: "sick" as const },
    { session_id: "d", dateKey: "2026-08-12", attended: false, absenceReason: "injured" as const },
    { session_id: "e", dateKey: "2026-08-17", attended: false, absenceReason: "work_school" as const },
    { session_id: "f", dateKey: "2026-08-19", attended: false, absenceReason: "vacation" as const },
    { session_id: "g", dateKey: "2026-08-20", attended: false, absenceReason: "no_reason" as const },
  ];
  const dist = getPlayerAttendanceDistribution(sessions);
  assert.equal(dist.total, 7);
  assert.equal(dist.present, 1);
  assert.equal(dist.private, 1);
  assert.equal(dist.sick, 1);
  assert.equal(dist.injured, 1);
  assert.equal(dist.work_school, 1);
  assert.equal(dist.vacation, 1);
  assert.equal(dist.no_reason, 1);
  assert.equal(attendanceSlicesWithCount(dist).length, 7);
  assert.ok(attendanceSlicesWithCount({ ...dist, vacation: 0, private: 0 }).every((s) => s.count > 0));
  assert.ok(!attendanceSlicesWithCount({ ...dist, vacation: 0 }).some((s) => s.key === "vacation"));
}

console.log("PASS test:training-performance-center");
