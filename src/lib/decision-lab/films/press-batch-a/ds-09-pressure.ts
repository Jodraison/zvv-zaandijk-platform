/**
 * FDL-DS-INSIDE-CLOSE-RW-PRESSURE-V1 — press-batch-a #9 (pressure principle).
 *
 * Same right flank as the Golden Session (their LCB → LB), but everything is
 * compressed via DS09_SEEKS: the pass is faster, the first touch is awkward
 * (a bigger, messier kill under real pressure), and the back's body is more
 * closed than usual. The freeze arrives early. RW must still choose the
 * inside-close principle — NOT chase the loose ball — even though everything
 * feels rushed.
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
import { DS09_SEEKS } from "@/lib/decision-lab/films/press-batch-a/timings";

export { DS09_SEEKS } from "@/lib/decision-lab/films/press-batch-a/timings";

const SLUG = "binnenkant-onder-druk";
const SESSION_ID = "FDL-DS-INSIDE-CLOSE-RW-PRESSURE-V1";
const IDS = filmIdsForSlug(SLUG);

const US = PRESS_V2_US_START;
const G = PRESS_V2_GOOD_US_END;
const B = PRESS_V2_BAD_US_END;

const CBL = { x: 82, y: 60 };
const LB = { x: 80, y: 84 };
const OPP8 = { x: 64, y: 68 };

/** Faster release, tighter body — the pass itself already feels rushed. */
const BALL_AT_CBL = ballAtReceivingFoot(CBL, { foot: "right", facingDeg: 18 });
const BALL_ARRIVE = ballAtReceivingFoot(LB, { foot: "right", facingDeg: 228 });
/** Poor touch under pressure — a bigger, messier kill than a calm receive. */
const BALL_SETTLE: TacticalPoint = {
  x: BALL_ARRIVE.x - 1.7,
  y: BALL_ARRIVE.y - 1.05,
};

const RW_CUT = { x: 56, y: 74 };
const RW_ARC = createPressingArc(US.RW, RW_CUT, G.RW, { bulge: 6.4 });
const RW_STRAIGHT_VIA: TacticalPoint[] = [{ x: 59, y: 78 }];

function passLcbToLbFast(stepStart: number, stepDur: number): TacticalAnimationAction[] {
  const dur = Math.max(stepDur, 1);
  /** Compressed flight window — the ball is already moving when the step starts. */
  const releaseAbs = DS09_SEEKS.t2 + 90;
  const arrivalAbs = DS09_SEEKS.t2Arrive - 20;
  return [
    {
      kind: "ballMove",
      from: BALL_AT_CBL,
      to: BALL_ARRIVE,
      easing: "linear",
      syncLane: true,
      trajectoryId: "lcb-to-lb-pressure",
      passerId: "opp.cbL",
      laneStatus: "pass",
      releaseLocal: Math.max(0.04, Math.min(0.22, (releaseAbs - stepStart) / dur)),
      arrivalLocal: Math.max(0.78, Math.min(0.96, (arrivalAbs - stepStart) / dur)),
    },
    { kind: "possession", holderId: null },
  ];
}

export const DS09_SITUATION: TacticalSituationDefinition = {
  id: IDS.live as TacticalSituationDefinition["id"],
  eyebrow: "SITUATIE",
  title: "Hun LCB speelt snel naar de back",
  subtitle: "Trigger: snelle pass, back staat onder druk — jij bent RW.",
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
  return { ...DS09_SITUATION, id, eyebrow, title, subtitle };
}

export const DS09_SITUATION_GOOD = cloneSituation(
  IDS.good as TacticalSituationDefinition["id"],
  "GOED",
  "Onder druk toch de lijn dicht",
  "Ondanks slechte aanname: eerst binnen dicht, niet de losse bal jagen.",
);

export const DS09_SITUATION_BAD = cloneSituation(
  IDS.bad as TacticalSituationDefinition["id"],
  "FOUT",
  "Op de losse bal af — binnenlijn open",
  "Verleiding van de slechte aanname: binnenlijn gaat meteen open.",
);

