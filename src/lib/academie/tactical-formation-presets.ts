/**
 * Tactical Animation System V3 — formation presets & team shape metadata.
 * Field % coords, attack direction left → right for "us".
 */

import type { TacticalOurPosition, TacticalPoint, TacticalPlayerMarker } from "@/lib/academie/tactical-visual-system";
import { FORMATION_PRESS_BASE } from "@/lib/academie/tactical-visual-system";

export type TacticalFormationId =
  | "4-2-3-1"
  | "4-3-3"
  | "4-4-2"
  | "4-4-1-1"
  | "4-5-1"
  | "2-3-2-3"
  | "3-2-4-1";

export type TacticalGamePhase =
  | "build-up"
  | "progression"
  | "final-third"
  | "high-press"
  | "mid-block"
  | "low-block"
  | "transition";

export type TacticalTeamShape = {
  formation: TacticalFormationId;
  phase: TacticalGamePhase;
  direction: "left-to-right" | "right-to-left";
};

export function cloneFormation(
  base: Record<TacticalOurPosition, TacticalPoint>,
  overrides?: Partial<Record<TacticalOurPosition, TacticalPoint>>,
): Record<TacticalOurPosition, TacticalPoint> {
  return { ...base, ...overrides };
}

/** Ons team — neutrale 4-2-3-1 */
export const PRESET_US_4231_NEUTRAL: Record<TacticalOurPosition, TacticalPoint> = {
  GK: { x: 8, y: 50 },
  LB: { x: 20, y: 20 },
  LCV: { x: 20, y: 40 },
  RCV: { x: 20, y: 60 },
  RB: { x: 20, y: 80 },
  L6: { x: 36, y: 40 },
  R6: { x: 36, y: 60 },
  "10": { x: 54, y: 50 },
  LW: { x: 68, y: 22 },
  RW: { x: 68, y: 78 },
  SP: { x: 78, y: 50 },
};

/** Ons team — connected-team start (authored): gespreide 4-2-3-1, teamlengte ~48. */
export const PRESET_US_4231_PROGRESSION: Record<TacticalOurPosition, TacticalPoint> = {
  GK: { x: 12, y: 50 },
  LB: { x: 34, y: 14 },
  LCV: { x: 24, y: 36 },
  RCV: { x: 26, y: 64 },
  RB: { x: 36, y: 78 },
  L6: { x: 40, y: 38 },
  R6: { x: 46, y: 58 },
  "10": { x: 58, y: 42 },
  LW: { x: 72, y: 12 },
  RW: { x: 74, y: 88 },
  SP: { x: 76, y: 50 },
};

/** Ons team — hoge pressing (zonder bal) — synchroon met FORMATION_PRESS_BASE */
/** High press — alias of immutable PRESS_V2 / FORMATION_PRESS_BASE (C-007). */
export const PRESET_US_HIGH_PRESS: Record<TacticalOurPosition, TacticalPoint> = {
  ...FORMATION_PRESS_BASE,
};

/** Tegenstander 4-4-2 mid-block — herkenbare horizontale linies (authored connected-team). */
export function opponents442MidBlock(overrides?: Partial<Record<string, TacticalPoint>>): TacticalPlayerMarker[] {
  const base: Record<string, TacticalPoint> = {
    gk: { x: 94, y: 50 },
    lb: { x: 80, y: 14 },
    lcb: { x: 78, y: 36 },
    rcb: { x: 78, y: 64 },
    rb: { x: 80, y: 86 },
    lm: { x: 64, y: 16 },
    lcm: { x: 58, y: 40 },
    rcm: { x: 58, y: 58 },
    rm: { x: 64, y: 84 },
    lst: { x: 48, y: 42 },
    rst: { x: 48, y: 60 },
    ...overrides,
  };
  return Object.entries(base).map(([key, at]) => ({
    id: `opp.${key}`,
    team: "opponent" as const,
    label: key.toUpperCase().slice(0, 3),
    at,
  }));
}

/** Tegenstander 4-3-3 in opbouw (bal bij RCV / cbL) */
export function opponents433BuildUp(ballAt: "cbL" | "cbR" | "6" = "cbL"): TacticalPlayerMarker[] {
  const pts: Record<string, TacticalPoint> = {
    gk: { x: 94, y: 50 },
    lb: { x: 86, y: 18 },
    cbL: { x: 84, y: 38 },
    cbR: { x: 84, y: 62 },
    rb: { x: 86, y: 82 },
    "6": { x: 74, y: 50 },
    "8": { x: 68, y: 34 },
    "10": { x: 68, y: 66 },
    lw: { x: 60, y: 18 },
    st: { x: 56, y: 50 },
    rw: { x: 60, y: 82 },
  };
  return Object.entries(pts).map(([key, at]) => ({
    id: `opp.${key}`,
    team: "opponent" as const,
    label: key.length <= 3 ? key.toUpperCase() : key.slice(0, 2).toUpperCase(),
    at,
    hasBall: key === ballAt,
  }));
}

/** Tegenstander 4-2-3-1 middenblok (Kernwaarden) */
export function opponents4231MidBlock(): TacticalPlayerMarker[] {
  const pts: Record<string, TacticalPoint> = {
    gk: { x: 94, y: 50 },
    lb: { x: 80, y: 20 },
    lcb: { x: 78, y: 40 },
    rcb: { x: 78, y: 60 },
    rb: { x: 80, y: 80 },
    ldm: { x: 64, y: 40 },
    rdm: { x: 64, y: 60 },
    "10": { x: 54, y: 50 },
    lw: { x: 56, y: 26 },
    rw: { x: 56, y: 74 },
    st: { x: 46, y: 50 },
  };
  return Object.entries(pts).map(([key, at]) => ({
    id: `opp.${key}`,
    team: "opponent" as const,
    label: key.length <= 3 ? key.toUpperCase() : key.slice(0, 3).toUpperCase(),
    at,
  }));
}

/** Collectieve verschuiving van opponent markers. */
export function shiftOpponentBlock(
  players: TacticalPlayerMarker[],
  dx: number,
  dy: number,
): Array<{ id: string; to: TacticalPoint }> {
  return players
    .filter((p) => p.team === "opponent")
    .map((p) => ({
      id: p.id,
      to: {
        x: Math.max(4, Math.min(96, p.at.x + dx)),
        y: Math.max(6, Math.min(94, p.at.y + dy)),
      },
    }));
}

export function protectDepth(
  backLineIds: string[],
  depthX: number,
  opts?: { centerY?: number; spacing?: number },
): Array<{ id: string; to: TacticalPoint }> {
  const centerY = opts?.centerY ?? 50;
  const spacing = opts?.spacing ?? 14;
  const n = backLineIds.length;
  return backLineIds.map((id, i) => ({
    id,
    to: {
      x: Math.max(4, Math.min(96, depthX)),
      y: Math.max(6, Math.min(94, centerY + (i - (n - 1) / 2) * spacing)),
    },
  }));
}
