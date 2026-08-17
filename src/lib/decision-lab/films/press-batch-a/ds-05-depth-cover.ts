/**
 * FDL-DS-DEPTH-COVER-RB-V1 — "Rugdekking" (hand-authored, Press Batch A #5).
 *
 * Unique read: by the freeze, us.RW is already pressing the back — engaged,
 * closing distance, nearly on top of the ball. The learner (us.RB) must
 * decide how DEEP she stands while that press happens: hold a compact line
 * with us.RCV (goal-side, patient) or hunt forward alongside RW. The
 * consequence of hunting is never beside the press — it always lands BEHIND
 * it, in the space RB just vacated.
 *
 * Mute-test: RW closes in → freeze on RB → hold depth vs hunt high →
 * consequence behind the line. Experience-only. Not a reusable template.
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
import { DS05_SEEKS } from "@/lib/decision-lab/films/press-batch-a/timings";

export { DS05_SEEKS } from "@/lib/decision-lab/films/press-batch-a/timings";

const SLUG = "rugdekking-rb";
const SESSION_ID = "FDL-DS-DEPTH-COVER-RB-V1";
const ACTIVE_ROLE = "us.RB";
const SUPPORT_ROLES = ["us.RW", "us.R6", "us.RCV"] as const;
const IDS = filmIdsForSlug(SLUG);

/** ——— Shared geometry ——— */
const US = PRESS_V2_US_START;
const G = PRESS_V2_GOOD_US_END;

const CBL = { x: 82, y: 60 };
const LB = { x: 80, y: 84 };

const BALL_AT_CBL = ballAtReceivingFoot(CBL, { foot: "right", facingDeg: 12 });
const BALL_ARRIVE = ballAtReceivingFoot(LB, { foot: "right", facingDeg: 205 });
const BALL_SETTLE = { x: BALL_ARRIVE.x - 0.9, y: BALL_ARRIVE.y - 0.55 };

/**
 * RW's press curve — further along than a "just starting" press: by freeze
 * RW is visibly engaged (not idle), because THIS session is not about RW's
 * decision. Same finish (G.RW) regardless of branch — only RB's depth differs.
 */
const RW_CUT = { x: 60, y: 79 };
const RW_ARC = createPressingArc(US.RW, RW_CUT, G.RW, { bulge: 4 });
const RW_LEG1 = RW_ARC[0]!;
const RW_LEG2 = RW_ARC[1]!;
const RW_FINISH = RW_ARC[3]!;

/** Space behind the press line — where any consequence of RB hunting high must land. */
const BEHIND_LINE_POCKET = { x: 24, y: 90 };
const OPP_LW_START = { x: 56, y: 86 };

const CAST_FOLLOW = ["us.RB", "us.RW", "us.RCV", "opp.lb"] as const;

function rwOrientation(at: TacticalPoint, extra?: Partial<PlayerOrientation>): PlayerOrientation {
  return o(angleToward(at, LB), "side-on", {
    visionTarget: { type: "ball" },
    nextActionIntent: "press",
    ...extra,
  });
}

function passLcbToLb(stepStart: number, stepDur: number): TacticalAnimationAction[] {
  const dur = Math.max(stepDur, 1);
  const releaseAbs = DS05_SEEKS.t2 + 220;
  const arrivalAbs = DS05_SEEKS.t2Arrive - 40;
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

/** Shared start: ball at LCB, RW closing in — RB must set its depth. */
export const FDL_DS_DEPTH_COVER_SITUATION: TacticalSituationDefinition = {
  id: IDS.live as TacticalSituationDefinition["id"],
  eyebrow: "SITUATIE",
  title: "Hun LCB speelt breed naar de back",
  subtitle: "Jij bent de RB — RW perst al door. Hoe diep sta jij?",
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
    ...FDL_DS_DEPTH_COVER_SITUATION,
    id: id as TacticalSituationDefinition["id"],
    eyebrow,
    title,
    subtitle,
  };
}

export const FDL_DS_DEPTH_COVER_SITUATION_GOOD = cloneSituation(
  IDS.good,
  "GOED",
  "Compact blijven — de ruimte in de rug blijft dicht",
  "RB houdt de lijn met RCV; niemand duikt er tussen.",
);

