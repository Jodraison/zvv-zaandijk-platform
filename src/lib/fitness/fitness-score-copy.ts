/**
 * Compacte puntentelling-copy — hoort bij positiepunten (1e = N … laatste = 1).
 */
import { formatPositionScaleLine, maxSessionTotalPoints } from "@/lib/fitness/fitness-position-points";

export function fitnessScoreLegendScale(fieldSize: number): string {
  return formatPositionScaleLine(fieldSize);
}

export function fitnessScoreLegendMax(fieldSize: number): string {
  return `4 onderdelen · max. ${maxSessionTotalPoints(fieldSize)} pt`;
}

export const FITNESS_SCORE_LEGEND_TIE = "Gelijke prestatie = gelijke plaats en gelijke punten.";
