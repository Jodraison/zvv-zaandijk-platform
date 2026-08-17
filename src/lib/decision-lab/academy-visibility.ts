/**
 * Canonical Academy / Decision Lab learner state (C-009).
 * Do not infer progress from session id presence alone.
 */

import type { DecisionLabProgressMap, DecisionLabSessionProgress } from "@/lib/decision-lab/progress";
import type { DecisionLabSession } from "@/lib/decision-lab/types";
import { resolveContinueSession, resolveRecentSessions } from "@/lib/decision-lab/continue";
import { resumeStageCopy } from "@/lib/decision-lab/lesson-stages";

export type LearnerProgressState = "untouched" | "opened" | "in_progress" | "completed";

export type AcademyCtaLabel =
  | "Start eerste beslissessie"
  | "Ga verder met je sessie"
  | "Start volgende sessie"
  | "Begin met de eerste situatie";

export type PlayerFacingStatusLabel =
  | "Nog niet gestart"
  | "Sessie geopend"
  | "Bezig"
  | "Afgerond";

export type CanonicalLearnerModel = {
  state: LearnerProgressState;
  primary: DecisionLabSession | null;
  recommendation: DecisionLabSession | null;
  recent: Array<{ s: DecisionLabSession; p: DecisionLabSessionProgress }>;
  showRecent: boolean;
  showRecommendation: boolean;
  showProgress: boolean;
  showReturningDashboard: boolean;
  isFirstUse: boolean;
  ctaLabel: AcademyCtaLabel;
  showResumeDetail: boolean;
  /** Player-facing status chip */
  statusLabel: PlayerFacingStatusLabel;
  /** Exact supporting line — never generic “ga verder waar je was” */
  statusDetail: string;
  /** Named lesson stage when in_progress */
  resumeStageLabel: string | null;
};

function nextAfter(
  sessions: DecisionLabSession[],
  current: DecisionLabSession | null,
): DecisionLabSession | null {
  if (!current) return null;
  const idx = sessions.findIndex((s) => s.id === current.id);
  if (idx < 0 || idx >= sessions.length - 1) return null;
  return sessions[idx + 1] ?? null;
}

function hasGenuineOpen(entry: DecisionLabSessionProgress | undefined): boolean {
  if (!entry) return false;
  if (entry.status === "completed" || Boolean(entry.completedAt)) return true;
  if (Boolean(entry.openedAt)) return true;
  if (entry.status === "started" && hasMeaningfulStep(entry)) return true;
  return false;
}

function hasMeaningfulStep(entry: DecisionLabSessionProgress | undefined): boolean {
  return Boolean(entry && typeof entry.step === "number" && entry.step > 0);
}

export function resolveLearnerProgressState(
  sessions: DecisionLabSession[],
  progress: DecisionLabProgressMap,
): LearnerProgressState {
  const entries = Object.values(progress);
  if (entries.length === 0) return "untouched";

  const anyGenuine = entries.some((e) => hasGenuineOpen(e));
  if (!anyGenuine) return "untouched";

  const allDone =
    sessions.length > 0 && sessions.every((s) => progress[s.id]?.status === "completed");
  if (allDone) return "completed";

  const anyMeaningful = entries.some((e) => hasMeaningfulStep(e) && e.status === "started");
  if (anyMeaningful) return "in_progress";

  const anyCompleted = entries.some((e) => e.status === "completed");
  if (anyCompleted) return "opened";

  const anyOpened = entries.some((e) => hasGenuineOpen(e));
  if (anyOpened) return "opened";

  return "untouched";
}

function buildStatusCopy(
  state: LearnerProgressState,
  primaryEntry: DecisionLabSessionProgress | undefined,
  anyCompleted: boolean,
): Pick<
  CanonicalLearnerModel,
  "statusLabel" | "statusDetail" | "resumeStageLabel" | "ctaLabel" | "showResumeDetail"
> {
  if (state === "untouched") {
    return {
      statusLabel: "Nog niet gestart",
      statusDetail: "Je eerste beslissessie staat klaar.",
      resumeStageLabel: null,
      ctaLabel: "Start eerste beslissessie",
      showResumeDetail: false,
    };
  }

  if (state === "completed") {
    return {
      statusLabel: "Afgerond",
      statusDetail: "Decision Lab is helemaal afgerond.",
      resumeStageLabel: null,
      ctaLabel: "Start volgende sessie",
      showResumeDetail: false,
    };
  }

  if (primaryEntry?.status === "completed") {
    return {
      statusLabel: "Afgerond",
      statusDetail: "Deze sessie is afgerond. Ga door naar de volgende.",
      resumeStageLabel: null,
      ctaLabel: "Start volgende sessie",
      showResumeDetail: false,
    };
  }

  // Next session after a completion — primary has no progress yet
  if (anyCompleted && !primaryEntry) {
    return {
      statusLabel: "Afgerond",
      statusDetail: "Vorige sessie afgerond. Start de volgende.",
      resumeStageLabel: null,
      ctaLabel: "Start volgende sessie",
      showResumeDetail: false,
    };
  }

  if (state === "opened" || !hasMeaningfulStep(primaryEntry)) {
    return {
      statusLabel: "Sessie geopend",
      statusDetail: "Begin met de eerste situatie — dit telt nog niet als leervoortgang.",
      resumeStageLabel: null,
      ctaLabel: "Begin met de eerste situatie",
      showResumeDetail: false,
    };
  }

  const stage = resumeStageCopy(primaryEntry!.lessonStage ?? primaryEntry!.step);
  return {
    statusLabel: "Bezig",
    statusDetail: `Ga verder vanaf: ${stage}`,
    resumeStageLabel: stage,
    ctaLabel: "Ga verder met je sessie",
    showResumeDetail: true,
  };
}

