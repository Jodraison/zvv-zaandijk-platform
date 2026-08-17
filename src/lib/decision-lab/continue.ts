/**
 * Echte voortgang → volgende sessie (geen nepdata).
 */

import type { DecisionLabProgressMap } from "@/lib/decision-lab/progress";
import type { DecisionLabSession } from "@/lib/decision-lab/types";

export function resolveContinueSession(
  sessions: DecisionLabSession[],
  progress: DecisionLabProgressMap,
): DecisionLabSession | null {
  if (!sessions.length) return null;

  const started = sessions
    .map((s) => ({ s, p: progress[s.id] }))
    .filter((x) => x.p?.status === "started")
    .sort((a, b) => (b.p!.updatedAt || "").localeCompare(a.p!.updatedAt || ""));
  if (started[0]) return started[0].s;

  const nextOpen = sessions.find((s) => progress[s.id]?.status !== "completed");
  return nextOpen ?? null;
}

export function resolveRecentSessions(
  sessions: DecisionLabSession[],
  progress: DecisionLabProgressMap,
  limit = 3,
) {
  return sessions
    .map((s) => ({ s, p: progress[s.id] }))
    .filter((x) => x.p)
    .sort((a, b) => (b.p!.updatedAt || "").localeCompare(a.p!.updatedAt || ""))
    .slice(0, limit);
}

export function sessionProgressLabel(
  status: DecisionLabProgressMap[string]["status"] | undefined,
): "Afgerond" | "Bezig" | "Nog niet gestart" {
  if (status === "completed") return "Afgerond";
  if (status === "started") return "Bezig";
  return "Nog niet gestart";
}
