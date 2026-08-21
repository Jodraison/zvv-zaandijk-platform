"use client";

import { useState } from "react";
import { PlayerPhotoAvatar } from "@/components/players/player-photo-avatar";
import { ABSENCE_REASONS, ABSENCE_REASON_LABELS_NL } from "@/lib/training/absence-reason";
import { attendanceTierLabelNl, type AdminPlayerAttendanceDetail } from "@/lib/training/training-performance";
import { cn } from "@/lib/utils";

export function AdminPlayerAbsenceDetailList({ rows }: { rows: AdminPlayerAttendanceDetail[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <ol className="divide-y divide-zvv-border">
      {rows.map((row, i) => {
        const open = openId === row.player_id;
        return (
          <li key={row.player_id}>
            <button
              type="button"
              onClick={() => setOpenId(open ? null : row.player_id)}
              className="flex w-full items-center gap-3 py-3 text-left"
            >
              <span className="w-6 shrink-0 text-right text-xs font-bold tabular-nums text-zvv-muted">{i + 1}</span>
              <PlayerPhotoAvatar
                playerId={row.player_id}
                name={row.name}
                photoUrl={row.photo_url}
                shirtNumber={row.shirt_number}
                className="h-9 w-9"
                sizes="36px"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-zvv-ink">
                  {row.shirt_number != null ? <span className="mr-1 text-zvv-muted">#{row.shirt_number}</span> : null}
                  {row.name}
                </p>
                <p className="text-[11px] text-zvv-muted">{attendanceTierLabelNl(row.tier)}</p>
              </div>
              <p className="shrink-0 text-sm tabular-nums font-semibold text-zvv-ink">
                {row.present}/{row.total} · {row.pct}%
              </p>
            </button>
            {open ? (
              <div className="mb-3 ml-9 rounded-xl border border-zvv-border bg-zvv-card-mid/40 px-3 py-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zvv-muted">Speelsterdetail</p>
                <p className="mt-1 text-sm text-zvv-ink">
                  Aanwezig {row.present} · Afwezig {row.absent}
                </p>
                <ul className="mt-2 space-y-1 text-sm">
                  {ABSENCE_REASONS.map((key) => (
                    <li key={key} className="flex justify-between gap-3">
                      <span className="text-zvv-muted">{ABSENCE_REASON_LABELS_NL[key]}</span>
                      <span className="tabular-nums font-medium text-zvv-ink">{row.reasons[key]}</span>
                    </li>
                  ))}
                </ul>
                <p className={cn("mt-2 text-xs font-semibold", row.withoutReasonCount ? "text-amber-800" : "text-zvv-muted")}>
                  Zonder reden: {row.withoutReasonCount}
                </p>
              </div>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
