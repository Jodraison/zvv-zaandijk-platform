import type { ClubDatabase, TrainingAttendance, TrainingSession } from "@/types";
import { sessionsCountingForAttendance } from "@/lib/training/training-status";
import { planRegularTrainingSessions } from "@/lib/training/regular-training-calendar";
import { trainingDateKeyAmsterdam } from "@/lib/training/manual-training";
import {
  type AbsenceReason,
  emptyAbsenceCounts,
  incrementAbsenceCount,
  parseAbsenceReason,
} from "@/lib/training/absence-reason";

export type AttendanceTier = "constant" | "strong" | "mixed" | "limited";

export type PublicPlayerAttendanceRow = {
  player_id: string;
  name: string;
  shirt_number: number | null;
  photo_url: string | null;
  present: number;
  absent: number;
  total: number;
  pct: number;
  tier: AttendanceTier;
};

export type PlayerTrainingSessionMoment = {
  session_id: string;
  dateKey: string;
  attended: boolean;
  absenceReason: AbsenceReason | null;
};

export type AdminPlayerAttendanceDetail = PublicPlayerAttendanceRow & {
  reasons: Record<AbsenceReason, number>;
  withoutReasonCount: number;
  sessions: PlayerTrainingSessionMoment[];
};

/** Alias voor de trainer-kaart: zelfde model, per-sessie uitleg. */
export type PlayerTrainingAttendanceDetail = AdminPlayerAttendanceDetail;

export const ADMIN_TIMELINE_DEFAULT = 6;

export function recentRegisteredMoments<T extends { dateKey: string }>(
  sessions: T[],
  limit = ADMIN_TIMELINE_DEFAULT,
): { visible: T[]; hidden: T[] } {
  const chrono = [...sessions].sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  if (chrono.length <= limit) return { visible: chrono, hidden: [] };
  return { visible: chrono.slice(-limit), hidden: chrono.slice(0, -limit) };
}

export function shortTrainingDayLabel(dateKey: string): string {
  const parts = dateKey.split("-");
  const day = Number(parts[2]);
  const month = Number(parts[1]);
  const months = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
  return `${day} ${months[(month || 1) - 1] ?? ""}`;
}

export type SessionTrendRow = {
  session_id: string;
  dateKey: string;
  present: number;
  total: number;
  pct: number;
};

export type TrainingPerformanceKpis = {
  registeredSessions: number;
  plannedSessions: number;
  averagePct: number;
  highestPct: number;
  activeStreak: number;
  playersAtLeast75: number;
  absenceMoments: number;
  withoutReasonCount: number;
};

export type TrainingPerformanceCenter = {
  kpis: TrainingPerformanceKpis;
  trend: SessionTrendRow[];
  ranking: PublicPlayerAttendanceRow[];
  absenceTotals: Record<AbsenceReason, number>;
  adminRanking: AdminPlayerAttendanceDetail[];
};

export function attendanceTier(pct: number): AttendanceTier {
  if (pct >= 90) return "constant";
  if (pct >= 75) return "strong";
  if (pct >= 50) return "mixed";
  return "limited";
}

export function attendanceTierLabelNl(tier: AttendanceTier): string {
  if (tier === "constant") return "Zeer constant";
  if (tier === "strong") return "Sterk";
  if (tier === "mixed") return "Wisselend";
  return "Beperkte aanwezigheid";
}

function activeMembers(db: ClubDatabase, seasonId: string) {
  return db.player_season_memberships
    .filter((m) => m.season_id === seasonId)
    .filter((m) => !m.is_guest && !db.players.find((p) => p.id === m.player_id)?.is_guest);
}

function countingSessions(db: ClubDatabase, seasonId: string, now: Date): TrainingSession[] {
  const expected = activeMembers(db, seasonId).length;
  return sessionsCountingForAttendance(
    db.training_sessions.filter((s) => s.season_id === seasonId),
    db.training_attendance,
    expected,
    now,
  ).sort((a, b) => b.session_at.localeCompare(a.session_at));
}

export function sortAttendanceRanking<T extends { pct: number; present: number; shirt_number: number | null }>(
  rows: T[],
): T[] {
  return [...rows].sort((a, b) => {
    if (b.pct !== a.pct) return b.pct - a.pct;
    if (b.present !== a.present) return b.present - a.present;
    const sa = a.shirt_number ?? 999;
    const sb = b.shirt_number ?? 999;
    return sa - sb;
  });
}

function sessionPresentCount(attendance: TrainingAttendance[], sessionId: string): number {
  return attendance.filter((a) => a.session_id === sessionId && a.present).length;
}

