/**
 * FDL-DS-INSIDE-CLOSE-RW-DECISION-V1 — press-batch-a #3 (stability principle).
 *
 * Same right flank as the Golden Session (their LCB → LB), but the teaching
 * emphasis is different: after the first touch, RW takes ONE small adjustment
 * step that holds the inside lane — the curve itself does NOT start before
 * freeze. Patience over speed.
 *
 * Good branch forces a SAFE RECYCLE (ball back to CB) — never a guaranteed
 * ball win — and team support (R6/RB) is deliberately delayed, arriving only
 * once RW's own shape is stable. Bad branch chases the ball; inside opens.
 */

import { createPressingArc } from "@/lib/academie/tactical-animation-collision";
import type {
  TacticalAnimationAction,
  TacticalAnimationDefinition,
} from "@/lib/academie/tactical-animation-types";
import { angleToward } from "@/lib/academie/tactical-orientation";
import {
  PRESS_V2_BAD_BALL_RESULT,
  PRESS_V2_BAD_US_END,
  PRESS_V2_GOOD_BALL_RESULT,
  PRESS_V2_GOOD_US_END,
  PRESS_V2_OPP_START,
  PRESS_V2_US_START,
  pressV2UsMarkers,
} from "@/lib/academie/tactical-press-reference-v2";
import {
  ballAtReceivingFoot,
  type TacticalPoint,
  type TacticalSituationDefinition,
} from "@/lib/academie/tactical-visual-system";
import { filmIdsForSlug } from "@/lib/decision-lab/films/dedicated/ids";
import { move, o, step } from "@/lib/decision-lab/films/press-batch-a/kit";
import { DS03_SEEKS } from "@/lib/decision-lab/films/press-batch-a/timings";

export { DS03_SEEKS } from "@/lib/decision-lab/films/press-batch-a/timings";

const SLUG = "binnenkant-dicht-decision";
const SESSION_ID = "FDL-DS-INSIDE-CLOSE-RW-DECISION-V1";
const IDS = filmIdsForSlug(SLUG);

const US = PRESS_V2_US_START;
const G = PRESS_V2_GOOD_US_END;
const B = PRESS_V2_BAD_US_END;

const CBL = { x: 82, y: 60 };
const LB = { x: 80, y: 84 };
const OPP8 = { x: 64, y: 68 };

const BALL_AT_CBL = ballAtReceivingFoot(CBL, { foot: "right", facingDeg: 12 });
const BALL_ARRIVE = ballAtReceivingFoot(LB, { foot: "right", facingDeg: 205 });
const BALL_SETTLE: TacticalPoint = {
  x: BALL_ARRIVE.x - 0.9,
  y: BALL_ARRIVE.y - 0.55,
};

/** Curve only fires after freeze — never during the hold. */
const RW_CUT = { x: 55, y: 75 };
const RW_ARC = createPressingArc(US.RW, RW_CUT, G.RW, { bulge: 4.6 });
const RW_STRAIGHT_VIA: TacticalPoint[] = [{ x: 58, y: 79 }];

/** RW's held stance during the patience window — a few cm, never toward the ball. */
const RW_ADJUST: TacticalPoint = { x: 44.9, y: 74.6 };
const RW_HOLD: TacticalPoint = { x: 45.0, y: 74.55 };

function passLcbToLb(stepStart: number, stepDur: number): TacticalAnimationAction[] {
  const dur = Math.max(stepDur, 1);
  const releaseAbs = DS03_SEEKS.t2 + 180;
  const arrivalAbs = DS03_SEEKS.t2Arrive - 40;
  return [
    {
      kind: "ballMove",
      from: BALL_AT_CBL,
      to: BALL_ARRIVE,
      easing: "easeOut",
      syncLane: true,
      trajectoryId: "lcb-to-lb-decision",
      passerId: "opp.cbL",
      laneStatus: "pass",
      releaseLocal: Math.max(0.1, Math.min(0.32, (releaseAbs - stepStart) / dur)),
      arrivalLocal: Math.max(0.72, Math.min(0.94, (arrivalAbs - stepStart) / dur)),
    },
    { kind: "possession", holderId: null },
  ];
}

