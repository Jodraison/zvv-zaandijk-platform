/**
 * Pitch field-% → meters for UEFA-style spacing QA.
 * Standard pitch: 105m length × 68m width.
 * Attack L→R: x = length, y = width (y=0 left wing, y=100 right wing).
 */

import type { TacticalPoint } from "@/lib/academie/tactical-visual-system";

export const PITCH_LENGTH_M = 105;
export const PITCH_WIDTH_M = 68;

/** 1 field-% along x ≈ meters. */
export const PCT_X_TO_M = PITCH_LENGTH_M / 100;
/** 1 field-% along y ≈ meters. */
export const PCT_Y_TO_M = PITCH_WIDTH_M / 100;

export function pitchXToMeters(xPct: number): number {
  return xPct * PCT_X_TO_M;
}

export function pitchYToMeters(yPct: number): number {
  return yPct * PCT_Y_TO_M;
}

export function metersToPitchX(m: number): number {
  return (m / PITCH_LENGTH_M) * 100;
}

export function metersToPitchY(m: number): number {
  return (m / PITCH_WIDTH_M) * 100;
}

/** Euclidean distance in meters (anisotropic: x and y scaled differently). */
export function distanceMeters(a: TacticalPoint, b: TacticalPoint): number {
  const dx = (b.x - a.x) * PCT_X_TO_M;
  const dy = (b.y - a.y) * PCT_Y_TO_M;
  return Math.hypot(dx, dy);
}

/** Horizontal (width-axis) distance in meters — |Δy|. */
export function horizontalDistanceMeters(a: TacticalPoint, b: TacticalPoint): number {
  return Math.abs(b.y - a.y) * PCT_Y_TO_M;
}

/** Vertical (length-axis) distance in meters — |Δx| (attack direction). */
export function verticalDistanceMeters(a: TacticalPoint, b: TacticalPoint): number {
  return Math.abs(b.x - a.x) * PCT_X_TO_M;
}

export type TeamSpacingReport = {
  teamWidthM: number;
  teamLengthM: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  meanLineX?: number[];
  lineGapsM?: number[];
};

/** Width/length from player set (field %). Excludes GK unless includeGk. */
export function teamSpacingMeters(
  players: Record<string, TacticalPoint>,
  ids: string[],
): TeamSpacingReport {
  const pts = ids.map((id) => players[id]).filter(Boolean) as TacticalPoint[];
  if (!pts.length) {
    return { teamWidthM: 0, teamLengthM: 0, minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return {
    teamWidthM: (maxY - minY) * PCT_Y_TO_M,
    teamLengthM: (maxX - minX) * PCT_X_TO_M,
    minX,
    maxX,
    minY,
    maxY,
  };
}

/** Mean x of a line, then gap between consecutive line means (meters along length). */
export function lineGapsMeters(
  players: Record<string, TacticalPoint>,
  lines: string[][],
): { means: number[]; gapsM: number[] } {
  const means = lines.map((ids) => {
    const xs = ids.map((id) => players[id]?.x).filter((x): x is number => x != null);
    return xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
  });
  const gapsM: number[] = [];
  for (let i = 0; i < means.length - 1; i++) {
    gapsM.push(Math.abs(means[i + 1]! - means[i]!) * PCT_X_TO_M);
  }
  return { means, gapsM };
}

export const US_OUTFIELD = [
  "us.LB",
  "us.LCV",
  "us.RCV",
  "us.RB",
  "us.L6",
  "us.R6",
  "us.LW",
  "us.10",
  "us.RW",
  "us.SP",
] as const;

export const US_DEF_BACK = ["us.LB", "us.LCV", "us.RCV", "us.RB"] as const;
export const US_DEF_MID = ["us.LW", "us.L6", "us.R6", "us.RW"] as const;
export const US_DEF_FRONT = ["us.SP", "us.10"] as const;
export const US_ATTACK_FIVE = ["us.LW", "us.10", "us.SP", "us.RW", "us.RB"] as const;
export const US_REST_THREE = ["us.LB", "us.LCV", "us.RCV"] as const;
export const US_DOUBLE_PIVOT = ["us.L6", "us.R6"] as const;

export const OPP_BACK = ["opp.lb", "opp.lcb", "opp.rcb", "opp.rb"] as const;
export const OPP_MID = ["opp.lm", "opp.lcm", "opp.rcm", "opp.rm"] as const;
export const OPP_FRONT = ["opp.lst", "opp.rst"] as const;
export const OPP_OUTFIELD = [...OPP_BACK, ...OPP_MID, ...OPP_FRONT] as const;

/** Pass 7 spacing targets (meters). */
export const SPACING_TARGETS = {
  usPossession: { width: [55, 64], length: [35, 45], lineGap: [8, 14] },
  usDefense442: { width: [35, 44], length: [25, 32], lineGap: [8, 12], lineGapMax: 15 },
  oppMidblock442: { width: [38, 46], length: [26, 34], lineGap: [8, 13], lineGapMax: 15 },
} as const;
