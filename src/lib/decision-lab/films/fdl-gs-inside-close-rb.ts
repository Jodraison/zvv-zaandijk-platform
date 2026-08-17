/**
 * FDL-GS-INSIDE-CLOSE-RB-PRESS-V1 — Golden Session teaching film (C-003B polish).
 *
 * Mute-test: trigger → first touch → open inside → decide → curve vs straight → consequence.
 * Experience-only. Not a reusable template.
 */

import { createPressingArc } from "@/lib/academie/tactical-animation-collision";
import type {
  TacticalAnimationAction,
  TacticalAnimationDefinition,
  TacticalAnimationStep,
} from "@/lib/academie/tactical-animation-types";
import {
  PRESS_V2_BAD_BALL_RESULT,
  PRESS_V2_BAD_US_END,
  PRESS_V2_GOOD_BALL_RESULT,
  PRESS_V2_GOOD_US_END,
  PRESS_V2_OPP_START,
  PRESS_V2_US_START,
  pressV2UsMarkers,
} from "@/lib/academie/tactical-press-reference-v2";
import type { PlayerOrientation } from "@/lib/academie/tactical-orientation";
import { angleToward } from "@/lib/academie/tactical-orientation";
import {
  ballAtReceivingFoot,
  type TacticalPoint,
  type TacticalSituationDefinition,
} from "@/lib/academie/tactical-visual-system";
import { GS_SEEKS } from "@/lib/decision-lab/gs-timings";

export { GS_SEEKS } from "@/lib/decision-lab/gs-timings";

/** ——— Timing (ms) — see gs-timings.ts ——— */

const US = PRESS_V2_US_START;
const G = PRESS_V2_GOOD_US_END;
const B = PRESS_V2_BAD_US_END;

const CBL = { x: 82, y: 60 };
const LB = { x: 80, y: 84 };
const OPP8 = { x: 64, y: 68 };

const BALL_AT_CBL = ballAtReceivingFoot(CBL, { foot: "right", facingDeg: 12 });
/** Contact — ball meets receiving foot */
const BALL_ARRIVE = ballAtReceivingFoot(LB, { foot: "right", facingDeg: 205 });
/** Settle — tiny kill toward body (first touch), not bounce */
const BALL_SETTLE = {
  x: BALL_ARRIVE.x - 0.9,
  y: BALL_ARRIVE.y - 0.55,
};

/** Curve: cut inside lane first, then approach LB (force outside). */
const RW_CUT = { x: 55, y: 75 };
const RW_ARC = createPressingArc(US.RW, RW_CUT, G.RW, { bulge: 5.2 });
/** Straight chase — almost linear to the ball */
const RW_STRAIGHT_VIA: TacticalPoint[] = [{ x: 58, y: 79 }];

const CAST_FOLLOW = ["us.RW", "opp.lb", "opp.8", "opp.cbL", "us.R6", "us.RB"] as const;

function o(
  facingAngleDeg: number,
  bodyShape: PlayerOrientation["bodyShape"],
  extras?: Partial<PlayerOrientation>,
): PlayerOrientation {
  return {
    facingAngleDeg,
    bodyShape,
    visionTarget: extras?.visionTarget ?? { type: "ball" },
    receivingFoot: extras?.receivingFoot,
    nextActionIntent: extras?.nextActionIntent,
    prePassScan: extras?.prePassScan,
  };
}

function step(
  id: string,
  startMs: number,
  durationMs: number,
  label: string,
  actions: TacticalAnimationAction[],
  opts?: {
    teachingPoint?: string;
    orientations?: Record<string, PlayerOrientation>;
    isTrigger?: boolean;
    follow?: string[];
    zoom?: number;
  },
): TacticalAnimationStep {
  return {
    id,
    startMs,
    durationMs,
    label,
    actions,
    teachingPoint: opts?.teachingPoint,
    orientations: opts?.orientations,
    isTrigger: opts?.isTrigger,
    cameraHint: {
      preset: "press-detail",
      followPlayerIds: opts?.follow ?? [...CAST_FOLLOW],
      maxZoomHint: opts?.zoom ?? 1.22,
    },
  };
}