function activeStreak(sessionsNewestFirst: TrainingSession[], attendance: TrainingAttendance[], expected: number): number {
  let n = 0;
  for (const s of sessionsNewestFirst) {
    const rows = attendance.filter((a) => a.session_id === s.id).length;
    if (rows < expected) break;
    n += 1;
  }
  return n;
}

export function buildTrainingPerformanceCenter(
  db: ClubDatabase,
  seasonId: string,
  now = new Date(),
): TrainingPerformanceCenter {
  const members = activeMembers(db, seasonId);
  const expected = members.length;
  const counted = countingSessions(db, seasonId, now);
  const countedIds = new Set(counted.map((s) => s.id));
  const plannedSessions = planRegularTrainingSessions(seasonId).length;

  const trend: SessionTrendRow[] = counted.map((s) => {
    const present = sessionPresentCount(db.training_attendance, s.id);
    const pct = expected ? Math.round((present / expected) * 1000) / 10 : 0;
    return {
      session_id: s.id,
      dateKey: trainingDateKeyAmsterdam(s.session_at),
      present,
      total: expected,
      pct,
    };
  });

  const absenceTotals = emptyAbsenceCounts();
  let absenceMoments = 0;
  let withoutReasonCount = 0;

  const adminRanking: AdminPlayerAttendanceDetail[] = members.map((m) => {
    const player = db.players.find((p) => p.id === m.player_id);
    const rows = db.training_attendance.filter((a) => a.player_id === m.player_id && countedIds.has(a.session_id));
    const present = rows.filter((a) => a.present).length;
    const absentRows = rows.filter((a) => !a.present);
    const reasons = emptyAbsenceCounts();
    for (const a of absentRows) {
      const reason = parseAbsenceReason(a.note, false);
      incrementAbsenceCount(reasons, reason ?? "no_reason");
      incrementAbsenceCount(absenceTotals, reason ?? "no_reason");
      absenceMoments += 1;
      if ((reason ?? "no_reason") === "no_reason") withoutReasonCount += 1;
    }
    const total = rows.length;
    const pct = total ? Math.round((present / total) * 1000) / 10 : 0;
    const shirt = Number(m.shirt_number);
    const sessions: PlayerTrainingSessionMoment[] = counted
      .map((s) => {
        const row = rows.find((a) => a.session_id === s.id);
        if (!row) return null;
        return {
          session_id: s.id,
          dateKey: trainingDateKeyAmsterdam(s.session_at),
          attended: !!row.present,
          absenceReason: row.present ? null : (parseAbsenceReason(row.note, false) ?? "no_reason"),
        };
      })
      .filter((moment): moment is PlayerTrainingSessionMoment => moment != null)
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
    return {
      player_id: m.player_id,
      name: player?.full_name ?? "—",
      shirt_number: Number.isFinite(shirt) ? shirt : null,
      photo_url: player?.photo_url ?? null,
      present,
      absent: absentRows.length,
      total,
      pct,
      tier: attendanceTier(pct),
      reasons,
      withoutReasonCount: reasons.no_reason,
      sessions,
    };
  });

  const sortedAdmin = sortAttendanceRanking(adminRanking);
  const ranking: PublicPlayerAttendanceRow[] = sortedAdmin.map((row) => ({
    player_id: row.player_id,
    name: row.name,
    shirt_number: row.shirt_number,
    photo_url: row.photo_url,
    present: row.present,
    absent: row.absent,
    total: row.total,
    pct: row.pct,
    tier: row.tier,
  }));

  const averagePct = trend.length
    ? Math.round((trend.reduce((sum, s) => sum + s.pct, 0) / trend.length) * 10) / 10
    : 0;
  const highestPct = trend.length ? Math.max(...trend.map((s) => s.pct)) : 0;

  return {
    kpis: {
      registeredSessions: counted.length,
      plannedSessions,
      averagePct,
      highestPct,
      activeStreak: activeStreak(counted, db.training_attendance, expected),
      playersAtLeast75: ranking.filter((r) => r.pct >= 75 && r.total > 0).length,
      absenceMoments,
      withoutReasonCount,
    },
    trend,
    ranking,
    absenceTotals,
    adminRanking: sortedAdmin,
  };
}

/** Publieke payload: geen per-speler redenen. */
export function publicTrainingPerformanceView(center: TrainingPerformanceCenter) {
  return {
    kpis: center.kpis,
    trend: center.trend,
    ranking: center.ranking,
    absenceTotals: center.absenceTotals,
  };
}
