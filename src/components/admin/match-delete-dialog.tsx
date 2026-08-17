"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteMatchAdminAction } from "@/actions/match-admin";
import { formatKickoffLongNl } from "@/lib/utils/format-date";
import { TEAM_DISPLAY_LABEL } from "@/constants/club";

export function MatchDeleteDialog({
  matchId,
  opponent,
  kickoffAt,
  status,
  hasStats,
  seasonId,
  triggerClassName,
  triggerLabel = "Wedstrijd verwijderen",
}: {
  matchId: string;
  opponent: string;
  kickoffAt: string;
  status: string;
  /** goals/events/played → strengere bevestiging */
  hasStats: boolean;
  seasonId: string;
  triggerClassName?: string;
  triggerLabel?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const strict = status === "played" || hasStats;
  const expected = useMemo(() => opponent.trim() || "VERWIJDEREN", [opponent]);
  const canSubmit = !strict || confirmText.trim() === expected || confirmText.trim() === "VERWIJDEREN";

  const onDelete = () => {
    if (!canSubmit) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteMatchAdminAction(matchId);
      if (!res.ok) {
        setError(res.error ?? "Verwijderen mislukt.");
        return;
      }
      setOpen(false);
      router.push(`/beheer/wedstrijden?season=${encodeURIComponent(seasonId)}`);
      router.refresh();
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          triggerClassName ??
          "rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-100"
        }
      >
        {triggerLabel}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="match-delete-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-zvv-border bg-white p-5 shadow-xl">
            <h2 id="match-delete-title" className="font-[family-name:var(--font-display)] text-2xl text-zvv-ink">
              Wedstrijd verwijderen?
            </h2>
            <p className="mt-3 text-sm font-semibold text-zvv-ink">
              {TEAM_DISPLAY_LABEL} – {opponent}
            </p>
            <p className="mt-1 text-sm text-zvv-muted">{formatKickoffLongNl(kickoffAt)}</p>

            {strict ? (
              <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950">
                Deze wedstrijd bevat uitslagen of statistieken. Verwijderen past ook doelpunten, assists, MVP, ranglijsten en
                speelstersprofielen aan.
              </p>
            ) : (
              <p className="mt-4 text-sm text-zvv-muted">
                Deze wedstrijd, de opstelling en eventuele wedstrijdselectie worden verwijderd.
              </p>
            )}

            {strict ? (
              <label className="mt-4 block text-xs font-semibold text-zvv-muted">
                Typ de tegenstander of VERWIJDEREN ter bevestiging
                <input
                  className="mt-1 min-h-11 w-full rounded-lg border border-zvv-border px-3 text-sm text-zvv-ink"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  autoComplete="off"
                />
              </label>
            ) : null}

            {error ? <p className="mt-3 text-sm font-medium text-red-700">{error}</p> : null}

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setOpen(false);
                  setConfirmText("");
                  setError(null);
                }}
                className="club-btn-secondary club-btn-primary-sm"
              >
                Annuleren
              </button>
              <button
                type="button"
                disabled={pending || !canSubmit}
                onClick={onDelete}
                className="rounded-xl border border-red-300 bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40"
              >
                {pending ? "Verwijderen…" : "Verwijderen"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
