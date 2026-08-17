/**
 * Centrale trainingsstatus — Europe/Amsterdam, geen “Geweest” als vage mix.
 */
import { parseOperationsInstant } from "@/lib/operations/countdown";
import type { TrainingAttendance, TrainingSession } from "@/types";

export const TRAINING_DURATION_MS = 60 * 60_000;

export type TrainingOperationalStatus =
  | "gepland"
  | "afgelast"
  | "klaar_voor_registratie"
  | "concept"
  | "geregistreerd";

export type TrainingOperationalStatusResult = {
  status: TrainingOperationalStatus;
  label: string;
  /** Mag meetellen in aanwezigheidaggregaties */
  countsForAttendance: boolean;
  /** Mag echte present-rows tonen als deelname */
  treatsAttendanceAsParticipation: boolean;
  isFuture: boolean;
  hasEnded: boolean;
  hasStarted: boolean;
};

const LABELS: Record<TrainingOperationalStatus, string> = {
  gepland: "Gepland",
  afgelast: "Afgelast",
  klaar_voor_registratie: "Klaar voor registratie",
  concept: "Concept",
  geregistreerd: "Geregistreerd",
};

export function trainingSessionEndInstant(sessionAt: string, durationMs = TRAINING_DURATION_MS): Date | null {
  const start = parseOperationsInstant(sessionAt);
  if (!start) return null;
  return new Date(start.getTime() + durationMs);
}

export function resolveTrainingOperationalStatus(
  session: Pick<TrainingSession, "session_at" | "status"> | null,
  opts: {
    now?: Date;
    /** Aantal aanwezigheidsrijen voor de seizoensselectie */
    attendanceRowCount?: number;
    expectedSquadCount?: number;
    /** Concept = draft dirty / niet volledig, of status scheduled met rows */
    isDraftIncomplete?: boolean;
    durationMs?: number;
  } = {},
): TrainingOperationalStatusResult {
  const now = opts.now ?? new Date();
  const durationMs = opts.durationMs ?? TRAINING_DURATION_MS;

  if (!session) {
    return {
      status: "gepland",
      label: LABELS.gepland,
      countsForAttendance: false,
      treatsAttendanceAsParticipation: false,
      isFuture: true,
      hasEnded: false,
      hasStarted: false,
    };
  }

  if (session.status === "cancelled") {
    return {
      status: "afgelast",
      label: LABELS.afgelast,
      countsForAttendance: false,
      treatsAttendanceAsParticipation: false,
      isFuture: false,
      hasEnded: false,
      hasStarted: false,
    };
  }

  const start = parseOperationsInstant(session.session_at);
  const end = start ? new Date(start.getTime() + durationMs) : null;
  const hasStarted = !!start && now.getTime() >= start.getTime();
  const hasEnded = !!end && now.getTime() >= end.getTime();
  const isFuture = !!start && now.getTime() < start.getTime();

  const rows = opts.attendanceRowCount ?? 0;
  const expected = opts.expectedSquadCount ?? 0;
  const completeRows = expected > 0 && rows >= expected;
  const incompleteRows = rows > 0 && !completeRows;

  // Toekomst: nooit geregistreerd / geverifieerd, ook niet bij legacy status=completed + rows
  if (isFuture) {
    return {
      status: "gepland",
      label: LABELS.gepland,
      countsForAttendance: false,
      treatsAttendanceAsParticipation: false,
      isFuture: true,
      hasEnded: false,
      hasStarted: false,
    };
  }

  if (opts.isDraftIncomplete || incompleteRows) {
    return {
      status: "concept",
      label: LABELS.concept,
      countsForAttendance: false,
      treatsAttendanceAsParticipation: false,
      isFuture: false,
      hasEnded,
      hasStarted,
    };
  }

  if (session.status === "completed" && completeRows && hasEnded) {
    return {
      status: "geregistreerd",
      label: LABELS.geregistreerd,
      countsForAttendance: true,
      treatsAttendanceAsParticipation: true,
      isFuture: false,
      hasEnded: true,
      hasStarted: true,
    };
  }

  if (hasEnded || hasStarted) {
    return {
      status: "klaar_voor_registratie",
      label: LABELS.klaar_voor_registratie,
      countsForAttendance: false,
      treatsAttendanceAsParticipation: false,
      isFuture: false,
      hasEnded,
      hasStarted,
    };
  }

  return {
    status: "gepland",
    label: LABELS.gepland,
    countsForAttendance: false,
    treatsAttendanceAsParticipation: false,
    isFuture: true,
    hasEnded: false,
    hasStarted: false,
  };
}

/** Filter sessies die mogen meetellen voor aanwezigheid%. */
export function sessionsCountingForAttendance(
  sessions: TrainingSession[],
  attendance: TrainingAttendance[],
  expectedSquadCount: number,
  now = new Date(),
): TrainingSession[] {
  return sessions.filter((s) => {
    const rows = attendance.filter((a) => a.session_id === s.id).length;
    const op = resolveTrainingOperationalStatus(s, {
      now,
      attendanceRowCount: rows,
      expectedSquadCount,
    });
    return op.countsForAttendance;
  });
}

export function assertCanPersistCompletedAttendance(
  sessionAt: string,
  now = new Date(),
): { ok: true } | { ok: false; error: string } {
  const start = parseOperationsInstant(sessionAt);
  if (!start) return { ok: false, error: "Ongeldig trainingsmoment." };
  if (now.getTime() < start.getTime()) {
    return {
      ok: false,
      error: "Toekomstige training: aanwezigheid kan nog niet als deelname worden geregistreerd.",
    };
  }
  return { ok: true };
}