export const DS03_SITUATION: TacticalSituationDefinition = {
  id: IDS.live as TacticalSituationDefinition["id"],
  eyebrow: "SITUATIE",
  title: "Hun LCB speelt breed naar de back",
  subtitle: "Trigger: back ontvangt — jij bent RW. Niet jagen: eerst stil de lijn houden.",
  homeShape: { formation: "4-4-2", phase: "high-press", direction: "left-to-right" },
  opponentShape: { formation: "4-2-3-1", phase: "build-up", direction: "right-to-left" },
  players: [
    ...pressV2UsMarkers(US),
    ...PRESS_V2_OPP_START.map((p) => ({ ...p, hasBall: p.id === "opp.cbL" })),
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
  return { ...DS03_SITUATION, id, eyebrow, title, subtitle };
}

export const DS03_SITUATION_GOOD = cloneSituation(
  IDS.good as TacticalSituationDefinition["id"],
  "GOED",
  "Rustig de lijn dicht — veilige recycle",
  "Geen jacht op balwinst: bal moet terug, steun komt bewust later.",
);

export const DS03_SITUATION_BAD = cloneSituation(
  IDS.bad as TacticalSituationDefinition["id"],
  "FOUT",
  "Ongeduldig — recht op de bal",
  "Te vroeg loslaten van de houding: binnenlijn gaat open.",
);

function castOrient(partial: Record<string, ReturnType<typeof o>>): Record<string, ReturnType<typeof o>> {
  return {
    "us.L6": o(8, "half-open", { visionTarget: { type: "ball" }, nextActionIntent: "cover" }),
    "us.RB": o(-8, "side-on", { visionTarget: { type: "ball" }, nextActionIntent: "cover" }),
    ...partial,
  };
}

/**
 * Shared prelude T0→T3 — compressed early scan (DS03 t0→t1 is short: recognise fast),
 * then a long patience window (adjust → hold) before freeze.
 */
function buildPrelude(toFreezeHoldMs: number) {
  const t0dur = DS03_SEEKS.t1 - DS03_SEEKS.t0;
  const t1dur = DS03_SEEKS.t2 - DS03_SEEKS.t1;
  const t2dur = DS03_SEEKS.t2Arrive - DS03_SEEKS.t2;
  const touchDur = DS03_SEEKS.t3 - DS03_SEEKS.t2Arrive;
  /** Patience window split: a tiny adjust step, then a still hold up to freeze target. */
  const adjustDur = Math.min(500, Math.max(200, Math.round((toFreezeHoldMs - DS03_SEEKS.t3) * 0.18)));
  const holdDur = toFreezeHoldMs - DS03_SEEKS.t3 - adjustDur;

  return [
    step(
      "t0-set",
      DS03_SEEKS.t0,
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
        zoom: 1.1,
        follow: ["opp.cbL", "opp.lb", "us.RW", "us.R6", "opp.8", "us.RB"],
        orientations: castOrient({
          "opp.cbL": o(10, "half-open-right", {
            visionTarget: { type: "teammate", playerId: "opp.lb" },
            nextActionIntent: "play-forward",
            receivingFoot: "right",
          }),
          "opp.lb": o(188, "side-on", { visionTarget: { type: "ball" }, nextActionIntent: "play-forward" }),
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

    /** Compressed scan — DS03's read is quicker than the Golden Session's. */
    step(
      "t1-scan",
      DS03_SEEKS.t1,
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
              geometry: { type: "corridor", from: { x: 78, y: 82 }, to: OPP8, width: 6.5 },
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
          o(198, "closed", { visionTarget: { type: "ball" }, receivingFoot: "right", nextActionIntent: "play-forward" }),
        ),
        move(
          "us.RW",
          { x: 42.4, y: 74.5 },
          "linear",
          undefined,
          o(angleToward({ x: 42.4, y: 74.5 }, LB), "half-open-right", {
            visionTarget: { type: "ball" },
            nextActionIntent: "press",
            prePassScan: true,
          }),
        ),
        move(
          "us.R6",
          { x: 41.6, y: 57.1 },
          "linear",
          undefined,
          o(14, "half-open", { visionTarget: { type: "opponent", playerId: "opp.8" }, nextActionIntent: "cover" }),
        ),
        move(
          "us.L6",
          { x: 40.6, y: 41 },
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
        teachingPoint: "Snel gezien — back + binnenlijn",
        zoom: 1.16,
        follow: ["opp.cbL", "opp.lb", "opp.8", "us.RW"],
      },
    ),

    step(
      "t2-trigger",
      DS03_SEEKS.t2,
      t2dur,
      "TRIGGER",
      [
        { kind: "phase", phase: "prepare" },
        { kind: "highlight", playerIds: ["opp.lb", "us.RW"] },
        { kind: "setZones", zones: [] },
        ...passLcbToLb(DS03_SEEKS.t2, t2dur),
        move(
          "opp.cbL",
          { x: 81.2, y: 60.5 },
          "easeOut",
          undefined,
          o(28, "half-open-right", { visionTarget: { type: "teammate", playerId: "opp.lb" }, nextActionIntent: "play-forward" }),
        ),
        move(
          "opp.lb",
          LB,
          "easeOut",
          undefined,
          o(205, "closed", { visionTarget: { type: "ball" }, receivingFoot: "right", nextActionIntent: "play-forward" }),
        ),
        move(
          "us.RW",
          { x: 44, y: 74.7 },
          "easeOut",
          undefined,
          o(angleToward({ x: 44, y: 74.7 }, LB), "side-on", { visionTarget: { type: "ball" }, nextActionIntent: "press" }),
        ),
        move(
          "us.R6",
          { x: 42.8, y: 58 },
          "easeOut",
          undefined,
          o(16, "half-open", { visionTarget: { type: "opponent", playerId: "opp.8" }, nextActionIntent: "cover" }),
        ),
        move("us.RB", { x: 32.2, y: 74.6 }, "easeOut"),
        move("us.L6", { x: 41.5, y: 42.5 }, "easeOut"),
      ],
      {
        teachingPoint: "Pass naar de back",
        isTrigger: true,
        zoom: 1.2,
        follow: ["opp.lb", "us.RW", "opp.8", "us.R6", "opp.cbL"],
        orientations: castOrient({
          "opp.lb": o(205, "closed", { visionTarget: { type: "ball" }, receivingFoot: "right", nextActionIntent: "play-forward" }),
          "us.RW": o(angleToward({ x: 44, y: 74.7 }, LB), "side-on", { visionTarget: { type: "ball" }, nextActionIntent: "press" }),
          "us.R6": o(16, "half-open", { visionTarget: { type: "opponent", playerId: "opp.8" }, nextActionIntent: "cover" }),
          "opp.8": o(202, "open", { visionTarget: { type: "ball" } }),
        }),
      },
    ),

    /** First-touch micro — contact → settle → body. */
    step(
      "t2b-first-touch",
      DS03_SEEKS.t2Arrive,
      touchDur,
      "AANNAME",
      [
        { kind: "phase", phase: "prepare" },
        { kind: "highlight", playerIds: ["opp.lb", "us.RW", "opp.8"] },
        { kind: "setLines", lines: [] },
        { kind: "setZones", zones: [] },
        { kind: "possession", holderId: "opp.lb" },
        {
          kind: "ballMove",
          from: BALL_ARRIVE,
          to: BALL_SETTLE,
          easing: "easeOut",
          syncLane: false,
          trajectoryId: "lb-first-touch-decision",
          releaseLocal: 0,
          arrivalLocal: 0.18,
        },
        { kind: "possession", holderId: "opp.lb" },
        move(
          "opp.lb",
          { x: 80.15, y: 84.25 },
          "easeOut",
          undefined,
          o(212, "closed", { visionTarget: { type: "teammate", playerId: "opp.8" }, receivingFoot: "right", nextActionIntent: "play-forward" }),
        ),
        move(
          "us.RW",
          RW_ADJUST,
          "easeInOut",
          undefined,
          o(angleToward(RW_ADJUST, OPP8), "half-open-right", {
            visionTarget: { type: "opponent", playerId: "opp.8" },
            nextActionIntent: "press",
            prePassScan: true,
          }),
        ),
        move(
          "us.R6",
          { x: 42.9, y: 58.3 },
          "easeInOut",
          undefined,
          o(18, "half-open", { visionTarget: { type: "opponent", playerId: "opp.8" }, nextActionIntent: "cover" }),
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
          { x: 33.2, y: 75 },
          "easeInOut",
          undefined,
          o(-4, "side-on", { visionTarget: { type: "ball" }, nextActionIntent: "cover" }),
        ),
        move(
          "opp.8",
          { x: 64.2, y: 68.2 },
          "easeInOut",
          undefined,
          o(195, "open", { visionTarget: { type: "ball" }, nextActionIntent: "play-forward" }),
        ),
      ],
      {
        teachingPoint: "Eerste aanname — binnen nog open",
        zoom: 1.3,
        follow: ["opp.lb", "us.RW", "opp.8", "us.R6"],
        orientations: castOrient({
          "opp.lb": o(212, "closed", { visionTarget: { type: "teammate", playerId: "opp.8" }, receivingFoot: "right", nextActionIntent: "play-forward" }),
          "us.RW": o(angleToward(RW_ADJUST, OPP8), "half-open-right", {
            visionTarget: { type: "opponent", playerId: "opp.8" },
            nextActionIntent: "press",
            prePassScan: true,
          }),
          "us.R6": o(18, "half-open", { visionTarget: { type: "opponent", playerId: "opp.8" }, nextActionIntent: "cover" }),
          "opp.8": o(195, "open", { visionTarget: { type: "ball" }, nextActionIntent: "play-forward" }),
        }),
      },
    ),

    /** Adjust — ONE small step holding the lane. Not the curve. */
    step(
      "t3-adjust",
      DS03_SEEKS.t3,
      adjustDur,
      "AANPASSEN",
      [
        { kind: "phase", phase: "prepare" },
        { kind: "highlight", playerIds: ["us.RW", "opp.lb"] },
        { kind: "possession", holderId: "opp.lb" },
        move(
          "us.RW",
          RW_HOLD,
          "easeInOut",
          undefined,
          o(angleToward(RW_HOLD, OPP8), "half-open-right", {
            visionTarget: { type: "opponent", playerId: "opp.8" },
            nextActionIntent: "press",
            prePassScan: true,
          }),
        ),
      ],
      {
        teachingPoint: "Kleine stap — lijn blijft dicht, nog geen boog",
        zoom: 1.33,
        follow: ["us.RW", "opp.lb", "opp.8"],
      },
    ),

    /** Hold — patience. Stillness is the decision, not hesitation. */
    step(
      "t3-hold",
      DS03_SEEKS.t3 + adjustDur,
      holdDur,
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
              geometry: { type: "corridor", from: BALL_SETTLE, to: OPP8, width: 6.2 },
            },
          ],
        },
        { kind: "setLines", lines: [] },
        { kind: "possession", holderId: "opp.lb" },
        { kind: "hold" },
      ],
      {
        teachingPoint: "Rustig blijven staan — dit IS de keuze",
        zoom: 1.35,
        follow: ["us.RW", "opp.lb", "opp.8"],
        orientations: castOrient({
          "opp.lb": o(214, "closed", { visionTarget: { type: "teammate", playerId: "opp.8" }, receivingFoot: "right", nextActionIntent: "play-forward" }),
          "us.RW": o(angleToward(RW_HOLD, OPP8), "half-open-right", {
            visionTarget: { type: "opponent", playerId: "opp.8" },
            nextActionIntent: "press",
            prePassScan: true,
          }),
          "us.R6": o(20, "half-open", { visionTarget: { type: "opponent", playerId: "opp.8" }, nextActionIntent: "cover" }),
          "us.L6": o(14, "half-open", { visionTarget: { type: "ball" }, nextActionIntent: "cover" }),
          "us.RB": o(-2, "side-on", { visionTarget: { type: "ball" }, nextActionIntent: "cover" }),
          "opp.8": o(192, "open", { visionTarget: { type: "ball" }, nextActionIntent: "play-forward" }),
        }),
      },
    ),
  ];
}

