import {
  ABSENCE_REASONS,
  ABSENCE_REASON_LABELS_NL,
  formatAbsenceMomentsAndPlayers,
  type AbsenceReason,
} from "@/lib/training/absence-reason";
import type { AbsenceReasonMetric, TeamAbsenceAnalysis } from "@/lib/training/training-performance";

function metricsFromCounts(counts: Record<AbsenceReason, number>): Record<AbsenceReason, AbsenceReasonMetric> {
  return {
    private: { moments: counts.private, uniquePlayers: 0 },
    sick: { moments: counts.sick, uniquePlayers: 0 },
    injured: { moments: counts.injured, uniquePlayers: 0 },
    work_school: { moments: counts.work_school, uniquePlayers: 0 },
    vacation: { moments: counts.vacation, uniquePlayers: 0 },
    no_reason: { moments: counts.no_reason, uniquePlayers: 0 },
  };
}

export function AbsenceCategoryBars({
  counts,
  analysis,
}: {
  counts?: Record<AbsenceReason, number>;
  analysis?: TeamAbsenceAnalysis;
}) {
  const byReason = analysis?.byReason ?? (counts ? metricsFromCounts(counts) : null);
  if (!byReason) return null;
  const total = ABSENCE_REASONS.reduce((n, k) => n + byReason[k].moments, 0);
  return (
    <ul className="space-y-2.5" data-testid="absence-analysis-rows">
      {ABSENCE_REASONS.map((key) => {
        const row = byReason[key];
        const pct = total ? Math.round((row.moments / total) * 100) : 0;
        return (
          <li key={key} data-reason={key}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium text-zvv-ink">{ABSENCE_REASON_LABELS_NL[key]}</span>
              <span className="text-right text-xs tabular-nums text-zvv-muted">
                {formatAbsenceMomentsAndPlayers(row.moments, row.uniquePlayers)}
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zvv-card-mid">
              <div className="h-full rounded-full bg-zvv-primary/80" style={{ width: `${pct}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
