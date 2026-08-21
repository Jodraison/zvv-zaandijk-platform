"use client";

import { useMemo, useState } from "react";
import { PlayerPhotoAvatar } from "@/components/players/player-photo-avatar";
import { AbsenceCategoryBars } from "@/components/training/absence-category-bars";
import { attendanceSessionCountLabel } from "@/components/training/player-attendance-rank";
import {
  ABSENCE_REASON_LABELS_NL,
  ABSENCE_REASONS,
  type AbsenceReason,
} from "@/lib/training/absence-reason";
import {
  recentRegisteredMoments,
  shortTrainingDayLabel,
  type AdminPlayerAttendanceDetail,
  type PlayerTrainingSessionMoment,
} from "@/lib/training/training-performance";
import { cn } from "@/lib/utils";

type PctBand = "all" | "100" | "75-99" | "50-74" | "lt50";

const PCT_FILTERS: { id: PctBand; label: string }[] = [
  { id: "all", label: "Alle speelsters" },
  { id: "100", label: "100%" },
  { id: "75-99", label: "75–99%" },
  { id: "50-74", label: "50–74%" },
  { id: "lt50", label: "<50%" },
];

function matchesPctBand(pct: number, total: number, band: PctBand): boolean {
  if (band === "all") return true;
  if (total === 0) return false;
  if (band === "100") return pct >= 100;
  if (band === "75-99") return pct >= 75 && pct < 100;
  if (band === "50-74") return pct >= 50 && pct < 75;
  return pct < 50;
}

function SessionChip({ moment }: { moment: PlayerTrainingSessionMoment }) {
  const day = shortTrainingDayLabel(moment.dateKey);
  if (moment.attended) {
    return (
      <li
        data-session-id={moment.session_id}
        data-attended="true"
        className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2 py-1.5 text-xs text-emerald-900"
      >
        <span className="tabular-nums font-medium">{day}</span>
        <span aria-hidden className="font-bold text-emerald-700">
          ✓
        </span>
        <span className="sr-only">Aanwezig</span>
      </li>
    );
  }
  const reason = moment.absenceReason ?? "no_reason";
  const label = ABSENCE_REASON_LABELS_NL[reason];
  return (
    <li
      data-session-id={moment.session_id}
      data-attended="false"
      data-absence-reason={reason}
      className={cn(
        "rounded-lg px-2 py-1.5 text-xs leading-tight",
        reason === "no_reason" ? "bg-amber-50 text-amber-950" : "bg-zvv-card-mid text-zvv-ink",
      )}
    >
      <span className="tabular-nums font-medium">{day}</span>
      <span className="mt-0.5 block font-semibold">{label}</span>
    </li>
  );
}

function PlayerHistoryTimeline({ sessions }: { sessions: PlayerTrainingSessionMoment[] }) {
  const { visible, hidden } = recentRegisteredMoments(sessions);
  const [open, setOpen] = useState(false);
  const shown = open ? [...hidden, ...visible] : visible;
  return (
    <div data-testid="player-history-timeline">
      <ul className="mt-3 grid grid-cols-2 gap-1.5">
        {shown.map((m) => (
          <SessionChip key={m.session_id} moment={m} />
        ))}
      </ul>
      {hidden.length > 0 ? (
        <button
          type="button"
          data-testid="player-history-expand"
          onClick={() => setOpen((v) => !v)}
          className="mt-2 text-xs font-semibold text-zvv-primary underline-offset-2 hover:underline"
        >
          {open ? "Laatste momenten tonen" : "Volledige historie bekijken"}
        </button>
      ) : null}
    </div>
  );
}

