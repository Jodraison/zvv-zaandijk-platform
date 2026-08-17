import type { FitnessParticipationStatus } from "@/lib/fitness/protocol";
import { FITNESS_COMPONENTS } from "@/lib/fitness/protocol";

export type FitnessResultValues = {
  flying_sprint_30m_seconds: number | null;
  agility_10_20_10_seconds: number | null;
  plank_seconds: number | null;
  six_minute_run_meters: number | null;
  participation_status?: FitnessParticipationStatus;
};

export type PlayerCompleteness =
  | "complete"
  | "partial"
  | "not_started"
  | "absent"
  | "injured"
  | "not_tested"
  | "stopped"
  | "other";

const EXCUSED: FitnessParticipationStatus[] = ["absent", "injured", "not_tested", "stopped", "other"];

export function countFilledComponents(r: FitnessResultValues): number {
  let n = 0;
  for (const c of FITNESS_COMPONENTS) {
    if (r[c.key] != null) n += 1;
  }
  return n;
}

export function derivePlayerCompleteness(r: FitnessResultValues): PlayerCompleteness {
  const status = r.participation_status ?? "pending";
  if (EXCUSED.includes(status)) return status as PlayerCompleteness;
  const filled = countFilledComponents(r);
  if (filled === 0) return "not_started";
  if (filled === FITNESS_COMPONENTS.length) return "complete";
  return "partial";
}

export function deriveParticipationStatus(r: FitnessResultValues): FitnessParticipationStatus {
  const current = r.participation_status ?? "pending";
  if (EXCUSED.includes(current)) return current;
  const filled = countFilledComponents(r);
  if (filled === 0) return "pending";
  if (filled === FITNESS_COMPONENTS.length) return "complete";
  return "partial";
}

export function sessionProgress(results: FitnessResultValues[], expectedPlayers: number) {
  const complete = results.filter((r) => derivePlayerCompleteness(r) === "complete").length;
  const byComponent = Object.fromEntries(
    FITNESS_COMPONENTS.map((c) => [c.key, results.filter((r) => r[c.key] != null).length]),
  ) as Record<(typeof FITNESS_COMPONENTS)[number]["key"], number>;
  return {
    expectedPlayers,
    complete,
    partial: results.filter((r) => derivePlayerCompleteness(r) === "partial").length,
    notStarted: results.filter((r) => derivePlayerCompleteness(r) === "not_started").length,
    byComponent,
  };
}

export const COMPLETENESS_LABEL: Record<PlayerCompleteness, string> = {
  complete: "Volledig",
  partial: "Gedeeltelijk",
  not_started: "Niet gestart",
  absent: "Afwezig",
  injured: "Geblesseerd",
  not_tested: "Niet afgenomen",
  stopped: "Test gestopt",
  other: "Anders",
};
