import { PlayerPhotoAvatar } from "@/components/players/player-photo-avatar";
import { PlayerAttendanceSessionChips } from "@/components/training/player-attendance-session-chips";
import type {
  PublicPlayerAttendanceRow,
  PublicPlayerTrainingCardModel,
  TrainerPlayerTrainingCardModel,
} from "@/lib/training/training-performance";
import { cn } from "@/lib/utils";

export function attendanceSessionCountLabel(present: number, total: number): string {
  return `${present} van ${total} trainingen`;
}

export function PlayerAttendanceRank({
  rows,
  trainerView = false,
}: {
  rows: Array<PublicPlayerTrainingCardModel | TrainerPlayerTrainingCardModel>;
  trainerView?: boolean;
}) {
  if (!rows.length) {
    return <p className="text-sm text-zvv-muted">Nog geen aanwezigheidsdata.</p>;
  }
  return (
    <ol
      data-testid="attendance-rank-grid"
      data-layout="cards"
      data-trainer-view={trainerView ? "true" : "false"}
      className="grid grid-cols-1 gap-3 md:grid-cols-2"
    >
      {rows.map((row, i) => {
        const rank = i + 1;
        const sessions = trainerView ? trainerSessions(row) : null;
        return (
          <li
            key={row.player_id}
            data-player-id={row.player_id}
            data-player-name={row.name}
            data-rank={rank}
            data-pct={row.pct}
            className={cn(
              "rounded-2xl border bg-white px-3.5 py-3 shadow-sm",
              rank <= 3 ? "border-zvv-primary/25" : "border-zvv-border",
            )}
          >
            <div className="flex items-center gap-3">
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
                className="h-14 w-14 md:h-16 md:w-16"
                sizes="64px"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold leading-tight text-zvv-ink md:text-[15px]">{row.name}</p>
                <p className="mt-0.5 truncate text-xs text-zvv-muted">
                  {row.shirt_number != null ? `#${row.shirt_number} · ` : null}
                  {attendanceSessionCountLabel(row.present, row.total)}
                </p>
                <div className="mt-1.5 h-1.5 max-w-[9rem] overflow-hidden rounded-full bg-zvv-card-mid">
                  <div
                    className="h-full rounded-full bg-zvv-primary motion-safe:transition-[width] motion-safe:duration-700"
                    style={{ width: `${Math.min(100, row.pct)}%` }}
                  />
                </div>
              </div>
              <p className="shrink-0 font-[family-name:var(--font-display)] text-[1.7rem] leading-none tracking-wide text-zvv-primary md:text-3xl">
                {row.pct}%
              </p>
            </div>
            {sessions ? <PlayerAttendanceSessionChips sessions={sessions} /> : null}
          </li>
        );
      })}
    </ol>
  );
}

function trainerSessions(row: PublicPlayerAttendanceRow): TrainerPlayerTrainingCardModel["recentSessions"] | null {
  if (!("recentSessions" in row) || !Array.isArray(row.recentSessions)) return null;
  return row.recentSessions;
}
