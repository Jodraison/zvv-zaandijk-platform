import { fitnessScoreLegendMax, fitnessScoreLegendScale } from "@/lib/fitness/fitness-score-copy";

export function FitnessScoreLegend({ fieldSize }: { fieldSize: number }) {
  if (fieldSize < 1) return null;
  return (
    <div data-testid="fitness-score-legend" className="text-[13px] leading-snug text-zvv-muted">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zvv-primary">Puntentelling</p>
      <p className="mt-1 text-[13px] text-zvv-ink">{fitnessScoreLegendScale(fieldSize)}</p>
      <p className="mt-0.5">{fitnessScoreLegendMax(fieldSize)}</p>
    </div>
  );
}
