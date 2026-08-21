/**
 * Training attendance workspace helpers — existing session/attendance contract.
 * No second attendance system.
 */
import type { TrainingSession } from "@/types";
import { trainingDateKeyAmsterdam } from "@/lib/training/manual-training";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isTrainingSessionId(value: string | null | undefined): boolean {
  return UUID_RE.test(String(value ?? "").trim());
}

export function resolveTrainingWorkspaceSelection(opts: {
  sid?: string | null;
  dateKey?: string | null;
  sessions: readonly Pick<TrainingSession, "id" | "session_at">[];
  dateKeys?: readonly { id: string; dateKey: string; prefer?: boolean }[];
  fallbackIds?: readonly string[];
}): { sessionId: string; missingSid: boolean } {
  const sid = String(opts.sid ?? "").trim();
  if (sid) {
    if (opts.sessions.some((s) => s.id === sid)) {
      return { sessionId: sid, missingSid: false };
    }
    return { sessionId: "", missingSid: isTrainingSessionId(sid) };
  }

  const dateQp = String(opts.dateKey ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateQp) && opts.dateKeys?.length) {
    const hit =
      opts.dateKeys.find((i) => i.dateKey === dateQp && i.prefer) ??
      opts.dateKeys.find((i) => i.dateKey === dateQp) ??
      null;
    if (hit) return { sessionId: hit.id, missingSid: false };
  }

  for (const id of opts.fallbackIds ?? []) {
    if (id && opts.sessions.some((s) => s.id === id)) {
      return { sessionId: id, missingSid: false };
    }
  }
  return { sessionId: opts.sessions[0]?.id ?? "", missingSid: false };
}

/** Prefer explicit session id so extra trainingsdagen on the same date stay distinct. */
export function resolveSessionForAttendanceSave(
  sessions: readonly TrainingSession[],
  seasonId: string,
  dateIso: string,
  sessionId?: string | null,
): TrainingSession | null {
  const sid = String(sessionId ?? "").trim();
  if (sid) {
    return sessions.find((s) => s.id === sid && s.season_id === seasonId) ?? null;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) return null;
  return (
    sessions.find((s) => s.season_id === seasonId && trainingDateKeyAmsterdam(s.session_at) === dateIso) ?? null
  );
}

/** Past/future must stay editable unless cancelled. Date-in-the-past is not a lock. */
export function trainingAttendanceIsReadOnly(status: TrainingSession["status"] | null | undefined): boolean {
  return status === "cancelled";
}
