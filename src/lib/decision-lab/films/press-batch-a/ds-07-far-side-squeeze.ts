/**
 * FDL-DS-FAR-SIDE-SQUEEZE-V1 — hand-authored teaching film (#7, press-farside).
 *
 * Ball-side stays RIGHT — identical base geometry to the Golden Session
 * (their LCB → LB, us.RW presses). The decision does NOT belong to RW here:
 * it belongs to the FAR-SIDE winger, us.LW. Does he tuck narrow with the team
 * while the ball is trapped on the other flank, or stay high and wide and
 * leave the switch/weak-side lane open?
 *
 * Teaching idea: distance-to-ball vs distance-to-team.
 * Camera: deliberately wide (not GS press-detail) so the far flank stays
 * visible the whole film — the point IS the far side.
 */

import { createPressingArc } from "@/lib/academie/tactical-animation-collision";
import type {
  TacticalAnimationAction,
  TacticalAnimationDefinition,
  TacticalAnimationStep,
} from "@/lib/academie/tactical-animation-types";
import {
  PRESS_V2_GOOD_BALL_RESULT,
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
import { DS07_SEEKS } from "@/lib/decision-lab/films/press-batch-a/timings";

export { DS07_SEEKS } from "@/lib/decision-lab/films/press-batch-a/timings";

/** ——— identity ——— */

export const DS07_SLUG = "verre-zijde-knijpt";
export const DS07_FILM_IDS = filmIdsForSlug(DS07_SLUG);

/** ——— ball-side reference (unchanged from GS — cbL → lb, RW presses) ——— */

const CBL = { x: 82, y: 60 };
const LB = { x: 80, y: 84 };

const BALL_AT_CBL = ballAtReceivingFoot(CBL, { foot: "right", facingDeg: 12 });
const BALL_ARRIVE = ballAtReceivingFoot(LB, { foot: "right", facingDeg: 205 });
const BALL_SETTLE: TacticalPoint = { x: BALL_ARRIVE.x - 0.9, y: BALL_ARRIVE.y - 0.55 };

const RW_START = PRESS_V2_US_START.RW;
const RW_ARC = createPressingArc(RW_START, { x: 57, y: 76 }, { x: 68, y: 79 }, { bulge: 4.6 });

/** ——— far-side reference — the actual lesson ——— */

const LW_START = PRESS_V2_US_START.LW; // {40, 22} — high, wide
const LW_NARROW: TacticalPoint = { x: 49, y: 33 }; // tucked toward centre
const LW_STAYS_WIDE: TacticalPoint = { x: 42, y: 19 }; // barely moves, even higher

const OUR_LB_START = PRESS_V2_US_START.LB; // {30, 22}
const OUR_LB_NARROW: TacticalPoint = { x: 36, y: 30 };
const OUR_LB_STAYS_WIDE: TacticalPoint = { x: 31, y: 21 };

const L6_START = PRESS_V2_US_START.L6; // {40, 40}
const L6_NARROW: TacticalPoint = { x: 45, y: 43 };

const OPP_RW_FAR = { x: 56, y: 14 }; // their outlet if we never tuck
const SWITCH_ARRIVE: TacticalPoint = { x: 57, y: 17 };

/** ——— camera — deliberately wide, not GS press-detail ——— */

const PRESET = "press-wide";
const FOLLOW_WIDE = ["us.LW", "us.L6", "us.LB", "opp.rw", "opp.lb", "opp.cbL", "us.RW"] as const;

function castOrient(partial: Record<string, PlayerOrientation>): Record<string, PlayerOrientation> {
  return {
    "us.L6": o(6, "half-open", { visionTarget: { type: "ball" }, nextActionIntent: "cover" }),
    "us.LB": o(8, "half-open", { visionTarget: { type: "ball" }, nextActionIntent: "cover" }),
    ...partial,
  };
}

function passLcbToLb(stepStartMs: number, stepDurMs: number): TacticalAnimationAction[] {
  const dur = Math.max(stepDurMs, 1);
  const releaseAbs = DS07_SEEKS.t2 + 200;
  const arrivalAbs = DS07_SEEKS.t2Arrive - 40;
  return [
    {
      kind: "ballMove",
      from: BALL_AT_CBL,
      to: BALL_ARRIVE,
      easing: "easeOut",
      syncLane: true,
      trajectoryId: "ds07-cbl-to-lb",
      passerId: "opp.cbL",
      laneStatus: "pass",
      releaseLocal: Math.max(0.1, Math.min(0.32, (releaseAbs - stepStartMs) / dur)),
      arrivalLocal: Math.max(0.72, Math.min(0.94, (arrivalAbs - stepStartMs) / dur)),
    },
    { kind: "possession", holderId: null },
  ];
}

/** ——— situations ——— */

const DS07_SITUATION_ROOT: TacticalSituationDefinition = {
  id: DS07_FILM_IDS.live as TacticalSituationDefinition["id"],
  eyebrow: "SITUATIE",
  title: "Bal blijft rechts — jij bent de verre vleugel",
  subtitle: "Trigger: bal naar hun back rechts. Jij bent LW — smal of breed blijven?",
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
  return { ...DS07_SITUATION_ROOT, id: id as TacticalSituationDefinition["id"], eyebrow, title, subtitle };
}

export const DS07_SITUATION_LIVE = DS07_SITUATION_ROOT;

export const DS07_SITUATION_GOOD = cloneSituation(
  DS07_FILM_IDS.good,
  "GOED",
  "Smal blijven — team knijpt mee",
  "LW zoekt de teamafstand; breedte krimpt; switch is dicht.",
);

export const DS07_SITUATION_BAD = cloneSituation(
  DS07_FILM_IDS.bad,
  "FOUT",
  "Breed en hoog blijven staan",
  "LW blijft aan de lijn — de bal om naar hun RW is open.",
);

/** ——— shared T0→freeze prelude ——— */

function buildPrelude(toHoldMs: number): TacticalAnimationStep[] {
  const t0dur = DS07_SEEKS.t1 - DS07_SEEKS.t0;
  const t1dur = DS07_SEEKS.t2 - DS07_SEEKS.t1;
  const t2dur = DS07_SEEKS.t2Arrive - DS07_SEEKS.t2;
  const touchDur = DS07_SEEKS.t3 - DS07_SEEKS.t2Arrive;
  const holdDur = toHoldMs - DS07_SEEKS.t3;

  return [
    step(
      "t0-set",
      DS07_SEEKS.t0,
      t0dur,
      "SITUATIE",
      [
        { kind: "phase", phase: "initial" },
        { kind: "highlight", playerIds: ["opp.cbL", "us.LW"] },
        { kind: "possession", holderId: "opp.cbL" },
        { kind: "hold" },
      ],
      {
        teachingPoint: "Bal rechts — kijk naar jouw afstand tot de bal én tot je team",
        preset: PRESET,
        zoom: 1.06,
        follow: [...FOLLOW_WIDE],
        orientations: castOrient({
          "opp.cbL": o(10, "half-open-right", {
            visionTarget: { type: "teammate", playerId: "opp.lb" },
            nextActionIntent: "play-forward",
            receivingFoot: "right",
          }),
          "us.LW": o(angleToward(LW_START, CBL), "open", {
            visionTarget: { type: "ball" },
            nextActionIntent: "cover",
            prePassScan: true,
          }),
          "us.RW": o(angleToward(RW_START, CBL), "half-open-right", {
            visionTarget: { type: "ball" },
            nextActionIntent: "press",
          }),
        }),
      },
    ),

    step(
      "t1-scan",
      DS07_SEEKS.t1,
      t1dur,
      "SCAN",
      [
        { kind: "phase", phase: "recognition" },
        { kind: "highlight", playerIds: ["opp.cbL", "opp.lb", "us.LW"] },
        move("opp.cbL", { x: 81.4, y: 60.8 }, "easeInOut"),
        move("opp.lb", { x: 80.4, y: 85 }, "easeInOut"),
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
          "us.LW",
          { x: 40.3, y: 22.4 },
          "linear",
          undefined,
          o(angleToward(LW_START, CBL), "open", {
            visionTarget: { type: "ball" },
            nextActionIntent: "cover",
            prePassScan: true,
          }),
        ),
        move("us.L6", { x: 40.4, y: 40.6 }, "linear"),
        move("us.LB", { x: 30.3, y: 22.3 }, "linear"),
        { kind: "possession", holderId: "opp.cbL" },
      ],
      {
        teachingPoint: "Bal nog links van jou — nog geen keuze nodig",
        preset: PRESET,
        zoom: 1.08,
        follow: [...FOLLOW_WIDE],
      },
    ),

    step(
      "t2-trigger",
      DS07_SEEKS.t2,
      t2dur,
      "TRIGGER",
      [
        { kind: "phase", phase: "prepare" },
        { kind: "highlight", playerIds: ["opp.lb", "us.RW"] },
        ...passLcbToLb(DS07_SEEKS.t2, t2dur),
        move(
          "opp.lb",
          LB,
          "easeOut",
          undefined,
          o(205, "closed", { visionTarget: { type: "ball" }, receivingFoot: "right", nextActionIntent: "play-forward" }),
        ),
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
        move("us.LW", { x: 40.1, y: 22.2 }, "easeOut"),
      ],
      {
        teachingPoint: "Pass naar hun back — bal blijft rechts",
        isTrigger: true,
        preset: PRESET,
        zoom: 1.08,
        follow: [...FOLLOW_WIDE],
        orientations: castOrient({
          "opp.lb": o(205, "closed", { visionTarget: { type: "ball" }, receivingFoot: "right", nextActionIntent: "play-forward" }),
          "us.RW": o(angleToward({ x: 43.5, y: 74.8 }, LB), "side-on", {
            visionTarget: { type: "ball" },
            nextActionIntent: "press",
          }),
          "us.LW": o(angleToward(LW_START, LB), "open", {
            visionTarget: { type: "ball" },
            nextActionIntent: "cover",
          }),
        }),
      },
    ),

    step(
      "t2b-first-touch",
      DS07_SEEKS.t2Arrive,
      touchDur,
      "AANNAME",
      [
        { kind: "phase", phase: "prepare" },
        { kind: "highlight", playerIds: ["opp.lb", "us.RW", "us.LW"] },
        { kind: "possession", holderId: "opp.lb" },
        {
          kind: "ballMove",
          from: BALL_ARRIVE,
          to: BALL_SETTLE,
          easing: "easeOut",
          syncLane: false,
          trajectoryId: "ds07-lb-first-touch",
          releaseLocal: 0,
          arrivalLocal: 0.2,
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
          { x: 44.2, y: 75.1 },
          "easeInOut",
          undefined,
          o(angleToward({ x: 44.2, y: 75.1 }, LB), "half-open-right", {
            visionTarget: { type: "ball" },
            nextActionIntent: "press",
          }),
        ),
        move(
          "us.LW",
          { x: 40, y: 22 },
          "easeInOut",
          undefined,
          o(angleToward(LW_START, LB), "open", {
            visionTarget: { type: "ball" },
            nextActionIntent: "cover",
            prePassScan: true,
          }),
        ),
      ],
      {
        teachingPoint: "Bal ligt vast rechts — meet je afstand tot je team",
        preset: PRESET,
        zoom: 1.1,
        follow: [...FOLLOW_WIDE],
      },
    ),

    step(
      "t3-freeze",
      DS07_SEEKS.t3,
      holdDur,
      "BESLIS",
      [
        { kind: "phase", phase: "recognition" },
        { kind: "highlight", playerIds: ["us.LW", "opp.rw", "opp.lb"] },
        {
          kind: "setLines",
          lines: [
            { kind: "run", from: LW_START, to: BALL_SETTLE, dashed: true, opacity: 0.35 },
            { kind: "run", from: LW_START, to: L6_START, dashed: true, opacity: 0.55 },
          ],
        },
        {
          kind: "setZones",
          zones: [
            {
              x: 44,
              y: 6,
              w: 24,
              h: 24,
              kind: "space",
              label: "",
              geometry: {
                type: "corridor",
                from: { x: 66, y: 40 },
                to: OPP_RW_FAR,
                width: 12,
              },
            },
          ],
        },
        { kind: "possession", holderId: "opp.lb" },
        { kind: "hold" },
      ],
      {
        teachingPoint: "Afstand tot de bal vs afstand tot je team — wat kies jij?",
        isTrigger: true,
        preset: PRESET,
        zoom: 1.1,
        follow: [...FOLLOW_WIDE],
        orientations: castOrient({
          "opp.lb": o(214, "closed", { visionTarget: { type: "teammate", playerId: "opp.8" }, receivingFoot: "right", nextActionIntent: "play-forward" }),
          "us.RW": o(angleToward({ x: 44.4, y: 75.15 }, LB), "half-open-right", { visionTarget: { type: "ball" }, nextActionIntent: "press" }),
          "us.LW": o(angleToward(LW_START, LB), "open", {
            visionTarget: { type: "ball" },
            nextActionIntent: "cover",
            prePassScan: true,
          }),
        }),
      },
    ),
  ];
}