function move(
  playerId: string,
  to: TacticalPoint,
  easing: "linear" | "easeIn" | "easeOut" | "easeInOut",
  via?: TacticalPoint[],
  orientation?: PlayerOrientation,
): TacticalAnimationAction {
  return { kind: "playerMove", playerId, to, via, easing, orientation };
}

function passLcbToLb(stepStart: number, stepDur: number): TacticalAnimationAction[] {
  const dur = Math.max(stepDur, 1);
  const releaseAbs = GS_SEEKS.t2 + 220;
  const arrivalAbs = GS_SEEKS.t2Arrive - 40;
  return [
    {
      kind: "ballMove",
      from: BALL_AT_CBL,
      to: BALL_ARRIVE,
      easing: "easeOut",
      syncLane: true,
      trajectoryId: "lcb-to-lb",
      passerId: "opp.cbL",
      laneStatus: "pass",
      releaseLocal: Math.max(0.1, Math.min(0.32, (releaseAbs - stepStart) / dur)),
      arrivalLocal: Math.max(0.72, Math.min(0.94, (arrivalAbs - stepStart) / dur)),
    },
    { kind: "possession", holderId: null },
  ];
}

/** Shared start: ball at LCB, LB waiting wide, us press-ready. */
export const FDL_GS_INSIDE_CLOSE_SITUATION: TacticalSituationDefinition = {
  id: "fdl-gs-inside-close-live",
  eyebrow: "SITUATIE",
  title: "Hun LCB speelt breed naar de back",
  subtitle: "Trigger: back ontvangt — jij bent RW. Eerst de binnenlijn.",
  homeShape: { formation: "4-4-2", phase: "high-press", direction: "left-to-right" },
  opponentShape: { formation: "4-2-3-1", phase: "build-up", direction: "right-to-left" },
  players: [
    ...pressV2UsMarkers(US),
    ...PRESS_V2_OPP_START.map((p) => ({
      ...p,
      hasBall: p.id === "opp.cbL",
    })),
  ],
  ball: BALL_AT_CBL,
  lines: [],
  zones: [],
};

function cloneSituation(
  id: TacticalSituationDefinition["id"],
  eyebrow: TacticalSituationDefinition["eyebrow"],
  title: string,
  subtitle: string,
): TacticalSituationDefinition {
  return { ...FDL_GS_INSIDE_CLOSE_SITUATION, id, eyebrow, title, subtitle };
}

export const FDL_GS_INSIDE_CLOSE_SITUATION_GOOD = cloneSituation(
  "fdl-gs-inside-close-good",
  "GOED",
  "Binnenkant dicht — buitenom sturen",
  "Curve sluit LB→8; team sluit aan; bal moet terug of wijd.",
);

export const FDL_GS_INSIDE_CLOSE_SITUATION_BAD = cloneSituation(
  "fdl-gs-inside-close-bad",
  "FOUT",
  "Recht naar de bal — binnenlijn open",
  "Rechte jacht laat opp.8 vrij; press breekt.",
);

/** Key-cast orientations — primary decisions only (no 22-player clutter). */
function castOrient(partial: Record<string, PlayerOrientation>): Record<string, PlayerOrientation> {
  return {
    "us.L6": o(8, "half-open", {
      visionTarget: { type: "ball" },
      nextActionIntent: "cover",
    }),
    "us.RB": o(-8, "side-on", {
      visionTarget: { type: "ball" },
      nextActionIntent: "cover",
    }),
    ...partial,
  };
}

/**
 * Shared T0→T3 prelude (identical start for live / good / bad).
 * Difference after freeze comes only from primary RW decision.
 */
