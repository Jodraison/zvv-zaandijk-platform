/**
 * Named lesson stages + versioned progress migration (C-010).
 */

export const PROGRESS_VERSION = 2 as const;

export const LESSON_STAGES = [
  { id: "situation", label: "Bekijk de situatie", short: "Bekijk" },
  { id: "scan", label: "Scan", short: "Scan" },
  { id: "decision", label: "Kies", short: "Kies" },
  { id: "consequence", label: "Bekijk het gevolg", short: "Gevolg" },
  { id: "explanation", label: "Begrijp waarom", short: "Waarom" },
  { id: "completion", label: "Rond af", short: "Afronden" },
] as const;

export type LessonStageId = (typeof LESSON_STAGES)[number]["id"];

export const LESSON_FLOW: LessonStageId[] = LESSON_STAGES.map((s) => s.id);

/** Legacy C-009 ids → C-010 named stages */
const C009_ALIASES: Record<string, LessonStageId> = {
  view: "situation",
  decide: "decision",
  understand: "explanation",
  complete: "completion",
  situation: "situation",
  scan: "scan",
  decision: "decision",
  consequence: "consequence",
  explanation: "explanation",
  completion: "completion",
};

export function lessonStageIndex(id: LessonStageId): number {
  return LESSON_FLOW.indexOf(id);
}

export function lessonStageLabel(id: LessonStageId): string {
  return LESSON_STAGES.find((s) => s.id === id)?.label ?? id;
}

export function normalizeLessonStageId(raw: string | undefined | null): LessonStageId | null {
  if (!raw) return null;
  const mapped = C009_ALIASES[raw];
  return mapped ?? null;
}

/**
 * Legacy 11-step FLOW (hero…summary) → named stage.
 * Conservative: never skip content the player may not have seen.
 */
export function migrateLegacyElevenStep(step: number): LessonStageId {
  if (!Number.isFinite(step) || step < 0) return "situation";
  if (step <= 2) return "situation";
  if (step === 3) return "scan";
  if (step === 4) return "decision";
  if (step === 5) return "consequence";
  if (step >= 6 && step <= 9) return "explanation";
  return "completion";
}

/**
 * C-009 six numeric indices (0–5) → named stage.
 */
export function migrateC009SixStep(step: number): LessonStageId {
  const clamped = Math.min(Math.max(Math.floor(step), 0), 5);
  return LESSON_FLOW[clamped]!;
}

/**
 * Resolve stage from mixed legacy storage.
 * - named lessonStage wins
 * - step > 5 → eleven-step legacy
 * - progressVersion 2 + step 0–5 → six-stage
 * - unversioned step 0–5 → treat as C-009 six-stage (last shipped),
 *   but if step===0 and no choice, stay at situation
 */
export function resolveLessonStageFromLegacy(input: {
  step?: number;
  lessonStage?: string;
  progressVersion?: number;
  status?: string;
  choice?: string;
}): LessonStageId {
  if (input.status === "completed") return "completion";

  const named = normalizeLessonStageId(input.lessonStage);
  if (named) return named;

  const step = typeof input.step === "number" ? input.step : 0;
  if (step > 5) return migrateLegacyElevenStep(step);

  if (input.progressVersion === PROGRESS_VERSION) {
    return migrateC009SixStep(step);
  }

  // Unversioned 0–5: C-009 six-stage was current; map directly.
  return migrateC009SixStep(step);
}

/** @deprecated alias */
export function migrateLegacyLessonStep(step: number): number {
  return lessonStageIndex(migrateLegacyElevenStep(step));
}

/** @deprecated alias */
export function stageFromStoredStep(step: number): LessonStageId {
  return resolveLessonStageFromLegacy({ step });
}

export function resumeStageCopy(stepOrStage: number | LessonStageId): string {
  if (typeof stepOrStage === "string") {
    return lessonStageLabel(normalizeLessonStageId(stepOrStage) ?? "situation");
  }
  return lessonStageLabel(resolveLessonStageFromLegacy({ step: stepOrStage }));
}
