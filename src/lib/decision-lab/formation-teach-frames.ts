/**
 * Canonical 4-2-3-1 → press occupation transform (C-010).
 * Three visible stages; mid stage is interpolated — no teleport.
 */

import {
  FORMATION_4231_US,
  PRESS_OPPONENTS,
  usPlayersFromFormation,
  ballAtReceivingFoot,
  type TacticalOurPosition,
  type TacticalPoint,
  type TacticalSituationDefinition,
  type TacticalPlayerMarker,
} from "@/lib/academie/tactical-visual-system";
import { PRESS_V2_US_START, pressV2UsMarkers } from "@/lib/academie/tactical-press-reference-v2";

function withDisplayLabels(players: TacticalPlayerMarker[]): TacticalPlayerMarker[] {
  return players.map((p) => ({
    ...p,
    label:
      p.id === "us.LCV"
        ? "LCB"
        : p.id === "us.RCV"
          ? "RCB"
          : p.id === "us.L6"
            ? "6"
            : p.id === "us.R6"
              ? "8"
              : p.id === "us.SP"
                ? "ST"
                : p.label,
    hasBall: false,
  }));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpPoint(a: TacticalPoint, b: TacticalPoint, t: number): TacticalPoint {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

/** Mid-press adjustment — still recognisable 4231 roles, moving toward PRESS_V2. */
export function lerpUsFormation(
  from: Record<TacticalOurPosition, TacticalPoint>,
  to: Record<TacticalOurPosition, TacticalPoint>,
  t: number,
): Record<TacticalOurPosition, TacticalPoint> {
  const out = {} as Record<TacticalOurPosition, TacticalPoint>;
  for (const key of Object.keys(from) as TacticalOurPosition[]) {
    out[key] = lerpPoint(from[key], to[key], t);
  }
  return out;
}

export const TRANSFORM_T_TRIGGER = 0.42;

export const FORMATION_TRIGGER_US = lerpUsFormation(
  FORMATION_4231_US,
  PRESS_V2_US_START,
  TRANSFORM_T_TRIGGER,
);

const US_4231 = withDisplayLabels(usPlayersFromFormation(FORMATION_4231_US));
const US_TRIGGER = withDisplayLabels(usPlayersFromFormation(FORMATION_TRIGGER_US));
const LB = { x: 80, y: 84 };
const BALL_TRIGGER = { x: 81, y: 76 };

function movementHints(
  from: Record<TacticalOurPosition, TacticalPoint>,
  to: Record<TacticalOurPosition, TacticalPoint>,
  roles: TacticalOurPosition[],
) {
  return roles.map((role) => ({
    kind: "run" as const,
    from: from[role],
    to: to[role],
    dashed: true,
    opacity: 0.55,
  }));
}

/** STAGE 1 — BASE SHAPE */
export const TRANSFORM_FRAME_BASE: TacticalSituationDefinition = {
  id: "connected-team",
  eyebrow: "SITUATIE",
  title: "Onze basis: 4-2-3-1",
  subtitle: "Blauw ZVV — wij vallen naar rechts aan",
  homeShape: { formation: "4-2-3-1", phase: "build-up", direction: "left-to-right" },
  players: US_4231,
  lines: [],
  zones: [],
};

/** STAGE 2 — TRIGGER DEVELOPS (interpolated, not teleport) */
export const TRANSFORM_FRAME_TRIGGER: TacticalSituationDefinition = {
  id: "connected-team",
  eyebrow: "SITUATIE",
  title: "Hun opbouw komt op gang",
  subtitle: "Bal naar hun back — onze 4-2-3-1 schuift mee",
  homeShape: { formation: "4-2-3-1", phase: "build-up", direction: "left-to-right" },
  opponentShape: { formation: "4-2-3-1", phase: "build-up", direction: "right-to-left" },
  players: [
    ...US_TRIGGER,
    ...PRESS_OPPONENTS.map((p) => ({
      ...p,
      hasBall: p.id === "opp.lb" || p.id === "opp.cbL",
    })),
  ],
  ball: ballAtReceivingFoot(BALL_TRIGGER, { foot: "right", facingDeg: 200 }),
  lines: movementHints(FORMATION_4231_US, FORMATION_TRIGGER_US, [
    "RW",
    "R6",
    "L6",
    "RB",
    "LW",
    "SP",
    "10",
  ]),
  zones: [],
};

/** STAGE 3 — PRESS OCCUPATION (roles still 4231 labels) */
export const TRANSFORM_FRAME_PRESS: TacticalSituationDefinition = {
  id: "fdl-gs-inside-close-live",
  eyebrow: "SITUATIE",
  title: "Pressvorm vanuit 4-2-3-1",
  subtitle: "Zelfde rollen — compacte bezetting. RW is first press.",
  homeShape: { formation: "4-4-2", phase: "high-press", direction: "left-to-right" },
  opponentShape: { formation: "4-2-3-1", phase: "build-up", direction: "right-to-left" },
  players: [
    ...pressV2UsMarkers(PRESS_V2_US_START),
    ...PRESS_OPPONENTS.map((p) => ({
      ...p,
      hasBall: p.id === "opp.lb",
    })),
  ],
  ball: ballAtReceivingFoot(LB, { foot: "right", facingDeg: 205 }),
  lines: [],
  zones: [],
};

/** Back-compat aliases used by first-use / tests */
export const ORIENTATION_FRAME_BASE_4231 = TRANSFORM_FRAME_BASE;
export const ORIENTATION_FRAME_WITH_OPPONENT = TRANSFORM_FRAME_TRIGGER;
export const ORIENTATION_FRAME_PRESS_SITUATION = TRANSFORM_FRAME_PRESS;

export const FORMATION_TEACH_FRAMES = [
  {
    id: "base",
    label: "Basis 4-2-3-1",
    title: "Onze basis: 4-2-3-1",
    situation: TRANSFORM_FRAME_BASE,
    cameraMode: "full" as const,
    orientationNote: "Onze basis: 4-2-3-1",
    phase: "Wij bouwen op" as const,
  },
  {
    id: "trigger",
    label: "Trigger",
    title: "Hun opbouw komt op gang",
    situation: TRANSFORM_FRAME_TRIGGER,
    cameraMode: "full" as const,
    orientationNote: "4-2-3-1 schuift naar press",
    phase: "Zij bouwen op" as const,
  },
  {
    id: "press",
    label: "Pressvorm",
    title: "Pressvorm vanuit 4-2-3-1",
    situation: TRANSFORM_FRAME_PRESS,
    cameraMode: "press-detail" as const,
    orientationNote: "Zelfde rollen · pressbezetting",
    phase: "Wij zetten druk" as const,
  },
] as const;

/** Assert midpoints sit between base and press (for tests). */
export function assertTransformTraceable(): { ok: boolean; issues: string[] } {
  const issues: string[] = [];
  for (const role of Object.keys(FORMATION_4231_US) as TacticalOurPosition[]) {
    const a = FORMATION_4231_US[role];
    const m = FORMATION_TRIGGER_US[role];
    const b = PRESS_V2_US_START[role];
    const dxBase = Math.hypot(m.x - a.x, m.y - a.y);
    const dxPress = Math.hypot(b.x - m.x, b.y - m.y);
    const dxDirect = Math.hypot(b.x - a.x, b.y - a.y);
    if (dxDirect > 1 && dxBase + dxPress < dxDirect * 0.95) {
      issues.push(`${role}: mid not on path`);
    }
    // Mid should not equal start or end for roles that move
    if (dxDirect > 4 && (dxBase < 0.5 || dxPress < 0.5)) {
      issues.push(`${role}: teleport risk`);
    }
  }
  return { ok: issues.length === 0, issues };
}
