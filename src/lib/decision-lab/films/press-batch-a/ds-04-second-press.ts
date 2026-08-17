/**
 * FDL-DS-SECOND-PRESS-8-V1 — "Tweede druk" (hand-authored, Press Batch A #4).
 *
 * Unique read: by the freeze, us.RW is NOT waiting — the first press is already
 * a visibly committed curve, roughly halfway along its arc to the LB. The
 * learner (us.R6, shirt "8") must decide what SHE does while that first press
 * keeps going: step across to deny the inside pass to opp.8, or pile onto the
 * ball-carrier alongside RW (double press) and leave opp.8 free.
 *
 * Mute-test: RW already curving → freeze on R6 → cover inside vs double press
 * → consequence. Experience-only. Not a reusable template.
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
import { o, move, step } from "@/lib/decision-lab/films/press-batch-a/kit";
import { DS04_SEEKS } from "@/lib/decision-lab/films/press-batch-a/timings";

export { DS04_SEEKS } from "@/lib/decision-lab/films/press-batch-a/timings";

const SLUG = "tweede-druk-8";
const SESSION_ID = "FDL-DS-SECOND-PRESS-8-V1";
const ACTIVE_ROLE = "us.R6";
const SUPPORT_ROLES = ["us.RW", "us.L6", "us.RB"] as const;
const IDS = filmIdsForSlug(SLUG);

/** ——— Shared geometry ——— */
const US = PRESS_V2_US_START;
const G = PRESS_V2_GOOD_US_END;
const B = PRESS_V2_BAD_US_END;

const CBL = { x: 82, y: 60 };
const LB = { x: 80, y: 84 };
const OPP8 = { x: 64, y: 68 };

const BALL_AT_CBL = ballAtReceivingFoot(CBL, { foot: "right", facingDeg: 12 });
const BALL_ARRIVE = ballAtReceivingFoot(LB, { foot: "right", facingDeg: 205 });
const BALL_SETTLE = { x: BALL_ARRIVE.x - 0.9, y: BALL_ARRIVE.y - 0.55 };

/**
 * RW's press is ONE continuous authored curve from kickoff of the trigger.
 * The cut point marks the ~halfway mark — RW arrives there exactly as the
 * freeze hold completes, then finishes the arc after the learner decides.
 */
const RW_CUT = { x: 54, y: 77 };
const RW_ARC_GOOD = createPressingArc(US.RW, RW_CUT, G.RW, { bulge: 5 });
const RW_ARC_BAD = createPressingArc(US.RW, RW_CUT, B.RW, { bulge: 5 });
/** [0]=first curve sample, [1]=second curve sample (~halfway leg), [2]=cut point, [3]=finish sample */
const RW_LEG1 = RW_ARC_GOOD[0]!;
const RW_LEG2 = RW_ARC_GOOD[1]!;
const RW_FINISH_GOOD = RW_ARC_GOOD[3]!;
const RW_FINISH_BAD = RW_ARC_BAD[3]!;

const CAST_FOLLOW = ["us.R6", "us.RW", "opp.8", "opp.lb"] as const;

function rwOrientation(at: TacticalPoint, extra?: Partial<PlayerOrientation>): PlayerOrientation {
  return o(angleToward(at, LB), "side-on", {
    visionTarget: { type: "ball" },
    nextActionIntent: "press",
    ...extra,
  });
}

function passLcbToLb(stepStart: number, stepDur: number): TacticalAnimationAction[] {
  const dur = Math.max(stepDur, 1);
  const releaseAbs = DS04_SEEKS.t2 + 220;
  const arrivalAbs = DS04_SEEKS.t2Arrive - 40;
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

/** Shared start: ball at LCB, us press-ready — RW about to launch its curve. */
export const FDL_DS_SECOND_PRESS_SITUATION: TacticalSituationDefinition = {
  id: IDS.live as TacticalSituationDefinition["id"],
  eyebrow: "SITUATIE",
  title: "Hun LCB speelt breed naar de back",
  subtitle: "Jij bent de 8 — RW is al vertrokken op de bal.",
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
    ...FDL_DS_SECOND_PRESS_SITUATION,
    id: id as TacticalSituationDefinition["id"],
    eyebrow,
    title,
    subtitle,
  };
}

