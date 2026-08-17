/**
 * Unified pass action — ball + lane + trail from one ballMove.
 */

import type { TacticalAnimationAction } from "@/lib/academie/tactical-animation-types";
import type { LessonFilmBall } from "@/lib/academie/tactical-engine/types";

/** Compile a lesson ball flight into engine actions (pass + clear possession mid-flight). */
export function filmPass(
  trajectory: LessonFilmBall,
  stepStartMs: number,
  stepDurationMs: number,
): TacticalAnimationAction[] {
  const dur = Math.max(stepDurationMs, 1);
  const releaseLocal = Math.max(0, Math.min(0.45, (trajectory.releaseTimeMs - stepStartMs) / dur));
  const arrivalLocal = Math.max(
    releaseLocal + 0.12,
    Math.min(0.94, (trajectory.arrivalTimeMs - stepStartMs) / dur),
  );
  const via =
    !trajectory.path || trajectory.path === "linear" || !trajectory.via?.length
      ? undefined
      : trajectory.via;

  return [
    {
      kind: "ballMove",
      from: trajectory.start,
      to: trajectory.end,
      via,
      easing: "easeOut",
      syncLane: true,
      trajectoryId: trajectory.id,
      passerId: trajectory.passerId,
      laneStatus:
        trajectory.status === "blocked" || trajectory.status === "intercepted" ? "fault" : "pass",
      releaseLocal,
      arrivalLocal,
    },
    { kind: "possession", holderId: null },
  ];
}