export const FDL_DS_DEPTH_COVER_SITUATION_BAD = cloneSituation(
  IDS.bad,
  "FOUT",
  "RB jaagt mee naar voren — ruimte in de rug open",
  "Hun buitenspeler duikt de vrije zone in achter de druk.",
);

/**
 * Shared T0→T3 prelude — identical for live / good / bad.
 * RW's press is already running; only RB's depth choice after freeze differs.
 */
function buildPrelude(toFreezeHoldMs: number): TacticalAnimationStep[] {
  const t0dur = DS05_SEEKS.t1 - DS05_SEEKS.t0;
  const t1dur = DS05_SEEKS.t2 - DS05_SEEKS.t1;
  const t2dur = DS05_SEEKS.t2Arrive - DS05_SEEKS.t2;
  const touchDur = DS05_SEEKS.t3 - DS05_SEEKS.t2Arrive;
  const t3dur = toFreezeHoldMs - DS05_SEEKS.t3;

  return [
    step(
      "t0-set",
      DS05_SEEKS.t0,
      t0dur,
      "Situatie",
      [
        { kind: "phase", phase: "initial" },
        { kind: "highlight", playerIds: ["opp.cbL", "us.RW"] },
        { kind: "possession", holderId: "opp.cbL" },
        { kind: "hold" },
      ],
      {
        teachingPoint: "Bal bij hun LCB — RW bereidt de druk voor",
        zoom: 1.12,
        follow: ["opp.cbL", "opp.lb", "us.RW", "us.RB", "us.RCV", "opp.lw"],
        orientations: {
          "opp.cbL": o(10, "half-open-right", {
            visionTarget: { type: "teammate", playerId: "opp.lb" },
            nextActionIntent: "play-forward",
            receivingFoot: "right",
          }),
          "opp.lb": o(188, "side-on", { visionTarget: { type: "ball" }, nextActionIntent: "play-forward" }),
          "us.RW": rwOrientation(US.RW, { prePassScan: true }),
          "us.RB": o(-8, "side-on", { visionTarget: { type: "ball" }, nextActionIntent: "cover" }),
          "us.RCV": o(-4, "half-open", { visionTarget: { type: "ball" }, nextActionIntent: "cover" }),
          "opp.lw": o(178, "open", { visionTarget: { type: "ball" } }),
        },
      },
    ),

    step(
      "t1-scan",
      DS05_SEEKS.t1,
      t1dur,
      "SCAN",
      [
        { kind: "phase", phase: "recognition" },
        { kind: "highlight", playerIds: ["opp.lb", "us.RW", "opp.lw"] },
        {
          kind: "setZones",
          zones: [
            {
              x: 20,
              y: 78,
              w: 20,
              h: 20,
              kind: "space",
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
        move("us.RW", RW_LEG1, "easeOut", undefined, rwOrientation(RW_LEG1, { prePassScan: true })),
        move("us.RB", { x: 31, y: 74.2 }, "linear", undefined, o(-6, "side-on", {
          visionTarget: { type: "ball" },
          nextActionIntent: "cover",
        })),
        move("us.RCV", { x: 28.3, y: 56.2 }, "linear"),
        move("us.R6", { x: 41.2, y: 57.2 }, "linear"),
        move("opp.lw", { x: 55.5, y: 86.5 }, "linear", undefined, o(180, "open", { visionTarget: { type: "ball" } })),
        { kind: "possession", holderId: "opp.cbL" },
      ],
      {
        teachingPoint: "Zie de ruimte die ontstaat achter de druklijn",
        zoom: 1.16,
        follow: [...CAST_FOLLOW, "opp.cbL"],
      },
    ),

    step(
      "t2-trigger",
      DS05_SEEKS.t2,
      t2dur,
      "TRIGGER",
      [
        { kind: "phase", phase: "prepare" },
        { kind: "highlight", playerIds: ["opp.lb", "us.RW"] },
        { kind: "setZones", zones: [] },
        ...passLcbToLb(DS05_SEEKS.t2, t2dur),
        move("opp.cbL", { x: 81.2, y: 60.5 }, "easeOut"),
        move("opp.lb", LB, "easeOut", undefined, o(205, "closed", {
          visionTarget: { type: "ball" },
          receivingFoot: "right",
          nextActionIntent: "play-forward",
        })),
        move("us.RW", RW_LEG2, "easeOut", undefined, rwOrientation(RW_LEG2)),
        move("us.RB", { x: 32.5, y: 74.6 }, "easeOut"),
        move("us.RCV", { x: 28.6, y: 56.4 }, "easeOut"),
        move("opp.lw", { x: 55, y: 87 }, "easeOut", undefined, o(182, "open", { visionTarget: { type: "ball" } })),
      ],
      {
        teachingPoint: "Pass naar de back — RW zet stevig door",
        isTrigger: true,
        zoom: 1.22,
        follow: [...CAST_FOLLOW, "opp.cbL"],
        orientations: {
          "opp.lb": o(205, "closed", {
            visionTarget: { type: "ball" },
            receivingFoot: "right",
            nextActionIntent: "play-forward",
          }),
          "us.RW": rwOrientation(RW_LEG2),
          "us.RB": o(-6, "side-on", { visionTarget: { type: "ball" }, nextActionIntent: "cover" }),
          "opp.lw": o(182, "open", { visionTarget: { type: "ball" } }),
        },
      },
    ),

    step(
      "t2b-first-touch",
      DS05_SEEKS.t2Arrive,
      touchDur,
      "AANNAME",
      [
        { kind: "phase", phase: "prepare" },
        { kind: "highlight", playerIds: ["opp.lb", "us.RW"] },
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
          visionTarget: { type: "ball" },
          receivingFoot: "right",
          nextActionIntent: "play-forward",
        })),
        move("us.RW", RW_CUT, "easeInOut", undefined, rwOrientation(RW_CUT, { prePassScan: true })),
        move("us.RB", { x: 33.5, y: 75 }, "easeInOut", undefined, o(-4, "side-on", {
          visionTarget: { type: "ball" },
          nextActionIntent: "cover",
        })),
        move("us.RCV", { x: 28.8, y: 56.5 }, "easeInOut"),
        move("opp.lw", { x: 54.7, y: 87.3 }, "easeInOut", undefined, o(184, "open", { visionTarget: { type: "ball" } })),
      ],
      {
        teachingPoint: "Eerste aanname — RW zit er al bovenop",
        zoom: 1.24,
        follow: [...CAST_FOLLOW],
      },
    ),

    step(
      "t3-freeze",
      DS05_SEEKS.t3,
      t3dur,
      "BESLIS",
      [
        { kind: "phase", phase: "recognition" },
        { kind: "highlight", playerIds: ["us.RB", "us.RW", "us.RCV"] },
        {
          kind: "setZones",
          zones: [
            {
              x: 18,
              y: 78,
              w: 22,
              h: 20,
              kind: "space",
              label: "",
              geometry: { type: "ellipse" },
            },
          ],
        },
        { kind: "setLines", lines: [] },
        { kind: "possession", holderId: "opp.lb" },
        move("us.RW", RW_CUT, "linear", undefined, rwOrientation(RW_CUT, { prePassScan: true })),
        move("us.RB", { x: 33.7, y: 75.05 }, "linear", undefined, o(-3, "side-on", {
          visionTarget: { type: "ball" },
          nextActionIntent: "cover",
        })),
        { kind: "hold" },
      ],
      {
        teachingPoint: "RW zit er bovenop — hoe diep sta jij als RB?",
        zoom: 1.26,
        follow: [...CAST_FOLLOW],
        orientations: {
          "opp.lb": o(214, "closed", {
            visionTarget: { type: "ball" },
            receivingFoot: "right",
            nextActionIntent: "play-forward",
          }),
          "us.RW": rwOrientation(RW_CUT, { prePassScan: true }),
          "us.RB": o(-3, "side-on", { visionTarget: { type: "ball" }, nextActionIntent: "cover" }),
          "us.RCV": o(-4, "half-open", { visionTarget: { type: "ball" }, nextActionIntent: "cover" }),
          "us.R6": o(16, "half-open", { visionTarget: { type: "ball" }, nextActionIntent: "cover" }),
          "opp.lw": o(184, "open", { visionTarget: { type: "ball" } }),
        },
      },
    ),
  ];
}

