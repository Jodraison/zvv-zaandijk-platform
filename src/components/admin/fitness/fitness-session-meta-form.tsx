"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteFitnessDraftSessionAction,
  updateFitnessSessionMetaAction,
} from "@/actions/fitness-protocol";

export function FitnessSessionMetaForm({
  sessionId,
  seasonId,
  initialTestOn,
  initialNote,
  canDelete,
}: {
  sessionId: string;
  seasonId: string;
  initialTestOn: string;
  initialNote: string | null;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [testOn, setTestOn] = useState(initialTestOn);
  const [note, setNote] = useState(initialNote ?? "");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const q = `?season=${encodeURIComponent(seasonId)}`;

  return (
    <div className="rounded-2xl border border-zvv-border bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-zvv-ink">Testmoment</p>
          <p className="text-sm text-zvv-muted">Datum en notitie wijzigen. De hele site volgt deze datum.</p>
        </div>
        <button
          type="button"
          className="club-btn-secondary club-btn-primary-sm"
          onClick={() => {
            setOpen((v) => !v);
            setError(null);
            setMessage(null);
          }}
        >
          Testmoment wijzigen
        </button>
      </div>

      {open ? (
        <form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            setMessage(null);
            startTransition(async () => {
              const res = await updateFitnessSessionMetaAction({
                session_id: sessionId,
                test_on: testOn,
                note: note || null,
              });
              if (!res.ok) {
                setError(res.error);
                return;
              }
              setMessage(res.message ?? "Opgeslagen.");
              router.refresh();
            });
          }}
        >
          <label className="block max-w-xs space-y-2">
            <span className="text-sm font-medium text-zvv-muted">Testdatum</span>
            <input
              type="date"
              required
              value={testOn}
              onChange={(e) => setTestOn(e.target.value)}
              className="min-h-11 w-full rounded-xl border border-zvv-border bg-white px-3 text-base"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-zvv-muted">Notitie</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              className="min-h-[88px] w-full rounded-xl border border-zvv-border bg-white px-3 py-2 text-base"
            />
          </label>
          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              {message}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={pending} className="club-btn-primary disabled:opacity-60">
              {pending ? "Opslaan…" : "Datum opslaan"}
            </button>
            {canDelete ? (
              <button
                type="button"
                disabled={pending}
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-100 disabled:opacity-40"
                onClick={() => {
                  if (!confirm("Concept-testmoment verwijderen? Resultaten van dit concept verdwijnen.")) return;
                  setError(null);
                  startTransition(async () => {
                    const res = await deleteFitnessDraftSessionAction(sessionId);
                    if (!res.ok) {
                      setError(res.error);
                      return;
                    }
                    router.push(`/beheer/fitheid${q}`);
                    router.refresh();
                  });
                }}
              >
                Testmoment verwijderen
              </button>
            ) : null}
          </div>
        </form>
      ) : null}
    </div>
  );
}
