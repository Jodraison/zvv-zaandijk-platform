/**
 * Bekende QA-/fixturepatronen die nooit in de publieke seizoenservaring mogen staan.
 */

export const QA_MATCH_OPPONENT_PATTERNS: readonly RegExp[] = [
  /^UX Final\b/i,
  /^Ketenherstel\b/i,
  /^Debug FC\b/i,
  /^Test FC\b/i,
  /^QA[\s_-]/i,
  /^OWF\b/i,
  /^OWF Accept\b/i,
  /^OWF Debug\b/i,
  /^vfdvgs$/i,
  /\b\d{13,}\b/, // timestamp-achtige suffixen van capture-scripts
];

/** Notes-markering voor tijdelijke fixtures. */
export const QA_FIXTURE_NOTES_MARKER = "__qa_fixture__";

export function isQaMatchOpponent(opponent: string | null | undefined): boolean {
  const name = (opponent ?? "").trim();
  if (!name) return false;
  return QA_MATCH_OPPONENT_PATTERNS.some((re) => re.test(name));
}

export function isQaFixtureNotes(notes: string | null | undefined): boolean {
  return (notes ?? "").includes(QA_FIXTURE_NOTES_MARKER);
}

export function classifyMatchOpponent(opponent: string): "qa_auto" | "likely_real" {
  return isQaMatchOpponent(opponent) ? "qa_auto" : "likely_real";
}
