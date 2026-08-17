"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AcademyPrimaryCta } from "@/components/academie/academy-primary-cta";
import { FormationTeachSequence } from "@/components/academie/formation-teach-sequence";
import { PerspectiveSetupStrip } from "@/components/academie/perspective-setup-strip";
import { TacticalPressureDualCard } from "@/components/academie/tactical-pressure-dual-card";
import { TacticalIllustration } from "@/components/academie/tactical-illustration";
import { GS_ORIENTATION } from "@/lib/academie/tactical-canonical-perspective";
import { GS_SEEKS } from "@/lib/decision-lab/films/fdl-gs-inside-close-rb";
import { getDedicatedBundleForSession } from "@/lib/decision-lab/films/dedicated/build-dedicated-films";
import { DEDICATED_FREEZE_MS } from "@/lib/decision-lab/films/dedicated/ids";
import {
  LESSON_FLOW,
  LESSON_STAGES,
  lessonStageIndex,
  resolveLessonStageFromLegacy,
  type LessonStageId,
} from "@/lib/decision-lab/lesson-stages";
import { getDecisionLabSession } from "@/lib/decision-lab/session-catalog";
import { readDecisionLabProgress, upsertSessionProgress } from "@/lib/decision-lab/progress";
import type { DecisionChoiceId, DecisionLabSession } from "@/lib/decision-lab/types";
import { cn } from "@/lib/utils";