function castOrient(partial: Record<string, ReturnType<typeof o>>): Record<string, ReturnType<typeof o>> {
  return {
    "us.L6": o(8, "half-open", { visionTarget: { type: "ball" }, nextActionIntent: "cover" }),
    "us.RB": o(-8, "side-on", { visionTarget: { type: "ball" }, nextActionIntent: "cover" }),
    ...partial,
  };
}

/**
 * Shared prelude — everything compressed via DS09_SEEKS. Short scan, fast
 * trigger, awkward touch, then an early freeze. No slack anywhere.
 */
function buildPrelude(toFreezeHoldMs: number) {
  const t0dur = DS09_SEEKS.t1 - DS09_SEEKS.t0;
  const t1dur = DS09_SEEKS.t2 - DS09_SEEKS.t1;
  const t2dur = DS09_SEEKS.t2Arrive - DS09_SEEKS.t2;
  const touchDur = DS09_SEEKS.t3 - DS09_SEEKS.t2Arrive;
  const t3dur = toFreezeHoldMs - DS09_SEEKS.t3;

  return [
    step(
      "t0-set",
      DS09_SEEKS.t0,
      t0dur,
      "Situatie",
      [
        { kind: "phase", phase: "initial" },
        { kind: "highlight", playerIds: ["opp.cbL", "us.RW"] },
        { kind: "possession", holderId: "opp.cbL" },
        { kind: "hold" },
      ],
      {
        teachingPoint: "Bal bij hun LCB — tempo hoog",
        zoom: 1.14,
        follow: ["opp.cbL", "opp.lb", "us.RW", "us.R6", "opp.8", "us.RB"],
        orientations: castOrient({
          "opp.cbL": o(14, "half-open-right", {
            visionTarget: { type: "teammate", playerId: "opp.lb" },
            nextActionIntent: "play-forward",
            receivingFoot: "right",
          }),
          "opp.lb": o(190, "side-on", { visionTarget: { type: "ball" }, nextActionIntent: "play-forward" }),
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

    /** Compressed scan — barely time to see it before the pass is already gone. */
    step(
      "t1-scan-fast",
      DS09_SEEKS.t1,
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
          { x: 81.6, y: 61.1 },
          "linear",
          undefined,
          o(24, "half-open-right", {
            visionTarget: { type: "teammate", playerId: "opp.lb" },
            nextActionIntent: "play-forward",
            receivingFoot: "right",
          }),
        ),
        move(
          "opp.lb",
          { x: 80.3, y: 84.8 },
          "linear",
          undefined,
          o(206, "closed", { visionTarget: { type: "ball" }, receivingFoot: "right", nextActionIntent: "play-forward" }),
        ),
        move(
          "us.RW",
          { x: 43, y: 74.6 },
          "linear",
          undefined,
          o(angleToward({ x: 43, y: 74.6 }, LB), "half-open-right", {
            visionTarget: { type: "ball" },
            nextActionIntent: "press",
            prePassScan: true,
          }),
        ),
        move(
          "us.R6",
          { x: 42, y: 57.3 },
          "linear",
          undefined,
          o(15, "half-open", { visionTarget: { type: "opponent", playerId: "opp.8" }, nextActionIntent: "cover" }),
        ),
        move("us.RB", { x: 31.5, y: 74.3 }, "linear"),
        move("opp.8", { x: 64.6, y: 68.6 }, "linear", undefined, o(201, "open", { visionTarget: { type: "ball" } })),
        { kind: "possession", holderId: "opp.cbL" },
      ],
      {
        teachingPoint: "Amper tijd — pass komt al",
        zoom: 1.2,
        follow: ["opp.cbL", "opp.lb", "opp.8", "us.RW"],
      },
    ),

    /** Trigger cue — the pass itself is the pressure signal: fast and flat. */
    step(
      "t2-fast-pass",
      DS09_SEEKS.t2,
      t2dur,
      "SNELLE PASS",
      [
        { kind: "phase", phase: "prepare" },
        { kind: "highlight", playerIds: ["opp.lb", "us.RW"] },
        { kind: "setZones", zones: [] },
        ...passLcbToLbFast(DS09_SEEKS.t2, t2dur),
        move(
          "opp.cbL",
          { x: 81.3, y: 60.8 },
          "linear",
          undefined,
          o(30, "half-open-right", { visionTarget: { type: "teammate", playerId: "opp.lb" }, nextActionIntent: "play-forward" }),
        ),
        move(
          "opp.lb",
          LB,
          "linear",
          undefined,
          o(230, "closed", { visionTarget: { type: "ball" }, receivingFoot: "right", nextActionIntent: "play-forward" }),
        ),
        move(
          "us.RW",
          { x: 44.2, y: 74.8 },
          "linear",
          undefined,
          o(angleToward({ x: 44.2, y: 74.8 }, LB), "side-on", { visionTarget: { type: "ball" }, nextActionIntent: "press" }),
        ),
        move(
          "us.R6",
          { x: 43, y: 58.1 },
          "linear",
          undefined,
          o(17, "half-open", { visionTarget: { type: "opponent", playerId: "opp.8" }, nextActionIntent: "cover" }),
        ),
        move("us.RB", { x: 32.8, y: 74.7 }, "linear"),
      ],
      {
        teachingPoint: "Bal komt hard en snel aan",
        isTrigger: true,
        zoom: 1.28,
        follow: ["opp.lb", "us.RW", "opp.8", "us.R6", "opp.cbL"],
        orientations: castOrient({
          "opp.lb": o(230, "closed", { visionTarget: { type: "ball" }, receivingFoot: "right", nextActionIntent: "play-forward" }),
          "us.RW": o(angleToward({ x: 44.2, y: 74.8 }, LB), "side-on", { visionTarget: { type: "ball" }, nextActionIntent: "press" }),
          "us.R6": o(17, "half-open", { visionTarget: { type: "opponent", playerId: "opp.8" }, nextActionIntent: "cover" }),
          "opp.8": o(203, "open", { visionTarget: { type: "ball" } }),
        }),
      },
    ),

    /** Awkward first touch — under real pressure the ball gets away a little. */
    step(
      "t2b-poor-touch",
      DS09_SEEKS.t2Arrive,
      touchDur,
      "SLECHTE AANNAME",
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
          trajectoryId: "lb-poor-touch",
          releaseLocal: 0,
          arrivalLocal: 0.32,
        },
        { kind: "possession", holderId: "opp.lb" },
        // Body stays MORE closed than a calm receive — pressure forces protection.
        move(
          "opp.lb",
          { x: 79.7, y: 83.3 },
          "easeOut",
          undefined,
          o(225, "closed", { visionTarget: { type: "teammate", playerId: "opp.8" }, receivingFoot: "right", nextActionIntent: "play-forward" }),
        ),
        move(
          "us.RW",
          { x: 44.9, y: 75 },
          "easeInOut",
          undefined,
          o(angleToward({ x: 44.9, y: 75 }, OPP8), "half-open-right", {
            visionTarget: { type: "opponent", playerId: "opp.8" },
            nextActionIntent: "press",
            prePassScan: true,
          }),
        ),
        move(
          "us.R6",
          { x: 43.6, y: 58.5 },
          "easeInOut",
          undefined,
          o(19, "half-open", { visionTarget: { type: "opponent", playerId: "opp.8" }, nextActionIntent: "cover" }),
        ),
        move("us.RB", { x: 34, y: 75.1 }, "easeInOut"),
        move(
          "opp.8",
          { x: 64, y: 68 },
          "easeInOut",
          undefined,
          o(196, "open", { visionTarget: { type: "ball" }, nextActionIntent: "play-forward" }),
        ),
      ],
      {
        teachingPoint: "Bal springt weg — nog steeds binnen kiezen",
        zoom: 1.32,
        follow: ["opp.lb", "us.RW", "opp.8", "us.R6"],
        orientations: castOrient({
          "opp.lb": o(225, "closed", { visionTarget: { type: "teammate", playerId: "opp.8" }, receivingFoot: "right", nextActionIntent: "play-forward" }),
          "us.RW": o(angleToward({ x: 44.9, y: 75 }, OPP8), "half-open-right", {
            visionTarget: { type: "opponent", playerId: "opp.8" },
            nextActionIntent: "press",
            prePassScan: true,
          }),
          "us.R6": o(19, "half-open", { visionTarget: { type: "opponent", playerId: "opp.8" }, nextActionIntent: "cover" }),
          "opp.8": o(196, "open", { visionTarget: { type: "ball" }, nextActionIntent: "play-forward" }),
        }),
      },
    ),

    /** Freeze arrives early — no time to admire the loose ball. */
    step(
      "t3-freeze-early",
      DS09_SEEKS.t3,
      t3dur,
      "BESLIS NU",
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
              geometry: { type: "corridor", from: BALL_SETTLE, to: OPP8, width: 6.8 },
            },
          ],
        },
        { kind: "setLines", lines: [] },
        { kind: "possession", holderId: "opp.lb" },
        move(
          "us.RW",
          { x: 45, y: 75.05 },
          "linear",
          undefined,
          o(angleToward({ x: 45, y: 75.05 }, OPP8), "half-open-right", {
            visionTarget: { type: "opponent", playerId: "opp.8" },
            nextActionIntent: "press",
            prePassScan: true,
          }),
        ),
        { kind: "hold" },
      ],
      {
        teachingPoint: "Geen tijd — toch dezelfde keuze",
        zoom: 1.36,
        follow: ["us.RW", "opp.lb", "opp.8"],
        orientations: castOrient({
          "opp.lb": o(228, "closed", { visionTarget: { type: "teammate", playerId: "opp.8" }, receivingFoot: "right", nextActionIntent: "play-forward" }),
          "us.RW": o(angleToward({ x: 45, y: 75.05 }, OPP8), "half-open-right", {
            visionTarget: { type: "opponent", playerId: "opp.8" },
            nextActionIntent: "press",
            prePassScan: true,
          }),
          "us.R6": o(21, "half-open", { visionTarget: { type: "opponent", playerId: "opp.8" }, nextActionIntent: "cover" }),
          "us.RB": o(-2, "side-on", { visionTarget: { type: "ball" }, nextActionIntent: "cover" }),
          "opp.8": o(193, "open", { visionTarget: { type: "ball" }, nextActionIntent: "play-forward" }),
        }),
      },
    ),
  ];
}