export function resolveCanonicalLearnerModel(
  sessions: DecisionLabSession[],
  progress: DecisionLabProgressMap,
): CanonicalLearnerModel {
  const state = resolveLearnerProgressState(sessions, progress);
  const isFirstUse = state === "untouched";
  const primary = resolveContinueSession(sessions, progress) ?? sessions[0] ?? null;
  const primaryEntry = primary ? progress[primary.id] : undefined;

  let recommendation: DecisionLabSession | null = null;
  if (!isFirstUse && primary) {
    const candidate = nextAfter(sessions, primary);
    if (candidate && candidate.id !== primary.id) recommendation = candidate;
  }

  const rawRecent = resolveRecentSessions(sessions, progress, 3);
  // Recent only when genuinely useful: in_progress or completed entries, not mere open
  const showRecent =
    !isFirstUse &&
    state === "in_progress" &&
    rawRecent.some((x) => x.p && (x.p.status === "completed" || hasMeaningfulStep(x.p)));
  const recent = showRecent
    ? rawRecent.filter(
        (x): x is { s: DecisionLabSession; p: DecisionLabSessionProgress } =>
          Boolean(x.p) && (x.p!.status === "completed" || hasMeaningfulStep(x.p!)),
      )
    : [];

  const anyCompleted = Object.values(progress).some((e) => e.status === "completed");

  const showRecommendation = Boolean(
    !isFirstUse &&
      recommendation &&
      primary &&
      recommendation.id !== primary.id &&
      (state === "in_progress" || primaryEntry?.status === "completed" || (anyCompleted && !hasMeaningfulStep(primaryEntry))),
  );

  const status = buildStatusCopy(state, primaryEntry, anyCompleted);

  return {
    state,
    primary,
    recommendation: showRecommendation ? recommendation : null,
    recent,
    showRecent: recent.length > 0,
    showRecommendation,
    showProgress: !isFirstUse,
    showReturningDashboard: !isFirstUse,
    isFirstUse,
    ctaLabel: status.ctaLabel,
    showResumeDetail: status.showResumeDetail,
    statusLabel: status.statusLabel,
    statusDetail: status.statusDetail,
    resumeStageLabel: status.resumeStageLabel,
  };
}

/** @deprecated — prefer resolveCanonicalLearnerModel */
export function resolveAcademyDashboardVisibility(
  sessions: DecisionLabSession[],
  progress: DecisionLabProgressMap,
) {
  const m = resolveCanonicalLearnerModel(sessions, progress);
  return {
    primary: m.primary,
    recommendation: m.recommendation,
    upcomingAfterStart: m.isFirstUse ? nextAfter(sessions, m.primary) : null,
    recent: m.recent,
    showRecommendation: m.showRecommendation,
    showRecent: m.showRecent,
    showUpcomingAfterStart: false,
    isFirstStart: m.isFirstUse,
    isResume: m.state === "in_progress" || m.state === "opened",
    learnerState: m.state,
    ctaLabel: m.ctaLabel,
    continueEyebrow: m.isFirstUse ? ("Start hier" as const) : ("Ga verder met" as const),
    showResumeHint: m.showResumeDetail,
    statusLabel: m.statusLabel,
    statusDetail: m.statusDetail,
  };
}

export function sessionDistinctLabel(
  session: DecisionLabSession,
  relativeTo?: DecisionLabSession | null,
): string {
  if (relativeTo && session.playerTitle === relativeTo.playerTitle) {
    return session.subtitle || `${session.primaryRole} · ${session.cue}`;
  }
  return session.playerTitle;
}

/** Player language for next-session preview (avoid cryptic “Spiegel · …”). */
export function nextSessionPlayerCopy(
  next: DecisionLabSession,
  current: DecisionLabSession | null,
): string {
  if (
    current &&
    /binnenkant/i.test(current.slug) &&
    /binnenkant/i.test(next.slug) &&
    /lw|links/i.test(next.primaryRole + next.slug + next.playerTitle)
  ) {
    return "Hierna train je dezelfde pressingkeuze vanaf links.";
  }
  return `Hierna: ${sessionDistinctLabel(next, current)}`;
}