export const ANIM_FDL_DS_DEPTH_COVER_LIVE: TacticalAnimationDefinition = {
  id: `anim.${IDS.live}`,
  situationId: IDS.live,
  complexity: "pattern",
  durationMs: DS05_SEEKS.liveEnd,
  pauseAtStartMs: 0,
  pauseAtEndMs: 2600,
  defaultPlaybackRate: 1,
  autoplay: true,
  loop: false,
  positioningMode: "authored",
  steps: buildPrelude(DS05_SEEKS.liveEnd),
};

export const ANIM_FDL_DS_DEPTH_COVER_GOOD: TacticalAnimationDefinition = {
  id: `anim.${IDS.good}`,
  situationId: IDS.good,
  complexity: "pattern",
  durationMs: DS05_SEEKS.end,
  pauseAtStartMs: 0,
  pauseAtEndMs: 2200,
  defaultPlaybackRate: 1,
  autoplay: true,
  loop: false,
  positioningMode: "authored",
  steps: [
    ...buildPrelude(DS05_SEEKS.t4),
    step(
      "t4-hold-depth",
      DS05_SEEKS.t4,
      DS05_SEEKS.t5 - DS05_SEEKS.t4,
      "COMPACT BLIJVEN",
      [
        { kind: "phase", phase: "action" },
        { kind: "highlight", playerIds: ["us.RB", "us.RCV"] },
        { kind: "setZones", zones: [] },
        move("us.RW", RW_FINISH, "easeOut", undefined, rwOrientation(RW_FINISH)),
        // RB steps only slightly goal-side — stays connected to RCV, not high.
        move("us.RB", { x: 30, y: 71 }, "easeInOut", undefined, o(-8, "side-on", {
          visionTarget: { type: "ball" },
          nextActionIntent: "cover",
        })),
        move("us.RCV", { x: 30, y: 59 }, "easeInOut", undefined, o(-4, "half-open", {
          visionTarget: { type: "ball" },
          nextActionIntent: "cover",
        })),
        move("opp.lw", { x: 54, y: 88 }, "easeInOut", undefined, o(186, "open", { visionTarget: { type: "ball" } })),
        {
          kind: "setLines",
          lines: [{ kind: "press", from: RW_FINISH, to: BALL_SETTLE }],
        },
        { kind: "possession", holderId: "opp.lb" },
      ],
      {
        teachingPoint: "RB blijft goalzijdig — geen ruimte weggeven",
        zoom: 1.22,
        follow: [...CAST_FOLLOW],
      },
    ),
    step(
      "t5-connect",
      DS05_SEEKS.t5,
      DS05_SEEKS.t6 - DS05_SEEKS.t5,
      "TEAM",
      [
        { kind: "phase", phase: "follow" },
        { kind: "highlight", playerIds: ["us.RB", "us.RCV", "us.RW"] },
        move("us.RW", G.RW, "easeIn", undefined, rwOrientation(G.RW)),
        move("us.RB", { x: 32, y: 70 }, "easeInOut", undefined, o(-8, "side-on", {
          visionTarget: { type: "ball" },
          nextActionIntent: "cover",
        })),
        move("us.RCV", { x: 30, y: 58 }, "easeInOut", undefined, o(-4, "half-open", {
          visionTarget: { type: "ball" },
          nextActionIntent: "cover",
        })),
        move("us.R6", G.R6, "easeInOut"),
        move("opp.lw", { x: 55, y: 89 }, "easeOut", undefined, o(190, "closed", { visionTarget: { type: "ball" } })),
        move("opp.lb", { x: 82.2, y: 86.2 }, "easeIn", undefined, o(235, "closed", {
          visionTarget: { type: "teammate", playerId: "opp.cbL" },
          nextActionIntent: "recycle",
          receivingFoot: "right",
        })),
        {
          kind: "setLines",
          lines: [{ kind: "press", from: G.RW, to: { x: 82.2, y: 86.2 } }],
        },
        {
          kind: "setZones",
          zones: [
            {
              x: 24,
              y: 62,
              w: 14,
              h: 14,
              kind: "cover-shadow",
              label: "",
              geometry: { type: "taper-shadow", apex: { x: 32, y: 70 }, dirDeg: 178, nearWidth: 2, farWidth: 8, length: 10 },
            },
          ],
        },
        { kind: "possession", holderId: "opp.lb" },
      ],
      {
        teachingPoint: "Linie blijft verbonden — niets doorheen",
        zoom: 1.18,
        follow: ["us.RB", "us.RCV", "us.RW", "opp.lb"],
      },
    ),
    step(
      "t6-recycle",
      DS05_SEEKS.t6,
      DS05_SEEKS.t7 - DS05_SEEKS.t6,
      "GEVOLG",
      [
        { kind: "phase", phase: "result" },
        { kind: "highlight", playerIds: ["us.RW", "us.RB", "opp.cbL"] },
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
        teachingPoint: "Alleen terug of wijd — niets in de rug",
        zoom: 1.16,
        follow: ["us.RW", "opp.cbL", "us.RB"],
      },
    ),
    step(
      "t7-hold",
      DS05_SEEKS.t7,
      DS05_SEEKS.end - DS05_SEEKS.t7,
      "DICHT",
      [
        { kind: "phase", phase: "result" },
        { kind: "highlight", playerIds: ["us.RB", "us.RCV", "us.RW"] },
        { kind: "possession", holderId: "opp.cbL" },
        {
          kind: "setLines",
          lines: [{ kind: "press", from: G.RW, to: { x: 82.2, y: 86.2 }, dashed: true }],
        },
        { kind: "hold" },
      ],
      {
        teachingPoint: "Rugdekking klopt — laatste linie staat",
        zoom: 1.14,
        follow: ["us.RB", "us.RCV", "us.RW", "opp.cbL"],
      },
    ),
  ],
};

