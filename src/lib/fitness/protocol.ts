/**
 * Fitness Control Center 2.0 — vier losse onderdelen (geen totalTime).
 */

export const FITNESS_PROTOCOL_CODE = "four_part_v1" as const;
export const FITNESS_DEFAULT_SCORE_CONFIG_ID = "a1000000-0000-4000-8000-000000000001";

export type FitnessProtocolCode = typeof FITNESS_PROTOCOL_CODE;
export type FitnessSessionStatus = "draft" | "published";

export type FitnessParticipationStatus =
  | "pending"
  | "partial"
  | "complete"
  | "absent"
  | "injured"
  | "not_tested"
  | "stopped"
  | "other";

export type FitnessComponentKey =
  | "flying_sprint_30m_seconds"
  | "agility_10_20_10_seconds"
  | "plank_seconds"
  | "six_minute_run_meters";

export const FITNESS_COMPONENTS: readonly {
  key: FitnessComponentKey;
  tabId: "sprint" | "agility" | "plank" | "run";
  label: string;
  shortLabel: string;
  unit: "s" | "plank" | "m";
  direction: "lower_better" | "higher_better";
}[] = [
  {
    key: "flying_sprint_30m_seconds",
    tabId: "sprint",
    label: "30 m sprint (vliegende aanloop)",
    shortLabel: "Sprint",
    unit: "s",
    direction: "lower_better",
  },
  {
    key: "agility_10_20_10_seconds",
    tabId: "agility",
    label: "Agility 10-20-10",
    shortLabel: "Agility",
    unit: "s",
    direction: "lower_better",
  },
  {
    key: "plank_seconds",
    tabId: "plank",
    label: "Plank",
    shortLabel: "Plank",
    unit: "plank",
    direction: "higher_better",
  },
  {
    key: "six_minute_run_meters",
    tabId: "run",
    label: "Zes minuten looptest",
    shortLabel: "6 min loop",
    unit: "m",
    direction: "higher_better",
  },
] as const;

export const PARTICIPATION_REASON_OPTIONS: readonly {
  value: FitnessParticipationStatus;
  label: string;
}[] = [
  { value: "absent", label: "Afwezig" },
  { value: "injured", label: "Geblesseerd" },
  { value: "not_tested", label: "Niet afgenomen" },
  { value: "stopped", label: "Test gestopt" },
  { value: "other", label: "Anders" },
] as const;

/** Ensure new protocol never exposes a totalTime field on result payloads. */
export function assertNoTotalTime(obj: Record<string, unknown>): void {
  if ("totalTime" in obj || "total_time" in obj) {
    throw new Error("Het nieuwe fitheidsprotocol kent geen totale tijd.");
  }
}
