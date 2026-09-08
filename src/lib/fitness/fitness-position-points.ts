/**
 * Positiepunten voor een fitheidssessie.
 * 1e = N, 2e = N-1, … laatste = 1. Ontbrekend onderdeel = 0, geen plaats.
 */
import type { FitnessTestResult } from "@/types";
import { FITNESS_COMPONENTS, type FitnessComponentKey } from "@/lib/fitness/protocol";

export function isMeasuredFitnessValue(value: number | null | undefined): boolean {
  return value != null && Number.isFinite(value) && value > 0;
}

export function resultHasAnyMeasurement(r: FitnessTestResult): boolean {
  return FITNESS_COMPONENTS.some((c) => isMeasuredFitnessValue(r[c.key] as number | null));
}

export function fitnessSessionFieldSize(results: readonly FitnessTestResult[]): number {
  return results.filter(resultHasAnyMeasurement).length;
}

export function positionPoints(place: number, fieldSize: number): number {
  if (!Number.isInteger(place) || !Number.isInteger(fieldSize) || fieldSize < 1) return 0;
  if (place < 1 || place > fieldSize) return 0;
  return fieldSize - place + 1;
}

/** Dense rank per unieke prestatie. Gelijke waarde = gelijke plaats. */
export function denseRankByValue(
  values: readonly number[],
  direction: "lower_better" | "higher_better",
): Map<number, number> {
  const unique = [...new Set(values)];
  unique.sort((a, b) => (direction === "lower_better" ? a - b : b - a));
  return new Map(unique.map((value, i) => [value, i + 1]));
}

export function denseRankAndPoints(
  value: number,
  rankByValue: ReadonlyMap<number, number>,
  fieldSize: number,
): { rank: number; points: number } {
  const rank = rankByValue.get(value);
  if (rank == null) return { rank: 0, points: 0 };
  return { rank, points: positionPoints(rank, fieldSize) };
}

export function maxSessionTotalPoints(fieldSize: number): number {
  return Math.max(0, fieldSize) * FITNESS_COMPONENTS.length;
}

export function formatPositionScaleLine(fieldSize: number): string {
  if (fieldSize <= 0) return "";
  if (fieldSize === 1) return "1e 1 pt";
  if (fieldSize === 2) return "1e 2 pt · 2e 1 pt";
  if (fieldSize === 3) return "1e 3 pt · 2e 2 pt · 3e 1 pt";
  return `1e ${fieldSize} pt · 2e ${fieldSize - 1} pt · 3e ${fieldSize - 2} pt · 4e ${fieldSize - 3} pt · … · ${fieldSize}e 1 pt`;
}

export function componentPointsOf(
  ranks: ReadonlyMap<string, number>,
  playerId: string,
  fieldSize: number,
): number {
  const place = ranks.get(playerId);
  if (place == null) return 0;
  return positionPoints(place, fieldSize);
}

export function measuredComponentEntries(
  results: readonly FitnessTestResult[],
  key: FitnessComponentKey,
): FitnessTestResult[] {
  return results.filter((r) => isMeasuredFitnessValue(r[key] as number | null));
}
