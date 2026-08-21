import { PlayerPhotoAvatar } from "@/components/players/player-photo-avatar";
import { AttendanceDonut } from "@/components/training/attendance-donut";
import { PlayerAttendanceSessionDetails } from "@/components/training/player-attendance-session-details";
import {
  isTrainerPlayerCard,
  type PublicPlayerAttendanceRow,
  type PublicPlayerTrainingCardModel,
  type TrainerPlayerTrainingCardModel,
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
      className="grid grid-cols-1 gap-2.5 md:grid-cols-2"
    >
      {rows.map((row, i) => {
        const rank = i + 1;
        const trainer = trainerView ? trainerCard(row) : null;
        return (
          <li
            key={row.player_id}
            data-player-id={row.player_id}
            data-player-name={row.name}
            data-rank={rank}
            data-pct={row.pct}
            className={cn(
              "rounded-2xl border bg-white px-3 py-2.5 shadow-sm",
              rank <= 3 ? "border-zvv-primary/25" : "border-zvv-border",
            )}
          >
            <div className="flex items-center gap-2.5">
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
                {!trainer ? (
                  <div className="mt-1.5 h-1.5 max-w-[9rem] overflow-hidden rounded-full bg-zvv-card-mid">
                    <div
                      className="h-full rounded-full bg-zvv-primary"
                      style={{ width: `${Math.min(100, row.pct)}%` }}
                    />
                  </div>
                ) : null}
              </div>
              {!trainer ? (
                <p className="shrink-0 font-[family-name:var(--font-display)] text-2xl leading-none tracking-wide text-zvv-primary">
                  {row.pct}%
                </p>
              ) : null}
            </div>
            {trainer ? (
              <div className="mt-2.5">
                <AttendanceDonut
                  name={row.name}
                  pct={row.pct}
                  present={row.present}
                  total={row.total}
                  distribution={trainer.distribution}
                />
                <PlayerAttendanceSessionDetails sessions={trainer.recentSessions} />
              </div>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function trainerCard(row: PublicPlayerAttendanceRow): TrainerPlayerTrainingCardModel | null {
  return isTrainerPlayerCard(row) ? row : null;
}
