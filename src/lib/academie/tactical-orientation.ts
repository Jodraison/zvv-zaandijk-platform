/**
 * Authored player orientation — facing, body shape, vision, next action.
 * Used for FOV validation and professional marker rendering.
 */

import type { TacticalPoint } from "@/lib/academie/tactical-visual-system";

/**
 * Six readable body states (Pass 4):
 * FRONTAL → open
 * HALF_OPEN_LEFT / HALF_OPEN_RIGHT → half-open-left / half-open-right
 * SIDE_ON → side-on
 * BACK_TO_GOAL → back-to-goal
 * CLOSED → closed
 * Legacy `half-open` kept for non-key players.
 */
export type BodyShape =
  | "open"
  | "half-open"
  | "half-open-left"
  | "half-open-right"
  | "closed"
  | "back-to-goal"
  | "side-on";

export type VisionTarget =
  | { type: "ball" }
  | { type: "goal" }
  | { type: "teammate"; playerId: string }
  | { type: "opponent"; playerId: string }
  | { type: "zone"; zoneId: string }
  | { type: "scan"; targets: string[] };

export type NextActionIntent =
  | "play-forward"
  | "recycle"
  | "turn"
  | "lay-off"
  | "protect"
  | "press"
  | "cover"
  | "run-in-behind";

export type PlayerOrientation = {
  facingAngleDeg: number;
  bodyShape: BodyShape;
  visionTarget: VisionTarget;
  receivingFoot?: "left" | "right" | "either";
  nextActionIntent?: NextActionIntent;
  /** True if player scanned in previous beat before this phase. */
  prePassScan?: boolean;
};

/** Degrees from point A looking toward B (0 = +x / attack right). */
export function angleToward(from: TacticalPoint, to: TacticalPoint): number {
  return (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
}

export function normalizeAngleDeg(deg: number): number {
  let d = deg % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

export function angleDeltaDeg(a: number, b: number): number {
  return Math.abs(normalizeAngleDeg(a - b));
}

/** Functional FOV half-angle by body shape (degrees). */
export function fovHalfAngle(shape: BodyShape): number {
  switch (shape) {
    case "open":
      return 90;
    case "half-open":
    case "half-open-left":
    case "half-open-right":
      return 75;
    case "side-on":
      return 65;
    case "back-to-goal":
      return 50;
    case "closed":
      return 40;
    default:
      return 60;
  }
}

/** Shoulder-axis tilt (deg) encoding open receiving side. */
export function shoulderTiltForBody(shape: BodyShape | undefined, strong: boolean): number {
  const s = strong ? 1 : 0.65;
  switch (shape) {
    case "open":
      return 10 * s;
    case "half-open-right":
      return 16 * s;
    case "half-open-left":
      return -16 * s;
    case "half-open":
      return 12 * s;
    case "side-on":
      return 22 * s;
    case "closed":
      return -8 * s;
    case "back-to-goal":
      return 0;
    default:
      return 0;
  }
}

/** Receiving-side label for QA / author overlays. */
export function receivingSideFor(
  shape: BodyShape | undefined,
  receivingFoot?: "left" | "right" | "either",
): "left" | "right" | "either" | "closed" {
  if (receivingFoot) return receivingFoot;
  if (shape === "half-open-left") return "left";
  if (shape === "half-open-right" || shape === "half-open" || shape === "open") return "right";
  if (shape === "closed") return "closed";
  return "either";
}

export function isPassInFieldOfView(
  facingAngleDeg: number,
  bodyShape: BodyShape,
  passVectorAngleDeg: number,
  opts?: { prePassScan?: boolean },
): boolean {
  const half = fovHalfAngle(bodyShape) + (opts?.prePassScan ? 25 : 0);
  return angleDeltaDeg(facingAngleDeg, passVectorAngleDeg) <= half;
}

export function orient(
  facingAngleDeg: number,
  bodyShape: BodyShape,
  visionTarget: VisionTarget,
  extras?: Partial<Pick<PlayerOrientation, "receivingFoot" | "nextActionIntent" | "prePassScan">>,
): PlayerOrientation {
  return {
    facingAngleDeg,
    bodyShape,
    visionTarget,
    ...extras,
  };
}