/** ——— animations ——— */

export const ANIM_DS07_LIVE: TacticalAnimationDefinition = {
  id: "anim.ds07-far-side-squeeze-live",
  situationId: DS07_FILM_IDS.live,
  complexity: "pattern",
  durationMs: DS07_SEEKS.liveEnd,
  pauseAtStartMs: 0,
  pauseAtEndMs: 2400,
  defaultPlaybackRate: 1,
  autoplay: true,
  loop: false,
  positioningMode: "authored",
  steps: buildPrelude(DS07_SEEKS.liveEnd),
};

export const ANIM_DS07_GOOD: TacticalAnimationDefinition = {
  id: "anim.ds07-far-side-squeeze-good",
  situationId: DS07_FILM_IDS.good,
  complexity: "pattern",
  durationMs: DS07_SEEKS.end,
  pauseAtStartMs: 0,
  pauseAtEndMs: 2000,
  defaultPlaybackRate: 1,
  autoplay: true,
  loop: false,
  positioningMode: "authored",
  steps: [
    ...buildPrelude(DS07_SEEKS.t4),
    step(
      "t4-tuck",
      DS07_SEEKS.t4,
      DS07_SEEKS.t5 - DS07_SEEKS.t4,
      "SMAL",
      [
        { kind: "phase", phase: "action" },
        { kind: "highlight", playerIds: ["us.LW", "us.L6", "us.LB"] },
        { kind: "setZones", zones: [] },
        { kind: "setLines", lines: [] },
        move(
          "us.LW",
          LW_NARROW,
          "easeOut",
          undefined,
          o(angleToward(LW_NARROW, BALL_SETTLE), "half-open", {
            visionTarget: { type: "ball" },
            nextActionIntent: "cover",
          }),
        ),
        move(
          "us.L6",
          L6_NARROW,
          "easeInOut",
          undefined,
          o(angleToward(L6_NARROW, BALL_SETTLE), "half-open", { visionTarget: { type: "ball" }, nextActionIntent: "cover" }),
        ),
        move(
          "us.LB",
          OUR_LB_NARROW,
          "easeInOut",
          undefined,
          o(angleToward(OUR_LB_NARROW, BALL_SETTLE), "half-open", { visionTarget: { type: "ball" }, nextActionIntent: "cover" }),
        ),
        move("us.RW", RW_ARC[RW_ARC.length - 1] ?? { x: 66, y: 78 }, "easeOut", RW_ARC.slice(0, -1)),
        { kind: "possession", holderId: "opp.lb" },
      ],
      {
        teachingPoint: "Smal + dichtbij — geen ruimte voor de switch",
        preset: PRESET,
        zoom: 1.1,
        follow: [...FOLLOW_WIDE],
      },
    ),
    step(
      "t5-connect",
      DS07_SEEKS.t5,
      DS07_SEEKS.t6 - DS07_SEEKS.t5,
      "TEAM",
      [
        { kind: "phase", phase: "follow" },
        { kind: "highlight", playerIds: ["us.LW", "us.L6", "us.LB", "opp.lb"] },
        {
          kind: "ballMove",
          from: BALL_SETTLE,
          to: PRESS_V2_GOOD_BALL_RESULT,
          easing: "easeOut",
          syncLane: true,
          trajectoryId: "ds07-good-recycle",
          passerId: "opp.lb",
          laneStatus: "pass",
          releaseLocal: 0.16,
          arrivalLocal: 0.82,
        },
        { kind: "possession", holderId: null },
        move("opp.lb", { x: 82.2, y: 86.2 }, "easeIn"),
        move("opp.cbL", PRESS_V2_GOOD_BALL_RESULT, "easeOut"),
        { kind: "possession", holderId: "opp.cbL" },
        move("us.LW", { x: 48, y: 34.5 }, "easeInOut"),
        move("us.L6", { x: 44.5, y: 44 }, "easeInOut"),
        move("us.LB", { x: 35.5, y: 31 }, "easeInOut"),
      ],
      {
        teachingPoint: "Geen uitweg opzij — bal moet terug",
        preset: PRESET,
        zoom: 1.08,
        follow: [...FOLLOW_WIDE],
      },
    ),
    step(
      "t6-hold",
      DS07_SEEKS.t6,
      DS07_SEEKS.t7 - DS07_SEEKS.t6,
      "GEVOLG",
      [
        { kind: "phase", phase: "result" },
        { kind: "highlight", playerIds: ["us.LW", "us.L6", "us.LB"] },
        { kind: "possession", holderId: "opp.cbL" },
        { kind: "hold" },
      ],
      {
        teachingPoint: "Team compact — zwakke kant onder controle",
        preset: PRESET,
        zoom: 1.06,
        follow: [...FOLLOW_WIDE],
      },
    ),
    step(
      "t7-hold",
      DS07_SEEKS.t7,
      DS07_SEEKS.end - DS07_SEEKS.t7,
      "SMAL DICHT",
      [
        { kind: "phase", phase: "result" },
        { kind: "highlight", playerIds: ["us.LW", "us.L6", "us.LB", "us.RW"] },
        { kind: "possession", holderId: "opp.cbL" },
        { kind: "hold" },
      ],
      {
        teachingPoint: "Breedte krimpt mee met de bal",
        preset: PRESET,
        zoom: 1.06,
        follow: [...FOLLOW_WIDE],
      },
    ),
  ],
};