export const FDL_DS_SECOND_PRESS_SITUATION_GOOD = cloneSituation(
  IDS.good,
  "GOED",
  "8 dekt binnen — RW maakt zijn duel af",
  "Tweede druk blijft bij de bal; jij sluit de passlijn naar opp.8.",
);

export const FDL_DS_SECOND_PRESS_SITUATION_BAD = cloneSituation(
  IDS.bad,
  "FOUT",
  "Dubbele druk op de back — binnen wordt vrij",
  "Twee spelers op de bal; opp.8 ontvangt zonder druk.",
);

/**
 * Shared T0→T3 prelude — identical for live / good / bad.
 * RW's curve is already running here; only R6's choice after freeze differs.
 */
function buildPrelude(toFreezeHoldMs: number): TacticalAnimationStep[] {
  const t0dur = DS04_SEEKS.t1 - DS04_SEEKS.t0;
  const t1dur = DS04_SEEKS.t2 - DS04_SEEKS.t1;
  const t2dur = DS04_SEEKS.t2Arrive - DS04_SEEKS.t2;
  const touchDur = DS04_SEEKS.t3 - DS04_SEEKS.t2Arrive;
  const t3dur = toFreezeHoldMs - DS04_SEEKS.t3;

  return [
    step(
      "t0-set",
      DS04_SEEKS.t0,
      t0dur,
      "Situatie",
      [
        { kind: "phase", phase: "initial" },
        { kind: "highlight", playerIds: ["opp.cbL", "us.RW"] },
        { kind: "possession", holderId: "opp.cbL" },
        { kind: "hold" },
      ],
      {
        teachingPoint: "Bal bij hun LCB — RW is al vertrokken",
        zoom: 1.12,
        follow: ["opp.cbL", "opp.lb", "us.RW", "us.R6", "opp.8", "us.RB"],
        orientations: {
          "opp.cbL": o(10, "half-open-right", {
            visionTarget: { type: "teammate", playerId: "opp.lb" },
            nextActionIntent: "play-forward",
            receivingFoot: "right",
          }),
          "opp.lb": o(188, "side-on", { visionTarget: { type: "ball" }, nextActionIntent: "play-forward" }),
          "us.RW": rwOrientation(US.RW, { prePassScan: true }),
          "us.R6": o(angleToward(US.R6, OPP8), "half-open", {
            visionTarget: { type: "opponent", playerId: "opp.8" },
            nextActionIntent: "cover",
          }),
          "opp.8": o(198, "open", { visionTarget: { type: "ball" } }),
        },
      },
    ),

    step(
      "t1-scan",
      DS04_SEEKS.t1,
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
        move("opp.cbL", { x: 81.4, y: 60.8 }, "easeInOut"),
        move("opp.lb", { x: 80.4, y: 85 }, "easeInOut", undefined, o(198, "closed", {
          visionTarget: { type: "ball" },
          receivingFoot: "right",
          nextActionIntent: "play-forward",
        })),
        move("us.RW", RW_LEG1, "easeOut", undefined, rwOrientation(RW_LEG1, { prePassScan: true })),
        move("us.R6", { x: 41.3, y: 57 }, "linear", undefined, o(16, "half-open", {
          visionTarget: { type: "opponent", playerId: "opp.8" },
          nextActionIntent: "cover",
        })),
        move("us.L6", { x: 40.5, y: 41 }, "linear"),
        move("us.RB", { x: 31, y: 74.2 }, "linear"),
        move("opp.8", { x: 64.5, y: 68.5 }, "linear", undefined, o(200, "open", { visionTarget: { type: "ball" } })),
        { kind: "possession", holderId: "opp.cbL" },
      ],
      {
        teachingPoint: "Zie de dubbele optie: 8 en de back",
        zoom: 1.18,
        follow: [...CAST_FOLLOW, "opp.cbL"],
      },
    ),

    step(
      "t2-trigger",
      DS04_SEEKS.t2,
      t2dur,
      "TRIGGER",
      [
        { kind: "phase", phase: "prepare" },
        { kind: "highlight", playerIds: ["opp.lb", "us.RW"] },
        { kind: "setZones", zones: [] },
        ...passLcbToLb(DS04_SEEKS.t2, t2dur),
        move("opp.cbL", { x: 81.2, y: 60.5 }, "easeOut"),
        move("opp.lb", LB, "easeOut", undefined, o(205, "closed", {
          visionTarget: { type: "ball" },
          receivingFoot: "right",
          nextActionIntent: "play-forward",
        })),
        move("us.RW", RW_LEG2, "easeOut", undefined, rwOrientation(RW_LEG2)),
        move("us.R6", { x: 42.3, y: 57.8 }, "easeOut", undefined, o(18, "half-open", {
          visionTarget: { type: "opponent", playerId: "opp.8" },
          nextActionIntent: "cover",
        })),
        move("us.L6", { x: 41.5, y: 42.5 }, "easeOut"),
        move("us.RB", { x: 32.5, y: 74.6 }, "easeOut"),
      ],
      {
        teachingPoint: "Pass naar de back — RW perst al door",
        isTrigger: true,
        zoom: 1.24,
        follow: [...CAST_FOLLOW, "opp.cbL"],
        orientations: {
          "opp.lb": o(205, "closed", {
            visionTarget: { type: "ball" },
            receivingFoot: "right",
            nextActionIntent: "play-forward",
          }),
          "us.RW": rwOrientation(RW_LEG2),
          "us.R6": o(18, "half-open", {
            visionTarget: { type: "opponent", playerId: "opp.8" },
            nextActionIntent: "cover",
          }),
          "opp.8": o(202, "open", { visionTarget: { type: "ball" } }),
        },
      },
    ),

    step(
      "t2b-first-touch",
      DS04_SEEKS.t2Arrive,
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
          trajectoryId: "lb-first-touch",
          releaseLocal: 0,
          arrivalLocal: 0.18,
        },
        { kind: "possession", holderId: "opp.lb" },
        move("opp.lb", { x: 80.15, y: 84.25 }, "easeOut", undefined, o(212, "closed", {
          visionTarget: { type: "teammate", playerId: "opp.8" },
          receivingFoot: "right",
          nextActionIntent: "play-forward",
        })),
        move("us.RW", RW_CUT, "easeInOut", undefined, rwOrientation(RW_CUT, { prePassScan: true })),
        move("us.R6", { x: 43, y: 58.3 }, "easeInOut", undefined, o(18, "half-open", {
          visionTarget: { type: "opponent", playerId: "opp.8" },
          nextActionIntent: "cover",
        })),
        move("us.L6", { x: 42, y: 43 }, "easeInOut"),
        move("us.RB", { x: 33.5, y: 75 }, "easeInOut"),
        move("opp.8", { x: 64.2, y: 68.2 }, "easeInOut", undefined, o(195, "open", {
          visionTarget: { type: "ball" },
          nextActionIntent: "play-forward",
        })),
      ],
      {
        teachingPoint: "Eerste aanname — RW is al voorbij het midden",
        zoom: 1.26,
        follow: [...CAST_FOLLOW],
      },
    ),

    step(
      "t3-freeze",
      DS04_SEEKS.t3,
      t3dur,
      "BESLIS",
      [
        { kind: "phase", phase: "recognition" },
        { kind: "highlight", playerIds: ["us.R6", "us.RW", "opp.8"] },
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
        // RW's committed curve keeps rolling to its halfway cut point — R6 has not moved yet.
        move("us.RW", RW_CUT, "linear", undefined, rwOrientation(RW_CUT, { prePassScan: true })),
        move("us.R6", { x: 43.4, y: 58.5 }, "linear", undefined, o(20, "half-open", {
          visionTarget: { type: "opponent", playerId: "opp.8" },
          nextActionIntent: "cover",
        })),
        { kind: "hold" },
      ],
      {
        teachingPoint: "RW is al halverwege — wat doe jij als 8?",
        zoom: 1.28,
        follow: [...CAST_FOLLOW],
        orientations: {
          "opp.lb": o(214, "closed", {
            visionTarget: { type: "teammate", playerId: "opp.8" },
            receivingFoot: "right",
            nextActionIntent: "play-forward",
          }),
          "us.RW": rwOrientation(RW_CUT, { prePassScan: true }),
          "us.R6": o(20, "half-open", {
            visionTarget: { type: "opponent", playerId: "opp.8" },
            nextActionIntent: "cover",
          }),
          "us.L6": o(14, "half-open", { visionTarget: { type: "ball" }, nextActionIntent: "cover" }),
          "us.RB": o(-2, "side-on", { visionTarget: { type: "ball" }, nextActionIntent: "cover" }),
          "opp.8": o(192, "open", { visionTarget: { type: "ball" }, nextActionIntent: "play-forward" }),
        },
      },
    ),
  ];
}

