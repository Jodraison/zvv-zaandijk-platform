/**
 * Development-only motion continuity audit for connected-team scene boundaries.
 * Not used in Academy Mode UI — export for author/debug + headless QA.
 */

import { evaluateTacticalAnimation } from "@/lib/academie/tactical-animation-engine";
import { getTacticalAnimation } from "@/lib/academie/tactical-animation-registry";
import { getTacticalSituation } from "@/components/academie/tactical-situations";
import type { TacticalPoint } from "@/lib/academie/tactical-visual-system";

export const CONNECTED_TEAM_SCENE_BOUNDS_MS = [
  3800, 8200, 11600, 15200, 18200, 22800, 27400, 29600, 31000, 32400, 34400, 36200, 38000,
] as const;

export const CONNECTED_TEAM_KEY_PLAYERS = [
  "us.R6",
  "us.10",
  "us.SP",
  "us.RW",
  "us.RB",
  "us.L6",
] as const;

export type MotionBoundarySample = {
  playerId: string;
  boundaryMs: number;
  before: TacticalPoint;
  after: TacticalPoint;
  positionDelta: number;
  speedBefore: number;
  speedAfter: number;
  speedDeltaPct: number;
  angleBeforeDeg: number;
  angleAfterDeg: number;
  angleDeltaDeg: number;
  flags: string[];
};

function dist(a: TacticalPoint, b: TacticalPoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function angleDeg(from: TacticalPoint, to: TacticalPoint): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.hypot(dx, dy) < 0.05) return Number.NaN;
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

function angleDelta(a: number, b: number): number {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  let d = b - a;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return Math.abs(d);
}

export function auditConnectedTeamMotionBoundaries(
  dtMs = 100,
): MotionBoundarySample[] {
  const sit = getTacticalSituation("connected-team");
  const anim = getTacticalAnimation("connected-team");
  if (!sit || !anim) return [];

  const out: MotionBoundarySample[] = [];

  for (const boundaryMs of CONNECTED_TEAM_SCENE_BOUNDS_MS) {
    for (const playerId of CONNECTED_TEAM_KEY_PLAYERS) {
      const t0 = Math.max(0, boundaryMs - dtMs);
      const t1 = boundaryMs;
      const t2 = Math.min(anim.durationMs, boundaryMs + dtMs);

      const f0 = evaluateTacticalAnimation(sit, anim, t0);
      const f1 = evaluateTacticalAnimation(sit, anim, t1);
      const f2 = evaluateTacticalAnimation(sit, anim, t2);

      const p0 = f0.playerAt[playerId];
      const p1 = f1.playerAt[playerId];
      const p2 = f2.playerAt[playerId];
      if (!p0 || !p1 || !p2) continue;

      const speedBefore = dist(p0, p1) / (dtMs / 1000);
      const speedAfter = dist(p1, p2) / (dtMs / 1000);
      const angleBefore = angleDeg(p0, p1);
      const angleAfter = angleDeg(p1, p2);
      const atBoundaryJump = dist(
        evaluateTacticalAnimation(sit, anim, boundaryMs - 1).playerAt[playerId] ?? p1,
        p1,
      );

      const speedDeltaPct =
        speedBefore < 0.15
          ? speedAfter > 1.2
            ? 100
            : 0
          : (Math.abs(speedAfter - speedBefore) / speedBefore) * 100;
      const angleDeltaDeg = angleDelta(angleBefore, angleAfter);

      const flags: string[] = [];
      if (atBoundaryJump > 0.35) flags.push("position-jump");
      if (speedDeltaPct > 35 && !(speedBefore < 0.2 && speedAfter > speedBefore)) {
        flags.push("speed-jump");
      }
      if (angleDeltaDeg > 35 && speedBefore > 0.4 && speedAfter > 0.4) {
        flags.push("direction-jump");
      }

      out.push({
        playerId,
        boundaryMs,
        before: p0,
        after: p2,
        positionDelta: atBoundaryJump,
        speedBefore,
        speedAfter,
        speedDeltaPct,
        angleBeforeDeg: angleBefore,
        angleAfterDeg: angleAfter,
        angleDeltaDeg,
        flags,
      });
    }
  }

  return out;
}
