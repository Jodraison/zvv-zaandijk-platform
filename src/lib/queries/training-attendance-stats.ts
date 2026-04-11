import type { ClubDatabase } from "@/types";

export type TrainingWindow = "4w" | "8w" | "season";

export type TrainingAttendanceStatRow = {
  player_id: string;
  present_count: number;
  absent_count: number;
  total_sessions: number;
  attendance_percentage: number;
};

export type TrainingSessionAttendanceStat = {
  session_id: string;
  session_date: string;
  day_name: string;
  present_count: number;
  squad_size_considered: number;
  attendance_percentage: number;
};

function nlWeekdayName(dayIndex: number): string {
  const days = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];
  return days[dayIndex] ?? "";
}

function windowFromDate(window: TrainingWindow): Date | null {
  if (window === "season") return null;
  const d = new Date();
  d.setDate(d.getDate() - (window === "4w" ? 28 : 56));
  return d;
}

export function computeTrainingAttendanceStats(
  db: ClubDatabase,
  seasonId: string,
  window: TrainingWindow = "season",
): TrainingAttendanceStatRow[] {
  const from = windowFromDate(window);

  const sessions = db.training_sessions.filter((s) => {
    if (s.season_id !== seasonId) return false;
    if (s.status !== "completed") return false;
    if (!from) return true;
    return new Date(s.session_at) >= from;
  });
  const sessionIds = new Set(sessions.map((s) => s.id));

  const members = db.player_season_memberships
    .filter((m) => m.season_id === seasonId)
    .filter((m) => !db.players.find((p) => p.id === m.player_id)?.is_guest);
  const rows = members.map((m) => {
    const att = db.training_attendance.filter((a) => a.player_id === m.player_id && sessionIds.has(a.session_id));
    const present_count = att.filter((a) => a.present).length;
    const absent_count = att.filter((a) => !a.present).length;
    const total_sessions = att.length;
    const attendance_percentage = total_sessions
      ? Math.round((present_count / total_sessions) * 1000) / 10
      : 0;
    return {
      player_id: m.player_id,
      present_count,
      absent_count,
      total_sessions,
      attendance_percentage,
    };
  });

  return rows.sort((a, b) => {
    if (b.attendance_percentage !== a.attendance_percentage) return b.attendance_percentage - a.attendance_percentage;
    if (b.present_count !== a.present_count) return b.present_count - a.present_count;
    return a.player_id.localeCompare(b.player_id);
  });
}

export function computeTrainingSessionStats(
  db: ClubDatabase,
  seasonId: string,
  window: TrainingWindow = "season",
): TrainingSessionAttendanceStat[] {
  const from = windowFromDate(window);
  const members = db.player_season_memberships
    .filter((m) => m.season_id === seasonId)
    .filter((m) => !db.players.find((p) => p.id === m.player_id)?.is_guest);
  const sessions = db.training_sessions
    .filter((s) => s.season_id === seasonId && s.status === "completed")
    .filter((s) => (!from ? true : new Date(s.session_at) >= from))
    .sort((a, b) => a.session_at.localeCompare(b.session_at));
  return sessions.map((s) => {
    const rows = db.training_attendance.filter((a) => a.session_id === s.id);
    const present_count = rows.filter((r) => r.present).length;
    const squad_size_considered = members.length;
    const attendance_percentage = squad_size_considered
      ? Math.round((present_count / squad_size_considered) * 1000) / 10
      : 0;
    return {
      session_id: s.id,
      session_date: s.session_at.slice(0, 10),
      day_name: nlWeekdayName(new Date(s.session_at).getDay()),
      present_count,
      squad_size_considered,
      attendance_percentage,
    };
  });
}
