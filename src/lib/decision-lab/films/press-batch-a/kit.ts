/**
 * Press Batch A (#2–#9) — shared film primitives only.
 * Not a shared timeline. Each session authors its own steps.
 */

import type {
  TacticalAnimationAction,
  TacticalAnimationStep,
} from "@/lib/academie/tactical-animation-types";
import type { PlayerOrientation } from "@/lib/academie/tactical-orientation";
import type { TacticalPoint } from "@/lib/academie/tactical-visual-system";

export function o(
  facingAngleDeg: number,
  bodyShape: PlayerOrientation["bodyShape"],
  extras?: Partial<PlayerOrientation>,
): PlayerOrientation {
  return {
    facingAngleDeg,
    bodyShape,
    visionTarget: extras?.visionTarget ?? { type: "ball" },
    receivingFoot: extras?.receivingFoot,
    nextActionIntent: extras?.nextActionIntent,
    prePassScan: extras?.prePassScan,
  };
}

export function move(
  playerId: string,
  to: TacticalPoint,
  easing: "linear" | "easeIn" | "easeOut" | "easeInOut" = "easeInOut",
  via?: TacticalPoint[],
  orientation?: PlayerOrientation,
): TacticalAnimationAction {
  return { kind: "playerMove", playerId, to, via, easing, orientation };
}

export function step(
  id: string,
  startMs: number,
  durationMs: number,
  label: string,
  actions: TacticalAnimationAction[],
  opts?: {
    teachingPoint?: string;
    orientations?: Record<string, PlayerOrientation>;
    isTrigger?: boolean;
    follow?: string[];
    zoom?: number;
    preset?: string;
  },
): TacticalAnimationStep {
  return {
    id,
    startMs,
    durationMs,
    label,
    actions,
    teachingPoint: opts?.teachingPoint,
    orientations: opts?.orientations,
    isTrigger: opts?.isTrigger,
    cameraHint: {
      preset: opts?.preset ?? "press-detail",
      followPlayerIds: opts?.follow,
      maxZoomHint: opts?.zoom ?? 1.2,
    },
  };
}

export function flipY(p: TacticalPoint): TacticalPoint {
  return { x: p.x, y: 100 - p.y };
}
