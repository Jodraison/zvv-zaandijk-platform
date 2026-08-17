/**
 * Academy Tactical Film Standard V2 — pressure reference pair ONLY.
 *
 * Immutable shared start + authored end frames for press-bad / press-good.
 * Ball at opponent LB (our right flank). First press = us.RW.
 * Single principle delta: team connects behind RW (good) vs not (bad).
 */

import type { TacticalOurPosition, TacticalPoint, TacticalPlayerMarker } from "@/lib/academie/tactical-visual-system";
import { academyDisplayRole } from "@/lib/academie/tactical-film-standard-v1";

/** Field % positions — attack L→R. y=0 left wing, y=100 right wing. */
export type PressShape = Record<string, TacticalPoint>;

/**
 * Canonical compact 4-4-2 (us) — width ~35.4m (y22–74), length ~25.2m (x28–52).
 * Gaps front→mid / mid→back ≈ 10.5–12.6m.
 */
export const PRESS_V2_US_START: Record<TacticalOurPosition, TacticalPoint> = {
  GK: { x: 12, y: 50 },
  LB: { x: 30, y: 22 },
  LCV: { x: 28, y: 38 },
  RCV: { x: 28, y: 56 },
  RB: { x: 30, y: 74 },
  LW: { x: 40, y: 22 },
  L6: { x: 40, y: 40 },
  R6: { x: 40, y: 56 },
  RW: { x: 40, y: 74 },
  SP: { x: 52, y: 40 },
  "10": { x: 52, y: 56 },
};

/**
 * Opponent BUILDUP 4-2-3-1 — ball at LB (their left / our right flank, high y).
 * Clear lines: backs / double pivot / 10+wings / ST.
 */
export const PRESS_V2_OPP_START: TacticalPlayerMarker[] = [
  { id: "opp.gk", team: "opponent", label: "GK", at: { x: 94, y: 50 } },
  { id: "opp.rb", team: "opponent", label: "RB", at: { x: 80, y: 16 } },
  { id: "opp.cbR", team: "opponent", label: "RCB", at: { x: 82, y: 36 } },
  { id: "opp.cbL", team: "opponent", label: "LCB", at: { x: 82, y: 60 } },
  { id: "opp.lb", team: "opponent", label: "LB", at: { x: 80, y: 84 }, hasBall: true },
  { id: "opp.6", team: "opponent", label: "6", at: { x: 66, y: 40 } },
  { id: "opp.8", team: "opponent", label: "8", at: { x: 64, y: 68 } },
  { id: "opp.rw", team: "opponent", label: "RW", at: { x: 56, y: 14 } },
  { id: "opp.10", team: "opponent", label: "10", at: { x: 58, y: 50 } },
  { id: "opp.lw", team: "opponent", label: "LW", at: { x: 56, y: 86 } },
  { id: "opp.st", team: "opponent", label: "ST", at: { x: 48, y: 50 } },
];

export const PRESS_V2_BALL_START: TacticalPoint = { x: 80, y: 84 };

/** Body facing (deg, 0 = +x attack). Shared at t=0 for both films. */
export const PRESS_V2_ORIENT_START: Record<string, number> = {
  "us.GK": 0,
  "us.LB": 10,
  "us.LCV": 5,
  "us.RCV": -5,
  "us.RB": -10,
  "us.LW": 15,
  "us.L6": 5,
  "us.R6": -10,
  "us.RW": -25,
  "us.SP": 5,
  "us.10": -5,
  "opp.gk": 180,
  "opp.rb": 180,
  "opp.cbR": 180,
  "opp.cbL": 175,
  "opp.lb": 200,
  "opp.6": 180,
  "opp.8": 190,
  "opp.rw": 180,
  "opp.10": 180,
  "opp.lw": 170,
  "opp.st": 180,
};

/**
 * Immutable start package — both press-bad and press-good MUST import this.
 * Never duplicate coordinates in sequences.
 */
