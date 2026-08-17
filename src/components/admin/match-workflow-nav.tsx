"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  MATCH_WORKFLOW_STEPS,
  matchWorkflowHref,
  type MatchWorkflowStepId,
} from "@/lib/match/match-workflow-steps";

export type { MatchWorkflowStepId };
export { MATCH_WORKFLOW_STEPS, parseMatchWorkflowStep } from "@/lib/match/match-workflow-steps";

export function MatchWorkflowNav({
  matchId,
  seasonId,
  active,
  status,
  lineupConfirmed,
}: {
  matchId: string;
  seasonId: string;
  active: MatchWorkflowStepId;
  status: string;
  lineupConfirmed?: boolean;
}) {
  const planned = status !== "played";
  const done: Record<MatchWorkflowStepId, boolean> = {
    wedstrijd: true,
    opstelling: !!lineupConfirmed,
    "na-de-wedstrijd": status === "played",
    controle: status === "played",
  };

  return (
    <nav aria-label="Wedstrijdstappen" className="overflow-x-auto">
      <ol className="flex min-w-max gap-1 rounded-2xl border border-zvv-border bg-white p-1.5">
        {MATCH_WORKFLOW_STEPS.map((step) => {
          const isActive = active === step.id;
          const later =
            planned && (step.id === "na-de-wedstrijd" || step.id === "controle") && !isActive;
          const finishExtra =
            step.id === "na-de-wedstrijd" && planned ? { finish: "1" } : undefined;
          const href = matchWorkflowHref(matchId, seasonId, step.id, finishExtra);
          const label =
            later && step.id === "na-de-wedstrijd"
              ? "Na de wedstrijd — later"
              : later && step.id === "controle"
                ? "Controleren — later"
                : step.label;

          return (
            <li key={step.id}>
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition",
                  isActive
                    ? "bg-zvv-primary text-white"
                    : later
                      ? "text-zvv-muted opacity-70 hover:opacity-100"
                      : "text-zvv-ink hover:bg-zvv-primary-muted",
                )}
                title={
                  later
                    ? "Beschikbaar na de wedstrijd of via Wedstrijd afronden"
                    : undefined
                }
              >
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                    isActive ? "bg-white/20" : done[step.id] ? "bg-emerald-100 text-emerald-800" : "bg-zvv-card-mid",
                  )}
                >
                  {done[step.id] && !isActive ? "✓" : step.short}
                </span>
                <span className="hidden sm:inline">{label}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