export function DecisionLabLessonExperience({ session }: { session: DecisionLabSession }) {
  const [stage, setStage] = useState<LessonStageId>("situation");
  const [choice, setChoice] = useState<DecisionChoiceId | null>(null);
  const [committed, setCommitted] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const isGolden = session.id === "FDL-GS-INSIDE-CLOSE-RB-PRESS-V1";
  const dedicated = getDedicatedBundleForSession(session.id);
  const hasDedicatedFilm = isGolden || Boolean(dedicated);
  const freezeMs = isGolden
    ? GS_SEEKS.freeze
    : (dedicated?.freezeMs ?? DEDICATED_FREEZE_MS);
  const dedicatedPhaseLabel = useMemo((): import("@/lib/academie/tactical-canonical-perspective").TacticalPhaseLabel => {
    const family = dedicated?.def.family ?? "";
    if (family.startsWith("press-")) return "Zij bouwen op";
    if (family === "transition-counter") return "Balverlies";
    if (family === "transition-rest") return "Wij verdedigen";
    if (family === "transition-firstpass") return "Omschakelen";
    if (family.startsWith("build-") || family.startsWith("possession-")) return "Wij bouwen op";
    if (family === "flank-1v1") return "Wij verdedigen";
    if (family === "final-nearpost") return "Wij bouwen op";
    if (session.wave === "opbouw" || session.wave === "balbezit" || session.wave === "aanvallen") {
      return "Wij bouwen op";
    }
    if (session.wave === "omschakeling") return "Omschakelen";
    if (session.wave === "verdedigen") return "Wij verdedigen";
    return "Zij bouwen op";
  }, [dedicated?.def.family, session.wave]);
  const dedicatedCamera =
    dedicated?.def.family.startsWith("build-") ||
    dedicated?.def.family.startsWith("possession-") ||
    dedicated?.def.family.startsWith("flank-") ||
    dedicated?.def.family.startsWith("final-")
      ? ("full" as const)
      : session.wave === "pressing" || hasDedicatedFilm
        ? ("press-detail" as const)
        : ("auto" as const);
  const nextSession = session.nextSessionId ? getDecisionLabSession(session.nextSessionId) : null;
  const idx = lessonStageIndex(stage);

  useEffect(() => {
    const saved = readDecisionLabProgress()[session.id];
    if (saved?.choice) {
      setChoice(saved.choice as DecisionChoiceId);
      setCommitted(true);
    }
    if (saved?.status === "completed") {
      setStage("completion");
      setCommitted(true);
      setHydrated(true);
      return;
    }
    if (saved?.lessonStage || typeof saved?.step === "number") {
      const resolved = resolveLessonStageFromLegacy({
        step: saved.step,
        lessonStage: saved.lessonStage,
        progressVersion: saved.progressVersion,
        status: saved.status,
        choice: saved.choice,
      });
      setStage(resolved);
      if (lessonStageIndex(resolved) >= lessonStageIndex("decision") && saved.choice) {
        setCommitted(true);
      }
    }
    setHydrated(true);
  }, [session.id]);

  const go = useCallback(
    (next: LessonStageId) => {
      setStage(next);
      upsertSessionProgress(session.id, {
        status: next === "completion" ? "completed" : "started",
        lessonStage: next,
        choice: choice ?? undefined,
      });
      requestAnimationFrame(() => {
        document.getElementById(`fdl-stage-${next}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    },
    [session.id, choice],
  );

  const selected = useMemo(
    () => session.choices.find((c) => c.id === choice) ?? null,
    [choice, session.choices],
  );

  const commitChoice = (id: DecisionChoiceId) => {
    if (committed) return;
    setChoice(id);
    setCommitted(true);
    upsertSessionProgress(session.id, {
      status: "started",
      lessonStage: "decision",
      choice: id,
    });
    window.setTimeout(() => go("consequence"), 320);
  };

  const progressPct = Math.round(((idx + (stage === "completion" ? 1 : 0)) / LESSON_FLOW.length) * 100);

  return (
    <div className="mx-auto w-full max-w-[min(96vw,1180px)] space-y-6 pb-28 md:space-y-8" data-testid="lesson-experience">
      {/* Sticky lesson rail */}
      <div className="sticky top-0 z-20 -mx-1 border-b border-zvv-border/70 bg-white/95 px-1 py-2.5 backdrop-blur-md supports-[padding:max(0px)]:pt-[max(0.5rem,env(safe-area-inset-top))]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link
            href="/academie/decision-lab"
            className="text-xs font-semibold text-zvv-muted transition hover:text-zvv-primary"
          >
            ← Decision Lab
          </Link>
          <p className="text-xs font-medium text-zvv-muted">
            {LESSON_STAGES[idx]?.short} · {idx + 1}/{LESSON_FLOW.length}
          </p>
        </div>
        <nav aria-label="Lesstappen" className="mt-3 hidden gap-1 md:flex">
          {LESSON_STAGES.map((s, i) => {
            const active = s.id === stage;
            const done = i < idx;
            return (
              <button
                key={s.id}
                type="button"
                disabled={i > idx}
                onClick={() => {
                  if (i <= idx) go(s.id);
                }}
                className={cn(
                  "min-w-0 flex-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition",
                  active && "bg-zvv-primary text-white",
                  done && !active && "bg-blue-50 text-zvv-primary",
                  !done && !active && "bg-slate-100 text-zvv-muted",
                  i > idx && "opacity-40",
                )}
              >
                {s.short}
              </button>
            );
          })}
        </nav>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 md:hidden">
          <div
            className="h-full rounded-full bg-zvv-primary transition-[width] duration-500"
            style={{ width: `${hydrated ? progressPct : 0}%` }}
          />
        </div>
      </div>

      {/* Header context — always visible at top of view stage */}
      {stage === "situation" ? (
        <section id="fdl-stage-situation" className="scroll-mt-28 space-y-5" data-testid="lesson-stage-situation">
          <header className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zvv-primary">
              Decision Lab · Sessie
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-[clamp(1.85rem,4.5vw,2.75rem)] leading-[0.98] tracking-wide text-zvv-ink">
              {session.playerTitle}
            </h1>
            <p className="max-w-2xl text-base text-zvv-muted">{session.whyItMatters}</p>
            <div className="flex flex-wrap gap-2 text-sm text-zvv-ink">
              <span className="rounded-full bg-slate-100 px-3 py-1 font-medium">{session.primaryRole}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 font-medium">
                {session.durationMin}–{session.durationMax} min
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 font-medium">{session.difficulty}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 font-medium">4-2-3-1</span>
            </div>
          </header>

          {isGolden || hasDedicatedFilm ? <PerspectiveSetupStrip /> : null}

          {isGolden ? (
            <div className="overflow-hidden rounded-[1.5rem] bg-zvv-night p-3 text-white sm:p-4">
              <p className="px-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue-200/85">
                Van 4-2-3-1 naar press
              </p>
              <div className="mt-3">
                <FormationTeachSequence large autoAdvance={false} />
              </div>
            </div>
          ) : null}

          <div className="overflow-hidden rounded-[1.5rem] bg-zvv-night p-4 text-white sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-200/85">
              Bekijk de situatie
            </p>
            <p className="mt-2 text-lg font-semibold">{session.subtitle}</p>
            <div
              className={cn(
                "mt-4 overflow-hidden rounded-2xl border border-white/10 bg-slate-950",
                hasDedicatedFilm ? "min-h-[320px] md:min-h-[480px]" : "min-h-[240px] md:min-h-[340px]",
              )}
            >
              <TacticalIllustration
                situationId={session.pitch.liveSituationId}
                className="w-full [&_figcaption]:hidden"
                autoplay
                cameraMode={dedicatedCamera}
                hierarchyQuiet
                compact={!hasDedicatedFilm}
                showControls
                showLegend={false}
                orientation={
                  isGolden
                    ? GS_ORIENTATION
                    : hasDedicatedFilm
                      ? {
                          phase: dedicatedPhaseLabel,
                          activeRole: dedicated?.activeRole.replace("us.", "") ?? session.primaryRole,
                          showAttackDirection: true,
                          baseFormationNote: "Vanuit 4-2-3-1",
                        }
                      : undefined
                }
                showOrientation={hasDedicatedFilm}
              />
            </div>
            <div className="mt-5">
              <AcademyPrimaryCta
                label="Naar scan"
                icon="continue"
                tone="on-dark"
                durationHint="Stap 2 van 6"
                onClick={() => go("scan")}
                testId="lesson-continue"
              />
            </div>
          </div>
        </section>
      ) : null}

      {stage === "scan" ? (
        <StageCard id="scan" eyebrow="Scan" title={session.scanPrompt}>
          <ol className="grid gap-2 sm:grid-cols-3">
            {session.scanHints.map((h, i) => (
              <li key={h} className="rounded-xl bg-slate-50 px-3 py-3 text-sm text-zvv-ink ring-1 ring-zvv-border/60">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zvv-primary">
                  Cue {i + 1}
                </span>
                {h}
              </li>
            ))}
          </ol>
          <div className="mt-6">
            <AcademyPrimaryCta
              label="Naar beslismoment"
              icon="continue"
              onClick={() => go("decision")}
              testId="lesson-continue"
            />
          </div>
        </StageCard>
      ) : null}

      {stage === "decision" ? (
        <StageCard
          id="decision"
          eyebrow="Kies"
          title={session.decisionPrompt}
          lead="Denk eerst. Kies daarna. Het goede antwoord wordt niet vooraf getoond."
          emphasis
        >
          {hasDedicatedFilm ? (
            <div className="mb-4 overflow-hidden rounded-2xl bg-slate-950 ring-1 ring-amber-200/50">
              <TacticalIllustration
                situationId={session.pitch.liveSituationId}
                className="min-h-[240px] w-full md:min-h-[360px] [&_figcaption]:hidden"
                autoplay={false}
                cameraMode={dedicatedCamera}
                hierarchyQuiet
                showControls
                seekMs={freezeMs}
                orientation={
                  isGolden
                    ? GS_ORIENTATION
                    : {
                        phase: dedicatedPhaseLabel,
                        activeRole: dedicated?.activeRole.replace("us.", "") ?? session.primaryRole,
                        showAttackDirection: true,
                        baseFormationNote: "Vanuit 4-2-3-1",
                      }
                }
                showOrientation
              />
              <p className="border-t border-white/10 px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-200/90">
                Beslismoment — kies vóór je rent
              </p>
            </div>
          ) : null}
          <div className="grid gap-3" role="listbox" aria-label="Keuzes">
            {session.choices.map((c) => {
              const selectedNow = choice === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="option"
                  aria-selected={selectedNow}
                  disabled={committed}
                  onClick={() => commitChoice(c.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      commitChoice(c.id);
                    }
                  }}
                  className={cn(
                    "min-h-14 rounded-2xl border px-4 py-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zvv-primary",
                    !committed && "border-zvv-border bg-white hover:border-zvv-primary/45 hover:bg-blue-50/50",
                    committed && selectedNow && "border-zvv-primary bg-blue-50",
                    committed && !selectedNow && "opacity-40",
                  )}
                  data-testid={`choice-${c.id}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-zvv-ink">
                      {c.id}
                    </span>
                    <span className="pt-1.5 text-[15px] font-medium leading-snug text-zvv-ink">{c.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
          {!committed ? (
            <p className="mt-4 text-center text-xs text-zvv-muted">Kies één actie om verder te gaan</p>
          ) : null}
        </StageCard>
      ) : null}

      {stage === "consequence" && selected ? (
        <StageCard
          id="consequence"
          eyebrow={selected.correct ? "Effectief" : "Ineffectief"}
          title={selected.correct ? "Goede prioriteit" : "Zo voelt de fout"}
        >
          <div
            className={cn(
              "rounded-2xl px-4 py-4 ring-1",
              selected.correct ? "bg-teal-50/80 ring-teal-200" : "bg-rose-50/80 ring-rose-200",
            )}
            data-testid="consequence-panel"
          >
            <p className="text-sm font-semibold text-zvv-ink">Gevolg</p>
            <p className="mt-1 text-[15px] leading-relaxed text-zvv-ink/90">{selected.consequence}</p>
            <p className="mt-3 text-sm leading-relaxed text-zvv-muted">{selected.explanation}</p>
            {selected.errorFix ? (
              <p className="mt-3 text-sm font-medium text-zvv-ink">Fix: {selected.errorFix}</p>
            ) : null}
          </div>
          {hasDedicatedFilm ? (
            <div className="mt-4 overflow-hidden rounded-2xl bg-slate-950 ring-1 ring-white/10">
              <TacticalIllustration
                situationId={
                  selected.correct ? session.pitch.goodSituationId : session.pitch.badSituationId
                }
                className="min-h-[220px] w-full md:min-h-[320px] [&_figcaption]:hidden"
                autoplay
                cameraMode={dedicatedCamera}
                hierarchyQuiet={!selected.correct}
                showControls
              />
            </div>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-3">
            <AcademyPrimaryCta
              label="Begrijp waarom"
              icon="continue"
              onClick={() => go("explanation")}
              testId="lesson-continue"
            />
            <button
              type="button"
              className="inline-flex min-h-12 items-center rounded-2xl border border-zvv-border px-5 text-sm font-semibold text-zvv-ink hover:bg-slate-50"
              onClick={() => {
                setCommitted(false);
                setChoice(null);
                go("decision");
              }}
            >
              Opnieuw kiezen
            </button>
          </div>
        </StageCard>
      ) : null}

      {stage === "explanation" && committed ? (
        <StageCard id="explanation" eyebrow="Begrijp waarom" title="FOUT vs GOED">
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCompareMode(false)}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-semibold",
                !compareMode ? "bg-zvv-primary text-white" : "bg-slate-100 text-zvv-muted",
              )}
            >
              Uitleg
            </button>
            <button
              type="button"
              onClick={() => setCompareMode(true)}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-semibold",
                compareMode ? "bg-zvv-primary text-white" : "bg-slate-100 text-zvv-muted",
              )}
            >
              Vergelijk FOUT / GOED
            </button>
          </div>
          {!compareMode ? (
            <div className="space-y-4">
              <ol className="space-y-3">
                {session.executionSteps.map((s, i) => (
                  <li key={s} className="flex gap-3 rounded-xl bg-slate-50 px-3 py-3 text-sm text-zvv-ink ring-1 ring-zvv-border/50">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zvv-primary text-[11px] font-bold text-white">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
              <div className="rounded-2xl bg-zvv-night px-5 py-6 text-center text-white">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-200">Cue</p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-4xl tracking-wide md:text-5xl">
                  {session.cue}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <TacticalPressureDualCard
                variant="bad"
                label="FOUT"
                title={session.pitch.badTitle}
                situationId={session.pitch.badSituationId}
                takeaway={session.pitch.badTitle}
                consequence={session.pitch.badConsequence}
                contrastHint={
                  isGolden || session.wave === "pressing" ? "rechte jacht" : undefined
                }
              />
              <TacticalPressureDualCard
                variant="good"
                label="GOED"
                title={session.pitch.goodTitle}
                situationId={session.pitch.goodSituationId}
                takeaway={session.pitch.goodTitle}
                consequence={session.pitch.goodConsequence}
                contrastHint={
                  isGolden || session.wave === "pressing" ? "binnenkant dicht" : undefined
                }
              />
            </div>
          )}
          <div className="mt-6">
            <AcademyPrimaryCta
              label="Rond sessie af"
              icon="next"
              onClick={() => go("completion")}
              testId="lesson-continue"
            />
          </div>
        </StageCard>
      ) : null}

      {stage === "completion" && committed ? (
        <section
          id="fdl-stage-completion"
          className="scroll-mt-28 overflow-hidden rounded-[1.5rem] bg-zvv-night px-5 py-7 text-white sm:px-8 sm:py-9"
          data-testid="lesson-completion"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200/90">Sessie afgerond</p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.75rem,4vw,2.4rem)] tracking-wide">
            {session.takeaway}
          </h2>
          <p className="mt-3 max-w-2xl text-base text-blue-100/85">{session.summary}</p>
          {selected ? (
            <p className="mt-4 text-sm text-blue-100/75">
              Jouw keuze: <span className="font-semibold text-white">{selected.label}</span>
              {" · "}
              {selected.correct ? "Effectief" : "Ineffectief — les geleerd"}
            </p>
          ) : null}
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            {nextSession ? (
              <AcademyPrimaryCta
                href={`/academie/decision-lab/${nextSession.slug}`}
                label="Start volgende sessie"
                icon="next"
                tone="on-dark"
                durationHint={`${nextSession.durationMin}–${nextSession.durationMax} min`}
                testId="lesson-next-cta"
              />
            ) : (
              <AcademyPrimaryCta
                href="/academie/decision-lab"
                label="Terug naar Decision Lab"
                icon="continue"
                tone="on-dark"
                testId="lesson-next-cta"
              />
            )}
            <Link
              href="/academie/decision-lab"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/25 px-5 text-sm font-semibold text-white/90 hover:bg-white/10"
            >
              Terug naar Decision Lab
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function StageCard({
  id,
  eyebrow,
  title,
  lead,
  children,
  emphasis,
}: {
  id: LessonStageId;
  eyebrow: string;
  title: string;
  lead?: string;
  children: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <section
      id={`fdl-stage-${id}`}
      className={cn(
        "scroll-mt-28 rounded-[1.35rem] bg-white p-5 md:p-7",
        emphasis ? "ring-2 ring-zvv-primary/20" : "ring-1 ring-zvv-border/70",
      )}
      data-testid={`lesson-stage-${id}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zvv-primary">{eyebrow}</p>
      <h2 className="mt-2 font-[family-name:var(--font-display)] text-[clamp(1.45rem,3.2vw,1.95rem)] tracking-wide text-zvv-ink">
        {title}
      </h2>
      {lead ? <p className="mt-2 text-sm leading-relaxed text-zvv-muted">{lead}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}
