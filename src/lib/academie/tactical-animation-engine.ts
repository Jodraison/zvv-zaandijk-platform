/**
 * Pure tijdlijn-evaluatie voor Tactical Animation System V2.
 * Geen React / geen timers — alleen state uit (definition, t).
 */

import type { TacticalPoint, TacticalSituationDefinition } from "@/lib/academie/tactical-visual-system";
import { ballBesideHolder } from "@/lib/academie/tactical-visual-system";
import type {
  TacticalAnimationAction,
  TacticalAnimationDefinition,
  TacticalAnimationEasing,
  TacticalAnimationFrame,
  TacticalAnimationPhase,
  TacticalAnimationStep,
  TacticalCameraHint,
} from "@/lib/academie/tactical-animation-types";
import { lerpPath } from "@/lib/academie/tactical-animation-collision";
import type { PlayerOrientation } from "@/lib/academie/tactical-orientation";
import { normalizeAngleDeg } from "@/lib/academie/tactical-orientation";

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function ease(t: number, kind: TacticalAnimationEasing = "easeInOut"): number {
  const x = clamp01(t);
  if (kind === "linear") return x;
  if (kind === "easeIn") return x * x;
  if (kind === "easeOut") return 1 - (1 - x) * (1 - x);
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

function lerpFacingDeg(a: number, b: number, t: number): number {
  const delta = normalizeAngleDeg(b - a);
  return a + delta * clamp01(t);
}

function lerpOrientation(
  from: PlayerOrientation | undefined,
  to: PlayerOrientation,
  t: number,
): PlayerOrientation {
  if (!from || t >= 0.999) return to;
  if (t <= 0.001) return from;
  return {
    ...to,
    facingAngleDeg: lerpFacingDeg(from.facingAngleDeg, to.facingAngleDeg, t),
    bodyShape: t < 0.45 ? from.bodyShape : to.bodyShape,
    visionTarget: t < 0.55 ? from.visionTarget : to.visionTarget,
    receivingFoot: t < 0.5 ? from.receivingFoot : to.receivingFoot,
    nextActionIntent: t < 0.5 ? from.nextActionIntent : to.nextActionIntent,
    prePassScan: to.prePassScan ?? from.prePassScan,
  };
}

function applyStepOrientations(
  step: TacticalAnimationStep,
  orientationAt: Record<string, PlayerOrientation>,
  local: number,
) {
  const startSnap: Record<string, PlayerOrientation | undefined> = {};
  for (const id of Object.keys(orientationAt)) {
    startSnap[id] = orientationAt[id];
  }

  const targets: Record<string, PlayerOrientation> = { ...(step.orientations ?? {}) };
  for (const action of step.actions) {
    if (action.kind === "playerMove" && action.orientation) {
      targets[action.playerId] = action.orientation;
    }
    if (action.kind === "groupMove") {
      for (const m of action.moves) {
        if (m.orientation) targets[m.playerId] = m.orientation;
      }
    }
  }

  for (const [id, target] of Object.entries(targets)) {
    orientationAt[id] = lerpOrientation(startSnap[id] ?? orientationAt[id], target, local);
  }
}

export function lerpPoint(a: TacticalPoint, b: TacticalPoint, t: number): TacticalPoint {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function moveAlongPath(
  from: TacticalPoint,
  to: TacticalPoint,
  via: TacticalPoint[] | undefined,
  e: number,
): TacticalPoint {
  if (!via?.length) return lerpPoint(from, to, e);
  return lerpPath([from, ...via, to], e);
}

function stepLocalProgress(step: TacticalAnimationStep, timeMs: number): number {
  if (timeMs < step.startMs) return 0;
  if (step.durationMs <= 0) return 1;
  return clamp01((timeMs - step.startMs) / step.durationMs);
}

function applyInstant(
  action: TacticalAnimationAction,
  draft: {
    phase: TacticalAnimationPhase;
    statusLabel: string;
    holderId: string | null;
    lines: TacticalAnimationFrame["lines"];
    zones: TacticalAnimationFrame["zones"];
    highlightedPlayerIds: string[];
    highlightedZoneIndexes: number[];
  },
  stepLabel?: string,
) {
  if (action.kind === "hold") return;
  if (action.kind === "phase") {
    draft.phase = action.phase;
    if (stepLabel) draft.statusLabel = stepLabel;
    return;
  }
  if (action.kind === "possession") {
    draft.holderId = action.holderId;
    return;
  }
  if (action.kind === "setLines") {
    draft.lines = action.lines;
    return;
  }
  if (action.kind === "setZones") {
    draft.zones = action.zones;
    return;
  }
  if (action.kind === "highlight") {
    draft.highlightedPlayerIds = action.playerIds ?? [];
    draft.highlightedZoneIndexes = action.zoneIndexes ?? [];
  }
}

function applyCompletedMotion(
  action: TacticalAnimationAction,
  playerAt: Record<string, TacticalPoint>,
  ballRef: { ball: TacticalPoint | null },
) {
  if (action.kind === "playerMove") {
    playerAt[action.playerId] = { ...action.to };
    return;
  }
  if (action.kind === "groupMove") {
    for (const m of action.moves) {
      playerAt[m.playerId] = { ...m.to };
    }
    return;
  }
  if (action.kind === "ballMove") {
    ballRef.ball =
      typeof action.interceptProgress === "number"
        ? moveAlongPath(action.from, action.to, action.via, action.interceptProgress)
        : { ...action.to };
  }
}

/**
 * Evalueert één frame. `timeMs` is geklemd tot [0, durationMs + pauseAtEndMs].
 */
export function evaluateTacticalAnimation(
  situation: TacticalSituationDefinition,
  animation: TacticalAnimationDefinition,
  timeMs: number,
): TacticalAnimationFrame {
  const total = animation.durationMs + (animation.pauseAtEndMs ?? 0);
  const t = Math.max(0, Math.min(timeMs, total));
  const playT = Math.min(t, animation.durationMs);

  const playerAt: Record<string, TacticalPoint> = {};
  for (const p of situation.players) {
    playerAt[p.id] = { ...p.at };
  }

  const initialHolder = situation.players.find((p) => p.hasBall)?.id ?? null;
  const ballRef: { ball: TacticalPoint | null } = {
    ball: situation.ball
      ? { ...situation.ball }
      : initialHolder
        ? ballBesideHolder(playerAt[initialHolder])
        : null,
  };

  const draft = {
    phase: "initial" as TacticalAnimationPhase,
    statusLabel: "Begin",
    holderId: initialHolder,
    lines: situation.lines ? [...situation.lines] : [],
    zones: situation.zones ? [...situation.zones] : [],
    highlightedPlayerIds: [] as string[],
    highlightedZoneIndexes: [] as number[],
  };

  const orientationAt: Record<string, PlayerOrientation> = {};
  let cameraHint: TacticalCameraHint | null = null;

  const activeSteps = [...animation.steps].sort((a, b) => a.startMs - b.startMs);

  let currentStep: TacticalAnimationStep | null = null;
  let currentLocal = 0;
  let activeStepIndex = 0;

  for (let i = 0; i < activeSteps.length; i++) {
    const step = activeSteps[i]!;
    if (playT < step.startMs) break;
    activeStepIndex = i;
    const local = stepLocalProgress(step, playT);
    if (local >= 1) {
      for (const action of step.actions) {
        if (action.kind === "playerMove" || action.kind === "groupMove" || action.kind === "ballMove") {
          applyCompletedMotion(action, playerAt, ballRef);
        } else {
          applyInstant(action, draft, step.label);
        }
      }
      applyStepOrientations(step, orientationAt, 1);
      if (step.cameraHint) cameraHint = step.cameraHint;
      if (step.label) draft.statusLabel = step.label;
    } else {
      currentStep = step;
      currentLocal = local;
      break;
    }
  }

  let ball = ballRef.ball;

  if (currentStep) {
    const startPositions: Record<string, TacticalPoint> = {};
    for (const id of Object.keys(playerAt)) {
      startPositions[id] = { ...playerAt[id]! };
    }

    for (const action of currentStep.actions) {
      if (
        action.kind === "phase" ||
        action.kind === "setLines" ||
        action.kind === "setZones" ||
        action.kind === "highlight" ||
        action.kind === "hold"
      ) {
        applyInstant(action, draft, currentStep.label);
      }
    }

    let ballInFlight = false;
    let syncTrajectory: TacticalAnimationFrame["ballTrajectory"] = null;
    let activeBallTrajectoryCount = 0;

    for (const action of currentStep.actions) {
      if (action.kind === "playerMove") {
        const from = startPositions[action.playerId] ?? action.to;
        const e = ease(currentLocal, action.easing ?? "easeInOut");
        playerAt[action.playerId] = moveAlongPath(from, action.to, action.via, e);
      }
      if (action.kind === "groupMove") {
        for (const m of action.moves) {
          const from = startPositions[m.playerId] ?? m.to;
          const e = ease(currentLocal, m.easing ?? "easeInOut");
          playerAt[m.playerId] = moveAlongPath(from, m.to, m.via, e);
        }
      }
      if (action.kind === "ballMove") {
        const targetProgress =
          typeof action.interceptProgress === "number" ? action.interceptProgress : 1;
        const releaseL = clamp01(action.releaseLocal ?? 0);
        const arrivalL = Math.max(
          releaseL + 0.06,
          Math.min(0.98, action.arrivalLocal ?? 0.9),
        );
        // ~250–450ms lane fade after arrival on typical 3–4s steps
        const fadeEnd = Math.min(1, arrivalL + Math.max(0.06, Math.min(0.14, 0.35 / Math.max(currentStep.durationMs / 1000, 1))));

        let pathT = 0;
        let pathFrom = action.from;
        if (currentLocal < releaseL) {
          pathT = 0;
          if (action.passerId && playerAt[action.passerId]) {
            ball = ballBesideHolder(playerAt[action.passerId]);
            pathFrom = ball;
          } else {
            ball = action.from;
          }
          ballInFlight = false;
        } else if (currentLocal < arrivalL) {
          // Prefer live passer foot at release so delayed holds do not teleport
          if (action.passerId && playerAt[action.passerId] && releaseL > 0.02) {
            // Approximate release foot: authored from remains geometry source of truth
            pathFrom = action.from;
          }
          const flightLocal = (currentLocal - releaseL) / Math.max(arrivalL - releaseL, 0.001);
          const e = ease(flightLocal, action.easing ?? "easeOut");
          pathT = e * targetProgress;
          ball = moveAlongPath(pathFrom, action.to, action.via, pathT);
          ballInFlight = pathT < 0.995;
        } else {
          pathT = targetProgress;
          ball = moveAlongPath(action.from, action.to, action.via, pathT);
          ballInFlight = false;
        }

        if (action.syncLane) {
          activeBallTrajectoryCount += 1;
          // Lane preview ~300–600ms before release (≈0.08–0.15 of step)
          const previewStart = Math.max(0, releaseL - Math.min(0.15, Math.max(0.08, 450 / Math.max(currentStep.durationMs, 1))));
          let laneOpacity = 0;
          if (currentLocal < previewStart) {
            laneOpacity = 0;
          } else if (currentLocal < releaseL) {
            laneOpacity = (currentLocal - previewStart) / Math.max(releaseL - previewStart, 0.001);
          } else if (currentLocal < arrivalL) {
            laneOpacity = 1;
          } else if (currentLocal < fadeEnd) {
            laneOpacity = 1 - (currentLocal - arrivalL) / Math.max(fadeEnd - arrivalL, 0.001);
          } else {
            laneOpacity = 0;
          }

          const trail: TacticalPoint[] = [];
          const samples = 10;
          for (let s = 0; s <= samples; s++) {
            const st = (pathT * s) / samples;
            trail.push(moveAlongPath(action.from, action.to, action.via, st));
          }

          // Full authored geometry for the lane; ball travels the same path.
          if (laneOpacity > 0.02) {
            draft.lines = [
              {
                kind: action.laneStatus === "fault" ? "fault" : action.laneStatus === "press" ? "press" : "pass",
                from: action.from,
                to: action.to,
                dashed: action.laneStatus === "press",
                opacity: laneOpacity,
              },
            ];
          } else {
            draft.lines = [];
          }

          syncTrajectory = {
            id: action.trajectoryId ?? "ball",
            from: action.from,
            to: action.to,
            via: action.via,
            ballAt: ball,
            trail,
            laneOpacity,
            laneKind: action.laneStatus === "fault" ? "fault" : action.laneStatus === "press" ? "press" : "pass",
            inFlight: ballInFlight,
          };
        }
      }
    }

    for (const action of currentStep.actions) {
      if (action.kind !== "possession") continue;
      const ballMove = currentStep.actions.find((a) => a.kind === "ballMove");
      if (ballMove && ballMove.kind === "ballMove") {
        const releaseL = clamp01(ballMove.releaseLocal ?? 0);
        const arrivalL = Math.max(
          releaseL + 0.06,
          Math.min(0.98, ballMove.arrivalLocal ?? (typeof ballMove.interceptProgress === "number" ? 0.88 : 0.95)),
        );
        if (action.holderId === null) {
          // Clear possession only at release — keep contact hold readable
          if (currentLocal >= releaseL + 0.005) applyInstant(action, draft);
        } else if (currentLocal < releaseL && currentLocal >= 0.04) {
          // Pre-release receive (kaats contact / hold before next pass)
          applyInstant(action, draft);
        } else if (currentLocal >= arrivalL) {
          applyInstant(action, draft);
        }
      } else if (currentLocal >= 0.05) {
        applyInstant(action, draft);
      }
    }

    if (currentStep.label) draft.statusLabel = currentStep.label;
    applyStepOrientations(currentStep, orientationAt, currentLocal);
    if (currentStep.cameraHint) cameraHint = currentStep.cameraHint;

    if (!ballInFlight && draft.holderId && playerAt[draft.holderId]) {
      ball = ballBesideHolder(playerAt[draft.holderId]);
    }

    // After syncLane fade, clear lines unless explicit setLines should remain
    const explicitLineActions = currentStep.actions.filter(
      (a) => a.kind === "setLines" && a.lines.length > 0,
    );
    if (syncTrajectory && !ballInFlight) {
      if (syncTrajectory.laneOpacity <= 0.02) {
        if (explicitLineActions.length) {
          applyInstant(explicitLineActions[explicitLineActions.length - 1]!, draft);
        } else {
          draft.lines = [];
        }
      }
    }

    const active = activeSteps[activeStepIndex] ?? null;
    const activeOrLast =
      active ??
      (playT >= animation.durationMs
        ? activeSteps[activeSteps.length - 1] ?? null
        : null);

    return {
      timeMs: t,
      phase: draft.phase,
      statusLabel: draft.statusLabel,
      ball,
      playerAt,
      holderId: draft.holderId,
      lines: draft.lines,
      zones: draft.zones,
      highlightedPlayerIds: draft.highlightedPlayerIds,
      highlightedZoneIndexes: draft.highlightedZoneIndexes,
      progress: animation.durationMs > 0 ? clamp01(playT / animation.durationMs) : 1,
      done: t >= total,
      activeStepIndex,
      activeStepId: active?.id ?? null,
      teachingPoint: active?.teachingPoint ?? null,
      tacticalState: activeOrLast?.tacticalState ?? null,
      ballTrajectory: syncTrajectory,
      activeBallTrajectoryCount,
      orientationAt,
      isTrigger: Boolean(active?.isTrigger),
      cameraHint: cameraHint ?? active?.cameraHint ?? null,
    };
  } else if (draft.holderId && playerAt[draft.holderId]) {
    ball = ballBesideHolder(playerAt[draft.holderId]);
  }

  const active = activeSteps[activeStepIndex] ?? null;
  const activeOrLast =
    active ??
    (playT >= animation.durationMs
      ? activeSteps[activeSteps.length - 1] ?? null
      : null);

  return {
    timeMs: t,
    phase: draft.phase,
    statusLabel: draft.statusLabel,
    ball,
    playerAt,
    holderId: draft.holderId,
    lines: draft.lines,
    zones: draft.zones,
    highlightedPlayerIds: draft.highlightedPlayerIds,
    highlightedZoneIndexes: draft.highlightedZoneIndexes,
    progress: animation.durationMs > 0 ? clamp01(playT / animation.durationMs) : 1,
    done: t >= total,
    activeStepIndex,
    activeStepId: active?.id ?? null,
    teachingPoint: active?.teachingPoint ?? null,
    tacticalState: activeOrLast?.tacticalState ?? null,
    ballTrajectory: null,
    activeBallTrajectoryCount: 0,
    orientationAt,
    isTrigger: Boolean(activeOrLast?.isTrigger),
    cameraHint: cameraHint ?? activeOrLast?.cameraHint ?? null,
  };
}

/** Starttijd van een step-index (voor fase-navigatie). */
export function getAnimationStepStartMs(
  animation: TacticalAnimationDefinition,
  stepIndex: number,
): number {
  const steps = [...animation.steps].sort((a, b) => a.startMs - b.startMs);
  const step = steps[Math.max(0, Math.min(stepIndex, steps.length - 1))];
  return step?.startMs ?? 0;
}

/** Eindtijd van een step (start + duration), exclusief pauseAtEnd. */
export function getAnimationStepEndMs(
  animation: TacticalAnimationDefinition,
  stepIndex: number,
): number {
  const steps = [...animation.steps].sort((a, b) => a.startMs - b.startMs);
  const step = steps[Math.max(0, Math.min(stepIndex, steps.length - 1))];
  if (!step) return 0;
  return step.startMs + step.durationMs;
}