export const ANIM_FDL_DS_SECOND_PRESS_LIVE: TacticalAnimationDefinition = {
  id: `anim.${IDS.live}`,
  situationId: IDS.live,
  complexity: "pattern",
  durationMs: DS04_SEEKS.liveEnd,
  pauseAtStartMs: 0,
  pauseAtEndMs: 2600,
  defaultPlaybackRate: 1,
  autoplay: true,
  loop: false,
  positioningMode: "authored",
  steps: buildPrelude(DS04_SEEKS.liveEnd),
};

export const ANIM_FDL_DS_SECOND_PRESS_GOOD: TacticalAnimationDefinition = {
  id: `anim.${IDS.good}`,
  situationId: IDS.good,
  complexity: "pattern",
  durationMs: DS04_SEEKS.end,
  pauseAtStartMs: 0,
  pauseAtEndMs: 2200,
  defaultPlaybackRate: 1,
  autoplay: true,
  loop: false,
  positioningMode: "authored",
  steps: [
    ...buildPrelude(DS04_SEEKS.t4),
    step(
      "t4-cover-inside",
      DS04_SEEKS.t4,
      DS04_SEEKS.t5 - DS04_SEEKS.t4,
      "8 DEKT BINNEN",
      [
        { kind: "phase", phase: "action" },
        { kind: "highlight", playerIds: ["us.R6", "us.RW"] },
        { kind: "setZones", zones: [] },
        // RW finishes its OWN arc — no change to its plan.
        move("us.RW", RW_FINISH_GOOD, "easeOut", undefined, rwOrientation(RW_FINISH_GOOD)),
        // R6 steps across to shadow the inside lane, not the ball.
        move("us.R6", { x: 52, y: 62 }, "easeOut", undefined, o(angleToward({ x: 52, y: 62 }, OPP8), "half-open", {
          visionTarget: { type: "opponent", playerId: "opp.8" },
          nextActionIntent: "cover",
        })),
        move("us.RB", { x: 40, y: 75 }, "easeInOut"),
        {
          kind: "setLines",
          lines: [{ kind: "press", from: RW_FINISH_GOOD, to: BALL_SETTLE }],
        },
        { kind: "possession", holderId: "opp.lb" },
      ],
      {
        teachingPoint: "RW maakt zijn duel af — 8 sluit de lijn",
        zoom: 1.26,
        follow: [...CAST_FOLLOW],
      },
    ),
    step(
      "t5-connect",
      DS04_SEEKS.t5,
      DS04_SEEKS.t6 - DS04_SEEKS.t5,
      "TEAM",
      [
        { kind: "phase", phase: "follow" },
        { kind: "highlight", playerIds: ["us.R6", "us.RW", "us.L6", "us.RB"] },
        move("us.RW", G.RW, "easeIn", undefined, rwOrientation(G.RW)),
        move("us.R6", { x: 58, y: 65 }, "easeInOut", undefined, o(angleToward({ x: 58, y: 65 }, OPP8), "half-open", {
          visionTarget: { type: "opponent", playerId: "opp.8" },
          nextActionIntent: "cover",
        })),
        move("us.L6", { x: 50, y: 50 }, "easeInOut"),
        move("us.RB", { x: 46, y: 75.5 }, "easeInOut"),
        move("us.RCV", G.RCV, "easeInOut"),
        move("opp.8", { x: 61.5, y: 70.5 }, "easeOut"),
        move("opp.lb", { x: 82.2, y: 86.2 }, "easeIn", undefined, o(235, "closed", {
          visionTarget: { type: "teammate", playerId: "opp.cbL" },
          nextActionIntent: "recycle",
          receivingFoot: "right",
        })),
        {
          kind: "setLines",
          lines: [
            { kind: "press", from: G.RW, to: { x: 82.2, y: 86.2 } },
            { kind: "press", from: { x: 58, y: 65 }, to: { x: 61.5, y: 70.5 }, dashed: true },
          ],
        },
        {
          kind: "setZones",
          zones: [
            {
              x: 60,
              y: 62,
              w: 14,
              h: 12,
              kind: "cover-shadow",
              label: "",
              geometry: { type: "taper-shadow", apex: { x: 58, y: 65 }, dirDeg: -25, nearWidth: 2, farWidth: 8, length: 11 },
            },
          ],
        },
        { kind: "possession", holderId: "opp.lb" },
      ],
      {
        teachingPoint: "Binnen dicht — RW en 8 werken samen",
        zoom: 1.2,
        follow: ["us.RW", "us.R6", "opp.lb", "us.RB"],
      },
    ),
    step(
      "t6-recycle",
      DS04_SEEKS.t6,
      DS04_SEEKS.t7 - DS04_SEEKS.t6,
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
        teachingPoint: "Alleen terug of wijd — binnen blijft dicht",
        zoom: 1.18,
        follow: ["us.RW", "opp.cbL", "us.R6", "opp.lb"],
      },
    ),
    step(
      "t7-hold",
      DS04_SEEKS.t7,
      DS04_SEEKS.end - DS04_SEEKS.t7,
      "DICHT",
      [
        { kind: "phase", phase: "result" },
        { kind: "highlight", playerIds: ["us.RW", "us.R6", "us.RB"] },
        { kind: "possession", holderId: "opp.cbL" },
        {
          kind: "setLines",
          lines: [
            { kind: "press", from: G.RW, to: { x: 82.2, y: 86.2 }, dashed: true },
            { kind: "press", from: { x: 58, y: 65 }, to: { x: 61.5, y: 70.5 }, dashed: true },
          ],
        },
        { kind: "hold" },
      ],
      {
        teachingPoint: "Tweede druk klopt — team blijft compact",
        zoom: 1.16,
        follow: ["us.RW", "us.R6", "us.RB", "opp.cbL"],
      },
    ),
  ],
};