export const DS09_ANIM_LIVE: TacticalAnimationDefinition = {
  id: `anim.${IDS.live}`,
  situationId: IDS.live,
  complexity: "pattern",
  durationMs: DS09_SEEKS.liveEnd,
  pauseAtStartMs: 0,
  pauseAtEndMs: 2200,
  defaultPlaybackRate: 1,
  autoplay: true,
  loop: false,
  positioningMode: "authored",
  steps: buildPrelude(DS09_SEEKS.liveEnd),
};

export const DS09_ANIM_GOOD: TacticalAnimationDefinition = {
  id: `anim.${IDS.good}`,
  situationId: IDS.good,
  complexity: "pattern",
  durationMs: DS09_SEEKS.end,
  pauseAtStartMs: 0,
  pauseAtEndMs: 1800,
  defaultPlaybackRate: 1,
  autoplay: true,
  loop: false,
  positioningMode: "authored",
  steps: [
    ...buildPrelude(DS09_SEEKS.t4),
    step(
      "t4-curve-quick",
      DS09_SEEKS.t4,
      DS09_SEEKS.t5 - DS09_SEEKS.t4,
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
        move(
          "us.R6",
          { x: 51, y: 65 },
          "easeInOut",
          undefined,
          o(23, "half-open", { visionTarget: { type: "opponent", playerId: "opp.8" }, nextActionIntent: "cover" }),
        ),
        move("us.RB", { x: 47, y: 75.4 }, "easeInOut"),
        {
          kind: "setLines",
          lines: [{ kind: "press", from: { x: 66, y: 78 }, to: BALL_SETTLE }],
        },
        { kind: "possession", holderId: "opp.lb" },
      ],
      {
        teachingPoint: "Eerst de lijn — zelfs met de bal los",
        zoom: 1.3,
        follow: ["us.RW", "opp.lb", "opp.8", "us.R6"],
      },
    ),
    step(
      "t5-connect-quick",
      DS09_SEEKS.t5,
      DS09_SEEKS.t6 - DS09_SEEKS.t5,
      "TEAM",
      [
        { kind: "phase", phase: "follow" },
        { kind: "highlight", playerIds: ["us.RW", "us.R6", "us.RB"] },
        move(
          "us.RW",
          { x: 71.5, y: 80.8 },
          "easeIn",
          undefined,
          o(angleToward({ x: 71.5, y: 80.8 }, LB), "side-on", { visionTarget: { type: "ball" }, nextActionIntent: "press" }),
        ),
        move("us.R6", G.R6, "easeInOut"),
        move("us.RB", G.RB, "easeInOut"),
        move("us.L6", G.L6, "easeInOut"),
        move("us.10", { x: 55, y: 60 }, "easeInOut"),
        move("opp.8", { x: 61, y: 70.8 }, "easeOut"),
        move(
          "opp.lb",
          { x: 82.4, y: 86.6 },
          "easeIn",
          undefined,
          o(238, "closed", { visionTarget: { type: "teammate", playerId: "opp.cbL" }, receivingFoot: "right", nextActionIntent: "recycle" }),
        ),
        {
          kind: "setLines",
          lines: [{ kind: "press", from: { x: 71.5, y: 80.8 }, to: { x: 82.4, y: 86.6 } }],
        },
        { kind: "possession", holderId: "opp.lb" },
      ],
      {
        teachingPoint: "8 dekt — lijn dicht, ondanks tempo",
        zoom: 1.24,
        follow: ["us.RW", "us.R6", "opp.lb", "us.RB"],
      },
    ),
    step(
      "t6-recycle-quick",
      DS09_SEEKS.t6,
      DS09_SEEKS.t7 - DS09_SEEKS.t6,
      "GEVOLG",
      [
        { kind: "phase", phase: "result" },
        { kind: "highlight", playerIds: ["us.RW", "us.R6", "opp.cbL"] },
        {
          kind: "ballMove",
          from: { x: 82.4, y: 86.6 },
          to: PRESS_V2_GOOD_BALL_RESULT,
          easing: "easeOut",
          syncLane: true,
          trajectoryId: "lb-recycle-pressure",
          passerId: "opp.lb",
          laneStatus: "pass",
          releaseLocal: 0.18,
          arrivalLocal: 0.84,
        },
        { kind: "possession", holderId: null },
        move("opp.cbL", PRESS_V2_GOOD_BALL_RESULT, "easeOut"),
        { kind: "possession", holderId: "opp.cbL" },
        { kind: "setZones", zones: [] },
      ],
      {
        teachingPoint: "Alleen terug of wijd",
        zoom: 1.2,
        follow: ["us.RW", "opp.cbL", "us.R6", "opp.lb"],
      },
    ),
    step(
      "t7-hold-quick",
      DS09_SEEKS.t7,
      DS09_SEEKS.end - DS09_SEEKS.t7,
      "DICHT",
      [
        { kind: "phase", phase: "result" },
        { kind: "highlight", playerIds: ["us.RW", "us.R6", "us.RB"] },
        { kind: "possession", holderId: "opp.cbL" },
        { kind: "hold" },
      ],
      {
        teachingPoint: "Binnenkant dicht, ook onder druk",
        zoom: 1.18,
        follow: ["us.RW", "us.R6", "opp.cbL"],
      },
    ),
  ],
};

