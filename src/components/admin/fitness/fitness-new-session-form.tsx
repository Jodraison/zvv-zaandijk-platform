"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createFitnessSessionAction } from "@/actions/fitness-protocol";

export function FitnessNewSessionForm({
  seasonId,
  defaultDate,
  startStation = "sprint",
}: {
  seasonId: string;
  defaultDate: string;
  startStation?: "sprint" | "agility" | "plank" | "run";
}) {
  const router = useRouter();
  const [testOn, setTestOn] = useState(defaultDate);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const q = `?season=${encodeURIComponent(seasonId)}`;

  return (
    <form
      className="space-y-4 rounded-2xl border border-zvv-border bg-white p-5"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        setExistingId(null);
        startTransition(async () => {
          const res = await createFitnessSessionAction({
            season_id: seasonId,
            test_on: testOn,
            note: note || null,
          });
          if (!res.ok) {
            setError(res.error);
            if (res.existingSessionId) setExistingId(res.existingSessionId);
            return;
          }
          // Direct naar gekozen station — geen doodlopende hub zonder invoer
          router.push(`/beheer/fitheid/${res.sessionId}/station/${startStation}${q}`);
          router.refresh();
        });
      }}
    >
      <label className="block space-y-2">
        <span className="text-sm font-medium text-zvv-muted">Testdatum</span>
        <input
          type="date"
          required
          value={testOn}
          onChange={(e) => setTestOn(e.target.value)}
          className="min-h-11 w-full max-w-xs rounded-xl border border-zvv-border bg-white px-3 text-base"
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-zvv-muted">Notitie (optioneel)</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          className="min-h-[88px] w-full rounded-xl border border-zvv-border bg-white px-3 py-2 text-base"
          placeholder="Bijv. eerste meting seizoen"
        />
      </label>
      {error ? (
        <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950" role="alert">
          <p>{error}</p>
          {existingId ? (
            <Link href={`/beheer/fitheid/${existingId}${q}`} className="font-semibold text-zvv-primary underline">
              Open bestaand testmoment
            </Link>
          ) : null}
        </div>
      ) : null}
      <button type="submit" disabled={pending} className="club-btn-primary disabled:opacity-60">
        {pending ? "Aanmaken…" : "Concept aanmaken en openen"}
      </button>
    </form>
  );
}
