"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { openFitnessSessionCorrectionAction, publishFitnessSessionAction } from "@/actions/fitness-protocol";
import {
  formatMetersNl,
  formatPlankDisplay,
  formatSecondsNl,
} from "@/lib/fitness/parse-values";
import { COMPLETENESS_LABEL, derivePlayerCompleteness, type FitnessResultValues } from "@/lib/fitness/completeness";

type Row = FitnessResultValues & {
  player_id: string;
  name: string;
  shirt_number: number | null;
};

export function FitnessSessionReview({
  sessionId,
  seasonId,
  testOn,
  status,
  rows,
}: {
  sessionId: string;
  seasonId: string;
  testOn: string;
  status: "draft" | "published";
  rows: Row[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const q = `?season=${encodeURIComponent(seasonId)}`;

  const complete = rows.filter((r) => derivePlayerCompleteness(r) === "complete").length;
  const partial = rows.filter((r) => derivePlayerCompleteness(r) === "partial").length;
  const notStarted = rows.filter((r) => derivePlayerCompleteness(r) === "not_started").length;

  return (
    <div className="space-y-5">
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="rounded-xl border border-zvv-border bg-white p-3">
          <p className="text-sm text-zvv-muted">Volledig</p>
          <p className="text-2xl font-semibold text-zvv-ink">{complete}</p>
        </div>
        <div className="rounded-xl border border-zvv-border bg-white p-3">
          <p className="text-sm text-zvv-muted">Gedeeltelijk</p>
          <p className="text-2xl font-semibold text-zvv-ink">{partial}</p>
        </div>
        <div className="rounded-xl border border-zvv-border bg-white p-3">
          <p className="text-sm text-zvv-muted">Niet gestart</p>
          <p className="text-2xl font-semibold text-zvv-ink">{notStarted}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-zvv-border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zvv-border bg-zvv-card-mid/60 text-zvv-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Speelster</th>
              <th className="px-3 py-2 font-medium">Sprint</th>
              <th className="px-3 py-2 font-medium">Agility</th>
              <th className="px-3 py-2 font-medium">Plank</th>
              <th className="px-3 py-2 font-medium">6 min</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.player_id} className="border-b border-zvv-border/70">
                <td className="px-3 py-2 font-medium text-zvv-ink">
                  {r.shirt_number != null ? `#${r.shirt_number} ` : ""}
                  {r.name}
                </td>
                <td className="px-3 py-2">{formatSecondsNl(r.flying_sprint_30m_seconds)}</td>
                <td className="px-3 py-2">{formatSecondsNl(r.agility_10_20_10_seconds)}</td>
                <td className="px-3 py-2">{formatPlankDisplay(r.plank_seconds)}</td>
                <td className="px-3 py-2">{formatMetersNl(r.six_minute_run_meters)}</td>
                <td className="px-3 py-2">{COMPLETENESS_LABEL[derivePlayerCompleteness(r)]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Link href={`/beheer/fitheid/${sessionId}${q}`} className="club-btn-secondary club-btn-primary-sm">
          Terug naar invoer
        </Link>
        {status === "draft" ? (
          <button
            type="button"
            className="club-btn-primary club-btn-primary-sm"
            disabled={pending}
            onClick={() => setConfirmOpen(true)}
          >
            Testmoment definitief maken
          </button>
        ) : (
          <button
            type="button"
            className="club-btn-secondary club-btn-primary-sm"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                const res = await openFitnessSessionCorrectionAction(sessionId);
                if (!res.ok) {
                  setError(res.error);
                  return;
                }
                router.push(`/beheer/fitheid/${sessionId}${q}`);
                router.refresh();
              });
            }}
          >
            Correctie openen
          </button>
        )}
      </div>

      {confirmOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="publish-title"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h2 id="publish-title" className="font-[family-name:var(--font-display)] text-2xl text-zvv-ink">
              Definitief maken?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zvv-muted">
              Testmoment {testOn} wordt vastgelegd. Conceptresultaten verdwijnen uit de bewerkstand. Gedeeltelijke
              resultaten blijven zichtbaar. Je kunt later een correctie openen.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                className="club-btn-primary"
                disabled={pending}
                onClick={() => {
                  startTransition(async () => {
                    const res = await publishFitnessSessionAction(sessionId);
                    if (!res.ok) {
                      setError(res.error);
                      setConfirmOpen(false);
                      return;
                    }
                    router.push(`/beheer/fitheid/${sessionId}/resultaten${q}`);
                    router.refresh();
                  });
                }}
              >
                {pending ? "Bezig…" : "Ja, definitief maken"}
              </button>
              <button type="button" className="club-btn-secondary" onClick={() => setConfirmOpen(false)}>
                Annuleren
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
