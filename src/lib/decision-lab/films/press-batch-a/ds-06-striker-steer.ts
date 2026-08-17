/**
 * FDL-DS-ST-STEER-PIN-V1 — "Spits stuurt" (hand-authored, Press Batch A #6).
 *
 * Unique read: the learner (us.SP) never needs to sprint anywhere — the ball
 * is not near her. What matters is the ANGLE of her recovery run while RW
 * closes down the back. A curved run pins the return pass to LCB/GK and
 * steers everything toward RW's press side; a straight sprint at the
 * ball-carrier removes that screen and opens the middle instead.
 *
 * Mute-test: RW closes down → freeze on SP's angle → curve to pin vs sprint
 * to ball → team reacts (or doesn't). Experience-only. Not a reusable template.
 */

import { createPressingArc } from "@/lib/academie/tactical-animation-collision";
import type {
  TacticalAnimationAction,
  TacticalAnimationDefinition,
  TacticalAnimationStep,
} from "@/lib/academie/tactical-animation-types";
import type { PlayerOrientation } from "@/lib/academie/tactical-orientation";
import { angleToward } from "@/lib/academie/tactical-orientation";
import {
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
import { o, move, step } from "@/lib/decision-lab/films/press-batch-a/kit";
import { DS06_SEEKS } from "@/lib/decision-lab/films/press-batch-a/timings";

export { DS06_SEEKS } from "@/lib/decision-lab/films/press-batch-a/timings";

const SLUG = "spits-stuurt";
const SESSION_ID = "FDL-DS-ST-STEER-PIN-V1";
const ACTIVE_ROLE = "us.SP";
const SUPPORT_ROLES = ["us.RW", "us.10", "us.R6"] as const;
const IDS = filmIdsForSlug(SLUG);

/** ——— Shared geometry ——— */
const US = PRESS_V2_US_START;
const G = PRESS_V2_GOOD_US_END;

const CBL = { x: 82, y: 60 };
const LB = { x: 80, y: 84 };
const GK = { x: 94, y: 50 };

const BALL_AT_CBL = ballAtReceivingFoot(CBL, { foot: "right", facingDeg: 12 });
const BALL_ARRIVE = ballAtReceivingFoot(LB, { foot: "right", facingDeg: 205 });
const BALL_SETTLE = { x: BALL_ARRIVE.x - 0.9, y: BALL_ARRIVE.y - 0.55 };

/** RW's own press curve — unaffected by SP's choice; forms the "press side" SP steers toward. */
const RW_CUT = { x: 55, y: 75 };
const RW_ARC = createPressingArc(US.RW, RW_CUT, G.RW, { bulge: 5.2 });

/** SP's screening target — goal-side of the LCB↔GK return lane. */
const SP_SCREEN_CUT = { x: 68, y: 58 };
const SP_SCREEN_FINAL = { x: 77, y: 68 };
/** SP's wrong target — straight line at the ball-carrier, redundant with RW. */
const SP_CHASE_FINAL = { x: 71, y: 78 };
/** Forced-error clearance point — ball leaves the pitch under the good press trap. */
const BALL_FORCED_OUT = { x: 79, y: 98 };

const CAST_FOLLOW = ["us.SP", "us.10", "opp.cbL", "us.RW"] as const;

function rwOrientation(at: TacticalPoint, extra?: Partial<PlayerOrientation>): PlayerOrientation {
  return o(angleToward(at, LB), "side-on", {
    visionTarget: { type: "ball" },
    nextActionIntent: "press",
    ...extra,
  });
}

function passLcbToLb(stepStart: number, stepDur: number): TacticalAnimationAction[] {
  const dur = Math.max(stepDur, 1);
  const releaseAbs = DS06_SEEKS.t2 + 220;
  const arrivalAbs = DS06_SEEKS.t2Arrive - 40;
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

/** Shared start: ball at LCB, SP central and unhurried — the angle is still open. */
export const FDL_DS_ST_STEER_SITUATION: TacticalSituationDefinition = {
  id: IDS.live as TacticalSituationDefinition["id"],
  eyebrow: "SITUATIE",
  title: "Hun LCB speelt breed naar de back",
  subtitle: "Jij bent de spits — niet de bal, de hoek van je loop telt.",
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
  id: string,
  eyebrow: TacticalSituationDefinition["eyebrow"],
  title: string,
  subtitle: string,
): TacticalSituationDefinition {
  return {
    ...FDL_DS_ST_STEER_SITUATION,
    id: id as TacticalSituationDefinition["id"],
    eyebrow,
    title,
    subtitle,
  };
}

export const FDL_DS_ST_STEER_SITUATION_GOOD = cloneSituation(
  IDS.good,
  "GOED",
  "Bocht pint de terugpass — bal blijft bij de druk",
  "Spits sluit LCB/GK af; de back moet geforceerd spelen.",
);

export const FDL_DS_ST_STEER_SITUATION_BAD = cloneSituation(
  IDS.bad,
  "FOUT",
  "Spits sprint recht op de bal — midden gaat open",
  "RW staat er alleen voor; de terugpass ligt vrij.",
);

/**
 * Shared T0→T3 prelude — identical for live / good / bad.
 * SP drifts across, undecided; RW has not yet launched its curve either.
 */
function buildPrelude(toFreezeHoldMs: number): TacticalAnimationStep[] {
  const t0dur = DS06_SEEKS.t1 - DS06_SEEKS.t0;
  const t1dur = DS06_SEEKS.t2 - DS06_SEEKS.t1;
  const t2dur = DS06_SEEKS.t2Arrive - DS06_SEEKS.t2;
  const touchDur = DS06_SEEKS.t3 - DS06_SEEKS.t2Arrive;
  const t3dur = toFreezeHoldMs - DS06_SEEKS.t3;

  return [
    step(
      "t0-set",
      DS06_SEEKS.t0,
      t0dur,
      "Situatie",
      [
        { kind: "phase", phase: "initial" },
        { kind: "highlight", playerIds: ["opp.cbL", "us.SP"] },
        { kind: "possession", holderId: "opp.cbL" },
        { kind: "hold" },
      ],
      {
        teachingPoint: "Bal bij hun LCB — jij staat centraal, nog niets kiezen",
        zoom: 1.1,
        follow: ["opp.cbL", "us.SP", "us.10", "us.RW", "opp.lb"],
        orientations: {
          "opp.cbL": o(10, "half-open-right", {
            visionTarget: { type: "teammate", playerId: "opp.lb" },
            nextActionIntent: "play-forward",
            receivingFoot: "right",
          }),
          "opp.lb": o(188, "side-on", { visionTarget: { type: "ball" }, nextActionIntent: "play-forward" }),
          "us.SP": o(angleToward(US.SP, CBL), "half-open", {
            visionTarget: { type: "opponent", playerId: "opp.cbL" },
            nextActionIntent: "cover",
          }),
          "us.RW": rwOrientation(US.RW, { prePassScan: true }),
          "us.10": o(-6, "half-open", { visionTarget: { type: "ball" }, nextActionIntent: "cover" }),
        },
      },
    ),

    step(
      "t1-scan",
      DS06_SEEKS.t1,
      t1dur,
      "SCAN",
      [
        { kind: "phase", phase: "recognition" },
        { kind: "highlight", playerIds: ["opp.cbL", "us.SP", "opp.lb"] },
        {
          kind: "setZones",
          zones: [
            {
              x: 72,
              y: 46,
              w: 20,
              h: 18,
              kind: "scan",
              label: "",
              geometry: { type: "ellipse" },
            },
          ],
        },
        move("opp.cbL", { x: 81.4, y: 60.8 }, "easeInOut"),
        move("opp.lb", { x: 80.4, y: 85 }, "easeInOut", undefined, o(198, "closed", {
          visionTarget: { type: "ball" },
          receivingFoot: "right",
          nextActionIntent: "play-forward",
        })),
        move("us.SP", { x: 54, y: 45 }, "linear", undefined, o(angleToward({ x: 54, y: 45 }, CBL), "half-open", {
          visionTarget: { type: "opponent", playerId: "opp.cbL" },
          nextActionIntent: "cover",
        })),
        move("us.10", { x: 52.5, y: 55 }, "linear"),
        move("us.RW", { x: 41.8, y: 74.4 }, "linear", undefined, o(angleToward({ x: 41.8, y: 74.4 }, LB), "half-open-right", {
          visionTarget: { type: "ball" },
          nextActionIntent: "press",
          prePassScan: true,
        })),
        move("us.R6", { x: 41.2, y: 57.2 }, "linear"),
        { kind: "possession", holderId: "opp.cbL" },
      ],
      {
        teachingPoint: "Zie de terugoptie naar LCB en GK",
        zoom: 1.14,
        follow: [...CAST_FOLLOW],
      },
    ),

    step(
      "t2-trigger",
      DS06_SEEKS.t2,
      t2dur,
      "TRIGGER",
      [
        { kind: "phase", phase: "prepare" },
        { kind: "highlight", playerIds: ["opp.lb", "us.RW"] },
        { kind: "setZones", zones: [] },
        ...passLcbToLb(DS06_SEEKS.t2, t2dur),
        move("opp.cbL", { x: 81.2, y: 60.5 }, "easeOut"),
        move("opp.lb", LB, "easeOut", undefined, o(205, "closed", {
          visionTarget: { type: "ball" },
          receivingFoot: "right",
          nextActionIntent: "play-forward",
        })),
        move("us.SP", { x: 56, y: 49 }, "easeOut", undefined, o(angleToward({ x: 56, y: 49 }, CBL), "half-open", {
          visionTarget: { type: "opponent", playerId: "opp.cbL" },
          nextActionIntent: "cover",
        })),
        move("us.10", { x: 53, y: 55.5 }, "easeOut"),
        move("us.RW", { x: 43.5, y: 74.8 }, "easeOut", undefined, o(angleToward({ x: 43.5, y: 74.8 }, LB), "side-on", {
          visionTarget: { type: "ball" },
          nextActionIntent: "press",
        })),
        move("us.R6", { x: 42.5, y: 58 }, "easeOut"),
      ],
      {
        teachingPoint: "Pass naar de back — RW bereidt de druk voor",
        isTrigger: true,
        zoom: 1.2,
        follow: [...CAST_FOLLOW, "opp.cbL"],
        orientations: {
          "opp.lb": o(205, "closed", {
            visionTarget: { type: "ball" },
            receivingFoot: "right",
            nextActionIntent: "play-forward",
          }),
          "us.SP": o(angleToward({ x: 56, y: 49 }, CBL), "half-open", {
            visionTarget: { type: "opponent", playerId: "opp.cbL" },
            nextActionIntent: "cover",
          }),
          "us.RW": o(angleToward({ x: 43.5, y: 74.8 }, LB), "side-on", {
            visionTarget: { type: "ball" },
            nextActionIntent: "press",
          }),
        },
      },
    ),

    step(
      "t2b-first-touch",
      DS06_SEEKS.t2Arrive,
      touchDur,
      "AANNAME",
      [
        { kind: "phase", phase: "prepare" },
        { kind: "highlight", playerIds: ["opp.lb", "us.SP"] },
        { kind: "setLines", lines: [] },
        { kind: "setZones", zones: [] },
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
        move("opp.lb", { x: 80.15, y: 84.25 }, "easeOut", undefined, o(212, "closed", {
          visionTarget: { type: "teammate", playerId: "opp.cbL" },
          receivingFoot: "right",
          nextActionIntent: "recycle",
        })),
        move("us.SP", { x: 58, y: 52 }, "easeInOut", undefined, o(angleToward({ x: 58, y: 52 }, CBL), "half-open", {
          visionTarget: { type: "opponent", playerId: "opp.cbL" },
          nextActionIntent: "cover",
          prePassScan: true,
        })),
        move("us.10", { x: 53.5, y: 56 }, "easeInOut"),
        move("us.RW", { x: 44.2, y: 75.1 }, "easeInOut", undefined, o(angleToward({ x: 44.2, y: 75.1 }, LB), "half-open-right", {
          visionTarget: { type: "ball" },
          nextActionIntent: "press",
          prePassScan: true,
        })),
        move("us.R6", { x: 43.2, y: 58.4 }, "easeInOut"),
      ],
      {
        teachingPoint: "Eerste aanname — de terugpass ligt nog open",
        zoom: 1.22,
        follow: [...CAST_FOLLOW],
      },
    ),

    step(
      "t3-freeze",
      DS06_SEEKS.t3,
      t3dur,
      "BESLIS",
      [
        { kind: "phase", phase: "recognition" },
        { kind: "highlight", playerIds: ["us.SP", "opp.cbL", "us.RW"] },
        {
          kind: "setZones",
          zones: [
            {
              x: 76,
              y: 52,
              w: 18,
              h: 20,
              kind: "risk",
              label: "",
              geometry: { type: "corridor", from: BALL_SETTLE, to: CBL, width: 6 },
            },
          ],
        },
        { kind: "setLines", lines: [] },
        { kind: "possession", holderId: "opp.lb" },
        move("us.SP", { x: 58.2, y: 52.1 }, "linear", undefined, o(angleToward({ x: 58.2, y: 52.1 }, CBL), "half-open", {
          visionTarget: { type: "opponent", playerId: "opp.cbL" },
          nextActionIntent: "cover",
          prePassScan: true,
        })),
        // RW's curve NOT started yet — the shape depends on the angle SP is about to pick.
        move("us.RW", { x: 44.4, y: 75.15 }, "linear", undefined, o(angleToward({ x: 44.4, y: 75.15 }, LB), "half-open-right", {
          visionTarget: { type: "ball" },
          nextActionIntent: "press",
          prePassScan: true,
        })),
        { kind: "hold" },
      ],
      {
        teachingPoint: "Welke hoek kies jij — bocht of rechtdoor?",
        zoom: 1.24,
        follow: [...CAST_FOLLOW],
        orientations: {
          "opp.lb": o(214, "closed", {
            visionTarget: { type: "teammate", playerId: "opp.cbL" },
            receivingFoot: "right",
            nextActionIntent: "recycle",
          }),
          "us.SP": o(angleToward({ x: 58.2, y: 52.1 }, CBL), "half-open", {
            visionTarget: { type: "opponent", playerId: "opp.cbL" },
            nextActionIntent: "cover",
            prePassScan: true,
          }),
          "us.RW": o(angleToward({ x: 44.4, y: 75.15 }, LB), "half-open-right", {
            visionTarget: { type: "ball" },
            nextActionIntent: "press",
            prePassScan: true,
          }),
          "us.10": o(-8, "half-open", { visionTarget: { type: "ball" }, nextActionIntent: "cover" }),
          "opp.cbL": o(28, "half-open-right", {
            visionTarget: { type: "teammate", playerId: "opp.lb" },
            nextActionIntent: "play-forward",
          }),
        },
      },
    ),
  ];
}

export const ANIM_FDL_DS_ST_STEER_LIVE: TacticalAnimationDefinition = {
  id: `anim.${IDS.live}`,
  situationId: IDS.live,
  complexity: "pattern",
  durationMs: DS06_SEEKS.liveEnd,
  pauseAtStartMs: 0,
  pauseAtEndMs: 2600,
  defaultPlaybackRate: 1,
  autoplay: true,
  loop: false,
  positioningMode: "authored",
  steps: buildPrelude(DS06_SEEKS.liveEnd),
};

export const ANIM_FDL_DS_ST_STEER_GOOD: TacticalAnimationDefinition = {
  id: `anim.${IDS.good}`,
  situationId: IDS.good,
  complexity: "pattern",
  durationMs: DS06_SEEKS.end,
  pauseAtStartMs: 0,
  pauseAtEndMs: 2200,
  defaultPlaybackRate: 1,
  autoplay: true,
  loop: false,
  positioningMode: "authored",
  steps: [
    ...buildPrelude(DS06_SEEKS.t4),
    step(
      "t4-curve-pin",
      DS06_SEEKS.t4,
      DS06_SEEKS.t5 - DS06_SEEKS.t4,
      "BOCHT PINT",
      [
        { kind: "phase", phase: "action" },
        { kind: "highlight", playerIds: ["us.SP", "us.RW"] },
        { kind: "setZones", zones: [] },
        move(
          "us.SP",
          SP_SCREEN_CUT,
          "easeOut",
          createPressingArc({ x: 58.2, y: 52.1 }, SP_SCREEN_CUT, SP_SCREEN_FINAL, { bulge: 6 }).slice(0, 1),
          o(angleToward(SP_SCREEN_CUT, GK), "half-open", {
            visionTarget: { type: "opponent", playerId: "opp.cbL" },
            nextActionIntent: "cover",
          }),
        ),
        move("us.RW", RW_ARC[0]!, "easeOut", undefined, rwOrientation(RW_ARC[0]!)),
        {
          kind: "setLines",
          lines: [{ kind: "press", from: SP_SCREEN_CUT, to: CBL, dashed: true }],
        },
        { kind: "possession", holderId: "opp.lb" },
      ],
      {
        teachingPoint: "Bocht sluit LCB/GK af — niet rechtdoor",
        zoom: 1.24,
        follow: [...CAST_FOLLOW],
      },
    ),
    step(
      "t5-team-reacts",
      DS06_SEEKS.t5,
      DS06_SEEKS.t6 - DS06_SEEKS.t5,
      "TEAM STUURT MEE",
      [
        { kind: "phase", phase: "follow" },
        { kind: "highlight", playerIds: ["us.SP", "us.10", "us.R6", "us.RW"] },
        move("us.SP", SP_SCREEN_FINAL, "easeInOut", undefined, o(angleToward(SP_SCREEN_FINAL, GK), "half-open", {
          visionTarget: { type: "opponent", playerId: "opp.cbL" },
          nextActionIntent: "cover",
        })),
        // Rest of the team steers with SP — everyone shifts toward the press side.
        move("us.10", { x: 58, y: 60 }, "easeInOut"),
        move("us.R6", { x: 50, y: 66 }, "easeInOut"),
        move("us.L6", { x: 46, y: 48 }, "easeInOut"),
        move("us.RW", G.RW, "easeIn", undefined, rwOrientation(G.RW)),
        move("opp.lb", { x: 82, y: 87 }, "easeIn", undefined, o(240, "closed", {
          visionTarget: { type: "ball" },
          nextActionIntent: "recycle",
          receivingFoot: "right",
        })),
        {
          kind: "setLines",
          lines: [
            { kind: "press", from: SP_SCREEN_FINAL, to: CBL, dashed: true },
            { kind: "press", from: G.RW, to: { x: 82, y: 87 } },
          ],
        },
        {
          kind: "setZones",
          zones: [
            {
              x: 70,
              y: 52,
              w: 16,
              h: 18,
              kind: "cover-shadow",
              label: "",
              geometry: { type: "taper-shadow", apex: SP_SCREEN_FINAL, dirDeg: 30, nearWidth: 2, farWidth: 8, length: 11 },
            },
          ],
        },
        { kind: "possession", holderId: "opp.lb" },
      ],
      {
        teachingPoint: "Hele blok stuurt mee — geen uitweg terug",
        zoom: 1.18,
        follow: ["us.SP", "us.10", "us.RW", "opp.lb"],
      },
    ),
    step(
      "t6-forced-error",
      DS06_SEEKS.t6,
      DS06_SEEKS.t7 - DS06_SEEKS.t6,
      "GEVOLG",
      [
        { kind: "phase", phase: "result" },
        { kind: "highlight", playerIds: ["opp.lb", "us.SP", "us.RW"] },
        {
          kind: "ballMove",
          from: { x: 82, y: 87 },
          to: BALL_FORCED_OUT,
          easing: "easeOut",
          syncLane: true,
          trajectoryId: "lb-forced-clearance",
          passerId: "opp.lb",
          laneStatus: "fault",
          releaseLocal: 0.14,
          arrivalLocal: 0.86,
        },
        { kind: "possession", holderId: null },
        { kind: "setZones", zones: [] },
      ],
      {
        teachingPoint: "Geen terugpass mogelijk — bal gaat eruit",
        zoom: 1.16,
        follow: ["opp.lb", "us.SP", "us.RW"],
      },
    ),
    step(
      "t7-hold",
      DS06_SEEKS.t7,
      DS06_SEEKS.end - DS06_SEEKS.t7,
      "GESTUURD",
      [
        { kind: "phase", phase: "result" },
        { kind: "highlight", playerIds: ["us.SP", "us.RW", "us.10"] },
        { kind: "possession", holderId: null },
        { kind: "hold" },
      ],
      {
        teachingPoint: "Bocht van de spits stuurt het hele blok",
        zoom: 1.14,
        follow: ["us.SP", "us.RW", "us.10"],
      },
    ),
  ],
};

export const ANIM_FDL_DS_ST_STEER_BAD: TacticalAnimationDefinition = {
  id: `anim.${IDS.bad}`,
  situationId: IDS.bad,
  complexity: "pattern",
  durationMs: DS06_SEEKS.t7,
  pauseAtStartMs: 0,
  pauseAtEndMs: 2200,
  defaultPlaybackRate: 1,
  autoplay: true,
  loop: false,
  positioningMode: "authored",
  steps: [
    ...buildPrelude(DS06_SEEKS.t4),
    step(
      "t4-solo-chase",
      DS06_SEEKS.t4,
      DS06_SEEKS.t5 - DS06_SEEKS.t4,
      "RECHT OP DE BAL",
      [
        { kind: "phase", phase: "action" },
        { kind: "highlight", playerIds: ["us.SP", "us.RW"] },
        {
          kind: "setZones",
          zones: [
            {
              x: 74,
              y: 50,
              w: 20,
              h: 20,
              kind: "risk",
              label: "",
              geometry: { type: "ellipse" },
            },
          ],
        },
        // Straight line — no curve, no screen. SP simply chases the ball.
        move("us.SP", SP_CHASE_FINAL, "easeOut", undefined, o(angleToward(SP_CHASE_FINAL, LB), "closed", {
          visionTarget: { type: "ball" },
          nextActionIntent: "press",
        })),
        move("us.RW", RW_ARC[0]!, "easeOut", undefined, rwOrientation(RW_ARC[0]!)),
        {
          kind: "setLines",
          lines: [{ kind: "fault", from: BALL_SETTLE, to: CBL, dashed: true }],
        },
        { kind: "possession", holderId: "opp.lb" },
      ],
      {
        teachingPoint: "Spits jaagt de bal — LCB/GK blijft open",
        zoom: 1.22,
        follow: [...CAST_FOLLOW],
      },
    ),
    step(
      "t5-centre-opens",
      DS06_SEEKS.t5,
      DS06_SEEKS.t6 - DS06_SEEKS.t5,
      "MIDDEN OPEN",
      [
        { kind: "phase", phase: "reaction" },
        { kind: "highlight", playerIds: ["opp.cbL", "us.SP", "us.RW"] },
        {
          kind: "ballMove",
          from: BALL_SETTLE,
          to: CBL,
          easing: "easeOut",
          syncLane: true,
          trajectoryId: "lb-recycle-open",
          passerId: "opp.lb",
          laneStatus: "fault",
          releaseLocal: 0.14,
          arrivalLocal: 0.78,
        },
        { kind: "possession", holderId: null },
        move("opp.cbL", CBL, "easeOut", undefined, o(15, "open", {
          visionTarget: { type: "ball" },
          nextActionIntent: "play-forward",
          receivingFoot: "right",
        })),
        move("us.RW", { x: 68, y: 79 }, "easeIn"),
        move("us.SP", { x: 73, y: 79 }, "easeIn"),
        { kind: "possession", holderId: "opp.cbL" },
      ],
      {
        teachingPoint: "Terugpass ligt vrij — RW staat er alleen voor",
        zoom: 1.18,
        follow: ["opp.cbL", "us.RW", "us.SP"],
      },
    ),
    step(
      "t6-isolated",
      DS06_SEEKS.t6,
      DS06_SEEKS.t7 - DS06_SEEKS.t6,
      "RW GEÏSOLEERD",
      [
        { kind: "phase", phase: "result" },
        { kind: "highlight", playerIds: ["opp.cbL", "us.RW"] },
        move("opp.cbL", { x: 70, y: 50 }, "easeOut", undefined, o(0, "open", {
          visionTarget: { type: "goal" },
          nextActionIntent: "play-forward",
        })),
        { kind: "possession", holderId: "opp.cbL" },
        { kind: "setLines", lines: [] },
        { kind: "hold" },
      ],
      {
        teachingPoint: "Ze spelen vrij door het midden",
        zoom: 1.12,
        follow: ["opp.cbL", "us.RW", "us.SP"],
      },
    ),
  ],
};

export const DS06_FILM_IDS = IDS;

export type Ds06FilmBundle = {
  sessionId: string;
  slug: string;
  freezeMs: number;
  previewMs: number;
  activeRole: string;
  mobileFocusIds: string[];
  situations: Record<string, TacticalSituationDefinition>;
  animations: Record<string, TacticalAnimationDefinition>;
};

export const DS06_BUNDLE: Ds06FilmBundle = {
  sessionId: SESSION_ID,
  slug: SLUG,
  freezeMs: DS06_SEEKS.freeze,
  previewMs: DS06_SEEKS.previewOpening,
  activeRole: ACTIVE_ROLE,
  mobileFocusIds: [ACTIVE_ROLE, ...SUPPORT_ROLES],
  situations: {
    [IDS.live]: FDL_DS_ST_STEER_SITUATION,
    [IDS.good]: FDL_DS_ST_STEER_SITUATION_GOOD,
    [IDS.bad]: FDL_DS_ST_STEER_SITUATION_BAD,
  },
  animations: {
    [IDS.live]: ANIM_FDL_DS_ST_STEER_LIVE,
    [IDS.good]: ANIM_FDL_DS_ST_STEER_GOOD,
    [IDS.bad]: ANIM_FDL_DS_ST_STEER_BAD,
  },
};
