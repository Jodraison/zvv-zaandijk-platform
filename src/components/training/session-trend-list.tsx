import { formatDateNL } from "@/lib/utils/format-date";
import type { SessionTrendRow } from "@/lib/training/training-performance";

export function SessionTrendList({ rows }: { rows: SessionTrendRow[] }) {
  if (!rows.length) {
    return <p className="text-sm text-zvv-muted">Nog geen geregistreerde trainingen.</p>;
  }
  return (
    <ol className="space-y-3">
      {rows.map((row) => (
        <li key={row.session_id}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="font-semibold uppercase tracking-wide text-zvv-ink">
              {formatDateNL(row.dateKey).replace(/\./g, "")}
            </span>
            <span className="tabular-nums text-zvv-muted">
              {row.present}/{row.total}
              <span className="ml-3 font-semibold text-zvv-ink">{row.pct}%</span>
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-zvv-card-mid">
            <div
              className="h-full rounded-full bg-zvv-primary motion-safe:transition-[width] motion-safe:duration-700"
              style={{ width: `${Math.min(100, row.pct)}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
