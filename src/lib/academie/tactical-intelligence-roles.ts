/**
 * Tactical Intelligence Engine V1 — player roles + relational geometry.
 */

import type { TacticalPoint } from "@/lib/academie/tactical-visual-system";
import { dist } from "@/lib/academie/tactical-animation-collision";

export type TacticalPlayerRole =
  | "ball-carrier"
  | "receiver"
  | "support"
  | "third-player"
  | "width"
  | "depth"
  | "balance"
  | "rest-defense"
  | "primary-pressure"
  | "cover"
  | "mark"
  | "screen"
  | "protect-depth"
  | "far-side-balance"
  | "recovery"
  | "decoy"
  | "hold-width"
  | "hold-depth"
  | "hold-rest";

export type TacticalRoleReference =
  | "ball"
  | "teammate"
  | "opponent"
  | "zone"
  | "goal"
  | "offside-line";

export type TacticalPlayerRoleState = {
  playerId: string;
  team: "us" | "opponent";
  role: TacticalPlayerRole;
  reference: TacticalRoleReference;
  referenceId?: string;
  /** Soft hold: allowed to stay still with a declared reason. */
  holdReason?: string;
};

/** Distance guidelines in pitch-% (~1 unit ≈ 1m on 100-unit pitch). */
export const TACTICAL_DISTANCES = {
  supportShort: { min: 6, max: 10 },
  supportSecond: { min: 10, max: 15 },
  thirdPlayer: { min: 12, max: 20 },
  sixesApart: { min: 8, max: 14 },
  primaryPressure: { min: 1.5, max: 3.5 },
  cover: { min: 4, max: 8 },
  screen: { min: 5, max: 10 },
  /** Marker bodies ~3.3u; labels need ~6u+ so axes never share. */
  visualClear: 6.2,
  duelMin: 3.4,
  clusterRadius: 6,
  clusterMaxNormal: 3,
  clusterMaxDuel: 4,
  relevantBallRadius: 28,
} as const;

/** Min distance between two roles — duel may be tighter; others stay readable. */
export function minDistanceForRoles(roleA: string, roleB: string): number {
  const pair = new Set([roleA, roleB]);
  if (pair.has("ball-carrier") && pair.has("primary-pressure")) {
    return TACTICAL_DISTANCES.duelMin;
  }
  if (pair.has("receiver") && pair.has("primary-pressure")) {
    return TACTICAL_DISTANCES.duelMin;
  }
  if (pair.has("primary-pressure") && pair.has("cover")) {
    return TACTICAL_DISTANCES.cover.min;
  }
  return TACTICAL_DISTANCES.visualClear;
}

export function clampPitch(p: TacticalPoint): TacticalPoint {
  return {
    x: Math.max(4, Math.min(96, p.x)),
    y: Math.max(6, Math.min(94, p.y)),
  };
}

export function positionRelativeToBall(
  ball: TacticalPoint,
  opts: { horizontalOffset: number; verticalOffset: number },
): TacticalPoint {
  return clampPitch({
    x: ball.x + opts.horizontalOffset,
    y: ball.y + opts.verticalOffset,
  });
}

export function positionRelativeToOpponent(
  opponent: TacticalPoint,
  opts: {
    side: "inside" | "outside" | "goal-side" | "ball-side";
    distance: number;
    ball?: TacticalPoint;
  },
): TacticalPoint {
  const d = opts.distance;
  if (opts.side === "goal-side") {
    return clampPitch({ x: opponent.x - d, y: opponent.y });
  }
  if (opts.side === "ball-side" && opts.ball) {
    const dx = opts.ball.x - opponent.x;
    const dy = opts.ball.y - opponent.y;
    const len = Math.hypot(dx, dy) || 1;
    return clampPitch({
      x: opponent.x + (dx / len) * d,
      y: opponent.y + (dy / len) * d,
    });
  }
  if (opts.side === "inside") {
    return clampPitch({ x: opponent.x - d * 0.6, y: opponent.y + (opponent.y < 50 ? d * 0.4 : -d * 0.4) });
  }
  return clampPitch({ x: opponent.x + d * 0.4, y: opponent.y + (opponent.y < 50 ? -d : d) });
}

