/**
 * FDL-DS-PRESS-ABORT-RECOVER-V1 — hand-authored teaching film (#8, press-abort).
 *
 * CRITICAL — this is NOT a curve-vs-straight film. By the freeze frame the
 * pressing window is already CLOSED: RW is late, cover never arrived, and the
 * ball has already progressed inside. The decision is whether to abort the
 * chase and recover goal-side compact with the team (good), or force the
 * press anyway and rip a hole behind/centrally (bad).
 *
 * Prelude proves the window is gone before the freeze:
 *  - us.R6 never steps up to cover the inside lane (stays deep, late).
 *  - opp.lb receives with an OPEN body / real time (RW is not tight).
 *  - the ball is already advancing inside (opp.8 on the ball, driving on)
 *    by the time we reach the freeze.
 */

import type {
  TacticalAnimationAction,
  TacticalAnimationDefinition,
  TacticalAnimationStep,
} from "@/lib/academie/tactical-animation-types";
import {
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
import { filmIdsForSlug } from "@/lib/decision-lab/films/dedicated/ids";
import { move, o, step } from "@/lib/decision-lab/films/press-batch-a/kit";
import { DS08_SEEKS } from "@/lib/decision-lab/films/press-batch-a/timings";

export { DS08_SEEKS } from "@/lib/decision-lab/films/press-batch-a/timings";

/** ——— identity ——— */

export const DS08_SLUG = "niet-doordrukken";
export const DS08_FILM_IDS = filmIdsForSlug(DS08_SLUG);

/** ——— reference points ——— */

const CBL = { x: 82, y: 60 };
const LB = { x: 80, y: 84 };
const OPP8_START = { x: 64, y: 68 };

const BALL_AT_CBL = ballAtReceivingFoot(CBL, { foot: "right", facingDeg: 12 });
const BALL_ARRIVE = ballAtReceivingFoot(LB, { foot: "right", facingDeg: 205 });
const BALL_SETTLE: TacticalPoint = { x: BALL_ARRIVE.x - 0.9, y: BALL_ARRIVE.y - 0.55 };

/** Ball keeps moving inside during the "window closing" beat — press is already too late. */
const OPP8_ADVANCED: TacticalPoint = { x: 56, y: 60 };
const BALL_AT_OPP8: TacticalPoint = ballAtReceivingFoot(OPP8_ADVANCED, { foot: "right", facingDeg: 195 });
/** Frozen: opp.8 has driven on even further, fully clear of any press. */
const OPP8_FROZEN: TacticalPoint = { x: 50, y: 55 };
const BALL_AT_FREEZE: TacticalPoint = ballAtReceivingFoot(OPP8_FROZEN, { foot: "either", facingDeg: 182 });

/** RW trailing the play — never got tight enough to matter. */
const RW_START = PRESS_V2_US_START.RW; // {40, 74}
const RW_TRAILING: TacticalPoint = { x: 46, y: 76 };
const RW_LATE: TacticalPoint = { x: 50, y: 78 };

/** R6 (cover) never steps up — stays deep the whole prelude. */
const R6_START = PRESS_V2_US_START.R6; // {40, 56}
const R6_LATE: TacticalPoint = { x: 36, y: 52 };

const RB_START = PRESS_V2_US_START.RB; // {30, 74}
const RCV_START = PRESS_V2_US_START.RCV; // {28, 56}

/** Good — abort + recover goal-side, compact with support roles. */
const RW_RECOVER: TacticalPoint = { x: 34, y: 63 };
const R6_RECOVER: TacticalPoint = { x: 32, y: 54 };
const RB_RECOVER: TacticalPoint = { x: 29, y: 68 };
const RCV_RECOVER: TacticalPoint = { x: 25, y: 58 };
const BALL_CONTAINED: TacticalPoint = { x: 42, y: 52 };

/** Bad — force the chase anyway; gap opens centrally/behind. */
const RW_LUNGE: TacticalPoint = { x: 53, y: 58 };
const OPP8_BREAKS: TacticalPoint = { x: 36, y: 50 };
const OPP_ST_RECEIVE: TacticalPoint = { x: 30, y: 48 };
const BALL_BEHIND: TacticalPoint = OPP_ST_RECEIVE;

/** ——— camera — GS press-detail contrast: emphasise the gap, not a curve ——— */

const PRESET = "press-detail";
const FOLLOW_CORE = ["us.RW", "us.R6", "opp.lb", "opp.8", "us.RB", "us.RCV"] as const;

function castOrient(partial: Record<string, PlayerOrientation>): Record<string, PlayerOrientation> {
  return {
    "us.RB": o(-8, "side-on", { visionTarget: { type: "ball" }, nextActionIntent: "cover" }),
    "us.RCV": o(-4, "half-open", { visionTarget: { type: "ball" }, nextActionIntent: "cover" }),
    ...partial,
  };
}

function passLcbToLb(stepStartMs: number, stepDurMs: number): TacticalAnimationAction[] {
  const dur = Math.max(stepDurMs, 1);
  const releaseAbs = DS08_SEEKS.t2 + 200;
  const arrivalAbs = DS08_SEEKS.t2Arrive - 40;
  return [
    {
      kind: "ballMove",
      from: BALL_AT_CBL,
      to: BALL_ARRIVE,
      easing: "easeOut",
      syncLane: true,
      trajectoryId: "ds08-cbl-to-lb",
      passerId: "opp.cbL",
      laneStatus: "pass",
      releaseLocal: Math.max(0.1, Math.min(0.32, (releaseAbs - stepStartMs) / dur)),
      arrivalLocal: Math.max(0.72, Math.min(0.94, (arrivalAbs - stepStartMs) / dur)),
    },
    { kind: "possession", holderId: null },
  ];
}

/** ——— situations ——— */

const DS08_SITUATION_ROOT: TacticalSituationDefinition = {
  id: DS08_FILM_IDS.live as TacticalSituationDefinition["id"],
  eyebrow: "SITUATIE",
  title: "De druk is al te laat — wat nu?",
  subtitle: "Trigger: bal ligt al binnen. Jij bent RW — jagen of herstellen?",
  homeShape: { formation: "4-4-2", phase: "high-press", direction: "left-to-right" },
  opponentShape: { formation: "4-2-3-1", phase: "build-up", direction: "right-to-left" },
  players: [
    ...pressV2UsMarkers(PRESS_V2_US_START),
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
  return { ...DS08_SITUATION_ROOT, id: id as TacticalSituationDefinition["id"], eyebrow, title, subtitle };
}

export const DS08_SITUATION_LIVE = DS08_SITUATION_ROOT;

export const DS08_SITUATION_GOOD = cloneSituation(
  DS08_FILM_IDS.good,
  "GOED",
  "Stop met jagen — herstel compact",
  "RW breekt de achtervolging af; team herstelt goal-side en dicht.",
);

export const DS08_SITUATION_BAD = cloneSituation(
  DS08_FILM_IDS.bad,
  "FOUT",
  "Toch doordrukken — te laat",
  "RW blijft jagen; het gat centraal/achter wordt uitgespeeld.",
);

/** ——— shared T0→freeze prelude: proves the window is already gone ——— */

function buildPrelude(toHoldMs: number): TacticalAnimationStep[] {
  const t0dur = DS08_SEEKS.t1 - DS08_SEEKS.t0;
  const t1dur = DS08_SEEKS.t2 - DS08_SEEKS.t1;
  const t2dur = DS08_SEEKS.t2Arrive - DS08_SEEKS.t2;
  const touchDur = DS08_SEEKS.t3 - DS08_SEEKS.t2Arrive;
  const closingDur = DS08_SEEKS.freeze - DS08_SEEKS.t3;
  const holdDur = toHoldMs - DS08_SEEKS.freeze;

  return [
    step(
      "t0-set",
      DS08_SEEKS.t0,
      t0dur,
      "SITUATIE",
      [
        { kind: "phase", phase: "initial" },
        { kind: "highlight", playerIds: ["opp.cbL", "us.RW"] },
        { kind: "possession", holderId: "opp.cbL" },
        { kind: "hold" },
      ],
      {
        teachingPoint: "Bal bij hun LCB — tweede fase, jij bent nog aan het herstellen",
        preset: PRESET,
        zoom: 1.14,
        follow: [...FOLLOW_CORE, "opp.cbL"],
        orientations: castOrient({
          "opp.cbL": o(10, "half-open-right", {
            visionTarget: { type: "teammate", playerId: "opp.lb" },
            nextActionIntent: "play-forward",
            receivingFoot: "right",
          }),
          "us.RW": o(angleToward(RW_START, CBL), "half-open", {
            visionTarget: { type: "ball" },
            nextActionIntent: "press",
          }),
          "us.R6": o(angleToward(R6_START, OPP8_START), "half-open", {
            visionTarget: { type: "opponent", playerId: "opp.8" },
            nextActionIntent: "cover",
          }),
        }),
      },
    ),

    step(
      "t1-scan",
      DS08_SEEKS.t1,
      t1dur,
      "SCAN",
      [
        { kind: "phase", phase: "recognition" },
        { kind: "highlight", playerIds: ["opp.lb", "opp.8", "us.R6"] },
        move("opp.cbL", { x: 81.4, y: 60.8 }, "easeInOut"),
        move("opp.lb", { x: 80.4, y: 85 }, "easeInOut"),
        move(
          "us.RW",
          { x: 42.5, y: 74.8 },
          "linear",
          undefined,
          o(angleToward({ x: 42.5, y: 74.8 }, LB), "half-open", {
            visionTarget: { type: "ball" },
            nextActionIntent: "press",
          }),
        ),
        // R6 barely moves — cover never sets up.
        move(
          "us.R6",
          { x: 40.3, y: 56.3 },
          "linear",
          undefined,
          o(angleToward({ x: 40.3, y: 56.3 }, OPP8_START), "half-open", {
            visionTarget: { type: "opponent", playerId: "opp.8" },
            nextActionIntent: "cover",
          }),
        ),
        move("opp.8", { x: 64.3, y: 68.3 }, "linear"),
      ],
      {
        teachingPoint: "R6 blijft laag — de dekking staat er nog niet",
        preset: PRESET,
        zoom: 1.18,
        follow: [...FOLLOW_CORE],
      },
    ),

    step(
      "t2-trigger",
      DS08_SEEKS.t2,
      t2dur,
      "TRIGGER",
      [
        { kind: "phase", phase: "prepare" },
        { kind: "highlight", playerIds: ["opp.lb", "us.RW"] },
        ...passLcbToLb(DS08_SEEKS.t2, t2dur),
        move(
          "opp.lb",
          LB,
          "easeOut",
          undefined,
          o(205, "half-open", { visionTarget: { type: "ball" }, receivingFoot: "right", nextActionIntent: "play-forward" }),
        ),
        move(
          "us.RW",
          RW_TRAILING,
          "easeOut",
          undefined,
          o(angleToward(RW_TRAILING, LB), "side-on", { visionTarget: { type: "ball" }, nextActionIntent: "press" }),
        ),
        move("us.R6", { x: 40, y: 56 }, "easeOut"),
        move("opp.8", { x: 63, y: 66 }, "easeOut"),
      ],
      {
        teachingPoint: "Pass naar de back — jij bent nog niet dicht genoeg",
        isTrigger: true,
        preset: PRESET,
        zoom: 1.2,
        follow: [...FOLLOW_CORE],
        orientations: castOrient({
          "opp.lb": o(205, "half-open", { visionTarget: { type: "ball" }, receivingFoot: "right", nextActionIntent: "play-forward" }),
          "us.RW": o(angleToward(RW_TRAILING, LB), "side-on", { visionTarget: { type: "ball" }, nextActionIntent: "press" }),
        }),
      },
    ),

    step(
      "t2b-first-touch",
      DS08_SEEKS.t2Arrive,
      touchDur,
      "AANNAME",
      [
        { kind: "phase", phase: "prepare" },
        { kind: "highlight", playerIds: ["opp.lb", "us.RW"] },
        { kind: "possession", holderId: "opp.lb" },
        {
          kind: "ballMove",
          from: BALL_ARRIVE,
          to: BALL_SETTLE,
          easing: "easeOut",
          syncLane: false,
          trajectoryId: "ds08-lb-first-touch",
          releaseLocal: 0,
          arrivalLocal: 0.2,
        },
        { kind: "possession", holderId: "opp.lb" },
        // LB receives OPEN — no pressure arrived. This is the key prelude beat.
        move(
          "opp.lb",
          { x: 80.1, y: 84.2 },
          "easeOut",
          undefined,
          o(198, "open", { visionTarget: { type: "teammate", playerId: "opp.8" }, receivingFoot: "either", nextActionIntent: "play-forward" }),
        ),
        move(
          "us.RW",
          RW_TRAILING,
          "easeInOut",
          undefined,
          o(angleToward(RW_TRAILING, LB), "half-open", { visionTarget: { type: "ball" }, nextActionIntent: "press" }),
        ),
        move("us.R6", { x: 39.5, y: 55.5 }, "easeInOut"),
        move("opp.8", { x: 61, y: 64 }, "easeInOut"),
      ],
      {
        teachingPoint: "LB ontvangt open — geen druk aangekomen, veel tijd",
        preset: PRESET,
        zoom: 1.22,
        follow: [...FOLLOW_CORE],
      },
    ),

    step(
      "t3-window-closing",
      DS08_SEEKS.t3,
      closingDur,
      "TE LAAT",
      [
        { kind: "phase", phase: "reaction" },
        { kind: "highlight", playerIds: ["opp.lb", "opp.8", "us.RW", "us.R6"] },
        {
          kind: "ballMove",
          from: BALL_SETTLE,
          to: BALL_AT_OPP8,
          easing: "easeOut",
          syncLane: true,
          trajectoryId: "ds08-lb-to-8",
          passerId: "opp.lb",
          laneStatus: "pass",
          releaseLocal: 0.1,
          arrivalLocal: 0.7,
        },
        { kind: "possession", holderId: null },
        move(
          "opp.8",
          OPP8_ADVANCED,
          "easeOut",
          undefined,
          o(190, "open", { visionTarget: { type: "ball" }, nextActionIntent: "turn" }),
        ),
        { kind: "possession", holderId: "opp.8" },
        // RW is chasing the pass, not the man — arrives where the ball WAS.
        move(
          "us.RW",
          RW_LATE,
          "easeInOut",
          undefined,
          o(angleToward(RW_LATE, LB), "closed", { visionTarget: { type: "ball" }, nextActionIntent: "press" }),
        ),
        // R6 finally reacts — but from a standing start, far too late.
        move(
          "us.R6",
          R6_LATE,
          "easeInOut",
          undefined,
          o(angleToward(R6_LATE, OPP8_ADVANCED), "half-open", {
            visionTarget: { type: "opponent", playerId: "opp.8" },
            nextActionIntent: "cover",
          }),
        ),
        {
          kind: "setZones",
          zones: [
            {
              x: 30,
              y: 44,
              w: 24,
              h: 26,
              kind: "risk",
              label: "",
              geometry: { type: "ellipse" },
            },
          ],
        },
      ],
      {
        teachingPoint: "Bal loopt al door — jouw druk komt te laat",
        preset: PRESET,
        zoom: 1.2,
        follow: [...FOLLOW_CORE],
      },
    ),

    step(
      "t3b-freeze",
      DS08_SEEKS.freeze,
      holdDur,
      "BESLIS",
      [
        { kind: "phase", phase: "recognition" },
        { kind: "highlight", playerIds: ["us.RW", "us.R6", "opp.8"] },
        {
          kind: "ballMove",
          from: BALL_AT_OPP8,
          to: BALL_AT_FREEZE,
          easing: "linear",
          syncLane: false,
          trajectoryId: "ds08-8-drives-on",
          releaseLocal: 0,
          arrivalLocal: 0.3,
        },
        move(
          "opp.8",
          OPP8_FROZEN,
          "linear",
          undefined,
          o(184, "open", { visionTarget: { type: "goal" }, nextActionIntent: "turn" }),
        ),
        { kind: "possession", holderId: "opp.8" },
        {
          kind: "setZones",
          zones: [
            {
              x: 28,
              y: 42,
              w: 26,
              h: 28,
              kind: "risk",
              label: "",
              geometry: { type: "ellipse" },
            },
          ],
        },
        { kind: "hold" },
      ],
      {
        teachingPoint: "Het venster is weg — jagen of herstellen?",
        isTrigger: true,
        preset: PRESET,
        zoom: 1.22,
        follow: [...FOLLOW_CORE],
        orientations: castOrient({
          "opp.8": o(184, "open", { visionTarget: { type: "goal" }, nextActionIntent: "turn" }),
          "us.RW": o(angleToward(RW_LATE, OPP8_FROZEN), "closed", { visionTarget: { type: "ball" }, nextActionIntent: "press" }),
          "us.R6": o(angleToward(R6_LATE, OPP8_FROZEN), "half-open", {
            visionTarget: { type: "opponent", playerId: "opp.8" },
            nextActionIntent: "cover",
          }),
        }),
      },
    ),
  ];
}

/** ——— animations ——— */

export const ANIM_DS08_LIVE: TacticalAnimationDefinition = {
  id: "anim.ds08-abort-recover-live",
  situationId: DS08_FILM_IDS.live,
  complexity: "pattern",
  durationMs: DS08_SEEKS.liveEnd,
  pauseAtStartMs: 0,
  pauseAtEndMs: 2600,
  defaultPlaybackRate: 1,
  autoplay: true,
  loop: false,
  positioningMode: "authored",
  steps: buildPrelude(DS08_SEEKS.liveEnd),
};

export const ANIM_DS08_GOOD: TacticalAnimationDefinition = {
  id: "anim.ds08-abort-recover-good",
  situationId: DS08_FILM_IDS.good,
  complexity: "pattern",
  durationMs: DS08_SEEKS.end,
  pauseAtStartMs: 0,
  pauseAtEndMs: 2200,
  defaultPlaybackRate: 1,
  autoplay: true,
  loop: false,
  positioningMode: "authored",
  steps: [
    ...buildPrelude(DS08_SEEKS.t4),
    step(
      "t4-abort",
      DS08_SEEKS.t4,
      DS08_SEEKS.t5 - DS08_SEEKS.t4,
      "AFBREKEN",
      [
        { kind: "phase", phase: "action" },
        { kind: "highlight", playerIds: ["us.RW", "us.R6", "us.RB", "us.RCV"] },
        { kind: "setZones", zones: [] },
        move(
          "us.RW",
          RW_RECOVER,
          "easeInOut",
          undefined,
          o(angleToward(RW_RECOVER, OPP8_FROZEN), "half-open", { visionTarget: { type: "ball" }, nextActionIntent: "cover" }),
        ),
        move(
          "us.R6",
          R6_RECOVER,
          "easeInOut",
          undefined,
          o(angleToward(R6_RECOVER, OPP8_FROZEN), "half-open", {
            visionTarget: { type: "opponent", playerId: "opp.8" },
            nextActionIntent: "cover",
          }),
        ),
        move("us.RB", RB_RECOVER, "easeInOut"),
        move("us.RCV", RCV_RECOVER, "easeInOut"),
        {
          kind: "setLines",
          lines: [
            { kind: "run", from: RW_LATE, to: RW_RECOVER, dashed: true, opacity: 0.6 },
            { kind: "run", from: R6_LATE, to: R6_RECOVER, dashed: true, opacity: 0.6 },
          ],
        },
        { kind: "possession", holderId: "opp.8" },
      ],
      {
        teachingPoint: "Stop met jagen — sprint terug naar je eigen doel",
        preset: PRESET,
        zoom: 1.14,
        follow: [...FOLLOW_CORE],
      },
    ),
    step(
      "t5-compact",
      DS08_SEEKS.t5,
      DS08_SEEKS.t6 - DS08_SEEKS.t5,
      "BLOK STAAT",
      [
        { kind: "phase", phase: "follow" },
        { kind: "highlight", playerIds: ["us.RW", "us.R6", "us.RB", "us.RCV"] },
        move("opp.8", { x: 44, y: 54 }, "easeIn"),
        {
          kind: "setLines",
          lines: [{ kind: "press", from: R6_RECOVER, to: { x: 44, y: 54 }, dashed: true }],
        },
        { kind: "possession", holderId: "opp.8" },
      ],
      {
        teachingPoint: "Team compact — geen ruimte om doorheen te lopen",
        preset: PRESET,
        zoom: 1.12,
        follow: [...FOLLOW_CORE],
      },
    ),
    step(
      "t6-consequence",
      DS08_SEEKS.t6,
      DS08_SEEKS.t7 - DS08_SEEKS.t6,
      "GEVOLG",
      [
        { kind: "phase", phase: "result" },
        { kind: "highlight", playerIds: ["us.R6", "opp.8", "opp.6"] },
        {
          kind: "ballMove",
          from: { x: 44, y: 54 },
          to: BALL_CONTAINED,
          easing: "easeOut",
          syncLane: true,
          trajectoryId: "ds08-good-recycle",
          passerId: "opp.8",
          laneStatus: "pass",
          releaseLocal: 0.16,
          arrivalLocal: 0.8,
        },
        { kind: "possession", holderId: null },
        move("opp.6", BALL_CONTAINED, "easeOut"),
        { kind: "possession", holderId: "opp.6" },
        { kind: "setLines", lines: [] },
      ],
      {
        teachingPoint: "Aanval afgeslagen — bal moet terug, geen paniek",
        preset: PRESET,
        zoom: 1.1,
        follow: [...FOLLOW_CORE, "opp.6"],
      },
    ),
    step(
      "t7-hold",
      DS08_SEEKS.t7,
      DS08_SEEKS.end - DS08_SEEKS.t7,
      "DICHT",
      [
        { kind: "phase", phase: "result" },
        { kind: "highlight", playerIds: ["us.RW", "us.R6", "us.RB", "us.RCV"] },
        { kind: "possession", holderId: "opp.6" },
        { kind: "hold" },
      ],
      {
        teachingPoint: "Herstel gelukt — team staat weer goal-side",
        preset: PRESET,
        zoom: 1.1,
        follow: [...FOLLOW_CORE],
      },
    ),
  ],
};

export const ANIM_DS08_BAD: TacticalAnimationDefinition = {
  id: "anim.ds08-abort-recover-bad",
  situationId: DS08_FILM_IDS.bad,
  complexity: "pattern",
  durationMs: DS08_SEEKS.t7,
  pauseAtStartMs: 0,
  pauseAtEndMs: 2200,
  defaultPlaybackRate: 1,
  autoplay: true,
  loop: false,
  positioningMode: "authored",
  steps: [
    ...buildPrelude(DS08_SEEKS.t4),
    step(
      "t4-force",
      DS08_SEEKS.t4,
      DS08_SEEKS.t5 - DS08_SEEKS.t4,
      "TOCH DOORDRUKKEN",
      [
        { kind: "phase", phase: "action" },
        { kind: "highlight", playerIds: ["us.RW", "opp.8"] },
        // Nobody recovers — RW keeps chasing, R6/RB/RCV stay passive.
        move(
          "us.RW",
          RW_LUNGE,
          "easeOut",
          undefined,
          o(angleToward(RW_LUNGE, OPP8_FROZEN), "closed", { visionTarget: { type: "ball" }, nextActionIntent: "press" }),
        ),
        move("us.R6", R6_LATE, "linear"),
        move("us.RB", RB_START, "linear"),
        move("us.RCV", RCV_START, "linear"),
        {
          kind: "setZones",
          zones: [
            {
              x: 22,
              y: 40,
              w: 30,
              h: 30,
              kind: "risk",
              label: "",
              geometry: { type: "ellipse" },
            },
          ],
        },
        {
          kind: "setLines",
          lines: [{ kind: "fault", from: RW_LUNGE, to: OPP8_FROZEN, dashed: true, opacity: 0.7 }],
        },
        { kind: "possession", holderId: "opp.8" },
      ],
      {
        teachingPoint: "RW jaagt door — niemand dekt het gat erachter",
        preset: PRESET,
        zoom: 1.18,
        follow: [...FOLLOW_CORE],
      },
    ),
    step(
      "t5-exploit",
      DS08_SEEKS.t5,
      DS08_SEEKS.t6 - DS08_SEEKS.t5,
      "RUIMTE ERACHTER",
      [
        { kind: "phase", phase: "reaction" },
        { kind: "highlight", playerIds: ["opp.8", "opp.st", "us.RW"] },
        move(
          "opp.8",
          OPP8_BREAKS,
          "easeOut",
          undefined,
          o(190, "open", { visionTarget: { type: "teammate", playerId: "opp.st" }, nextActionIntent: "play-forward" }),
        ),
        {
          kind: "ballMove",
          from: BALL_AT_FREEZE,
          to: BALL_BEHIND,
          easing: "easeOut",
          syncLane: true,
          trajectoryId: "ds08-bad-through",
          passerId: "opp.8",
          laneStatus: "fault",
          releaseLocal: 0.2,
          arrivalLocal: 0.85,
        },
        { kind: "possession", holderId: null },
        move(
          "opp.st",
          OPP_ST_RECEIVE,
          "easeOut",
          undefined,
          o(178, "open", { visionTarget: { type: "goal" }, nextActionIntent: "run-in-behind" }),
        ),
        { kind: "possession", holderId: "opp.st" },
        move("us.RW", { x: 47, y: 62 }, "easeIn"),
      ],
      {
        teachingPoint: "Bal door het gat — hun spits is vrij",
        preset: PRESET,
        zoom: 1.2,
        follow: [...FOLLOW_CORE, "opp.st"],
      },
    ),
    step(
      "t6-broken",
      DS08_SEEKS.t6,
      DS08_SEEKS.t7 - DS08_SEEKS.t6,
      "GEVAAR",
      [
        { kind: "phase", phase: "result" },
        { kind: "highlight", playerIds: ["opp.st", "us.RB", "us.RCV"] },
        { kind: "possession", holderId: "opp.st" },
        { kind: "setLines", lines: [] },
        { kind: "hold" },
      ],
      {
        teachingPoint: "Grote kans voor hen — het venster kostte je de lijn",
        preset: PRESET,
        zoom: 1.16,
        follow: [...FOLLOW_CORE, "opp.st"],
      },
    ),
  ],
};

/** ——— exported bundle for press-batch-a/index.ts ——— */

export const DS08_BUNDLE = {
  situations: {
    [DS08_FILM_IDS.live]: DS08_SITUATION_LIVE,
    [DS08_FILM_IDS.good]: DS08_SITUATION_GOOD,
    [DS08_FILM_IDS.bad]: DS08_SITUATION_BAD,
  } as Record<string, TacticalSituationDefinition>,
  animations: {
    [DS08_FILM_IDS.live]: ANIM_DS08_LIVE,
    [DS08_FILM_IDS.good]: ANIM_DS08_GOOD,
    [DS08_FILM_IDS.bad]: ANIM_DS08_BAD,
  } as Record<string, TacticalAnimationDefinition>,
  freezeMs: DS08_SEEKS.freeze,
  previewMs: DS08_SEEKS.previewOpening,
};