export const DS09_ANIM_BAD: TacticalAnimationDefinition = {
  id: `anim.${IDS.bad}`,
  situationId: IDS.bad,
  complexity: "pattern",
  durationMs: DS09_SEEKS.t7,
  pauseAtStartMs: 0,
  pauseAtEndMs: 1800,
  defaultPlaybackRate: 1,
  autoplay: true,
  loop: false,
  positioningMode: "authored",
  steps: [
    ...buildPrelude(DS09_SEEKS.t4),
    step(
      "t4-chase-loose-ball",
      DS09_SEEKS.t4,
      DS09_SEEKS.t5 - DS09_SEEKS.t4,
      "OP DE LOSSE BAL",
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
              geometry: { type: "corridor", from: BALL_SETTLE, to: OPP8, width: 6.8 },
            },
          ],
        },
        move(
          "us.RW",
          B.RW,
          "linear",
          RW_STRAIGHT_VIA,
          o(angleToward(B.RW, LB), "closed", { visionTarget: { type: "ball" }, nextActionIntent: "press" }),
        ),
        move("us.R6", { x: 43, y: 58.6 }, "easeInOut"),
        move("us.RB", { x: 34.5, y: 75.2 }, "easeInOut"),
        move(
          "opp.8",
          { x: 65.4, y: 66.8 },
          "easeOut",
          undefined,
          o(182, "open", { visionTarget: { type: "ball" }, nextActionIntent: "play-forward" }),
        ),
        {
          kind: "setLines",
          lines: [
            { kind: "fault", from: { x: 45, y: 75.05 }, to: BALL_SETTLE, dashed: true },
            { kind: "fault", from: BALL_SETTLE, to: { x: 65.4, y: 66.8 }, dashed: true },
          ],
        },
        { kind: "possession", holderId: "opp.lb" },
      ],
      {
        teachingPoint: "Verleidelijk — maar lijn blijft open",
        zoom: 1.3,
        follow: ["us.RW", "opp.lb", "opp.8"],
      },
    ),
    step(
      "t5-inside-quick",
      DS09_SEEKS.t5,
      DS09_SEEKS.t6 - DS09_SEEKS.t5,
      "BINNEN OPEN",
      [
        { kind: "phase", phase: "reaction" },
        { kind: "highlight", playerIds: ["opp.8", "us.RW"] },
        {
          kind: "ballMove",
          from: BALL_SETTLE,
          to: PRESS_V2_BAD_BALL_RESULT,
          easing: "linear",
          syncLane: true,
          trajectoryId: "lb-inside-pressure",
          passerId: "opp.lb",
          laneStatus: "fault",
          releaseLocal: 0.1,
          arrivalLocal: 0.68,
        },
        { kind: "possession", holderId: null },
        move(
          "opp.8",
          PRESS_V2_BAD_BALL_RESULT,
          "easeOut",
          undefined,
          o(176, "open", { visionTarget: { type: "ball" }, nextActionIntent: "play-forward", receivingFoot: "right" }),
        ),
        move("us.RW", { x: 73.5, y: 82.5 }, "easeIn"),
        move("us.R6", B.R6, "easeInOut"),
        { kind: "possession", holderId: "opp.8" },
        {
          kind: "setZones",
          zones: [{ x: 58, y: 58, w: 16, h: 16, kind: "risk", label: "", geometry: { type: "ellipse" } }],
        },
      ],
      {
        teachingPoint: "Hun 8 is vrij, meteen",
        zoom: 1.26,
        follow: ["opp.8", "us.RW", "opp.lb"],
      },
    ),
    step(
      "t6-broken-quick",
      DS09_SEEKS.t6,
      DS09_SEEKS.t7 - DS09_SEEKS.t6,
      "PRESS WEG",
      [
        { kind: "phase", phase: "result" },
        { kind: "highlight", playerIds: ["opp.8", "us.RW"] },
        { kind: "possession", holderId: "opp.8" },
        { kind: "setLines", lines: [] },
        { kind: "hold" },
      ],
      {
        teachingPoint: "Press breekt, direct",
        zoom: 1.2,
        follow: ["opp.8", "us.RW", "us.R6"],
      },
    ),
  ],
};

export const DS09_BUNDLE = {
  sessionId: SESSION_ID,
  slug: SLUG,
  freezeMs: DS09_SEEKS.freeze,
  previewMs: DS09_SEEKS.previewOpening,
  activeRole: "us.RW",
  mobileFocusIds: ["us.RW", "us.R6", "us.RB", "us.10"],
  situations: {
    [IDS.live]: DS09_SITUATION,
    [IDS.good]: DS09_SITUATION_GOOD,
    [IDS.bad]: DS09_SITUATION_BAD,
  } as Record<string, TacticalSituationDefinition>,
  animations: {
    [IDS.live]: DS09_ANIM_LIVE,
    [IDS.good]: DS09_ANIM_GOOD,
    [IDS.bad]: DS09_ANIM_BAD,
  } as Record<string, TacticalAnimationDefinition>,
};
