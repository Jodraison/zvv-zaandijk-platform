"use client";

import { useState, useTransition } from "react";
import { saveAcademyOnboardingPositieAction } from "@/actions/academy-onboarding";
import { ACADEMY_DEFAULT_EXPERIENCE } from "@/lib/academy/onboarding-metadata";
import { academyRoutes } from "@/lib/academy/routes";
import { cn } from "@/lib/utils";

export type OnboardingPositionOption = {
  id: string;
  slug: string;
  nameNl: string;
  abbrev: string;
};

/**
 * S-10 Onboarding Positie (T-04-01) — PositionCard select · Volgende → S-11.
 */
export function AcademyOnboardingPositieForm({
  positions,
  initialPrimaryId,
  initialSecondaryId,
}: {
  positions: OnboardingPositionOption[];
  initialPrimaryId?: string | null;
  initialSecondaryId?: string | null;
}) {
  const [primaryId, setPrimaryId] = useState<string | null>(initialPrimaryId ?? null);
  const [secondaryId, setSecondaryId] = useState<string | null>(initialSecondaryId ?? null);
  const [experience] = useState(ACADEMY_DEFAULT_EXPERIENCE);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit() {
    if (!primaryId || pending) return;
    setError(null);
    startTransition(async () => {
      const result = await saveAcademyOnboardingPositieAction({
        primaryPositionId: primaryId,
        secondaryPositionId: secondaryId,
        experience,
      });
      if (result && result.ok === false) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-8 md:px-0">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-zvv-muted">Welkom</p>
        <h1 className="font-[family-name:var(--font-display)] text-2xl tracking-wide text-zvv-ink">
          Kies je positie
        </h1>
        <p className="text-sm text-zvv-muted">Primary positie — dit wordt je Academy-home.</p>
      </header>

      <fieldset disabled={pending} className="space-y-2">
        <legend className="sr-only">Primaire positie</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" role="listbox" aria-label="Posities">
          {positions.map((p) => {
            const selected = primaryId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  setPrimaryId(p.id);
                  if (secondaryId === p.id) setSecondaryId(null);
                }}
                className={cn(
                  "min-h-11 rounded-lg border px-3 py-2.5 text-left transition-colors",
                  selected
                    ? "border-zvv-primary bg-zvv-primary/10 text-zvv-ink"
                    : "border-zvv-border bg-white text-zvv-ink hover:border-zvv-primary",
                )}
                data-academy-component="PositionCard"
              >
                <span className="block text-xs font-bold text-zvv-primary">{p.abbrev}</span>
                <span className="block text-sm font-semibold">{p.nameNl}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset disabled={pending || !primaryId} className="space-y-2">
        <legend className="text-sm font-semibold text-zvv-ink">Secondary (optioneel)</legend>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={cn(
              "min-h-11 rounded-lg border px-3 text-sm font-semibold",
              secondaryId === null
                ? "border-zvv-primary bg-zvv-primary/10"
                : "border-zvv-border bg-white",
            )}
            onClick={() => setSecondaryId(null)}
          >
            Overslaan
          </button>
          {positions
            .filter((p) => p.id !== primaryId)
            .map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={secondaryId === p.id}
                className={cn(
                  "min-h-11 rounded-lg border px-3 text-sm font-semibold",
                  secondaryId === p.id
                    ? "border-zvv-primary bg-zvv-primary/10"
                    : "border-zvv-border bg-white",
                )}
                onClick={() => setSecondaryId(p.id)}
              >
                {p.abbrev}
              </button>
            ))}
        </div>
      </fieldset>

      <div className="rounded-lg border border-zvv-border bg-zvv-surface px-3 py-2.5 text-sm text-zvv-ink">
        Ervaring: <strong>4e klasse</strong>
        <span className="sr-only"> ({experience})</span>
      </div>

      {error ? (
        <p role="alert" aria-live="assertive" className="text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        disabled={!primaryId || pending}
        onClick={onSubmit}
        className={cn(
          "inline-flex min-h-11 w-full items-center justify-center rounded-lg px-4 text-sm font-semibold",
          !primaryId || pending
            ? "cursor-not-allowed bg-zvv-muted/40 text-zvv-muted"
            : "bg-zvv-primary text-white hover:opacity-95",
        )}
        aria-busy={pending}
      >
        {pending ? "Bezig…" : "Volgende"}
      </button>

      <p className="text-center text-xs text-zvv-muted">
        Stap 1 van 2 · daarna problemen ·{" "}
        <span className="sr-only">Volgende route {academyRoutes.onboardingProblemen}</span>
      </p>
    </div>
  );
}
