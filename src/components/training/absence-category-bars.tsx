import { ABSENCE_REASONS, ABSENCE_REASON_LABELS_NL, type AbsenceReason } from "@/lib/training/absence-reason";

export function AbsenceCategoryBars({ counts }: { counts: Record<AbsenceReason, number> }) {
  const total = ABSENCE_REASONS.reduce((n, k) => n + counts[k], 0);
  return (
    <ul className="space-y-2.5">
      {ABSENCE_REASONS.map((key) => {
        const n = counts[key];
        const pct = total ? Math.round((n / total) * 100) : 0;
        return (
          <li key={key}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium text-zvv-ink">{ABSENCE_REASON_LABELS_NL[key]}</span>
              <span className="tabular-nums text-zvv-muted">{n}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zvv-card-mid">
              <div
                className="h-full rounded-full bg-zvv-primary/80 motion-safe:transition-[width] motion-safe:duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