/** Third vertex of support triangle around ball carrier → receiver axis. */
export function positionAsSupportTriangle(
  ballCarrier: TacticalPoint,
  receiver: TacticalPoint,
  opts?: { angleDeg?: number; distance?: number; side?: "left" | "right" },
): TacticalPoint {
  const angle = ((opts?.angleDeg ?? 55) * Math.PI) / 180;
  const distance = opts?.distance ?? 11;
  const dx = receiver.x - ballCarrier.x;
  const dy = receiver.y - ballCarrier.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const sign = opts?.side === "right" ? 1 : -1;
  const px = -uy * sign;
  const py = ux * sign;
  const mid = {
    x: ballCarrier.x + ux * (len * 0.45),
    y: ballCarrier.y + uy * (len * 0.45),
  };
  return clampPitch({
    x: mid.x + px * distance * Math.sin(angle),
    y: mid.y + py * distance * Math.sin(angle),
  });
}

export function positionForRestDefense(
  ball: TacticalPoint,
  structure: "2+1" | "3+1" = "2+1",
): { lcv: TacticalPoint; rcv: TacticalPoint; six: TacticalPoint; gk: TacticalPoint } {
  // Collective rest-defense: tracks ball height — not a static deep park (was capped at x=28).
  const midApprox = Math.max(36, ball.x - 8);
  const baseX = Math.max(20, Math.min(ball.x - 20, midApprox - 12, 48));
  const centerY = 50 + (ball.y - 50) * 0.35;
  if (structure === "3+1") {
    return {
      lcv: clampPitch({ x: baseX, y: centerY - 12 }),
      rcv: clampPitch({ x: baseX, y: centerY + 12 }),
      six: clampPitch({ x: baseX + 10, y: centerY }),
      gk: clampPitch({ x: Math.max(6, baseX - 16), y: 50 + (ball.y - 50) * 0.28 }),
    };
  }
  return {
    lcv: clampPitch({ x: baseX, y: centerY - 11 }),
    rcv: clampPitch({ x: baseX + 1, y: centerY + 11 }),
    six: clampPitch({ x: baseX + 11, y: centerY + (centerY > 50 ? -4 : 4) }),
    gk: clampPitch({ x: Math.max(6, baseX - 16), y: 50 + (ball.y - 50) * 0.28 }),
  };
}

export function createThirdPlayerCombination(opts: {
  passer: TacticalPoint;
  receiver: TacticalPoint;
  side?: "left" | "right";
  distance?: number;
}): TacticalPoint {
  return positionAsSupportTriangle(opts.passer, opts.receiver, {
    angleDeg: 60,
    distance: opts.distance ?? 13,
    side: opts.side ?? "left",
  });
}

/** Arrival delay offsets (ms) relative to primary action start. */
export const ARRIVAL_OFFSETS = {
  primary: 0,
  support: 350,
  cover: 450,
  balance: 700,
  farSide: 850,
} as const;

export type SpaceOwnership = {
  zone: string;
  controlledBy: "us" | "opponent" | "contested" | "free";
  influencedByPlayerIds: string[];
};

export function occupancyAlongLane(
  from: TacticalPoint,
  to: TacticalPoint,
  players: Array<{ id: string; at: TacticalPoint; team: "us" | "opponent" }>,
  radius = 4.5,
): string[] {
  const blockers: string[] = [];
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  for (const p of players) {
    if (p.team !== "opponent") continue;
    // Project onto segment
    const t = Math.max(0, Math.min(1, ((p.at.x - from.x) * dx + (p.at.y - from.y) * dy) / (len * len)));
    const proj = { x: from.x + dx * t, y: from.y + dy * t };
    if (dist(p.at, proj) < radius && t > 0.12 && t < 0.88) blockers.push(p.id);
  }
  return blockers;
}

export function countInRadius(
  center: TacticalPoint,
  players: TacticalPoint[],
  radius: number,
): number {
  return players.filter((p) => dist(center, p) <= radius).length;
}
