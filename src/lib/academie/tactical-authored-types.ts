/**
 * Authored UEFA-Pro scenario model — hand-designed phases are source of truth.
 * Validators report only; they never rewrite positions.
 */

import type { TacticalPoint } from "@/lib/academie/tactical-visual-system";
import type {
  AttackStructure,
  BlockHeight,
  OpponentDefensiveModel,
  RestDefenseShape,
} from "@/lib/academie/tactical-game-model";
import type { AuthoredPassSpec } from "@/lib/academie/tactical-pass-lane";
import type { PlayerOrientation } from "@/lib/academie/tactical-orientation";
import type { AttackDirection } from "@/lib/academie/tactical-offside-release";

export type VerticalLane =
  | "left-touchline"
  | "left-halfspace"
  | "central"
  | "right-halfspace"
  | "right-touchline";

export type HorizontalZone =
  | "first-build"
  | "second-build"
  | "middle"
  | "attacking-mid"
  | "final-third"
  | "box";

export type AuthoredPosition = {
  at: TacticalPoint;
  lane: VerticalLane;
  zone: HorizontalZone;
  role: string;
  orientation?: PlayerOrientation;
};

export type AuthoredScenarioPhase = {
  id: string;
  ballHolder: string;
  ballAt: TacticalPoint;
  ballZone: string;
  coachingPoint: string;
  usShape: Record<string, AuthoredPosition>;
  opponentShape: Record<string, AuthoredPosition>;
  plannedPasses?: AuthoredPassSpec[];
  attackStructure?: AttackStructure;
  restDefense?: RestDefenseShape;
};

export type AuthoredScenarioBrief = {
  id: string;
  lessonObjective: string;
  positioningMode: "authored";
  attackDirection: AttackDirection;
  us: {
    baseFormation: string;
    attackingShape: string;
    playerRoles: Record<string, string>;
    attackingBackId: string;
    tuckingBackId: string;
  };
  opponent: {
    defensiveModel: OpponentDefensiveModel;
    formation: string;
    blockHeight: BlockHeight;
    pressingTrigger: string;
    pressingDirection: string;
    markingPrinciple: string;
    playerRoles: Record<string, string>;
  };
  transitionThreats: string[];
  defensiveTransitionShape?: {
    usShape: Record<string, AuthoredPosition>;
    opponentShape: Record<string, AuthoredPosition>;
    ballHolder: string;
    ballAt: TacticalPoint;
  };
  phases: AuthoredScenarioPhase[];
};

export function laneFromY(y: number): VerticalLane {
  if (y < 22) return "left-touchline";
  if (y < 40) return "left-halfspace";
  if (y < 60) return "central";
  if (y < 78) return "right-halfspace";
  return "right-touchline";
}

export function zoneFromX(x: number): HorizontalZone {
  if (x < 22) return "first-build";
  if (x < 38) return "second-build";
  if (x < 55) return "middle";
  if (x < 72) return "attacking-mid";
  if (x < 88) return "final-third";
  return "box";
}

export function authoredAt(
  x: number,
  y: number,
  role: string,
  orientation?: PlayerOrientation,
): AuthoredPosition {
  return {
    at: { x, y },
    lane: laneFromY(y),
    zone: zoneFromX(x),
    role,
    orientation,
  };
}

export function shapeToMoves(
  shape: Record<string, AuthoredPosition>,
): Array<{ id: string; to: TacticalPoint }> {
  return Object.entries(shape).map(([id, p]) => ({ id, to: p.at }));
}

export function shapeToPoints(
  shape: Record<string, AuthoredPosition>,
): Record<string, TacticalPoint> {
  const out: Record<string, TacticalPoint> = {};
  for (const [id, p] of Object.entries(shape)) out[id] = p.at;
  return out;
}

/** Build situation markers from authored phase (avoids intro path collisions). */
export function playersFromAuthoredPhase(
  phase: AuthoredScenarioPhase,
  labelFromId: (id: string) => string = (id) => id.split(".").pop() ?? id,
): Array<{
  id: string;
  team: "us" | "opponent";
  label: string;
  at: TacticalPoint;
  hasBall?: boolean;
}> {
  const out: Array<{
    id: string;
    team: "us" | "opponent";
    label: string;
    at: TacticalPoint;
    hasBall?: boolean;
  }> = [];
  for (const [id, p] of Object.entries(phase.usShape)) {
    out.push({
      id,
      team: "us",
      label: labelFromId(id),
      at: p.at,
      ...(id === phase.ballHolder ? { hasBall: true } : {}),
    });
  }
  for (const [id, p] of Object.entries(phase.opponentShape)) {
    out.push({
      id,
      team: "opponent",
      label: labelFromId(id),
      at: p.at,
    });
  }
  return out;
}

export const AUTHORED_CANONICAL_IDS = [
  "connected-team",
  "kw-r6-ball",
  "press-good",
  "press-bad",
  "kw-choice-force",
  "kw-choice-relocate",
  "solo-support",
  "ta-lcv-buildup",
  "in-r6-win",
  "in-moment-rest",
  "me-spits-miss",
] as const;