export const DS03_ANIM_LIVE: TacticalAnimationDefinition = {
  id: `anim.${IDS.live}`,
  situationId: IDS.live,
  complexity: "pattern",
  durationMs: DS03_SEEKS.liveEnd,
  pauseAtStartMs: 0,
  pauseAtEndMs: 2600,
  defaultPlaybackRate: 1,
  autoplay: true,
  loop: false,
  positioningMode: "authored",
  steps: buildPrelude(DS03_SEEKS.liveEnd),
};

export const DS03_ANIM_GOOD: TacticalAnimationDefinition = {
  id: `anim.${IDS.good}`,
  situationId: IDS.good,
  complexity: "pattern",
  durationMs: DS03_SEEKS.end,
  pauseAtStartMs: 0,
  pauseAtEndMs: 2200,
  defaultPlaybackRate: 1,
  autoplay: true,
  loop: false,
  positioningMode: "authored",
  steps: [
    ...buildPrelude(DS03_SEEKS.t4),
    step(
      "t4-curve",
      DS03_SEEKS.t4,
      DS03_SEEKS.t5 - DS03_SEEKS.t4,
      "BINNEN DICHT",
      [
        { kind: "phase", phase: "action" },
        { kind: "highlight", playerIds: ["us.RW"] },
        { kind: "setZones", zones: [] },
        move(
          "us.RW",
          { x: 66, y: 78 },
          "easeOut",
          RW_ARC.slice(0, Math.max(1, RW_ARC.length - 1)),
          o(angleToward({ x: 66, y: 78 }, LB), "side-on", { visionTarget: { type: "ball" }, nextActionIntent: "press" }),
        ),
        // Support NOT yet moving — deliberately delayed until RW's shape is stable.
        {
          kind: "setLines",
          lines: [{ kind: "press", from: { x: 66, y: 78 }, to: BALL_SETTLE }],
        },
        { kind: "possession", holderId: "opp.lb" },
      ],
      {
        teachingPoint: "Eerst de lijn — steun komt nog niet",
        zoom: 1.24,
        follow: ["us.RW", "opp.lb", "opp.8"],
      },
    ),
    step(
      "t5-connect-delayed",
      DS03_SEEKS.t5,
      DS03_SEEKS.t6 - DS03_SEEKS.t5,
      "TEAM VOLGT",
      [
        { kind: "phase", phase: "follow" },
        { kind: "highlight", playerIds: ["us.RW", "us.R6"] },
        move(
          "us.RW",
          { x: 70.5, y: 80 },
          "easeIn",
          undefined,
          o(angleToward({ x: 70.5, y: 80 }, LB), "side-on", { visionTarget: { type: "ball" }, nextActionIntent: "press" }),
        ),
        // Only NOW does R6 begin — support arrives after RW is stable, not before.
        move(
          "us.R6",
          { x: 52, y: 66 },
          "easeInOut",
          undefined,
          o(24, "half-open", { visionTarget: { type: "opponent", playerId: "opp.8" }, nextActionIntent: "cover" }),
        ),
        move("us.RB", { x: 40, y: 75 }, "easeInOut"),
        move(
          "opp.lb",
          { x: 81.4, y: 85.4 },
          "linear",
          undefined,
          o(220, "closed", { visionTarget: { type: "teammate", playerId: "opp.cbL" }, receivingFoot: "right", nextActionIntent: "recycle" }),
        ),
        { kind: "possession", holderId: "opp.lb" },
      ],
      {
        teachingPoint: "Steun sluit pas nu aan",
        zoom: 1.2,
        follow: ["us.RW", "us.R6", "opp.lb"],
      },
    ),
    step(
      "t6-safe-recycle",
      DS03_SEEKS.t6,
      DS03_SEEKS.t7 - DS03_SEEKS.t6,
      "VEILIG TERUG",
      [
        { kind: "phase", phase: "result" },
        { kind: "highlight", playerIds: ["us.RW", "us.R6", "opp.cbL"] },
        move(
          "us.R6",
          G.R6,
          "easeInOut",
          undefined,
          o(28, "half-open", { visionTarget: { type: "opponent", playerId: "opp.8" }, nextActionIntent: "cover" }),
        ),
        move("us.RB", G.RB, "easeInOut"),
        move("us.L6", G.L6, "easeInOut"),
        move("opp.8", { x: 61.8, y: 70.5 }, "easeOut"),
        {
          kind: "ballMove",
          from: { x: 81.4, y: 85.4 },
          to: PRESS_V2_GOOD_BALL_RESULT,
          easing: "easeOut",
          syncLane: true,
          trajectoryId: "lb-recycle-safe",
          passerId: "opp.lb",
          laneStatus: "pass",
          releaseLocal: 0.2,
          arrivalLocal: 0.82,
        },
        { kind: "possession", holderId: null },
        move("opp.cbL", PRESS_V2_GOOD_BALL_RESULT, "easeOut"),
        { kind: "possession", holderId: "opp.cbL" },
        {
          kind: "setLines",
          lines: [{ kind: "press", from: { x: 70.5, y: 80 }, to: { x: 81.4, y: 85.4 }, dashed: true }],
        },
        { kind: "setZones", zones: [] },
      ],
      {
        teachingPoint: "Alleen terug — geen balwinst geclaimd",
        zoom: 1.16,
        follow: ["us.RW", "opp.cbL", "us.R6", "opp.lb"],
      },
    ),
    step(
      "t7-hold",
      DS03_SEEKS.t7,
      DS03_SEEKS.end - DS03_SEEKS.t7,
      "STABIEL",
      [
        { kind: "phase", phase: "result" },
        { kind: "highlight", playerIds: ["us.RW", "us.R6", "us.RB"] },
        { kind: "possession", holderId: "opp.cbL" },
        { kind: "hold" },
      ],
      {
        teachingPoint: "Rustig, gesloten — geen risico genomen",
        zoom: 1.14,
        follow: ["us.RW", "us.R6", "opp.cbL"],
      },
    ),
  ],
};

