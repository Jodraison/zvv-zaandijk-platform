import { ABSENCE_REASON_LABELS_NL } from "@/lib/training/absence-reason";
import {
  recentRegisteredMoments,
  shortTrainingDayLabel,
  type PlayerTrainingSessionMoment,
} from "@/lib/training/training-performance";
import { cn } from "@/lib/utils";

function SessionChip({ moment }: { moment: PlayerTrainingSessionMoment }) {
  const day = shortTrainingDayLabel(moment.dateKey);
  if (moment.attended) {
    return (
      <li
        data-session-id={moment.session_id}
        data-attended="true"
        className="flex items-center gap-1.5 rounded-lg bg-emerald-50/90 px-2 py-1.5 text-[11px] text-emerald-950"
      >
        <span aria-hidden className="font-bold text-emerald-700">
          ✓
        </span>
        <span className="tabular-nums font-semibold uppercase tracking-wide">{day}</span>
        <span className="sr-only">Aanwezig</span>
      </li>
    );
  }
  const reason = moment.absenceReason ?? "no_reason";
  return (
    <li
      data-session-id={moment.session_id}
      data-attended="false"
      data-absence-reason={reason}
      className={cn(
        "rounded-lg px-2 py-1.5 text-[11px] leading-tight",
        reason === "no_reason" ? "bg-amber-50 text-amber-950" : "bg-slate-100 text-zvv-ink",
      )}
    >
      <span className="block tabular-nums font-semibold uppercase tracking-wide">{day}</span>
      <span className="mt-0.5 block font-semibold">{ABSENCE_REASON_LABELS_NL[reason]}</span>
    </li>
  );
}

export function PlayerAttendanceSessionChips({ sessions }: { sessions: PlayerTrainingSessionMoment[] }) {
  const { visible, hidden } = recentRegisteredMoments(sessions);
  if (!visible.length) return null;
  return (
    <div data-testid="player-recent-sessions" className="mt-3 border-t border-zvv-border/60 pt-2.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zvv-muted">Laatste trainingen</p>
      <ul className="mt-2 grid grid-cols-2 gap-1.5 xl:grid-cols-3">
        {visible.map((m) => (
          <SessionChip key={m.session_id} moment={m} />
        ))}
      </ul>
      {hidden.length > 0 ? (
        <details className="mt-2">
          <summary
            data-testid="player-history-expand"
            className="cursor-pointer text-xs font-semibold text-zvv-primary"
          >
            + {hidden.length} eerdere trainingen
          </summary>
          <ul className="mt-2 grid grid-cols-2 gap-1.5 xl:grid-cols-3">
            {hidden.map((m) => (
              <SessionChip key={m.session_id} moment={m} />
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