export const PRESS_REFERENCE_START_STATE = {
  version: "2.0.0",
  usFormation: "4-4-2" as const,
  opponentModel: "BUILDUP_4_2_3_1" as const,
  ballHolder: "opp.lb" as const,
  ballAt: PRESS_V2_BALL_START,
  us: PRESS_V2_US_START,
  opponents: PRESS_V2_OPP_START,
  orientations: PRESS_V2_ORIENT_START,
  camera: { mode: "full" as const },
  triggerCaption: "Trigger: de back ontvangt gesloten aan de zijlijn.",
} as const;

/** Detail-camera focus IDs (pressing zone ~35–50% of pitch). */
export const PRESS_V2_DETAIL_FOCUS_IDS = [
  "opp.lb",
  "opp.8",
  "opp.cbL",
  "opp.lw",
  "us.RW",
  "us.R6",
  "us.L6",
  "us.RB",
  "us.RCV",
] as const;

/**
 * Fixed teaching crop around ball-side press (field %).
 * ~ right half / high-y flank — keeps RW, 8, 6, RB/RCB + LB options in frame.
 */
export const PRESS_V2_DETAIL_FIELD_RECT = {
  x: 44,
  y: 42,
  w: 54,
  h: 56,
} as const;

/**
 * BAD end — only RW presses; team stays essentially at start.
 * Open inside lane: LB → opp.8.
 */
export const PRESS_V2_BAD_US_END: Record<TacticalOurPosition, TacticalPoint> = {
  ...PRESS_V2_US_START,
  RW: { x: 72, y: 82 },
  // Minimal / late: everyone else nearly stays — principle = no connection
  R6: { x: 41, y: 58 },
  L6: { x: 40, y: 42 },
  RB: { x: 31, y: 74 },
  RCV: { x: 28, y: 56 },
  "10": { x: 51, y: 56 },
  SP: { x: 51, y: 42 },
  LW: { x: 40, y: 24 },
  LB: { x: 30, y: 24 },
};

export const PRESS_V2_BAD_BALL_RESULT: TacticalPoint = { x: 66, y: 66 }; // through to opp.8
export const PRESS_V2_BAD_OPP_8_RECV: TacticalPoint = { x: 66, y: 66 };

/**
 * GOOD end — five-role pressing geometry, 4-4-2 still readable.
 *
 *   RW → BAL(LB)
 *     8
 *   6
 * RCB   RB
 *
 * Meter targets (105×68): RW–8 7–11, 8–6 7–12, RW–RB 8–13, RB–RCB 8–12.
 */
export const PRESS_V2_GOOD_US_END: Record<TacticalOurPosition, TacticalPoint> = {
  GK: { x: 14, y: 52 },
  LB: { x: 32, y: 28 },
  LCV: { x: 30, y: 42 },
  RCV: { x: 54, y: 68 },
  RB: { x: 62, y: 78 },
  LW: { x: 40, y: 30 },
  L6: { x: 56, y: 64 },
  R6: { x: 64, y: 74 },
  RW: { x: 72, y: 80 },
  SP: { x: 52, y: 44 },
  "10": { x: 54, y: 58 },
};

/** LB forced back to LCB. */
export const PRESS_V2_GOOD_BALL_RESULT: TacticalPoint = { x: 84, y: 62 };
export const PRESS_V2_GOOD_OPP_SHIFTS: PressShape = {
  "opp.lb": { x: 82, y: 86 },
  "opp.cbL": { x: 84, y: 62 },
  "opp.8": { x: 62, y: 70 },
  "opp.lw": { x: 54, y: 88 },
};

export const PRESS_V2_ROLES = {
  FIRST_PRESS: "us.RW",
  SECOND_PRESS: "us.R6",
  INSIDE_COVER: "us.L6",
  DEPTH_COVER: "us.RB",
  DEPTH_COVER_2: "us.RCV",
  FAR_SIDE: ["us.LW", "us.LB", "us.SP", "us.10"] as const,
} as const;