export const ANIM_FDL_DS_DEPTH_COVER_BAD: TacticalAnimationDefinition = {
  id: `anim.${IDS.bad}`,
  situationId: IDS.bad,
  complexity: "pattern",
  durationMs: DS05_SEEKS.t7,
  pauseAtStartMs: 0,
  pauseAtEndMs: 2200,
  defaultPlaybackRate: 1,
  autoplay: true,
  loop: false,
  positioningMode: "authored",
  steps: [
    ...buildPrelude(DS05_SEEKS.t4),
    step(
      "t4-hunt-high",
      DS05_SEEKS.t4,
      DS05_SEEKS.t5 - DS05_SEEKS.t4,
      "RB JAAGT MEE",
      [
        { kind: "phase", phase: "action" },
        { kind: "highlight", playerIds: ["us.RB", "opp.lw"] },
        { kind: "setZones", zones: [] },
        move("us.RW", RW_FINISH, "easeOut", undefined, rwOrientation(RW_FINISH)),
        // RB abandons depth to hunt alongside RW — the line breaks open behind.
        move("us.RB", { x: 42, y: 77 }, "easeOut", undefined, o(angleToward({ x: 42, y: 77 }, LB), "closed", {
          visionTarget: { type: "ball" },
          nextActionIntent: "press",
        })),
        move("us.RCV", { x: 29, y: 57 }, "easeInOut"),
        // Their winger sees the gap and starts the run in behind.
        move("opp.lw", { x: 46, y: 89 }, "easeOut", undefined, o(angleToward({ x: 46, y: 89 }, BEHIND_LINE_POCKET), "open", {
          visionTarget: { type: "zone", zoneId: "behind-line" },
          nextActionIntent: "run-in-behind",
        })),
        {
          kind: "setZones",
          zones: [
            {
              x: 18,
              y: 82,
              w: 24,
              h: 18,
              kind: "risk",
              label: "",
              geometry: { type: "ellipse" },
            },
          ],
        },
        {
          kind: "setLines",
          lines: [{ kind: "fault", from: { x: 42, y: 77 }, to: BEHIND_LINE_POCKET, dashed: true }],
        },
        { kind: "possession", holderId: "opp.lb" },
      ],
      {
        teachingPoint: "RB kiest voor de bal — de rug staat leeg",
        zoom: 1.22,
        follow: [...CAST_FOLLOW, "opp.lw"],
      },
    ),
    step(
      "t5-run-in-behind",
      DS05_SEEKS.t5,
      DS05_SEEKS.t6 - DS05_SEEKS.t5,
      "RUIMTE OPEN",
      [
        { kind: "phase", phase: "reaction" },
        { kind: "highlight", playerIds: ["opp.lw", "us.RB"] },
        move("opp.lw", { x: OPP_LW_START.x - 20, y: 90 }, "easeOut", undefined, o(
          angleToward({ x: OPP_LW_START.x - 20, y: 90 }, BEHIND_LINE_POCKET),
          "open",
          { visionTarget: { type: "ball" }, nextActionIntent: "run-in-behind" },
        )),
        move("us.RB", { x: 48, y: 79 }, "easeIn"),
        { kind: "possession", holderId: "opp.lb" },
      ],
      {
        teachingPoint: "Hun buitenspeler duikt de vrije zone in",
        zoom: 1.2,
        follow: ["opp.lw", "us.RB", "opp.lb"],
      },
    ),
    step(
      "t6-behind-line",
      DS05_SEEKS.t6,
      DS05_SEEKS.t7 - DS05_SEEKS.t6,
      "ACHTER DE LIJN",
      [
        { kind: "phase", phase: "result" },
        { kind: "highlight", playerIds: ["opp.lw", "opp.lb"] },
        {
          kind: "ballMove",
          from: BALL_SETTLE,
          to: BEHIND_LINE_POCKET,
          easing: "easeOut",
          syncLane: true,
          trajectoryId: "lb-in-behind",
          passerId: "opp.lb",
          laneStatus: "fault",
          releaseLocal: 0.12,
          arrivalLocal: 0.82,
        },
        { kind: "possession", holderId: null },
        move("opp.lw", BEHIND_LINE_POCKET, "easeOut", undefined, o(200, "open", {
          visionTarget: { type: "goal" },
          nextActionIntent: "play-forward",
          receivingFoot: "left",
        })),
        { kind: "possession", holderId: "opp.lw" },
        { kind: "setLines", lines: [] },
        { kind: "hold" },
      ],
      {
        teachingPoint: "Diepbal komt aan — precies achter de druklijn",
        zoom: 1.14,
        follow: ["opp.lw", "opp.lb", "us.RB"],
      },
    ),
  ],
};

