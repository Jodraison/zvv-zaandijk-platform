/**
 * Press Batch A (#2–#9) — hand-authored film registry.
 *
 * Wires the individually-authored ds-02..ds-09 films into the
 * `DedicatedFilmBundle`-compatible shape the lesson routes already know how
 * to render (see dedicated/build-dedicated-films.ts). `def` (order, family,
 * activeRole, supportRoles) always comes from `DEDICATED_SESSION_FILM_DEFS`
 * in dedicated/ids.ts — the single source of truth for session metadata.
 *
 * Contract each ds-0X-*.ts module must satisfy:
 *   export const DS0X_BUNDLE: {
 *     situations: Record<string, TacticalSituationDefinition>; // live/good/bad
 *     animations: Record<string, TacticalAnimationDefinition>; // live/good/bad
 *     freezeMs: number;   // from DS0X_SEEKS.freeze (timings.ts)
 *     previewMs: number;
 *   }
 */

import type { TacticalAnimationDefinition } from "@/lib/academie/tactical-animation-types";
import type { TacticalSituationDefinition } from "@/lib/academie/tactical-visual-system";
import {
  DEDICATED_SESSION_FILM_DEFS,
  type DedicatedFilmDef,
} from "@/lib/decision-lab/films/dedicated/ids";
import type { DedicatedFilmBundle } from "@/lib/decision-lab/films/dedicated/build-dedicated-films";

import { DS02_BUNDLE } from "@/lib/decision-lab/films/press-batch-a/ds-02-lw-mirror";
import { DS03_BUNDLE } from "@/lib/decision-lab/films/press-batch-a/ds-03-stable-decision";
import { DS04_BUNDLE } from "@/lib/decision-lab/films/press-batch-a/ds-04-second-press";
import { DS05_BUNDLE } from "@/lib/decision-lab/films/press-batch-a/ds-05-depth-cover";
import { DS06_BUNDLE } from "@/lib/decision-lab/films/press-batch-a/ds-06-striker-steer";
import { DS07_BUNDLE } from "@/lib/decision-lab/films/press-batch-a/ds-07-far-side-squeeze";
import { DS08_BUNDLE } from "@/lib/decision-lab/films/press-batch-a/ds-08-abort-recover";
import { DS09_BUNDLE } from "@/lib/decision-lab/films/press-batch-a/ds-09-pressure";

/** Per-film contract produced by each ds-0X-*.ts module. */
export type PressBatchAFilmBundle = {
  situations: Record<string, TacticalSituationDefinition>;
  animations: Record<string, TacticalAnimationDefinition>;
  freezeMs: number;
  previewMs: number;
};

const BUNDLE_BY_SESSION_ID: Record<string, PressBatchAFilmBundle> = {
  "FDL-DS-INSIDE-CLOSE-LW-PRESS-V1": DS02_BUNDLE,
  "FDL-DS-INSIDE-CLOSE-RW-DECISION-V1": DS03_BUNDLE,
  "FDL-DS-SECOND-PRESS-8-V1": DS04_BUNDLE,
  "FDL-DS-DEPTH-COVER-RB-V1": DS05_BUNDLE,
  "FDL-DS-ST-STEER-PIN-V1": DS06_BUNDLE,
  "FDL-DS-FAR-SIDE-SQUEEZE-V1": DS07_BUNDLE,
  "FDL-DS-PRESS-ABORT-RECOVER-V1": DS08_BUNDLE,
  "FDL-DS-INSIDE-CLOSE-RW-PRESSURE-V1": DS09_BUNDLE,
};

/** All Batch A (#2–#9) session IDs covered by hand-authored films. */
export const PRESS_BATCH_A_SESSION_IDS: ReadonlySet<string> = new Set(
  Object.keys(BUNDLE_BY_SESSION_ID),
);

function defForSession(sessionId: string): DedicatedFilmDef | undefined {
  return DEDICATED_SESSION_FILM_DEFS.find((d) => d.sessionId === sessionId);
}

/** Look up the fully-assembled, DedicatedFilmBundle-compatible film for a session. */
export function getPressBatchABundle(sessionId: string): DedicatedFilmBundle | undefined {
  const def = defForSession(sessionId);
  const filmBundle = BUNDLE_BY_SESSION_ID[sessionId];
  if (!def || !filmBundle) return undefined;

  return {
    def,
    situations: filmBundle.situations,
    animations: filmBundle.animations,
    freezeMs: filmBundle.freezeMs,
    previewMs: filmBundle.previewMs,
    activeRole: def.activeRole,
    mobileFocusIds: [def.activeRole, ...def.supportRoles],
  };
}

/** Freeze timestamp (ms) per session slug — for QA / freeze-frame tooling. */
export function listPressBatchAFreezeMs(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [sessionId, filmBundle] of Object.entries(BUNDLE_BY_SESSION_ID)) {
    const def = defForSession(sessionId);
    if (!def) continue;
    out[def.slug] = filmBundle.freezeMs;
  }
  return out;
}

/**
 * Guards D-002's "no shared timeline" rule: every hand-authored Batch A film
 * must freeze at a distinct moment. Throws with the two colliding slugs if
 * two sessions ever share a freeze timestamp.
 */
export function assertBatchAUniqueTimelines(): void {
  const seenAtMs = new Map<number, string>();
  for (const [sessionId, filmBundle] of Object.entries(BUNDLE_BY_SESSION_ID)) {
    const def = defForSession(sessionId);
    const label = def?.slug ?? sessionId;
    const existing = seenAtMs.get(filmBundle.freezeMs);
    if (existing) {
      throw new Error(
        `Press Batch A freeze collision: "${existing}" and "${label}" both freeze at ${filmBundle.freezeMs}ms`,
      );
    }
    seenAtMs.set(filmBundle.freezeMs, label);
  }
}
