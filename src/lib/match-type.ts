import type { MatchType } from "@/types";

export const DEFAULT_MATCH_TYPE: MatchType = "competition";

const MATCH_TYPE_VALUES: MatchType[] = ["competition", "cup", "friendly"];

export function asMatchType(raw: string | null | undefined): MatchType {
  const v = String(raw ?? DEFAULT_MATCH_TYPE).toLowerCase();
  if (MATCH_TYPE_VALUES.includes(v as MatchType)) return v as MatchType;
  return DEFAULT_MATCH_TYPE;
}

export const MATCH_TYPE_LABELS: Record<MatchType, string> = {
  competition: "Competitie",
  cup: "Beker",
  friendly: "Oefenwedstrijd",
};

export function matchTypeLabel(type: MatchType): string {
  return MATCH_TYPE_LABELS[type] ?? MATCH_TYPE_LABELS.competition;
}