export const ANIM_FDL_DS_SECOND_PRESS_BAD: TacticalAnimationDefinition = {
  id: `anim.${IDS.bad}`,
  situationId: IDS.bad,
  complexity: "pattern",
  durationMs: DS04_SEEKS.t7,
  pauseAtStartMs: 0,
  pauseAtEndMs: 2200,
  defaultPlaybackRate: 1,
  autoplay: true,
  loop: false,
  positioningMode: "authored",
  steps: [
    ...buildPrelude(DS04_SEEKS.t4),
    step(
      "t4-double-press",
      DS04_SEEKS.t4,
      DS04_SEEKS.t5 - DS04_SEEKS.t4,
      "DUBBEL DRUK",
      [
        { kind: "phase", phase: "action" },
        { kind: "highlight", playerIds: ["us.R6", "opp.8"] },
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
        move("us.RW", RW_FINISH_BAD, "easeOut", undefined, rwOrientation(RW_FINISH_BAD)),
        // R6 abandons the inside lane to pile onto the ball with RW.
        move("us.R6", { x: 50, y: 68 }, "easeOut", undefined, o(angleToward({ x: 50, y: 68 }, LB), "closed", {
          visionTarget: { type: "ball" },
          nextActionIntent: "press",
        })),
        move("us.RB", { x: 33, y: 75 }, "easeInOut"),
        move("opp.8", { x: 65, y: 67 }, "easeOut", undefined, o(185, "open", {
          visionTarget: { type: "ball" },
          nextActionIntent: "play-forward",
        })),
        {
          kind: "setLines",
          lines: [
            { kind: "fault", from: { x: 50, y: 68 }, to: BALL_SETTLE, dashed: true },
            { kind: "fault", from: BALL_SETTLE, to: { x: 65, y: 67 }, dashed: true },
          ],
        },
        { kind: "possession", holderId: "opp.lb" },
      ],
      {
        teachingPoint: "8 volgt de bal — binnen wordt vrij",
        zoom: 1.26,
        follow: [...CAST_FOLLOW],
      },
    ),
    step(
      "t5-inside-open",
      DS04_SEEKS.t5,
      DS04_SEEKS.t6 - DS04_SEEKS.t5,
      "BINNEN OPEN",
      [
        { kind: "phase", phase: "reaction" },
        { kind: "highlight", playerIds: ["opp.8", "us.R6"] },
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
        move("opp.8", PRESS_V2_BAD_BALL_RESULT, "easeOut", undefined, o(178, "open", {
          visionTarget: { type: "ball" },
          nextActionIntent: "play-forward",
          receivingFoot: "right",
        })),
        move("us.R6", { x: 62, y: 77 }, "easeIn"),
        { kind: "possession", holderId: "opp.8" },
      ],
      {
        teachingPoint: "Opp.8 ontvangt vrij en kan draaien",
        zoom: 1.22,
        follow: ["opp.8", "us.R6", "opp.lb"],
      },
    ),
    step(
      "t6-broken",
      DS04_SEEKS.t6,
      DS04_SEEKS.t7 - DS04_SEEKS.t6,
      "PRESS WEG",
      [
        { kind: "phase", phase: "result" },
        { kind: "highlight", playerIds: ["opp.8", "us.R6"] },
        { kind: "possession", holderId: "opp.8" },
        { kind: "setLines", lines: [] },
        { kind: "hold" },
      ],
      {
        teachingPoint: "Tweede druk mist doel — progressieve pass door",
        zoom: 1.16,
        follow: ["opp.8", "us.R6", "us.RW"],
      },
    ),
  ],
};

