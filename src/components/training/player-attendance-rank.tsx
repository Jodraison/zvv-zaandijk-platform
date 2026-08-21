import { PlayerPhotoAvatar } from "@/components/players/player-photo-avatar";
import type { PublicPlayerAttendanceRow } from "@/lib/training/training-performance";
import { cn } from "@/lib/utils";

export function attendanceSessionCountLabel(present: number, total: number): string {
  return `${present} van ${total} trainingen`;
}

export function PlayerAttendanceRank({ rows }: { rows: PublicPlayerAttendanceRow[] }) {
  if (!rows.length) {
    return <p className="text-sm text-zvv-muted">Nog geen aanwezigheidsdata.</p>;
  }
  return (
    <ol
      data-testid="attendance-rank-grid"
      data-layout="cards"
      className="grid grid-cols-1 gap-2 md:grid-cols-2"
    >
      {rows.map((row, i) => {
        const rank = i + 1;
        return (
          <li
            key={row.player_id}
            data-player-id={row.player_id}
            data-rank={rank}
            className={cn(
              "flex items-center gap-3 rounded-2xl border bg-white px-3 py-2.5 shadow-sm",
              rank <= 3 ? "border-zvv-primary/25" : "border-zvv-border",
            )}
          >
            <span
              className={cn(
                "w-5 shrink-0 text-right text-xs font-bold tabular-nums",
                rank <= 3 ? "text-zvv-primary" : "text-zvv-muted",
              )}
            >
              {rank}
            </span>
            <PlayerPhotoAvatar
              playerId={row.player_id}
              name={row.name}
              photoUrl={row.photo_url}
              shirtNumber={row.shirt_number}
              className="h-12 w-12 md:h-14 md:w-14"
              sizes="56px"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold leading-tight text-zvv-ink">{row.name}</p>
              <p className="mt-0.5 truncate text-xs text-zvv-muted">
                {row.shirt_number != null ? `#${row.shirt_number} · ` : null}
                {attendanceSessionCountLabel(row.present, row.total)}
              </p>
              <div className="mt-1.5 h-1.5 max-w-[8.5rem] overflow-hidden rounded-full bg-zvv-card-mid">
                <div
                  className="h-full rounded-full bg-zvv-primary motion-safe:transition-[width] motion-safe:duration-700"
                  style={{ width: `${Math.min(100, row.pct)}%` }}
                />
              </div>
            </div>
            <p className="shrink-0 font-[family-name:var(--font-display)] text-2xl leading-none tracking-wide text-zvv-primary">
              {row.pct}%
            </p>
          </li>
        );
      })}
    </ol>
  );
}