function buildPrelude(toFreezeHoldMs: number): TacticalAnimationStep[] {
  const t0dur = GS_SEEKS.t1 - GS_SEEKS.t0;
  const t1dur = GS_SEEKS.t2 - GS_SEEKS.t1;
  const t2dur = GS_SEEKS.t2Arrive - GS_SEEKS.t2;
  const touchDur = GS_SEEKS.t3 - GS_SEEKS.t2Arrive;
  const t3dur = toFreezeHoldMs - GS_SEEKS.t3;

  return [
    step(
      "t0-set",
      GS_SEEKS.t0,
      t0dur,
      "Situatie",
      [
        { kind: "phase", phase: "initial" },
        { kind: "highlight", playerIds: ["opp.cbL", "us.RW"] },
        { kind: "possession", holderId: "opp.cbL" },
        { kind: "hold" },
      ],
      {
        teachingPoint: "Bal bij hun LCB",
        zoom: 1.12,
        follow: ["opp.cbL", "opp.lb", "us.RW", "us.R6", "opp.8", "us.RB"],
        orientations: castOrient({
          "opp.cbL": o(10, "half-open-right", {
            visionTarget: { type: "teammate", playerId: "opp.lb" },
            nextActionIntent: "play-forward",
            receivingFoot: "right",
          }),
          "opp.lb": o(188, "side-on", {
            visionTarget: { type: "ball" },
            nextActionIntent: "play-forward",
          }),
          "us.RW": o(angleToward(US.RW, CBL), "half-open-right", {
            visionTarget: { type: "ball" },
            nextActionIntent: "press",
            prePassScan: true,
            receivingFoot: "left",
          }),
          "us.R6": o(angleToward(US.R6, OPP8), "half-open", {
            visionTarget: { type: "opponent", playerId: "opp.8" },
            nextActionIntent: "cover",
          }),
          "opp.8": o(198, "open", { visionTarget: { type: "ball" } }),
        }),
      },
    ),

    step(
      "t1-scan",
      GS_SEEKS.t1,
      t1dur,
      "SCAN",
      [
        { kind: "phase", phase: "recognition" },
        { kind: "highlight", playerIds: ["opp.lb", "opp.8", "us.RW"] },
        {
          kind: "setZones",
          zones: [
            {
              x: 62,
              y: 66,
              w: 16,
              h: 14,
              kind: "risk",
              label: "",
              geometry: {
                type: "corridor",
                from: { x: 78, y: 82 },
                to: OPP8,
                width: 6.5,
              },
            },
          ],
        },
        move(
          "opp.cbL",
          { x: 81.4, y: 60.8 },
          "easeInOut",
          undefined,
          o(22, "half-open-right", {
            visionTarget: { type: "teammate", playerId: "opp.lb" },
            nextActionIntent: "play-forward",
            receivingFoot: "right",
          }),
        ),
        move(
          "opp.lb",
          { x: 80.4, y: 85 },
          "easeInOut",
          undefined,
          o(198, "closed", {
            visionTarget: { type: "ball" },
            receivingFoot: "right",
            nextActionIntent: "play-forward",
          }),
        ),
        move(
          "us.RW",
          { x: 41.8, y: 74.4 },
          "linear",
          undefined,
          o(angleToward({ x: 41.8, y: 74.4 }, LB), "half-open-right", {
            visionTarget: { type: "ball" },
            nextActionIntent: "press",
            prePassScan: true,
          }),
        ),
        move(
          "us.R6",
          { x: 41.2, y: 57.2 },
          "linear",
          undefined,
          o(14, "half-open", {
            visionTarget: { type: "opponent", playerId: "opp.8" },
            nextActionIntent: "cover",
          }),
        ),
        move(
          "us.L6",
          { x: 40.5, y: 41 },
          "linear",
          undefined,
          o(10, "half-open", { visionTarget: { type: "ball" }, nextActionIntent: "cover" }),
        ),
        move(
          "us.RB",
          { x: 31, y: 74.2 },
          "linear",
          undefined,
          o(-6, "side-on", { visionTarget: { type: "ball" }, nextActionIntent: "cover" }),
        ),
        move("opp.8", { x: 64.5, y: 68.5 }, "linear", undefined, o(200, "open", { visionTarget: { type: "ball" } })),
        { kind: "possession", holderId: "opp.cbL" },
      ],
      {
        teachingPoint: "Zie back + binnenlijn",
        zoom: 1.18,
        follow: ["opp.cbL", "opp.lb", "opp.8", "us.RW", "us.R6"],
      },
    ),

    step(
      "t2-trigger",
      GS_SEEKS.t2,
      t2dur,
      "TRIGGER",
      [
        { kind: "phase", phase: "prepare" },
        { kind: "highlight", playerIds: ["opp.lb", "us.RW"] },
        { kind: "setZones", zones: [] },
        ...passLcbToLb(GS_SEEKS.t2, t2dur),
        move(
          "opp.cbL",
          { x: 81.2, y: 60.5 },
          "easeOut",
          undefined,
          o(28, "half-open-right", {
            visionTarget: { type: "teammate", playerId: "opp.lb" },
            nextActionIntent: "play-forward",
          }),
        ),
        move(
          "opp.lb",
          LB,
          "easeOut",
          undefined,
          o(205, "closed", {
            visionTarget: { type: "ball" },
            receivingFoot: "right",
            nextActionIntent: "play-forward",
          }),
        ),
        // Micro tense — not solving
        move(
          "us.RW",
          { x: 43.5, y: 74.8 },
          "easeOut",
          undefined,
          o(angleToward({ x: 43.5, y: 74.8 }, LB), "side-on", {
            visionTarget: { type: "ball" },
            nextActionIntent: "press",
          }),
        ),
        move(
          "us.R6",
          { x: 42.5, y: 58 },
          "easeOut",
          undefined,
          o(16, "half-open", {
            visionTarget: { type: "opponent", playerId: "opp.8" },
            nextActionIntent: "cover",
          }),
        ),
        move("us.RB", { x: 32.5, y: 74.6 }, "easeOut"),
        move("us.L6", { x: 41.5, y: 42.5 }, "easeOut"),
      ],
      {
        teachingPoint: "Pass naar de back",
        isTrigger: true,
        zoom: 1.24,
        follow: ["opp.lb", "us.RW", "opp.8", "us.R6", "opp.cbL"],
        orientations: castOrient({
          "opp.lb": o(205, "closed", {
            visionTarget: { type: "ball" },
            receivingFoot: "right",
            nextActionIntent: "play-forward",
          }),
          "us.RW": o(angleToward({ x: 43.5, y: 74.8 }, LB), "side-on", {
            visionTarget: { type: "ball" },
            nextActionIntent: "press",
          }),
          "us.R6": o(16, "half-open", {
            visionTarget: { type: "opponent", playerId: "opp.8" },
            nextActionIntent: "cover",
          }),
          "opp.8": o(202, "open", { visionTarget: { type: "ball" } }),
        }),
      },
    ),

    /** First-touch micro — contact → settle → body; then freeze. */
    step(
      "t2b-first-touch",
      GS_SEEKS.t2Arrive,
      touchDur,
      "AANNAME",
      [
        { kind: "phase", phase: "prepare" },
        { kind: "highlight", playerIds: ["opp.lb", "us.RW", "opp.8"] },
        { kind: "setLines", lines: [] },
        { kind: "setZones", zones: [] },
        // Contact already happened at step start — settle is a micro kill under foot.
        { kind: "possession", holderId: "opp.lb" },
        {
          kind: "ballMove",
          from: BALL_ARRIVE,
          to: BALL_SETTLE,
          easing: "easeOut",
          syncLane: false,
          trajectoryId: "lb-first-touch",
          releaseLocal: 0,
          arrivalLocal: 0.18,
        },
        { kind: "possession", holderId: "opp.lb" },
        // Light body kill + closed receive; vision opens toward inside option
        move(
          "opp.lb",
          { x: 80.15, y: 84.25 },
          "easeOut",
          undefined,
          o(212, "closed", {
            visionTarget: { type: "teammate", playerId: "opp.8" },
            receivingFoot: "right",
            nextActionIntent: "play-forward",
          }),
        ),
        // RW tracks ball → reads inside
        move(
          "us.RW",
          { x: 44.2, y: 75.1 },
          "easeInOut",
          undefined,
          o(angleToward({ x: 44.2, y: 75.1 }, OPP8), "half-open-right", {
            visionTarget: { type: "opponent", playerId: "opp.8" },
            nextActionIntent: "press",
            prePassScan: true,
          }),
        ),
        move(
          "us.R6",
          { x: 43.2, y: 58.4 },
          "easeInOut",
          undefined,
          o(18, "half-open", {
            visionTarget: { type: "opponent", playerId: "opp.8" },
            nextActionIntent: "cover",
          }),
        ),
        move(
          "us.L6",
          { x: 42, y: 43 },
          "easeInOut",
          undefined,
          o(12, "half-open", { visionTarget: { type: "ball" }, nextActionIntent: "cover" }),
        ),
        move(
          "us.RB",
          { x: 33.5, y: 75 },
          "easeInOut",
          undefined,
          o(-4, "side-on", { visionTarget: { type: "ball" }, nextActionIntent: "cover" }),
        ),
        move(
          "opp.8",
          { x: 64.2, y: 68.2 },
          "easeInOut",
          undefined,
          o(195, "open", {
            visionTarget: { type: "ball" },
            nextActionIntent: "play-forward",
          }),
        ),
      ],
      {
        teachingPoint: "Eerste aanname — binnen nog open",
        zoom: 1.26,
        follow: ["opp.lb", "us.RW", "opp.8", "us.R6"],
        orientations: castOrient({
          "opp.lb": o(212, "closed", {
            visionTarget: { type: "teammate", playerId: "opp.8" },
            receivingFoot: "right",
            nextActionIntent: "play-forward",
          }),
          "us.RW": o(angleToward({ x: 44.2, y: 75.1 }, OPP8), "half-open-right", {
            visionTarget: { type: "opponent", playerId: "opp.8" },
            nextActionIntent: "press",
            prePassScan: true,
          }),
          "us.R6": o(18, "half-open", {
            visionTarget: { type: "opponent", playerId: "opp.8" },
            nextActionIntent: "cover",
          }),
          "opp.8": o(195, "open", {
            visionTarget: { type: "ball" },
            nextActionIntent: "play-forward",
          }),
        }),
      },
    ),

    step(
      "t3-freeze",
      GS_SEEKS.t3,
      t3dur,
      "BESLIS",
      [
        { kind: "phase", phase: "recognition" },
        { kind: "highlight", playerIds: ["us.RW", "opp.lb", "opp.8"] },
        {
          kind: "setZones",
          zones: [
            {
              x: 63,
              y: 67,
              w: 15,
              h: 13,
              kind: "risk",
              label: "",
              geometry: {
                type: "corridor",
                from: BALL_SETTLE,
                to: OPP8,
                width: 6.2,
              },
            },
          ],
        },
        { kind: "setLines", lines: [] },
        { kind: "possession", holderId: "opp.lb" },
        // Breath only — curve NOT started
        move(
          "us.RW",
          { x: 44.4, y: 75.15 },
          "linear",
          undefined,
          o(angleToward({ x: 44.4, y: 75.15 }, OPP8), "half-open-right", {
            visionTarget: { type: "opponent", playerId: "opp.8" },
            nextActionIntent: "press",
            prePassScan: true,
          }),
        ),
        { kind: "hold" },
      ],
      {
        teachingPoint: "Welke lijn is open?",
        zoom: 1.28,
        follow: ["us.RW", "opp.lb", "opp.8", "us.R6"],
        orientations: castOrient({
          "opp.lb": o(214, "closed", {
            visionTarget: { type: "teammate", playerId: "opp.8" },
            receivingFoot: "right",
            nextActionIntent: "play-forward",
          }),
          "us.RW": o(angleToward({ x: 44.4, y: 75.15 }, OPP8), "half-open-right", {
            visionTarget: { type: "opponent", playerId: "opp.8" },
            nextActionIntent: "press",
            prePassScan: true,
          }),
          "us.R6": o(20, "half-open", {
            visionTarget: { type: "opponent", playerId: "opp.8" },
            nextActionIntent: "cover",
          }),
          "us.L6": o(14, "half-open", {
            visionTarget: { type: "ball" },
            nextActionIntent: "cover",
          }),
          "us.RB": o(-2, "side-on", {
            visionTarget: { type: "ball" },
            nextActionIntent: "cover",
          }),
          "opp.8": o(192, "open", {
            visionTarget: { type: "ball" },
            nextActionIntent: "play-forward",
          }),
        }),
      },
    ),
  ];
}

