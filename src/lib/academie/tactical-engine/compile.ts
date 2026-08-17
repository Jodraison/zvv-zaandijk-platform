/**
 * compileFilm — LessonFilmSpec → TacticalAnimationDefinition
 * One reusable compiler. Lessons never hand-write SVG timelines.
 */

import {
  animStep,
  buildAnimation,
  receiveBall,
} from "@/lib/academie/tactical-animation-sequences";
import type {
  TacticalAnimationAction,
  TacticalAnimationDefinition,
  TacticalAnimationStep,
} from "@/lib/academie/tactical-animation-types";
import { filmPass } from "@/lib/academie/tactical-engine/pass";
import { easingFromAcceleration } from "@/lib/academie/tactical-engine/helpers";
import type {
  LessonFilmPhase,
  LessonFilmPlayerMove,
  LessonFilmSpec,
} from "@/lib/academie/tactical-engine/types";
import type { PlayerOrientation } from "@/lib/academie/tactical-orientation";

function playerMoveAction(move: LessonFilmPlayerMove): TacticalAnimationAction {
  return {
    kind: "playerMove",
    playerId: move.playerId,
    to: move.to,
    via: move.via,
    easing: easingFromAcceleration(move.acceleration),
    orientation: move.orientation,
  };
}

function orientationsForPhase(phase: LessonFilmPhase): Record<string, PlayerOrientation> {
  const out: Record<string, PlayerOrientation> = { ...(phase.holdOrientations ?? {}) };
  for (const m of [...(phase.players ?? []), ...(phase.opponents ?? [])]) {
    if (m.orientation) out[m.playerId] = m.orientation;
  }
  return out;
}

function compilePhase(phase: LessonFilmPhase): TacticalAnimationStep {
  const actions: TacticalAnimationAction[] = [
    { kind: "phase", phase: phase.phase },
  ];

  if (phase.highlightPlayerIds?.length || phase.isTrigger) {
    actions.push({
      kind: "highlight",
      playerIds: phase.highlightPlayerIds ?? [],
    });
  }

  if (phase.zones?.length) {
    actions.push({ kind: "setZones", zones: phase.zones });
  }

  if (phase.lines?.length) {
    actions.push({ kind: "setLines", lines: phase.lines });
  }

  for (const m of phase.players ?? []) {
    actions.push(playerMoveAction(m));
  }
  for (const m of phase.opponents ?? []) {
    actions.push(playerMoveAction(m));
  }

  if (phase.ball) {
    actions.push(...filmPass(phase.ball, phase.startMs, phase.durationMs));
    const holder = phase.ball.receiveHolderId ?? phase.ball.receiverId;
    if (holder) {
      actions.push(receiveBall(holder));
    }
  }

  if (phase.freezeMs && phase.freezeMs > 0) {
    actions.push({ kind: "hold" });
  }

  const orientations = orientationsForPhase(phase);
  const label = phase.isTrigger ? (phase.statusLabel || "TRIGGER") : phase.statusLabel;

  return {
    ...animStep(
      phase.id,
      phase.startMs,
      phase.durationMs + (phase.freezeMs ?? 0),
      label,
      actions,
      phase.teachingPoint,
    ),
    orientations: Object.keys(orientations).length ? orientations : undefined,
    isTrigger: phase.isTrigger,
    cameraHint: phase.camera
      ? {
          preset: phase.camera.preset,
          followPlayerIds: phase.camera.followPlayerIds,
          maxZoomHint: phase.camera.maxZoomHint,
        }
      : undefined,
  };
}

/**
 * Compile a lesson film into a runtime animation definition.
 * Drop into useTacticalAnimation / TacticalIllustration via `definition`.
 */
export function compileFilm(spec: LessonFilmSpec): TacticalAnimationDefinition {
  const steps = [...spec.phases]
    .sort((a, b) => a.startMs - b.startMs)
    .map(compilePhase);

  const built = buildAnimation(spec.id, spec.situationId, steps, {
    pauseAtEndMs: spec.pauseAtEndMs ?? 1600,
    autoplay: spec.autoplay ?? true,
    loop: spec.loop ?? false,
    complexity: "pattern",
    positioningMode: "authored",
  });

  // Prefer authored total when provided (allows intentional end holds).
  if (spec.totalDurationMs > built.durationMs) {
    return { ...built, durationMs: spec.totalDurationMs };
  }
  return built;
}

/** Type guard — useful when lessons optionally attach a film. */
export function isLessonFilmSpec(value: unknown): value is LessonFilmSpec {
  if (!value || typeof value !== "object") return false;
  const v = value as LessonFilmSpec;
  return (
    typeof v.id === "string" &&
    typeof v.situationId === "string" &&
    Array.isArray(v.phases) &&
    typeof v.totalDurationMs === "number"
  );
}
