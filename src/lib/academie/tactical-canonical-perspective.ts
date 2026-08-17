/**
 * Canonical ZVV Academy / Decision Lab team perspective (C-007).
 * Single source for colors, attack direction, base 4-2-3-1, and phase labels.
 */

import {
  FORMATION_4231_US,
  FORMATION_PRESS_BASE,
  type TacticalOurPosition,
  type TacticalPoint,
  type TacticalPlayerMarker,
  type TacticalSituationDefinition,
  type TacticalTeam,
} from "@/lib/academie/tactical-visual-system";
import { TACTICAL_COLORS } from "@/lib/academie/tactical-visual-tokens";
import { academyDisplayRole } from "@/lib/academie/tactical-film-standard-v1";

/** Stable display order for full-team phases. */
export const ZVV_4231_ROLES = [
  "GK",
  "LB",
  "LCB",
  "RCB",
  "RB",
  "6",
  "8",
  "10",
  "LW",
  "RW",
  "ST",
] as const;

export type Zvv4231Role = (typeof ZVV_4231_ROLES)[number];

/** Internal position keys → display roles. */
export const ZVV_POSITION_TO_DISPLAY: Record<TacticalOurPosition, Zvv4231Role> = {
  GK: "GK",
  LB: "LB",
  LCV: "LCB",
  RCV: "RCB",
  RB: "RB",
  L6: "6",
  R6: "8",
  "10": "10",
  LW: "LW",
  RW: "RW",
  SP: "ST",
};

export const ZVV_CANONICAL = {
  clubName: "ZVV Zaandijk",
  teamLabel: "WIJ — ZVV ZAANDIJK",
  opponentLabel: "TEGENSTANDER",
  /** Our markers always use team: "us" → blue */
  ourTeam: "us" as TacticalTeam,
  opponentTeam: "opponent" as TacticalTeam,
  ourColor: TACTICAL_COLORS.us,
  opponentColor: TACTICAL_COLORS.opponent,
  /**
   * Attack L→R (+x). Defend toward left goal.
   * Opponent buildup typically advances right→left.
   */
  attackDirection: "left-to-right" as const,
  attackDirectionLabel: "Aanval →",
  defendDirectionLabel: "← Verdediging",
  baseFormation: "4-2-3-1" as const,
  baseShape: FORMATION_4231_US,
  /** Pressing phase occupation — derived from 4-2-3-1 (readable 4-4-2). */
  pressingShape: FORMATION_PRESS_BASE,
  perspectiveSentence:
    "Je speelt als het blauwe ZVV Zaandijk-team vanuit onze 4-2-3-1.",
} as const;

export type TacticalPhaseLabel =
  | "Zij bouwen op"
  | "Wij zetten druk"
  | "Balverlies"
  | "Wij bouwen op"
  | "Wij verdedigen"
  | "Omschakelen";

export type TacticalOrientationSpec = {
  phase: TacticalPhaseLabel;
  activeRole?: string;
  /** Attack direction shown to learner */
  showAttackDirection?: boolean;
  baseFormationNote?: string;
};

/** Default orientation for Golden Session / pressing Decision Lab previews. */
export const GS_ORIENTATION: TacticalOrientationSpec = {
  phase: "Zij bouwen op",
  activeRole: "RW",
  showAttackDirection: true,
  baseFormationNote: "Vanuit 4-2-3-1",
};

export function usMarkersFromCanonical4231(
  ballHolder?: TacticalOurPosition,
): TacticalPlayerMarker[] {
  return (Object.keys(ZVV_CANONICAL.baseShape) as TacticalOurPosition[]).map((pos) => ({
    id: `us.${pos}`,
    team: ZVV_CANONICAL.ourTeam,
    label: ZVV_POSITION_TO_DISPLAY[pos],
    at: ZVV_CANONICAL.baseShape[pos],
    hasBall: ballHolder === pos,
  }));
}

export function resolveActiveRoleLabel(roleOrId: string): string {
  return academyDisplayRole(roleOrId);
}

export type SemanticValidationIssue = {
  code: string;
  message: string;
};

/**
 * Validate a situation for Decision Lab rendering.
 * Full-team phases require 11 us players with stable IDs.
 */