export const DS05_FILM_IDS = IDS;

export type Ds05FilmBundle = {
  sessionId: string;
  slug: string;
  freezeMs: number;
  previewMs: number;
  activeRole: string;
  mobileFocusIds: string[];
  situations: Record<string, TacticalSituationDefinition>;
  animations: Record<string, TacticalAnimationDefinition>;
};

export const DS05_BUNDLE: Ds05FilmBundle = {
  sessionId: SESSION_ID,
  slug: SLUG,
  freezeMs: DS05_SEEKS.freeze,
  previewMs: DS05_SEEKS.previewOpening,
  activeRole: ACTIVE_ROLE,
  mobileFocusIds: [ACTIVE_ROLE, ...SUPPORT_ROLES],
  situations: {
    [IDS.live]: FDL_DS_DEPTH_COVER_SITUATION,
    [IDS.good]: FDL_DS_DEPTH_COVER_SITUATION_GOOD,
    [IDS.bad]: FDL_DS_DEPTH_COVER_SITUATION_BAD,
  },
  animations: {
    [IDS.live]: ANIM_FDL_DS_DEPTH_COVER_LIVE,
    [IDS.good]: ANIM_FDL_DS_DEPTH_COVER_GOOD,
    [IDS.bad]: ANIM_FDL_DS_DEPTH_COVER_BAD,
  },
};
