import type { ClubDatabase } from "@/types";
import { teamAttendanceSummary } from "@/lib/queries/training-fitness";
import { fitnessTotalSeconds } from "@/lib/fitness-analytics";
import { formatSprintSecondsNl } from "@/lib/import/fitness-time";
import { formatDateNL } from "@/lib/utils/format-date";

export type TeamDevelopmentTraining = {
  averageAttendancePct: number | null;
  averageAttendanceLabel: string;
  sessionCount: number;
  lastSessionDateLabel: string | null;
};

export type TeamDevelopmentFitness = {
  testCount: number;
  lastTestDateLabel: string | null;
  teamSprintSummaryLabel: string | null;
};

export type TeamDevelopment = {
  training: TeamDevelopmentTraining;
  fitness: TeamDevelopmentFitness;
};

function emptyTraining(): TeamDevelopmentTraining {
  return {
    averageAttendancePct: null,
    averageAttendanceLabel: "—",
    sessionCount: 0,
    lastSessionDateLabel: null,
  };
}

function emptyFitness(): TeamDevelopmentFitness {
  return {
    testCount: 0,
    lastTestDateLabel: null,
    teamSprintSummaryLabel: null,
  };
}

function buildTrainingSummary(
  training: ReturnType<typeof teamAttendanceSummary>,
): TeamDevelopmentTraining {
  if (training.sessionCount === 0 && training.bySession.length === 0) {
    return emptyTraining();
  }

  const averageAttendancePct =
    training.bySession.length > 0
      ? Math.round(
          (training.bySession.reduce((sum, session) => sum + session.pct, 0) / training.bySession.length) * 10,
        ) / 10
      : null;

  const lastSession = training.bySession.length > 0 ? training.bySession[training.bySession.length - 1] : null;

  return {
    averageAttendancePct,
    averageAttendanceLabel: averageAttendancePct != null ? `${averageAttendancePct}%` : "—",
    sessionCount: training.sessionCount,
    lastSessionDateLabel: lastSession ? formatDateNL(lastSession.label) : null,
  };
}

function buildFitnessSummary(db: ClubDatabase, seasonId: string): TeamDevelopmentFitness {
  if (!seasonId) return emptyFitness();

  const tests = db.fitness_tests.filter((f) => f.season_id === seasonId && f.test_type === "sprint_20_40_60");
  if (tests.length === 0) return emptyFitness();

  const lastTestOn = tests.reduce<string | null>((best, test) => {
    if (!best || test.test_on > best) return test.test_on;
    return best;
  }, null);

  const onLatest = lastTestOn ? tests.filter((test) => test.test_on === lastTestOn) : [];
  const fastestOnLatest =
    onLatest.length > 0 ? Math.min(...onLatest.map((test) => fitnessTotalSeconds(test))) : null;

  return {
    testCount: tests.length,
    lastTestDateLabel: lastTestOn ? formatDateNL(lastTestOn) : null,
    teamSprintSummaryLabel: fastestOnLatest != null ? formatSprintSecondsNl(fastestOnLatest) : null,
  };
}

/**
 * Compacte trainings- en fitheidssamenvatting voor Statistics Center.
 * Delegeert naar `teamAttendanceSummary` en bestaande fitheidshelpers — geen eigen aggregatie.
 */
export function getTeamDevelopment(
  db: ClubDatabase,
  seasonId: string,
  training: ReturnType<typeof teamAttendanceSummary> = teamAttendanceSummary(db, seasonId),
): TeamDevelopment {
  return {
    training: buildTrainingSummary(training),
    fitness: buildFitnessSummary(db, seasonId),
  };
}