export function validateTacticalSituationSemantics(
  sit: TacticalSituationDefinition,
  opts?: {
    requireFullUsTeam?: boolean;
    expectedActiveRoleId?: string;
    requireBallHolder?: boolean;
  },
): SemanticValidationIssue[] {
  const issues: SemanticValidationIssue[] = [];
  const requireFull = opts?.requireFullUsTeam ?? true;
  const requireBall = opts?.requireBallHolder ?? true;

  const us = sit.players.filter((p) => p.team === "us");
  const opp = sit.players.filter((p) => p.team === "opponent");

  if (us.length === 0) {
    issues.push({ code: "missing-us", message: "No our-team (us) players" });
  }
  if (opp.length === 0) {
    issues.push({ code: "missing-opp", message: "No opponent players" });
  }

  const usIds = us.map((p) => p.id);
  if (new Set(usIds).size !== usIds.length) {
    issues.push({ code: "dup-us-id", message: "Duplicate our-team player ids" });
  }
  const oppIds = opp.map((p) => p.id);
  if (new Set(oppIds).size !== oppIds.length) {
    issues.push({ code: "dup-opp-id", message: "Duplicate opponent player ids" });
  }

  // Color assignment is structural: us → blue, opponent → red (enforced by renderer).
  for (const p of us) {
    if (p.team !== "us") {
      issues.push({ code: "us-color", message: `Player ${p.id} not on us team` });
    }
  }
  for (const p of opp) {
    if (p.team !== "opponent") {
      issues.push({
        code: "opp-color",
        message: `Player ${p.id} not on opponent team`,
      });
    }
  }

  if (requireFull) {
    if (us.length !== 11) {
      issues.push({
        code: "us-count",
        message: `Expected 11 our players, got ${us.length}`,
      });
    }
    const required = [
      "us.GK",
      "us.LB",
      "us.LCV",
      "us.RCV",
      "us.RB",
      "us.L6",
      "us.R6",
      "us.10",
      "us.LW",
      "us.RW",
      "us.SP",
    ];
    for (const id of required) {
      if (!usIds.includes(id)) {
        issues.push({ code: "missing-role", message: `Missing required role ${id}` });
      }
    }
  }

  const holders = sit.players.filter((p) => p.hasBall);
  const ballPoint = sit.ball;
  if (requireBall) {
    if (holders.length === 0 && !ballPoint) {
      issues.push({ code: "no-ball", message: "No ball holder and no ball point" });
    }
    if (holders.length > 1) {
      issues.push({
        code: "multi-ball",
        message: `Multiple ball holders: ${holders.map((h) => h.id).join(",")}`,
      });
    }
  }

  if (opts?.expectedActiveRoleId) {
    const found = sit.players.some((p) => p.id === opts.expectedActiveRoleId);
    if (!found) {
      issues.push({
        code: "missing-active-role",
        message: `Active role ${opts.expectedActiveRoleId} not in situation`,
      });
    }
  }

  // Attack direction is canonical L→R for us.
  const dir = sit.homeShape?.direction;
  if (dir && dir !== "left-to-right") {
    issues.push({
      code: "attack-direction",
      message: `Our attack direction must be left-to-right (got ${dir}) on ${sit.id}`,
    });
  }

  // Base 4-2-3-1 resolvable
  const baseKeys = Object.keys(ZVV_CANONICAL.baseShape);
  if (baseKeys.length !== 11) {
    issues.push({ code: "base-4231", message: "Canonical 4-2-3-1 does not resolve to 11" });
  }

  return issues;
}

export function assertValidSituation(
  sit: TacticalSituationDefinition,
  opts?: Parameters<typeof validateTacticalSituationSemantics>[1],
): void {
  const issues = validateTacticalSituationSemantics(sit, opts);
  if (issues.length) {
    throw new Error(
      `Invalid tactical situation ${sit.id}: ${issues.map((i) => `${i.code}:${i.message}`).join("; ")}`,
    );
  }
}

/** Classify whether a us formation snapshot looks like attack 4-2-3-1 (SP ahead of 10 line). */
export function classifyUs4231Recognition(
  points: Record<string, TacticalPoint>,
): { ok: boolean; reason: string } {
  const sp = points.SP ?? points["us.SP"];
  const ten = points["10"] ?? points["us.10"];
  const rw = points.RW ?? points["us.RW"];
  const lw = points.LW ?? points["us.LW"];
  if (!sp || !ten || !rw || !lw) {
    return { ok: false, reason: "missing SP/10/RW/LW" };
  }
  // Attack 4-2-3-1: ST clearly ahead of AM line; wingers near AM depth
  if (sp.x > ten.x + 8 && Math.abs(rw.x - ten.x) < 18 && Math.abs(lw.x - ten.x) < 18) {
    return { ok: true, reason: "attack-4231" };
  }
  // Pressing occupation derived from 4231: dual front (SP+10), wingers deeper
  if (Math.abs(sp.x - ten.x) < 6 && rw.x < ten.x - 5 && lw.x < ten.x - 5) {
    return { ok: true, reason: "press-from-4231" };
  }
  return { ok: false, reason: "unrecognized shape" };
}
