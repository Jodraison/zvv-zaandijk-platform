"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AcademyPrimaryCta } from "@/components/academie/academy-primary-cta";
import { SessionTacticalPreview } from "@/components/decision-lab/session-tactical-preview";
import { ZVV_CANONICAL } from "@/lib/academie/tactical-canonical-perspective";
import {
  resolveCanonicalLearnerModel,
} from "@/lib/decision-lab/academy-visibility";
import { GS_SEEKS } from "@/lib/decision-lab/gs-timings";
import { listDecisionLabBlokken, type BlokWithSessions } from "@/lib/decision-lab/missions";
import { listDecisionLabSessions } from "@/lib/decision-lab/session-catalog";
import {
  readDecisionLabProgress,
  type DecisionLabProgressMap,
} from "@/lib/decision-lab/progress";
import type { DecisionLabSession } from "@/lib/decision-lab/types";
import { cn } from "@/lib/utils";

const GOLDEN_ID = "FDL-GS-INSIDE-CLOSE-RB-PRESS-V1";

export function DecisionLabHub() {
  const sessions = useMemo(() => listDecisionLabSessions(), []);
  const blokken = useMemo(() => listDecisionLabBlokken(), []);
  const [progress, setProgress] = useState<DecisionLabProgressMap>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setProgress(readDecisionLabProgress());
    setHydrated(true);
  }, []);

  const model = useMemo(
    () => resolveCanonicalLearnerModel(sessions, progress),
    [sessions, progress],
  );

  const completed = sessions.filter((s) => progress[s.id]?.status === "completed").length;
  const pct = sessions.length ? Math.round((completed / sessions.length) * 100) : 0;
  const nextSession = model.primary ?? sessions[0]!;
  const nextBlok = blokken.find((b) => b.sessions.some((s) => s.id === nextSession.id));
  const currentBlokOrder = nextBlok?.order ?? 1;

  const previewSeek =
    nextSession.id === GOLDEN_ID ? GS_SEEKS.previewOpening : undefined;

  return (
    <div className="space-y-8 md:space-y-10" data-testid="decision-lab-hub">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zvv-primary">
            Football Academy · Leerpad
          </p>
          <h1 className="mt-1.5 font-[family-name:var(--font-display)] text-[clamp(1.85rem,4.5vw,2.5rem)] leading-[0.95] tracking-wide text-zvv-ink">
            Decision Lab
          </h1>
          <p className="mt-1.5 max-w-lg text-sm text-zvv-muted">
            Zien, beslissen, uitvoeren — één wedstrijdkeuze per sessie.
          </p>
        </div>
        {!model.isFirstUse ? (
          <div className="w-full max-w-[200px] rounded-xl bg-slate-50 px-3.5 py-2.5 sm:w-auto">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zvv-muted">
                Voortgang
              </p>
              <p className="font-[family-name:var(--font-display)] text-lg tracking-wide text-zvv-ink">
                {hydrated ? pct : "—"}
                <span className="text-xs text-zvv-muted">%</span>
              </p>
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-200/80">
              <div
                className="h-full rounded-full bg-zvv-primary transition-[width] duration-700"
                style={{ width: `${hydrated ? pct : 0}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-zvv-muted">
              {hydrated ? `${completed}/${sessions.length}` : "—"} · {nextBlok?.title ?? "—"}
            </p>
          </div>
        ) : null}
      </header>

      {model.isFirstUse ? (
        <aside className="rounded-2xl bg-slate-50 px-4 py-3.5 sm:px-5" aria-label="Eerste keer">
          <ul className="grid gap-1.5 text-sm text-zvv-ink sm:grid-cols-2">
            <li>Wij zijn blauw · {ZVV_CANONICAL.clubName}</li>
            <li>Basisvorm: 4-2-3-1</li>
            <li>Aanval naar rechts</li>
            <li>Eerste rol: RW</li>
          </ul>
        </aside>
      ) : (
        <p className="text-sm text-zvv-muted" data-testid="hub-status-detail">
          <span className="font-semibold text-zvv-ink">{model.statusLabel}</span>
          {" — "}
          {model.statusDetail}
        </p>
      )}

      <section
        aria-labelledby="dl-next-heading"
        className="overflow-hidden rounded-[1.5rem] bg-zvv-night text-white shadow-zvv-hero"
      >
        <div className="grid gap-0 md:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col justify-between p-5 sm:p-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-200/90">
                {nextBlok?.title ?? "Trainingsblok"} · Jouw volgende beslissing
              </p>
              <h2
                id="dl-next-heading"
                className="mt-2.5 font-[family-name:var(--font-display)] text-[clamp(1.35rem,3.5vw,1.95rem)] leading-tight tracking-wide"
              >
                {nextSession.playerTitle}
              </h2>
              <p className="mt-2 text-sm text-blue-100/80">
                {nextSession.durationMin}–{nextSession.durationMax} min · {nextSession.primaryRole} ·{" "}
                {nextSession.difficulty}
              </p>
              <p className="mt-2 text-sm text-blue-100/70">{nextSession.learningGoals[0]}</p>
            </div>
            <div className="mt-5">
              <AcademyPrimaryCta
                href={`/academie/decision-lab/${nextSession.slug}`}
                label={model.ctaLabel}
                icon={model.isFirstUse ? "play" : model.ctaLabel.includes("volgende") ? "next" : "continue"}
                tone="on-dark"
                durationHint={`${nextSession.durationMin}–${nextSession.durationMax} min`}
                testId="hub-primary-cta"
              />
            </div>
          </div>
          <div className="border-t border-white/10 p-4 md:border-l md:border-t-0 md:p-5">
            <SessionTacticalPreview
              situationId={nextSession.pitch.liveSituationId}
              seekMs={previewSeek}
              className="min-h-[200px] md:min-h-[280px]"
            />
          </div>
        </div>
      </section>

      <section aria-labelledby="dl-route-heading" className="space-y-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zvv-muted">
            Leerroute
          </p>
          <h2
            id="dl-route-heading"
            className="mt-1 font-[family-name:var(--font-display)] text-[clamp(1.4rem,3vw,1.9rem)] tracking-wide text-zvv-ink"
          >
            Trainingsblokken
          </h2>
        </div>

        <ol className="space-y-3">
          {blokken.map((blok) => (
            <BlokCard
              key={blok.id}
              blok={blok}
              progress={progress}
              nextSessionId={nextSession.id}
              hydrated={hydrated}
              collapsedByDefault={blok.order > currentBlokOrder + 1}
            />
          ))}
        </ol>
      </section>
    </div>
  );
}

function BlokCard({
  blok,
  progress,
  nextSessionId,
  hydrated,
  collapsedByDefault,
}: {
  blok: BlokWithSessions;
  progress: DecisionLabProgressMap;
  nextSessionId: string;
  hydrated: boolean;
  collapsedByDefault: boolean;
}) {
  const [open, setOpen] = useState(!collapsedByDefault);
  const done = blok.sessions.filter((s) => progress[s.id]?.status === "completed").length;
  const total = blok.sessions.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const hasActive = blok.sessions.some((s) => s.id === nextSessionId);
  const allDone = done === total && total > 0;
  const status = allDone
    ? "Afgerond"
    : hasActive
      ? "Actief"
      : done > 0
        ? "Bezig"
        : "Nog niet gestart";

  return (
    <li
      className={cn(
        "overflow-hidden rounded-2xl bg-white transition",
        hasActive ? "ring-2 ring-zvv-primary/25" : "ring-1 ring-zvv-border/70",
      )}
    >
      <button
        type="button"
        className="flex w-full flex-wrap items-start justify-between gap-3 px-4 py-3.5 text-left sm:px-5"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zvv-muted">
            Trainingsblok {blok.order}
          </p>
          <h3 className="mt-0.5 font-[family-name:var(--font-display)] text-lg tracking-wide text-zvv-ink md:text-xl">
            {blok.title}
          </h3>
          <p className="mt-0.5 text-sm text-zvv-muted">{blok.promise}</p>
        </div>
        <div className="text-right">
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
              allDone && "bg-teal-50 text-teal-800",
              hasActive && !allDone && "bg-blue-50 text-blue-800",
              !hasActive && !allDone && done > 0 && "bg-amber-50 text-amber-800",
              !hasActive && !allDone && done === 0 && "bg-slate-100 text-slate-600",
            )}
          >
            {status}
          </span>
          <p className="mt-1.5 text-xs font-medium text-zvv-muted">
            {hydrated ? `${done}/${total}` : "—"} · {open ? "Inklappen" : "Tonen"}
          </p>
        </div>
      </button>

      {open ? (
        <ul className="divide-y divide-zvv-border/60 border-t border-zvv-border/60">
          {blok.sessions.map((s) => (
            <SessionRow
              key={s.id}
              session={s}
              status={progress[s.id]?.status}
              isNext={s.id === nextSessionId}
              isGolden={s.id === GOLDEN_ID}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function SessionRow({
  session,
  status,
  isNext,
  isGolden,
}: {
  session: DecisionLabSession;
  status?: "started" | "completed";
  isNext: boolean;
  isGolden: boolean;
}) {
  const actionLabel = (() => {
    if (status === "completed") return "Afgerond";
    if (status === "started") return isNext ? "Ga verder" : "Bezig";
    if (isNext) return "Start hier";
    return "Nog niet gestart";
  })();

  return (
    <li>
      <Link
        href={`/academie/decision-lab/${session.slug}`}
        className={cn(
          "group flex flex-col gap-1.5 px-4 py-3.5 transition sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5",
          isNext ? "bg-blue-50/60" : "hover:bg-slate-50/80",
        )}
      >
        <div className="min-w-0">
          {isGolden ? (
            <span className="rounded-full bg-zvv-night px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-100">
              Startsessie
            </span>
          ) : null}
          <p className="mt-1 text-sm font-semibold text-zvv-ink group-hover:text-zvv-primary">
            {session.playerTitle}
          </p>
          <p className="mt-0.5 text-xs text-zvv-muted">
            {session.durationMin}–{session.durationMax} min · {session.difficulty}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 text-xs font-semibold",
            status === "completed" && "text-teal-700",
            status === "started" && "text-amber-700",
            isNext && !status && "text-zvv-primary",
            !isNext && !status && "text-zvv-muted",
          )}
        >
          {actionLabel}
        </span>
      </Link>
    </li>
  );
}
