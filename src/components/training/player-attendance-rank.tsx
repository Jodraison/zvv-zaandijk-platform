import { PlayerPhotoAvatar } from "@/components/players/player-photo-avatar";
import { attendanceTierLabelNl, type PublicPlayerAttendanceRow } from "@/lib/training/training-performance";
import { cn } from "@/lib/utils";

export function PlayerAttendanceRank({ rows }: { rows: PublicPlayerAttendanceRow[] }) {
  if (!rows.length) {
    return <p className="text-sm text-zvv-muted">Nog geen aanwezigheidsdata.</p>;
  }
  return (
    <ol className="divide-y divide-zvv-border">
      {rows.map((row, i) => (
        <li key={row.player_id} className="flex items-center gap-3 py-3">
          <span className="w-6 shrink-0 text-right text-xs font-bold tabular-nums text-zvv-muted">{i + 1}</span>
          <PlayerPhotoAvatar
            playerId={row.player_id}
            name={row.name}
            photoUrl={row.photo_url}
            shirtNumber={row.shirt_number}
            className="h-10 w-10"
            sizes="40px"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <p className="truncate font-semibold text-zvv-ink">
                {row.shirt_number != null ? <span className="mr-1 text-zvv-muted">#{row.shirt_number}</span> : null}
                {row.name}
              </p>
              <p className="shrink-0 tabular-nums text-sm font-semibold text-zvv-ink">
                {row.present} / {row.total}
                <span className="ml-2 text-zvv-primary">{row.pct}%</span>
              </p>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zvv-card-mid">
              <div
                className="h-full rounded-full bg-zvv-primary motion-safe:transition-[width] motion-safe:duration-700"
                style={{ width: `${Math.min(100, row.pct)}%` }}
              />
            </div>
            <p className={cn("mt-1 text-[11px] font-medium uppercase tracking-wider text-zvv-muted")}>
              {attendanceTierLabelNl(row.tier)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
