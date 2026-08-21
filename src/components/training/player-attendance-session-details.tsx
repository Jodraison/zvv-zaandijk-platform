import { ABSENCE_REASON_LABELS_NL } from "@/lib/training/absence-reason";
import { shortTrainingDayLabel, type PlayerTrainingSessionMoment } from "@/lib/training/training-performance";
import { cn } from "@/lib/utils";

export function PlayerAttendanceSessionDetails({ sessions }: { sessions: PlayerTrainingSessionMoment[] }) {
  if (!sessions.length) return null;
  return (
    <details data-testid="player-session-details" className="mt-2.5 border-t border-zvv-border/60 pt-2">
      <summary className="cursor-pointer text-xs font-semibold text-zvv-primary">
        Bekijk {sessions.length} trainingen
      </summary>
      <ul className="mt-2 space-y-1">
        {sessions.map((moment) => {
          const day = shortTrainingDayLabel(moment.dateKey);
          if (moment.attended) {
            return (
              <li
                key={moment.session_id}
                data-session-id={moment.session_id}
                data-attended="true"
                className="flex items-center justify-between gap-3 text-xs"
              >
                <span className="tabular-nums font-semibold uppercase tracking-wide text-zvv-ink">{day}</span>
                <span className="font-medium text-emerald-800">✓ Aanwezig</span>
              </li>
            );
          }
          const reason = moment.absenceReason ?? "no_reason";
          return (
            <li
              key={moment.session_id}
              data-session-id={moment.session_id}
              data-attended="false"
              data-absence-reason={reason}
              className="flex items-center justify-between gap-3 text-xs"
            >
              <span className="tabular-nums font-semibold uppercase tracking-wide text-zvv-ink">{day}</span>
              <span className={cn("font-semibold", reason === "no_reason" ? "text-zvv-muted" : "text-zvv-ink")}>
                {ABSENCE_REASON_LABELS_NL[reason]}
              </span>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