export const DS04_FILM_IDS = IDS;

export type Ds04FilmBundle = {
  sessionId: string;
  slug: string;
  freezeMs: number;
  previewMs: number;
  activeRole: string;
  mobileFocusIds: string[];
  situations: Record<string, TacticalSituationDefinition>;
  animations: Record<string, TacticalAnimationDefinition>;
};

export const DS04_BUNDLE: Ds04FilmBundle = {
  sessionId: SESSION_ID,
  slug: SLUG,
  freezeMs: DS04_SEEKS.freeze,
  previewMs: DS04_SEEKS.previewOpening,
  activeRole: ACTIVE_ROLE,
  mobileFocusIds: [ACTIVE_ROLE, ...SUPPORT_ROLES],
  situations: {
    [IDS.live]: FDL_DS_SECOND_PRESS_SITUATION,
    [IDS.good]: FDL_DS_SECOND_PRESS_SITUATION_GOOD,
    [IDS.bad]: FDL_DS_SECOND_PRESS_SITUATION_BAD,
  },
  animations: {
    [IDS.live]: ANIM_FDL_DS_SECOND_PRESS_LIVE,
    [IDS.good]: ANIM_FDL_DS_SECOND_PRESS_GOOD,
    [IDS.bad]: ANIM_FDL_DS_SECOND_PRESS_BAD,
  },
};
