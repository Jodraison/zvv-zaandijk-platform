/**
 * Productworkflow — vier zichtbare trainersstappen.
 * Legacy step-ids (selectie/verloop/uitslag) mappen naar de nieuwe namen.
 */

export const MATCH_WORKFLOW_STEPS = [
  { id: "wedstrijd", label: "Wedstrijd", short: "1" },
  { id: "opstelling", label: "Opstelling & selectie", short: "2" },
  { id: "na-de-wedstrijd", label: "Na de wedstrijd", short: "3" },
  { id: "controle", label: "Controleren", short: "4" },
] as const;

export type MatchWorkflowStepId = (typeof MATCH_WORKFLOW_STEPS)[number]["id"];

const LEGACY_STEP_MAP: Record<string, MatchWorkflowStepId> = {
  wedstrijd: "wedstrijd",
  selectie: "opstelling",
  opstelling: "opstelling",
  verloop: "na-de-wedstrijd",
  uitslag: "na-de-wedstrijd",
  "na-de-wedstrijd": "na-de-wedstrijd",
  controle: "controle",
};

export function parseMatchWorkflowStep(raw: string | undefined | null): MatchWorkflowStepId {
  const id = (raw ?? "").trim();
  return LEGACY_STEP_MAP[id] ?? "wedstrijd";
}

export function matchWorkflowHref(
  matchId: string,
  seasonId: string,
  step: MatchWorkflowStepId,
  extra?: Record<string, string>,
): string {
  const params = new URLSearchParams({ season: seasonId, step, ...extra });
  return `/beheer/wedstrijden/${matchId}?${params.toString()}`;
}