export const ANIM_FDL_GS_INSIDE_CLOSE_LIVE: TacticalAnimationDefinition = {
  id: "anim.fdl-gs-inside-close-live",
  situationId: "fdl-gs-inside-close-live",
  complexity: "pattern",
  durationMs: GS_SEEKS.liveEnd,
  pauseAtStartMs: 0,
  pauseAtEndMs: 2600,
  defaultPlaybackRate: 1,
  autoplay: true,
  loop: false,
  positioningMode: "authored",
  steps: buildPrelude(GS_SEEKS.liveEnd),
};

export const ANIM_FDL_GS_INSIDE_CLOSE_GOOD: TacticalAnimationDefinition = {
  id: "anim.fdl-gs-inside-close-good",
  situationId: "fdl-gs-inside-close-good",
  complexity: "pattern",
  durationMs: GS_SEEKS.end,
  pauseAtStartMs: 0,
  pauseAtEndMs: 2200,
  defaultPlaybackRate: 1,
  autoplay: true,
  loop: false,
  positioningMode: "authored",
  steps: [
    ...buildPrelude(GS_SEEKS.t4),
    step(
      "t4-curve",
      GS_SEEKS.t4,
      GS_SEEKS.t5 - GS_SEEKS.t4,
      "BINNEN DICHT",
      [
        { kind: "phase", phase: "action" },
        { kind: "highlight", playerIds: ["us.RW"] },
        { kind: "setZones", zones: [] },
        // Accelerate on curve — inside cut first
        move(
          "us.RW",
          { x: 66, y: 78 },
          "easeOut",
          RW_ARC.slice(0, Math.max(1, RW_ARC.length - 1)),
          o(angleToward({ x: 66, y: 78 }, LB), "side-on", {
            visionTarget: { type: "ball" },
            nextActionIntent: "press",
          }),
        ),
        // 8 starts later — not teleport sync
        move(
          "us.R6",
          { x: 50, y: 64 },
          "easeInOut",
          undefined,
          o(22, "half-open", {
            visionTarget: { type: "opponent", playerId: "opp.8" },
            nextActionIntent: "cover",
          }),
        ),
        move("us.RB", { x: 46, y: 75.5 }, "easeInOut"),
        {
          kind: "setLines",
          lines: [{ kind: "press", from: { x: 66, y: 78 }, to: BALL_SETTLE }],
        },
        { kind: "possession", holderId: "opp.lb" },
      ],
      {
        teachingPoint: "Eerst de lijn",
        zoom: 1.26,
        follow: ["us.RW", "opp.lb", "opp.8", "us.R6"],
      },
    ),
    step(
      "t5-connect",
      GS_SEEKS.t5,
      GS_SEEKS.t6 - GS_SEEKS.t5,
      "TEAM",
      [
        { kind: "phase", phase: "follow" },
        { kind: "highlight", playerIds: ["us.RW", "us.R6", "us.L6", "us.RB"] },
        // Decelerate into shadow pressure
        move(
          "us.RW",
          { x: 71.2, y: 80.5 },
          "easeIn",
          undefined,
          o(angleToward({ x: 71.2, y: 80.5 }, LB), "side-on", {
            visionTarget: { type: "ball" },
            nextActionIntent: "press",
          }),
        ),
        move(
          "us.R6",
          G.R6,
          "easeInOut",
          undefined,
          o(28, "half-open", {
            visionTarget: { type: "opponent", playerId: "opp.8" },
            nextActionIntent: "cover",
          }),
        ),
        move(
          "us.L6",
          G.L6,
          "easeInOut",
          undefined,
          o(18, "half-open", { visionTarget: { type: "ball" }, nextActionIntent: "cover" }),
        ),
        move(
          "us.RB",
          G.RB,
          "easeInOut",
          undefined,
          o(-6, "side-on", { visionTarget: { type: "ball" }, nextActionIntent: "cover" }),
        ),
        move("us.RCV", G.RCV, "easeInOut"),
        move("us.LCV", { x: 31, y: 43 }, "easeOut"),
        move("us.LB", G.LB, "easeOut"),
        move("us.LW", G.LW, "easeOut"),
        move("us.10", G["10"], "easeInOut"),
        move("us.SP", G.SP, "easeInOut"),
        move("opp.8", { x: 61.5, y: 70.5 }, "easeOut"),
        move(
          "opp.lb",
          { x: 82.2, y: 86.2 },
          "easeIn",
          undefined,
          o(235, "closed", {
            visionTarget: { type: "teammate", playerId: "opp.cbL" },
            nextActionIntent: "recycle",
            receivingFoot: "right",
          }),
        ),
        {
          kind: "setLines",
          lines: [
            { kind: "press", from: { x: 71.2, y: 80.5 }, to: { x: 82.2, y: 86.2 } },
            { kind: "press", from: G.R6, to: { x: 61.5, y: 70.5 }, dashed: true },
          ],
        },
        {
          kind: "setZones",
          zones: [
            {
              x: 64,
              y: 70,
              w: 14,
              h: 12,
              kind: "cover-shadow",
              label: "",
              geometry: {
                type: "taper-shadow",
                apex: { x: 70, y: 80 },
                dirDeg: -38,
                nearWidth: 2.2,
                farWidth: 9,
                length: 12,
              },
            },
          ],
        },
        { kind: "possession", holderId: "opp.lb" },
      ],
      {
        teachingPoint: "8 dekt — lijn dicht",
        zoom: 1.22,
        follow: ["us.RW", "us.R6", "opp.lb", "us.RB", "us.L6"],
      },
    ),
    step(
      "t6-recycle",
      GS_SEEKS.t6,
      GS_SEEKS.t7 - GS_SEEKS.t6,
      "GEVOLG",
      [
        { kind: "phase", phase: "result" },
        { kind: "highlight", playerIds: ["us.RW", "us.R6", "opp.cbL"] },
        {
          kind: "ballMove",
          from: { x: 82.2, y: 86.2 },
          to: PRESS_V2_GOOD_BALL_RESULT,
          easing: "easeOut",
          syncLane: true,
          trajectoryId: "lb-recycle",
          passerId: "opp.lb",
          laneStatus: "pass",
          releaseLocal: 0.16,
          arrivalLocal: 0.8,
        },
        { kind: "possession", holderId: null },
        move("opp.cbL", PRESS_V2_GOOD_BALL_RESULT, "easeOut"),
        { kind: "possession", holderId: "opp.cbL" },
        { kind: "setZones", zones: [] },
      ],
      {
        teachingPoint: "Alleen terug of wijd",
        zoom: 1.18,
        follow: ["us.RW", "opp.cbL", "us.R6", "opp.lb"],
      },
    ),
    step(
      "t7-hold",
      GS_SEEKS.t7,
      GS_SEEKS.end - GS_SEEKS.t7,
      "DICHT",
      [
        { kind: "phase", phase: "result" },
        { kind: "highlight", playerIds: ["us.RW", "us.R6", "us.L6", "us.RB"] },
        { kind: "possession", holderId: "opp.cbL" },
        {
          kind: "setLines",
          lines: [
            { kind: "press", from: { x: 71.2, y: 80.5 }, to: { x: 82.2, y: 86.2 }, dashed: true },
            { kind: "press", from: G.R6, to: { x: 61.5, y: 70.5 }, dashed: true },
          ],
        },
        { kind: "hold" },
      ],
      {
        teachingPoint: "Binnenkant dicht",
        zoom: 1.16,
        follow: ["us.RW", "us.R6", "us.RB", "opp.cbL"],
      },
    ),
  ],
};

