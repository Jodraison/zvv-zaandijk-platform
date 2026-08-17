import type { Match } from "@/types";
import { isQaFixtureNotes, isQaMatchOpponent } from "@/lib/match/qa-fixture-patterns";

/** Structureel contract: productie vs demo/qa — nooit alleen op UI-naamfilters. */
export type MatchDataScope = "production" | "demo" | "qa";

/**
 * Bepaalt data_scope.
 * Expliciet veld wint; anders notes-marker / opponent-QA-patronen → qa.
 */
export function resolveMatchDataScope(match: Pick<Match, "opponent" | "notes" | "data_scope">): MatchDataScope {
  if (match.data_scope === "production" || match.data_scope === "demo" || match.data_scope === "qa") {
    return match.data_scope;
  }
  if (isQaFixtureNotes(match.notes) || isQaMatchOpponent(match.opponent)) return "qa";
  return "production";
}

export function isProductionMatch(match: Pick<Match, "opponent" | "notes" | "data_scope">): boolean {
  return resolveMatchDataScope(match) === "production";
}

export function isNonProductionMatch(match: Pick<Match, "opponent" | "notes" | "data_scope">): boolean {
  return !isProductionMatch(match);
}