/** Film seek anchors (ms) for evidence + QA. */
export const PRESS_V2_SEEKS = {
  start: 0,
  trigger: 1800,
  firstPress: 3200,
  secondPress: 4500,
  insideCover: 5600,
  depthCover: 6800,
  farSide: 7800,
  result: 9200,
  endHold: 11000,
} as const;

export function pressV2UsMarkers(
  formation: Record<TacticalOurPosition, TacticalPoint> = PRESS_V2_US_START,
): TacticalPlayerMarker[] {
  return (Object.keys(formation) as TacticalOurPosition[]).map((pos) => ({
    id: `us.${pos}`,
    team: "us" as const,
    label: academyDisplayRole(`us.${pos}`),
    at: formation[pos],
  }));
}

export function pressV2OppMarkers(
  base: TacticalPlayerMarker[] = PRESS_V2_OPP_START,
  overrides?: PressShape,
  ballHolder = "opp.lb",
): TacticalPlayerMarker[] {
  return base.map((p) => ({
    ...p,
    label: academyDisplayRole(p.id),
    at: overrides?.[p.id] ?? p.at,
    hasBall: p.id === ballHolder,
  }));
}

/** Field % → meters (FIFA 105×68). */
export function pressV2MetersBetween(a: TacticalPoint, b: TacticalPoint): number {
  const dx = ((a.x - b.x) / 100) * 105;
  const dy = ((a.y - b.y) / 100) * 68;
  return Math.hypot(dx, dy);
}

export type PressV2BodyRead = {
  facingAngleDeg: number;
  bodyShape: "closed" | "half-open" | "half-open-left" | "half-open-right" | "side-on" | "open";
  receivingFoot?: "left" | "right" | "either";
};

/**
 * Key-player body readability for detail view (LB / RW / 8 / RB).
 * Shared at start; press phase nudges RW/8/RB without inventing new geometry.
 */
export const PRESS_V2_BODY_KEY: Record<string, PressV2BodyRead> = {
  "opp.lb": { facingAngleDeg: 200, bodyShape: "closed", receivingFoot: "right" },
  "us.RW": { facingAngleDeg: -20, bodyShape: "half-open-right", receivingFoot: "left" },
  "us.R6": { facingAngleDeg: 15, bodyShape: "half-open", receivingFoot: "either" },
  "us.RB": { facingAngleDeg: -5, bodyShape: "side-on" },
};

export function getPressV2Orientation(
  situationId: string,
  playerId: string,
): PressV2BodyRead | undefined {
  if (
    situationId !== "press-good" &&
    situationId !== "press-bad" &&
    situationId !== "fdl-gs-inside-close-live" &&
    situationId !== "fdl-gs-inside-close-good" &&
    situationId !== "fdl-gs-inside-close-bad"
  ) {
    return undefined;
  }
  const key = PRESS_V2_BODY_KEY[playerId];
  if (key) return key;
  const deg = PRESS_V2_ORIENT_START[playerId];
  if (typeof deg === "number") {
    return { facingAngleDeg: deg, bodyShape: playerId.startsWith("opp.") ? "open" : "half-open" };
  }
  return undefined;
}

/** Spacing QA for good end geometry. */
export function pressV2GoodSpacingReport() {
  const g = PRESS_V2_GOOD_US_END;
  return {
    "RW-8": pressV2MetersBetween(g.RW, g.R6),
    "8-6": pressV2MetersBetween(g.R6, g.L6),
    "RW-RB": pressV2MetersBetween(g.RW, g.RB),
    "RB-RCB": pressV2MetersBetween(g.RB, g.RCV),
    targets: { "RW-8": [7, 11], "8-6": [7, 12], "RW-RB": [8, 13], "RB-RCB": [8, 12] },
  };
}