export const DS03_ANIM_BAD: TacticalAnimationDefinition = {
  id: `anim.${IDS.bad}`,
  situationId: IDS.bad,
  complexity: "pattern",
  durationMs: DS03_SEEKS.t7,
  pauseAtStartMs: 0,
  pauseAtEndMs: 2200,
  defaultPlaybackRate: 1,
  autoplay: true,
  loop: false,
  positioningMode: "authored",
  steps: [
    ...buildPrelude(DS03_SEEKS.t4),
    step(
      "t4-impatient",
      DS03_SEEKS.t4,
      DS03_SEEKS.t5 - DS03_SEEKS.t4,
      "TE VROEG LOS",
      [
        { kind: "phase", phase: "action" },
        { kind: "highlight", playerIds: ["us.RW", "opp.8"] },
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
              geometry: { type: "corridor", from: BALL_SETTLE, to: OPP8, width: 6.5 },
            },
          ],
        },
        move(
          "us.RW",
          B.RW,
          "easeOut",
          RW_STRAIGHT_VIA,
          o(angleToward(B.RW, LB), "closed", { visionTarget: { type: "ball" }, nextActionIntent: "press" }),
        ),
        move("us.R6", { x: 42.4, y: 58.5 }, "easeInOut"),
        move("us.L6", { x: 41.2, y: 43 }, "easeInOut"),
        move("us.RB", { x: 34.3, y: 75 }, "easeInOut"),
        move(
          "opp.8",
          { x: 65, y: 67 },
          "easeOut",
          undefined,
          o(185, "open", { visionTarget: { type: "ball" }, nextActionIntent: "play-forward" }),
        ),
        {
          kind: "setLines",
          lines: [
            { kind: "fault", from: RW_HOLD, to: BALL_SETTLE, dashed: true },
            { kind: "fault", from: BALL_SETTLE, to: { x: 65, y: 67 }, dashed: true },
          ],
        },
        { kind: "possession", holderId: "opp.lb" },
      ],
      {
        teachingPoint: "Houding losgelaten — lijn blijft open",
        zoom: 1.3,
        follow: ["us.RW", "opp.lb", "opp.8"],
      },
    ),
    step(
      "t5-inside",
      DS03_SEEKS.t5,
      DS03_SEEKS.t6 - DS03_SEEKS.t5,
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
          trajectoryId: "lb-inside-decision",
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
          o(178, "open", { visionTarget: { type: "ball" }, nextActionIntent: "play-forward", receivingFoot: "right" }),
        ),
        move("us.RW", { x: 73, y: 83 }, "easeIn"),
        move("us.R6", B.R6, "easeInOut"),
        { kind: "possession", holderId: "opp.8" },
        {
          kind: "setZones",
          zones: [{ x: 58, y: 58, w: 16, h: 16, kind: "risk", label: "", geometry: { type: "ellipse" } }],
        },
      ],
      {
        teachingPoint: "Hun 8 is vrij — ongeduld kost de lijn",
        zoom: 1.24,
        follow: ["opp.8", "us.RW", "opp.lb"],
      },
    ),
    step(
      "t6-broken",
      DS03_SEEKS.t6,
      DS03_SEEKS.t7 - DS03_SEEKS.t6,
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
        zoom: 1.18,
        follow: ["opp.8", "us.RW", "us.R6"],
      },
    ),
  ],
};

export const DS03_BUNDLE = {
  sessionId: SESSION_ID,
  slug: SLUG,
  freezeMs: DS03_SEEKS.freeze,
  previewMs: DS03_SEEKS.previewOpening,
  activeRole: "us.RW",
  mobileFocusIds: ["us.RW", "us.R6", "us.RB", "us.L6"],
  situations: {
    [IDS.live]: DS03_SITUATION,
    [IDS.good]: DS03_SITUATION_GOOD,
    [IDS.bad]: DS03_SITUATION_BAD,
  } as Record<string, TacticalSituationDefinition>,
  animations: {
    [IDS.live]: DS03_ANIM_LIVE,
    [IDS.good]: DS03_ANIM_GOOD,
    [IDS.bad]: DS03_ANIM_BAD,
  } as Record<string, TacticalAnimationDefinition>,
};
