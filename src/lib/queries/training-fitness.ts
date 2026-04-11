import type { ClubDatabase } from "@/types";
import { computeTrainingAttendanceStats, computeTrainingSessionStats } from "@/lib/queries/training-attendance-stats";

export function teamAttendanceSummary(db: ClubDatabase, seasonId: string) {
  if (!seasonId) return { bySession: [], perPlayer: [], sessionCount: 0 };
  const sessions = db.training_sessions
    .filter((s) => s.season_id === seasonId)
    .sort((a, b) => b.session_at.localeCompare(a.session_at));
  const members = db.player_season_memberships
    .filter((m) => m.season_id === seasonId)
    .filter((m) => !db.players.find((p) => p.id === m.player_id)?.is_guest);
  const playerNames = new Map(
    members.map((m) => [m.player_id, db.players.find((p) => p.id === m.player_id)?.full_name ?? ""]),
  );

  const bySessionStats = computeTrainingSessionStats(db, seasonId, "season");
  const bySession = bySessionStats.map((s) => ({
    id: s.session_id,
    label: s.session_date,
    session_at: sessions.find((x) => x.id === s.session_id)?.session_at ?? `${s.session_date}T00:00:00.000Z`,
    pct: s.attendance_percentage,
    present: s.present_count,
    total: s.squad_size_considered,
  }));

  const perPlayerStats = computeTrainingAttendanceStats(db, seasonId, "season");
  const perPlayer = members
    .map((mem) => {
      const row = perPlayerStats.find((r) => r.player_id === mem.player_id);
      const present = row?.present_count ?? 0;
      const absent = row?.absent_count ?? 0;
      const total = row?.total_sessions ?? 0;
      const pct = row?.attendance_percentage ?? 0;
      return {
        player_id: mem.player_id,
        name: playerNames.get(mem.player_id) ?? "",
        shirt_number: mem.shirt_number,
        pct,
        present,
        total: total || (present + absent),
      };
    })
    .sort((a, b) => b.pct - a.pct || a.shirt_number - b.shirt_number);

  return { bySession: bySession.reverse(), perPlayer, sessionCount: sessions.length };
}

export function fitnessTrendTeam(db: ClubDatabase, seasonId: string, distance: "20" | "40" | "60") {
  if (!seasonId) return [];
  const tests = db.fitness_tests.filter((f) => f.season_id === seasonId && f.test_type === "sprint_20_40_60");
  const pick = (t: (typeof tests)[number]) =>
    distance === "20" ? t.sprint_20m : distance === "40" ? t.sprint_40m : t.sprint_60m;
  const byWeek = new Map<string, number[]>();
  for (const t of tests) {
    const d = new Date(t.test_on + "T12:00:00.000Z");
    const key = `${d.getFullYear()}-W${Math.ceil((d.getDate() + 6 - d.getDay()) / 7)}`;
    if (!byWeek.has(key)) byWeek.set(key, []);
    byWeek.get(key)!.push(pick(t));
  }
  const points = [...byWeek.entries()].map(([k, vals]) => ({
    label: k,
    avg: vals.reduce((a, b) => a + b, 0) / vals.length,
  }));
  points.sort((a, b) => a.label.localeCompare(b.label));
  return points;
}
