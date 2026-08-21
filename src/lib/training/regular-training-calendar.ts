/**
 * Canonieke reguliere trainingskalender — ma/wo 20:00–21:00 Europe/Amsterdam.
 * Materialiseert ontbrekende sessies; overschrijft nooit bestaande rijen of attendance.
 */
import { randomUUID } from "crypto";
import {
  generateMonWedDates,
  getSeasonOperations,
  trainingKickoffIso,
  type SeasonOperationsConfig,
} from "@/lib/season/season-operations-2026-27";
import { trainingDateKeyAmsterdam } from "@/lib/training/manual-training";
import type { TrainingAttendance, TrainingSession } from "@/types";

export type RegularTrainingPlanItem = {
  dateKey: string;
  session_at: string;
  location: string;
  title: "Reguliere training";
};

export type EnsureRegularTrainingResult = {
  sessions: TrainingSession[];
  inserted: TrainingSession[];
  preservedIds: string[];
  skippedDates: string[];
  cancelledPreserved: number;
  attendancePreserved: number;
};

export function planRegularTrainingSessions(
  seasonId: string,
  ops: SeasonOperationsConfig | null = getSeasonOperations(seasonId),
): RegularTrainingPlanItem[] {
  if (!ops) return [];
  return generateMonWedDates(ops.operationalStartOn, ops.operationalEndOn).map((dateKey) => ({
    dateKey,
    session_at: trainingKickoffIso(dateKey, ops),
    location: `${ops.trainingSchedule.startsAt}–${ops.trainingSchedule.endsAt}`,
    title: "Reguliere training",
  }));
}

export function existingTrainingDateKeys(
  sessions: readonly Pick<TrainingSession, "season_id" | "session_at">[],
  seasonId: string,
): Set<string> {
  const keys = new Set<string>();
  for (const s of sessions) {
    if (s.season_id !== seasonId) continue;
    keys.add(trainingDateKeyAmsterdam(s.session_at));
  }
  return keys;
}

/**
 * Voegt alleen ontbrekende ma/wo-sessies toe. Bestaande (ook cancelled/extra/verplaatst) blijven staan.
 */
export function ensureRegularTrainingSessionsForSeason(
  sessions: TrainingSession[],
  seasonId: string,
  attendance: readonly Pick<TrainingAttendance, "session_id">[] = [],
  createId: () => string = () => randomUUID(),
): EnsureRegularTrainingResult {
  const seasonSessions = sessions.filter((s) => s.season_id === seasonId);
  const byDate = existingTrainingDateKeys(seasonSessions, seasonId);
  const preservedIds = seasonSessions.map((s) => s.id);
  const cancelledPreserved = seasonSessions.filter((s) => s.status === "cancelled").length;
  const seasonIds = new Set(preservedIds);
  const attendancePreserved = attendance.filter((a) => seasonIds.has(a.session_id)).length;

  const inserted: TrainingSession[] = [];
  const skippedDates: string[] = [];
  const next = [...sessions];

  for (const plan of planRegularTrainingSessions(seasonId)) {
    if (byDate.has(plan.dateKey)) {
      skippedDates.push(plan.dateKey);
      continue;
    }
    const row: TrainingSession = {
      id: createId(),
      season_id: seasonId,
      title: plan.title,
      session_at: plan.session_at,
      location: plan.location,
      status: "scheduled",
    };
    next.push(row);
    byDate.add(plan.dateKey);
    inserted.push(row);
  }

  return {
    sessions: next,
    inserted,
    preservedIds,
    skippedDates,
    cancelledPreserved,
    attendancePreserved,
  };
}
