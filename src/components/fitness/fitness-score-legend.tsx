import {
  FITNESS_SCORE_LEGEND_BULLETS,
  FITNESS_SCORE_LEGEND_NORMALIZATION,
  FITNESS_SCORE_LEGEND_SUMMARY,
  FITNESS_SCORE_LEGEND_TITLE,
} from "@/lib/fitness/fitness-score-copy";

export function FitnessScoreLegend() {
  return (
    <details
      data-testid="fitness-score-legend"
      open
      className="rounded-xl border border-zvv-border bg-zvv-card-mid/50 px-3 py-2.5"
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 text-[13px] font-semibold leading-snug text-zvv-ink [&::-webkit-details-marker]:hidden">
        <span
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-zvv-primary/45 text-[11px] font-bold text-zvv-primary"
          aria-hidden
        >
          i
        </span>
        <span>{FITNESS_SCORE_LEGEND_SUMMARY}</span>
      </summary>
      <div className="mt-2.5 space-y-2 text-[13px] leading-relaxed text-zvv-muted">
        <p className="font-semibold text-zvv-ink">{FITNESS_SCORE_LEGEND_TITLE}</p>
        <ul className="list-disc space-y-1 pl-4">
          {FITNESS_SCORE_LEGEND_BULLETS.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p>{FITNESS_SCORE_LEGEND_NORMALIZATION}</p>
      </div>
    </details>
  );
}
