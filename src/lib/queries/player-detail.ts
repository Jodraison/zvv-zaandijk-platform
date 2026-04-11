import type { ClubDatabase, PlayerDetailAggregates } from "@/types";
import { aggregateSeasonMatchStats, playerTotalsFromAggregate } from "@/lib/queries/season-match-stats";
import { computeTrainingAttendanceStats } from "@/lib/queries/training-attendance-stats";
import { fitnessTotalSeconds } from "@/lib/fitness-analytics";
import { matchResult } from "./matches";

export function buildPlayerDetail(db: ClubDatabase, playerId: string, seasonId: string): PlayerDetailAggregates | null {
  const mem = db.player_season_memberships.find((m) => m.player_id === playerId && m.season_id === seasonId);
  if (!mem) return null;

  const played = db.matches.filter(
    (m) => m.season_id === seasonId && m.status === "played" && (m.integrity_state ?? "verified") === "verified",
  );

  const agg = aggregateSeasonMatchStats(db, seasonId);
  const { goals_total, assists_total, wotm_total } = playerTotalsFromAggregate(agg, playerId);

  const sessions = db.training_sessions.filter((t) => t.season_id === seasonId && t.status === "completed");
  const sessionIds = new Set(sessions.map((s) => s.id));
  const att = db.training_attendance.filter((a) => a.player_id === playerId && sessionIds.has(a.session_id));
  const statsRow = computeTrainingAttendanceStats(db, seasonId, "season").find((r) => r.player_id === playerId);
  const presentCount = statsRow?.present_count ?? 0;
  const absentCount = statsRow?.absent_count ?? 0;
  const total = statsRow?.total_sessions ?? 0;
  const attendance_rate = statsRow?.attendance_percentage ?? 0;
  const attendance_series = sessions
    .slice()
    .sort((a, b) => a.session_at.localeCompare(b.session_at))
    .map((sess) => {
      const row = att.find((a) => a.session_id === sess.id);
      return { session_at: sess.session_at, present: row?.present ?? false };
    });

  const fitness = db.fitness_tests
    .filter((f) => f.player_id === playerId && f.season_id === seasonId)
    .slice()
    .sort((a, b) => a.test_on.localeCompare(b.test_on))
    .map((f) => ({
      test_on: f.test_on,
      sprint_20m: f.sprint_20m,
      sprint_40m: f.sprint_40m,
      sprint_60m: f.sprint_60m,
      total_time: fitnessTotalSeconds(f),
      recorded_at: f.recorded_at,
    }));

  const recent_matches = played
    .slice()
    .sort((a, b) => b.kickoff_at.localeCompare(a.kickoff_at))
    .slice(0, 6)
    .map((m) => {
      const events = db.match_goal_events.filter((e) => e.match_id === m.id);
      const goals = events.filter((e) => e.scorer_player_id === playerId).length;
      const assists = events.filter((e) => e.assist_player_id === playerId).length;
      return {
        match_id: m.id,
        opponent: m.opponent,
        kickoff_at: m.kickoff_at,
        goals,
        assists,
        is_wotm: m.wotm_player_id === playerId,
        result: matchResult(db, m)!,
      };
    });

  return {
    goals_total,
    assists_total,
    wotm_total,
    attendance_rate,
    sessions_considered: total,
    attendance_present_count: presentCount,
    attendance_absent_count: absentCount,
    fitness_series: fitness,
    attendance_series,
    recent_matches,
  };
}
