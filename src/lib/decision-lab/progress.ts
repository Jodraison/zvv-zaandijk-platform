"use client";

import {
  LESSON_FLOW,
  PROGRESS_VERSION,
  lessonStageIndex,
  migrateC009SixStep,
  resolveLessonStageFromLegacy,
  type LessonStageId,
} from "@/lib/decision-lab/lesson-stages";

const KEY = "fdl-progress-v1";

export type DecisionLabSessionProgress = {
  status: "started" | "completed";
  /** Stage index 0–5 (derived from lessonStage). */
  step: number;
  /** Named lesson stage (canonical). */
  lessonStage?: LessonStageId;
  /** Storage schema version for this entry. */
  progressVersion?: typeof PROGRESS_VERSION;
  choice?: string;
  updatedAt: string;
  openedAt?: string;
  completedAt?: string;
};

export type DecisionLabProgressMap = Record<string, DecisionLabSessionProgress>;

function migrateEntry(raw: DecisionLabSessionProgress): {
  entry: DecisionLabSessionProgress;
  changed: boolean;
} {
  const stage =
    raw.status === "completed"
      ? ("completion" as const)
      : resolveLessonStageFromLegacy({
          step: raw.step,
          lessonStage: raw.lessonStage,
          progressVersion: raw.progressVersion,
          status: raw.status,
          choice: raw.choice,
        });
  const step = lessonStageIndex(stage);
  const needs =
    raw.progressVersion !== PROGRESS_VERSION ||
    raw.lessonStage !== stage ||
    raw.step !== step;

  if (!needs) return { entry: raw, changed: false };

  return {
    changed: true,
    entry: {
      ...raw,
      progressVersion: PROGRESS_VERSION,
      lessonStage: stage,
      step,
    },
  };
}

export function migrateProgressMap(map: DecisionLabProgressMap): {
  map: DecisionLabProgressMap;
  changed: boolean;
} {
  let changed = false;
  const next: DecisionLabProgressMap = {};
  for (const [id, raw] of Object.entries(map)) {
    const m = migrateEntry(raw);
    next[id] = m.entry;
    if (m.changed) changed = true;
  }
  return { map: next, changed };
}

export function readDecisionLabProgress(): DecisionLabProgressMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as DecisionLabProgressMap;
    const { map, changed } = migrateProgressMap(parsed);
    if (changed) writeDecisionLabProgress(map);
    return map;
  } catch {
    return {};
  }
}

export function writeDecisionLabProgress(map: DecisionLabProgressMap) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(map));
}

export function clearDecisionLabProgress() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

export function upsertSessionProgress(
  sessionId: string,
  patch: Partial<DecisionLabSessionProgress>,
) {
  const map = readDecisionLabProgress();
  const prev = map[sessionId];
  const now = new Date().toISOString();
  const status = patch.status ?? prev?.status ?? "started";

  let lessonStage: LessonStageId;
  if (status === "completed") {
    lessonStage = "completion";
  } else if (patch.lessonStage) {
    lessonStage = patch.lessonStage;
  } else if (typeof patch.step === "number") {
    lessonStage = migrateC009SixStep(patch.step);
  } else if (prev?.lessonStage) {
    lessonStage = prev.lessonStage;
  } else {
    lessonStage = "situation";
  }

  map[sessionId] = {
    status,
    step: lessonStageIndex(lessonStage),
    lessonStage,
    progressVersion: PROGRESS_VERSION,
    choice: patch.choice ?? prev?.choice,
    updatedAt: now,
    openedAt: prev?.openedAt ?? patch.openedAt ?? now,
    completedAt:
      status === "completed"
        ? (patch.completedAt ?? prev?.completedAt ?? now)
        : (patch.completedAt ?? prev?.completedAt),
  };
  writeDecisionLabProgress(map);
  return map[sessionId]!;
}