export function AdminPlayerAttendanceExplain({
  rows,
  absenceTotals,
  withoutReasonCount = 0,
}: {
  rows: AdminPlayerAttendanceDetail[];
  absenceTotals?: Record<AbsenceReason, number>;
  withoutReasonCount?: number;
}) {
  const [band, setBand] = useState<PctBand>("all");
  const [reason, setReason] = useState<AbsenceReason | "all">("all");

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (!matchesPctBand(row.pct, row.total, band)) return false;
      if (reason !== "all" && row.reasons[reason] <= 0) return false;
      return true;
    });
  }, [rows, band, reason]);

  return (
    <div className="space-y-6">
      <section
        data-testid="admin-player-attendance-explain"
        className="rounded-2xl border border-zvv-border bg-white p-5 shadow-sm"
      >
        <p className="club-page-eyebrow">Speelsters</p>
        <h3 className="mt-1 font-[family-name:var(--font-display)] text-2xl tracking-wide text-zvv-ink">
          Aanwezigheid & redenen
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-zvv-muted">
          Per speelster: percentage, aanwezige trainingen en de reden bij ieder gemist moment. Alleen zichtbaar in
          beheer.
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5" data-testid="player-explain-filters">
          {PCT_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setBand(f.id)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-semibold",
                band === f.id
                  ? "border-zvv-primary bg-zvv-primary text-white"
                  : "border-zvv-border bg-white text-zvv-ink",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setReason("all")}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-semibold",
              reason === "all" ? "border-zvv-ink bg-zvv-ink text-white" : "border-zvv-border bg-white text-zvv-muted",
            )}
          >
            Alle redenen
          </button>
          {ABSENCE_REASONS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setReason(key)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-semibold",
                reason === key
                  ? "border-zvv-ink bg-zvv-ink text-white"
                  : "border-zvv-border bg-white text-zvv-muted",
              )}
            >
              {key === "injured"
                ? "Met blessure"
                : key === "sick"
                  ? "Met ziekte"
                  : key === "work_school"
                    ? "Met werk/school"
                    : key === "vacation"
                      ? "Met vakantie"
                      : key === "private"
                        ? "Met privé"
                        : "Zonder reden"}
            </button>
          ))}
        </div>

        <p className="mt-3 text-xs text-zvv-muted">
          {filtered.length} van {rows.length} speelsters · {withoutReasonCount} momenten zonder reden
        </p>

        {filtered.length ? (
          <ol
            data-testid="admin-player-explain-grid"
            className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2"
          >
            {filtered.map((row, i) => {
              const rank = rows.findIndex((r) => r.player_id === row.player_id) + 1;
              return (
                <li
                  key={row.player_id}
                  data-player-id={row.player_id}
                  data-player-name={row.name}
                  data-pct={row.pct}
                  className="rounded-2xl border border-zvv-border bg-gradient-to-br from-white to-zvv-card-mid/25 px-3.5 py-3 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-5 shrink-0 pt-1 text-right text-xs font-bold tabular-nums text-zvv-muted">
                      {rank || i + 1}
                    </span>
                    <PlayerPhotoAvatar
                      playerId={row.player_id}
                      name={row.name}
                      photoUrl={row.photo_url}
                      shirtNumber={row.shirt_number}
                      className="h-12 w-12"
                      sizes="48px"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold leading-tight text-zvv-ink">{row.name}</p>
                      <p className="mt-0.5 text-xs text-zvv-muted">
                        {row.shirt_number != null ? `#${row.shirt_number} · ` : null}
                        {attendanceSessionCountLabel(row.present, row.total)}
                      </p>
                    </div>
                    <p className="shrink-0 font-[family-name:var(--font-display)] text-2xl leading-none tracking-wide text-zvv-primary">
                      {row.pct}%
                    </p>
                  </div>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-zvv-card-mid">
                    <div
                      className="h-full rounded-full bg-zvv-primary motion-safe:transition-[width] motion-safe:duration-700"
                      style={{ width: `${Math.min(100, row.pct)}%` }}
                    />
                  </div>
                  <PlayerHistoryTimeline sessions={row.sessions} />
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="mt-4 text-sm text-zvv-muted">Geen speelsters in dit filter.</p>
        )}
      </section>

      {absenceTotals ? (
        <section
          data-testid="admin-team-reasons-secondary"
          className="rounded-2xl border border-zvv-border bg-zvv-card-mid/20 p-5 shadow-sm"
        >
          <p className="club-page-eyebrow">Teamanalyse</p>
          <h3 className="mt-1 font-[family-name:var(--font-display)] text-2xl tracking-wide text-zvv-ink">
            Redenen dit seizoen
          </h3>
          <p className="mt-1 text-sm text-zvv-muted">
            Secundair. Teamtotalen — waarom het team trainingen mist. Individuele uitleg staat in de kaarten hierboven.
          </p>
          <div className="mt-4">
            <AbsenceCategoryBars counts={absenceTotals} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