export const ANIM_FDL_GS_INSIDE_CLOSE_BAD: TacticalAnimationDefinition = {
  id: "anim.fdl-gs-inside-close-bad",
  situationId: "fdl-gs-inside-close-bad",
  complexity: "pattern",
  durationMs: GS_SEEKS.t7,
  pauseAtStartMs: 0,
  pauseAtEndMs: 2200,
  defaultPlaybackRate: 1,
  autoplay: true,
  loop: false,
  positioningMode: "authored",
  steps: [
    ...buildPrelude(GS_SEEKS.t4),
    step(
      "t4-straight",
      GS_SEEKS.t4,
      GS_SEEKS.t5 - GS_SEEKS.t4,
      "RECHT OP BAL",
      [
        { kind: "phase", phase: "action" },
        { kind: "highlight", playerIds: ["us.RW", "opp.8"] },
        // Inside stays visibly open while RW chases ball
        {
          kind: "setZones",
          zones: [
            {
              x: 63,
              y: 67,
              w: 15,
              h: 13,
              kind: "risk",
              label: "",
              geometry: {
                type: "corridor",
                from: BALL_SETTLE,
                to: OPP8,
                width: 6.5,
              },
            },
          ],
        },
        move(
          "us.RW",
          B.RW,
          "easeOut",
          RW_STRAIGHT_VIA,
          o(angleToward(B.RW, LB), "closed", {
            visionTarget: { type: "ball" },
            nextActionIntent: "press",
          }),
        ),
        // Support late / incomplete — cannot magically fix
        move("us.R6", { x: 42, y: 58.5 }, "easeInOut"),
        move("us.L6", { x: 41, y: 43 }, "easeInOut"),
        move("us.RB", { x: 34, y: 75 }, "easeInOut"),
        move(
          "opp.8",
          { x: 65, y: 67 },
          "easeOut",
          undefined,
          o(185, "open", {
            visionTarget: { type: "ball" },
            nextActionIntent: "play-forward",
          }),
        ),
        {
          kind: "setLines",
          lines: [
            { kind: "fault", from: { x: 44, y: 75 }, to: BALL_SETTLE, dashed: true },
            { kind: "fault", from: BALL_SETTLE, to: { x: 65, y: 67 }, dashed: true },
          ],
        },
        { kind: "possession", holderId: "opp.lb" },
      ],
      {
        teachingPoint: "Lijn blijft open",
        zoom: 1.26,
        follow: ["us.RW", "opp.lb", "opp.8"],
      },
    ),
    step(
      "t5-inside",
      GS_SEEKS.t5,
      GS_SEEKS.t6 - GS_SEEKS.t5,
      "BINNEN OPEN",
      [
        { kind: "phase", phase: "reaction" },
        { kind: "highlight", playerIds: ["opp.8", "us.RW"] },
        {
          kind: "ballMove",
          from: BALL_SETTLE,
          to: PRESS_V2_BAD_BALL_RESULT,
          easing: "easeOut",
          syncLane: true,
          trajectoryId: "lb-inside",
          passerId: "opp.lb",
          laneStatus: "fault",
          releaseLocal: 0.14,
          arrivalLocal: 0.74,
        },
        { kind: "possession", holderId: null },
        move(
          "opp.8",
          PRESS_V2_BAD_BALL_RESULT,
          "easeOut",
          undefined,
          o(178, "open", {
            visionTarget: { type: "ball" },
            nextActionIntent: "play-forward",
            receivingFoot: "right",
          }),
        ),
        move("us.RW", { x: 73, y: 83 }, "easeIn"),
        move("us.R6", B.R6, "easeInOut"),
        { kind: "possession", holderId: "opp.8" },
        {
          kind: "setZones",
          zones: [
            {
              x: 58,
              y: 58,
              w: 16,
              h: 16,
              kind: "risk",
              label: "",
              geometry: { type: "ellipse" },
            },
          ],
        },
      ],
      {
        teachingPoint: "Hun 8 is vrij",
        zoom: 1.22,
        follow: ["opp.8", "us.RW", "opp.lb"],
      },
    ),
    step(
      "t6-broken",
      GS_SEEKS.t6,
      GS_SEEKS.t7 - GS_SEEKS.t6,
      "PRESS WEG",
      [
        { kind: "phase", phase: "result" },
        { kind: "highlight", playerIds: ["opp.8", "us.RW"] },
        { kind: "possession", holderId: "opp.8" },
        { kind: "setLines", lines: [] },
        { kind: "hold" },
      ],
      {
        teachingPoint: "Press breekt",
        zoom: 1.16,
        follow: ["opp.8", "us.RW", "us.R6"],
      },
    ),
  ],
};

export const FDL_GS_INSIDE_CLOSE_FILM_IDS = {
  live: "fdl-gs-inside-close-live",
  good: "fdl-gs-inside-close-good",
  bad: "fdl-gs-inside-close-bad",
} as const;
