"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { completeAcademyOnboardingAction } from "@/actions/academy-onboarding";
import { academyRoutes } from "@/lib/academy/routes";
import { cn } from "@/lib/utils";

export type OnboardingProblemOption = {
  id: string;
  slug: string;
  labelPlayer: string;
};

/**
 * S-11 Onboarding Problemen (T-04-01) — max 2 · Start Academy → S-20 + onboarding_complete.
 */
export function AcademyOnboardingProblemenForm({
  problems,
  hasPrimaryPosition,
}: {
  problems: OnboardingProblemOption[];
  hasPrimaryPosition: boolean;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  }

  function onStart() {
    if (pending || selected.length < 1 || !hasPrimaryPosition) return;
    setError(null);
    startTransition(async () => {
      const result = await completeAcademyOnboardingAction({ problemIds: selected });
      if (result && result.ok === false) {
        setError(result.error);
      }
    });
  }

  if (!hasPrimaryPosition) {
    return (
      <div className="mx-auto max-w-md space-y-4 px-4 py-8 md:px-0">
        <h1 className="font-[family-name:var(--font-display)] text-2xl tracking-wide text-zvv-ink">
          Waar loop je tegenaan?
        </h1>
        <p role="alert" className="text-sm text-zvv-muted">
          Kies eerst je positie voordat je problemen selecteert.
        </p>
        <Link
          href={academyRoutes.onboardingPositie}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-zvv-primary px-4 text-sm font-semibold text-white"
        >
          Naar positie
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-8 md:px-0">
      <header className="space-y-2">
        <h1 className="font-[family-name:var(--font-display)] text-2xl tracking-wide text-zvv-ink">
          Waar loop je tegenaan?
        </h1>
        <p className="text-sm text-zvv-muted">Kies max 2 problemen (spelerstaal).</p>
      </header>

      <ul className="space-y-2" aria-label="Problemen">
        {problems.map((p) => {
          const on = selected.includes(p.id);
          const disabled = !on && selected.length >= 2;
          return (
            <li key={p.id}>
              <button
                type="button"
                aria-pressed={on}
                disabled={pending || disabled}
                onClick={() => toggle(p.id)}
                className={cn(
                  "flex min-h-11 w-full items-center rounded-lg border px-3 py-2.5 text-left text-sm font-semibold",
                  on
                    ? "border-zvv-primary bg-zvv-primary/10 text-zvv-ink"
                    : disabled
                      ? "cursor-not-allowed border-zvv-border bg-zvv-muted/20 text-zvv-muted"
                      : "border-zvv-border bg-white text-zvv-ink hover:border-zvv-primary",
                )}
                data-academy-component="ProblemCard"
              >
                {p.labelPlayer}
              </button>
            </li>
          );
        })}
      </ul>

      {error ? (
        <p role="alert" aria-live="assertive" className="text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Link
          href={academyRoutes.onboardingPositie}
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-zvv-border bg-white px-4 text-sm font-semibold text-zvv-ink"
        >
          Terug
        </Link>
        <button
          type="button"
          disabled={selected.length < 1 || pending}
          onClick={onStart}
          className={cn(
            "inline-flex min-h-11 flex-1 items-center justify-center rounded-lg px-4 text-sm font-semibold",
            selected.length < 1 || pending
              ? "cursor-not-allowed bg-zvv-muted/40 text-zvv-muted"
              : "bg-zvv-primary text-white hover:opacity-95",
          )}
          aria-busy={pending}
        >
          {pending ? "Bezig…" : "Start Academy"}
        </button>
      </div>
    </div>
  );
}
