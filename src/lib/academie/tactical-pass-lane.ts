/**
 * Pass-lane occlusion — hard geometric check for authored ball moves.
 * Report-only: never rewrites positions.
 */

import type { TacticalPoint } from "@/lib/academie/tactical-visual-system";
import { dist } from "@/lib/academie/tactical-animation-collision";

export type PassLaneStatus =
  | "open"
  | "pressured"
  | "blocked"
  | "interceptable"
  | "forced";

export type PassLaneException =
  | "dummy"
  | "one-touch"
  | "deflection"
  | "nutmeg"
  | "aerial"
  | "forced-error";

export type AuthoredPassSpec = {
  fromId: string;
  toId: string;
  /** Declared intent — validator compares geometry to this. */
  expectedStatus: PassLaneStatus;
  exception?: PassLaneException;
  /** Absolute ms when passer releases (for offside-at-release). */
  releaseTimeMs?: number;
};

export type PassLaneEvaluation = {
  status: PassLaneStatus;
  clearance: number;
  nearestOpponentId: string | null;
  nearestDistance: number;
  tOnLane: number;
};

/** Perpendicular distance from point to segment; t in [0,1] along segment. */
export function pointToSegment(
  p: TacticalPoint,
  a: TacticalPoint,
  b: TacticalPoint,
): { dist: number; t: number; closest: TacticalPoint } {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 < 1e-6) {
    return { dist: dist(p, a), t: 0, closest: { ...a } };
  }
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const closest = { x: a.x + t * dx, y: a.y + t * dy };
  return { dist: dist(p, closest), t, closest };
}

const BLOCKED_R = 3.2;
const INTERCEPT_R = 4.6;
const PRESSURED_R = 7.0;

/**
 * Evaluate pass corridor against opponent markers.
 * Only opponents with t ∈ (0.14, 0.82) count as corridor blockers
 * (near passer/receiver = pressure/marking, not pass-through).
 */
export function evaluatePassLane(
  from: TacticalPoint,
  to: TacticalPoint,
  opponents: Array<{ id: string; at: TacticalPoint }>,
  opts?: { intentionalForced?: boolean },
): PassLaneEvaluation {
  let nearestOpponentId: string | null = null;
  let nearestDistance = Infinity;
  let tOnLane = 0;

  for (const opp of opponents) {
    const { dist: d, t } = pointToSegment(opp.at, from, to);
    if (t < 0.14 || t > 0.82) continue;
    if (d < nearestDistance) {
      nearestDistance = d;
      nearestOpponentId = opp.id;
      tOnLane = t;
    }
  }

  if (!Number.isFinite(nearestDistance)) {
    return {
      status: "open",
      clearance: 99,
      nearestOpponentId: null,
      nearestDistance: 99,
      tOnLane: 0,
    };
  }

  let status: PassLaneStatus;
  if (nearestDistance < BLOCKED_R) {
    status = opts?.intentionalForced ? "forced" : "blocked";
  } else if (nearestDistance < INTERCEPT_R) {
    status = opts?.intentionalForced ? "forced" : "interceptable";
  } else if (nearestDistance < PRESSURED_R) {
    status = "pressured";
  } else {
    status = "open";
  }

  return {
    status,
    clearance: nearestDistance,
    nearestOpponentId,
    nearestDistance,
    tOnLane,
  };
}

/** Successful reception through blocked/interceptable lane without exception = hard error. */
export function isIllegalSuccessfulPass(
  evaled: PassLaneEvaluation,
  exception?: PassLaneException,
): boolean {
  if (exception) return false;
  return evaled.status === "blocked" || evaled.status === "interceptable";
}

export function passLaneLabel(status: PassLaneStatus): string {
  return status.toUpperCase();
}
