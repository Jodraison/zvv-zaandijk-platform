"use client";

import Link from "next/link";
import { AcademyPrimaryCta } from "@/components/academie/academy-primary-cta";
import { SessionTacticalPreview } from "@/components/decision-lab/session-tactical-preview";
import {
  nextSessionPlayerCopy,
  type CanonicalLearnerModel,
} from "@/lib/decision-lab/academy-visibility";
import { getBlokForSession, listDecisionLabBlokken } from "@/lib/decision-lab/missions";
import { GS_SEEKS } from "@/lib/decision-lab/gs-timings";
import { listDecisionLabSessions } from "@/lib/decision-lab/session-catalog";
import type { DecisionLabProgressMap } from "@/lib/decision-lab/progress";

const GOLDEN_ID = "FDL-GS-INSIDE-CLOSE-RB-PRESS-V1";

function learningPhaseLabel(progress: DecisionLabProgressMap): string {
  const blokken = listDecisionLabBlokken();
  if (Object.keys(progress).length === 0) return "Druk herkennen";
  for (const blok of blokken) {
    const allDone = blok.sessions.every((s) => progress[s.id]?.status === "completed");
    if (!allDone) return blok.title;
  }
  return "Decision Lab afgerond";
}

/** Returning-user compact dashboard (C-009) — distinct from first-use. */
export function AcademyReturningDashboard({
  model,
  progress,
  hydrated,
}: {
  model: CanonicalLearnerModel;
  progress: DecisionLabProgressMap;
  hydrated: boolean;
}) {
  const sessions = listDecisionLabSessions();
  const primary = model.primary!;
  const blok = getBlokForSession(primary);
  const fdlCompleted = sessions.filter((s) => progress[s.id]?.status === "completed").length;
  const fdlPct = sessions.length ? Math.round((fdlCompleted / sessions.length) * 100) : 0;
  const phase = learningPhaseLabel(progress);
  const previewSeek = primary.id === GOLDEN_ID ? GS_SEEKS.previewOpening : undefined;

  return (
    <div className="w-full space-y-8 md:space-y-10" data-testid="academy-returning">
      <section className="overflow-hidden rounded-[1.75rem] bg-zvv-night text-white shadow-zvv-hero">
        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
          <div className="flex flex-col justify-between gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200/90">
                Football Academy
              </p>
              <p
                className="mt-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-blue-50"
                data-testid="academy-status-label"
              >
                {model.statusLabel}
              </p>
              <h1 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.75rem,4vw,2.5rem)] leading-[1.02] tracking-wide">
                {primary.playerTitle}
              </h1>
              <p className="mt-2 text-base text-blue-100/85" data-testid="academy-status-detail">
                {model.statusDetail}
              </p>
              <p className="mt-2 text-sm text-blue-100/70">
                Decision Lab · {blok?.title ?? "Trainingsblok"} · {primary.primaryRole}
              </p>
              {model.resumeStageLabel ? (
                <p className="mt-2 text-sm font-medium text-blue-50">
                  Huidige stap: {model.resumeStageLabel}
                </p>
              ) : null}
            </div>
            <AcademyPrimaryCta
              href={`/academie/decision-lab/${primary.slug}`}
              label={model.ctaLabel}
              icon={model.state === "opened" ? "play" : model.ctaLabel.includes("volgende") ? "next" : "continue"}
              tone="on-dark"
              durationHint={`${primary.durationMin}–${primary.durationMax} min`}
            />
            {model.showProgress ? (
              <div className="rounded-2xl bg-white/[0.06] px-4 py-3">
                <div className="flex justify-between gap-2 text-sm">
                  <span className="text-blue-100/75">Voortgang Decision Lab</span>
                  <span className="font-semibold">{hydrated ? `${fdlPct}%` : "—"}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-blue-400 transition-[width] duration-700"
                    style={{ width: `${hydrated ? fdlPct : 0}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-blue-100/70">
                  {hydrated ? `${fdlCompleted}/${sessions.length} afgerond · ${phase}` : "Laden…"}
                  {model.statusLabel === "Sessie geopend"
                    ? " · 0% leervoortgang is normaal tot je de eerste situatie start"
                    : null}
                </p>
              </div>
            ) : null}
          </div>
          <SessionTacticalPreview
            situationId={primary.pitch.liveSituationId}
            seekMs={previewSeek}
            className="min-h-[300px] border-white/15 md:min-h-[400px]"
          />
        </div>
      </section>

      {model.showRecommendation && model.recommendation ? (
        <section className="rounded-2xl bg-slate-50 px-5 py-4">
          <p className="text-sm font-medium text-zvv-ink">
            {nextSessionPlayerCopy(model.recommendation, primary)}
          </p>
        </section>
      ) : primary.primaryRole.toLowerCase().includes("links") || /lw/i.test(primary.slug) ? (
        <section className="rounded-2xl bg-slate-50 px-5 py-4">
          <p className="text-sm font-medium text-zvv-ink">
            Je traint nu dezelfde keuze vanaf de linkerflank.
          </p>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-wide text-zvv-ink">
          Decision Lab
        </h2>
        <Link
          href="/academie/decision-lab"
          className="flex items-center justify-between gap-3 rounded-2xl bg-white px-5 py-4 ring-1 ring-zvv-primary/25 transition hover:ring-zvv-primary/45"
        >
          <div>
            <p className="text-lg font-semibold text-zvv-ink">Bekijk je trainingsroute</p>
            <p className="text-sm text-zvv-muted">
              {sessions.length} sessies · {phase}
            </p>
          </div>
          <span className="text-sm font-semibold text-zvv-primary">Open →</span>
        </Link>
      </section>

      {model.showRecent ? (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zvv-muted">
            Laatste sessies
          </h2>
          <ul className="divide-y divide-zvv-border overflow-hidden rounded-2xl bg-white ring-1 ring-zvv-border">
            {model.recent.map(({ s, p }) => (
              <li key={s.id}>
                <Link
                  href={`/academie/decision-lab/${s.slug}`}
                  className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zvv-ink">{s.playerTitle}</p>
                    <p className="text-xs text-zvv-muted">
                      {p.status === "completed" ? "Afgerond" : "Bezig"}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-zvv-primary">
                    {p.status === "completed" ? "Bekijk" : "Ga verder"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-2xl bg-slate-50/70 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-zvv-muted">
          Later in de Academy
        </p>
        <p className="mt-2 text-sm text-zvv-muted">
          Speelwijze, posities en teamprincipes volgen wanneer Decision Lab staat.
        </p>
      </section>
    </div>
  );
}
