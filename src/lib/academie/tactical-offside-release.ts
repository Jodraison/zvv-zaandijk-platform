/**
 * Exact offside-at-pass-release evaluation (attack left→right by default).
 */

import type { TacticalPoint } from "@/lib/academie/tactical-visual-system";

export type AttackDirection = "left-to-right" | "right-to-left";

export type PassReleaseSnapshot = {
  sequenceId: string;
  phaseId: string;
  releaseTimeMs: number;
  passerId: string;
  receiverId: string;
  ballPosition: TacticalPoint;
  receiverPosition: TacticalPoint;
  opponentPositions: Array<{ id: string; at: TacticalPoint }>;
  attackDirection: AttackDirection;
};

export type OffsideStatus = "ONSIDE" | "LEVEL" | "OFFSIDE";

export type OffsideEvaluation = {
  status: OffsideStatus;
  receiverX: number;
  ballX: number;
  secondLastDefenderX: number;
  secondLastDefenderId: string | null;
  /** Positive = receiver ahead of second-last toward goal (offside risk). */
  difference: number;
  attackingHalf: boolean;
};

function nearerGoalX(dir: AttackDirection, a: number, b: number, eps = 0.35): boolean {
  return dir === "left-to-right" ? a > b + eps : a < b - eps;
}

function levelX(dir: AttackDirection, a: number, b: number, eps = 0.35): boolean {
  return Math.abs(a - b) <= eps;
}

/**
 * FIFA-style: offside only in attacking half, nearer goal than ball AND than second-last opponent.
 * LEVEL counts as onside.
 */
export function evaluateOffsideAtRelease(snap: PassReleaseSnapshot): OffsideEvaluation {
  const dir = snap.attackDirection;
  const rx = snap.receiverPosition.x;
  const bx = snap.ballPosition.x;
  const attackingHalf = dir === "left-to-right" ? rx > 50 : rx < 50;

  const outs = snap.opponentPositions.filter((p) => !p.id.toLowerCase().includes("gk"));
  const sorted = [...outs].sort((a, b) => (dir === "left-to-right" ? b.at.x - a.at.x : a.at.x - b.at.x));
  const second = sorted[1] ?? sorted[0];
  const secondX = second?.at.x ?? (dir === "left-to-right" ? 100 : 0);
  const secondId = second?.id ?? null;
  const difference = dir === "left-to-right" ? rx - secondX : secondX - rx;

  if (!attackingHalf) {
    return {
      status: "ONSIDE",
      receiverX: rx,
      ballX: bx,
      secondLastDefenderX: secondX,
      secondLastDefenderId: secondId,
      difference,
      attackingHalf,
    };
  }

  if (!nearerGoalX(dir, rx, bx)) {
    return {
      status: levelX(dir, rx, bx) ? "LEVEL" : "ONSIDE",
      receiverX: rx,
      ballX: bx,
      secondLastDefenderX: secondX,
      secondLastDefenderId: secondId,
      difference,
      attackingHalf,
    };
  }

  if (levelX(dir, rx, secondX)) {
    return {
      status: "LEVEL",
      receiverX: rx,
      ballX: bx,
      secondLastDefenderX: secondX,
      secondLastDefenderId: secondId,
      difference,
      attackingHalf,
    };
  }

  if (nearerGoalX(dir, rx, secondX)) {
    return {
      status: "OFFSIDE",
      receiverX: rx,
      ballX: bx,
      secondLastDefenderX: secondX,
      secondLastDefenderId: secondId,
      difference,
      attackingHalf,
    };
  }

  return {
    status: "ONSIDE",
    receiverX: rx,
    ballX: bx,
    secondLastDefenderX: secondX,
    secondLastDefenderId: secondId,
    difference,
    attackingHalf,
  };
}

export function formatOffsideLabel(ev: OffsideEvaluation): string {
  const m = Math.abs(ev.difference).toFixed(1);
  if (ev.status === "OFFSIDE") return `OFFSIDE ${m}`;
  if (ev.status === "LEVEL") return "LEVEL";
  return `ONSIDE +${m}`;
}