export const ANIM_DS07_BAD: TacticalAnimationDefinition = {
  id: "anim.ds07-far-side-squeeze-bad",
  situationId: DS07_FILM_IDS.bad,
  complexity: "pattern",
  durationMs: DS07_SEEKS.t7,
  pauseAtStartMs: 0,
  pauseAtEndMs: 2000,
  defaultPlaybackRate: 1,
  autoplay: true,
  loop: false,
  positioningMode: "authored",
  steps: [
    ...buildPrelude(DS07_SEEKS.t4),
    step(
      "t4-stay-wide",
      DS07_SEEKS.t4,
      DS07_SEEKS.t5 - DS07_SEEKS.t4,
      "BREED",
      [
        { kind: "phase", phase: "action" },
        { kind: "highlight", playerIds: ["us.LW", "opp.rw"] },
        {
          kind: "setZones",
          zones: [
            {
              x: 40,
              y: 6,
              w: 30,
              h: 30,
              kind: "risk",
              label: "",
              geometry: { type: "ellipse" },
            },
          ],
        },
        move("us.LW", LW_STAYS_WIDE, "easeOut"),
        move("us.LB", OUR_LB_STAYS_WIDE, "easeInOut"),
        move("us.L6", { x: 40.6, y: 41 }, "easeInOut"),
        move("us.RW", RW_ARC[RW_ARC.length - 1] ?? { x: 66, y: 78 }, "easeOut", RW_ARC.slice(0, -1)),
        {
          kind: "setLines",
          lines: [{ kind: "fault", from: LW_START, to: L6_START, dashed: true, opacity: 0.55 }],
        },
        { kind: "possession", holderId: "opp.lb" },
      ],
      {
        teachingPoint: "LW blijft aan de lijn — team knijpt niet mee",
        preset: PRESET,
        zoom: 1.08,
        follow: [...FOLLOW_WIDE],
      },
    ),
    step(
      "t5-switch",
      DS07_SEEKS.t5,
      DS07_SEEKS.t6 - DS07_SEEKS.t5,
      "OMSPEELD",
      [
        { kind: "phase", phase: "reaction" },
        { kind: "highlight", playerIds: ["opp.lb", "opp.rw", "us.LW"] },
        {
          kind: "ballMove",
          from: BALL_SETTLE,
          to: SWITCH_ARRIVE,
          via: [{ x: 68, y: 46 }],
          easing: "easeOut",
          syncLane: true,
          trajectoryId: "ds07-bad-switch",
          passerId: "opp.lb",
          laneStatus: "fault",
          releaseLocal: 0.14,
          arrivalLocal: 0.86,
        },
        { kind: "possession", holderId: null },
        move(
          "opp.rw",
          SWITCH_ARRIVE,
          "easeOut",
          undefined,
          o(200, "open", { visionTarget: { type: "ball" }, nextActionIntent: "play-forward", receivingFoot: "right" }),
        ),
        { kind: "possession", holderId: "opp.rw" },
        move("us.LW", { x: 44, y: 20 }, "easeIn"),
      ],
      {
        teachingPoint: "Lange bal om — hun RW staat helemaal vrij",
        preset: PRESET,
        zoom: 1.12,
        follow: [...FOLLOW_WIDE],
      },
    ),
    step(
      "t6-broken",
      DS07_SEEKS.t6,
      DS07_SEEKS.t7 - DS07_SEEKS.t6,
      "ZIJDE OPEN",
      [
        { kind: "phase", phase: "result" },
        { kind: "highlight", playerIds: ["opp.rw", "us.LW"] },
        { kind: "possession", holderId: "opp.rw" },
        { kind: "setLines", lines: [] },
        { kind: "hold" },
      ],
      {
        teachingPoint: "Zwakke kant is nu hún sterke kant",
        preset: PRESET,
        zoom: 1.1,
        follow: [...FOLLOW_WIDE],
      },
    ),
  ],
};

/** ——— exported bundle for press-batch-a/index.ts ——— */

export const DS07_BUNDLE = {
  situations: {
    [DS07_FILM_IDS.live]: DS07_SITUATION_LIVE,
    [DS07_FILM_IDS.good]: DS07_SITUATION_GOOD,
    [DS07_FILM_IDS.bad]: DS07_SITUATION_BAD,
  } as Record<string, TacticalSituationDefinition>,
  animations: {
    [DS07_FILM_IDS.live]: ANIM_DS07_LIVE,
    [DS07_FILM_IDS.good]: ANIM_DS07_GOOD,
    [DS07_FILM_IDS.bad]: ANIM_DS07_BAD,
  } as Record<string, TacticalAnimationDefinition>,
  freezeMs: DS07_SEEKS.freeze,
  previewMs: DS07_SEEKS.previewOpening,
};
