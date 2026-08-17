/**
 * FDL-DS-INSIDE-CLOSE-LW-PRESS-V1 — press-batch-a #2 (mirror principle).
 *
 * NOT a flipped copy of the Golden Session RB/RW labels. Ball starts at their
 * RCB, is played to their LB (left flank / low-y). Active learner is us.LW;
 * us.L6 shifts across to cover their 8 who now sits in the LEFT halfspace
 * (~y32, mirrored from the GS right-halfspace read); us.LB gives depth.
 *
 * Mirror principle: the curve closes the inside lane toward the centre
 * (higher y), and steers the ball carrier outside toward HIS touchline,
 * which on this flank is LOW y (not high y like the GS right flank).
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
  type TacticalOurPosition,
  type TacticalPlayerMarker,
  type TacticalPoint,
  type TacticalSituationDefinition,
} from "@/lib/academie/tactical-visual-system";
import { filmIdsForSlug } from "@/lib/decision-lab/films/dedicated/ids";
import { flipY, move, o, step } from "@/lib/decision-lab/films/press-batch-a/kit";
import { DS02_SEEKS } from "@/lib/decision-lab/films/press-batch-a/timings";

export { DS02_SEEKS } from "@/lib/decision-lab/films/press-batch-a/timings";

const SLUG = "binnenkant-dicht-lw";
const SESSION_ID = "FDL-DS-INSIDE-CLOSE-LW-PRESS-V1";
const IDS = filmIdsForSlug(SLUG);

/** Reflect angle through the horizontal midline (used together with flipY). */
function mirrorDeg(deg: number): number {
  const m = -deg % 360;
  if (m > 180) return m - 360;
  if (m <= -180) return m + 360;
  return m;
}

function mirrorFormation(
  f: Record<TacticalOurPosition, TacticalPoint>,
): Record<TacticalOurPosition, TacticalPoint> {
  const flipped = {} as Record<TacticalOurPosition, TacticalPoint>;
  (Object.keys(f) as TacticalOurPosition[]).forEach((k) => {
    flipped[k] = flipY(f[k]);
  });
  const swap = (a: TacticalOurPosition, b: TacticalOurPosition) => {
    const tmp = flipped[a];
    flipped[a] = flipped[b];
    flipped[b] = tmp;
  };
  swap("LB", "RB");
  swap("LCV", "RCV");
  swap("L6", "R6");
  swap("LW", "RW");
  return flipped;
}

const US = PRESS_V2_US_START;
/** Good/bad end shapes derived by genuine mirror (flip + flank swap), not relabeling. */
const G = mirrorFormation(PRESS_V2_GOOD_US_END);
const B = mirrorFormation(PRESS_V2_BAD_US_END);

const CBR = { x: 82, y: 36 };
const OPP_RB = { x: 80, y: 16 };
/** Their 8 sits in the LEFT halfspace for this session — not the GS right-side spot. */
const OPP8 = flipY({ x: 64, y: 68 });

const BALL_AT_CBR = ballAtReceivingFoot(CBR, { foot: "left", facingDeg: -14 });
/** Contact — ball meets receiving foot, low-y flank. */
const BALL_ARRIVE = ballAtReceivingFoot(OPP_RB, { foot: "left", facingDeg: 150 });
/** Settle — tiny kill toward body (first touch), not bounce. Mirrored sign on y. */
const BALL_SETTLE: TacticalPoint = {
  x: BALL_ARRIVE.x - 0.9,
  y: BALL_ARRIVE.y + 0.55,
};

/** Curve: cut inside lane first (toward centre), then approach RB (force him outside/low-y). */
const LW_CUT = flipY({ x: 55, y: 75 });
const LW_ARC = createPressingArc(US.LW, LW_CUT, G.LW, { bulge: 5.8 });
/** Straight chase — almost linear onto the ball, inside stays open. */
const LW_STRAIGHT_VIA: TacticalPoint[] = [flipY({ x: 58, y: 79 })];

function passCbrToRb(stepStart: number, stepDur: number): TacticalAnimationAction[] {
  const dur = Math.max(stepDur, 1);
  const releaseAbs = DS02_SEEKS.t2 + 220;
  const arrivalAbs = DS02_SEEKS.t2Arrive - 40;
  return [
    {
      kind: "ballMove",
      from: BALL_AT_CBR,
      to: BALL_ARRIVE,
      easing: "easeOut",
      syncLane: true,
      trajectoryId: "cbr-to-rb",
      passerId: "opp.cbR",
      laneStatus: "pass",
      releaseLocal: Math.max(0.1, Math.min(0.32, (releaseAbs - stepStart) / dur)),
      arrivalLocal: Math.max(0.72, Math.min(0.94, (arrivalAbs - stepStart) / dur)),
    },
    { kind: "possession", holderId: null },
  ];
}

function oppMarkersForDS02(): TacticalPlayerMarker[] {
  return PRESS_V2_OPP_START.map((p) => {
    if (p.id === "opp.8") return { ...p, at: OPP8, hasBall: false };
    return { ...p, hasBall: p.id === "opp.cbR" };
  });
}

/** Shared start: ball at RCB, RB waiting wide-left, us press-ready mirrored. */
export const DS02_SITUATION: TacticalSituationDefinition = {
  id: IDS.live as TacticalSituationDefinition["id"],
  eyebrow: "SITUATIE",
  title: "Hun RCB speelt breed naar de linksback",
  subtitle: "Trigger: back ontvangt — jij bent LW. Eerst de binnenlijn, nu links.",
  homeShape: { formation: "4-4-2", phase: "high-press", direction: "left-to-right" },
  opponentShape: { formation: "4-2-3-1", phase: "build-up", direction: "right-to-left" },
  players: [...pressV2UsMarkers(US), ...oppMarkersForDS02()],
  ball: BALL_AT_CBR,
  lines: [],
  zones: [],
};

function cloneSituation(
  id: TacticalSituationDefinition["id"],
  eyebrow: TacticalSituationDefinition["eyebrow"],
  title: string,
  subtitle: string,
): TacticalSituationDefinition {
  return { ...DS02_SITUATION, id, eyebrow, title, subtitle };
}

export const DS02_SITUATION_GOOD = cloneSituation(
  IDS.good as TacticalSituationDefinition["id"],
  "GOED",
  "Binnenkant dicht — buitenom sturen (links)",
  "Curve sluit RB→8; team sluit aan; bal moet terug of wijd.",
);

export const DS02_SITUATION_BAD = cloneSituation(
  IDS.bad as TacticalSituationDefinition["id"],
  "FOUT",
  "Recht naar de bal — binnenlijn open (links)",
  "Rechte jacht laat hun 8 vrij in de linker halfspace; press breekt.",
);

/** Key-cast orientations — primary decisions only. */
function castOrient(partial: Record<string, ReturnType<typeof o>>): Record<string, ReturnType<typeof o>> {
  return {
    "us.L6": o(mirrorDeg(8), "half-open", {
      visionTarget: { type: "ball" },
      nextActionIntent: "cover",
    }),
    "us.LB": o(mirrorDeg(-8), "side-on", {
      visionTarget: { type: "ball" },
      nextActionIntent: "cover",
    }),
    ...partial,
  };
}

/**
 * Shared T0→T3 prelude (identical start for live / good / bad).
 * Difference after freeze comes only from the LW decision.
 */
function buildPrelude(toFreezeHoldMs: number) {
  const t0dur = DS02_SEEKS.t1 - DS02_SEEKS.t0;
  const t1dur = DS02_SEEKS.t2 - DS02_SEEKS.t1;
  const t2dur = DS02_SEEKS.t2Arrive - DS02_SEEKS.t2;
  const touchDur = DS02_SEEKS.t3 - DS02_SEEKS.t2Arrive;
  const t3dur = toFreezeHoldMs - DS02_SEEKS.t3;

  return [
    step(
      "t0-set",
      DS02_SEEKS.t0,
      t0dur,
      "Situatie",
      [
        { kind: "phase", phase: "initial" },
        { kind: "highlight", playerIds: ["opp.cbR", "us.LW"] },
        { kind: "possession", holderId: "opp.cbR" },
        { kind: "hold" },
      ],
      {
        teachingPoint: "Bal bij hun RCB",
        zoom: 1.12,
        follow: ["opp.cbR", "opp.rb", "us.LW", "us.L6", "opp.8", "us.LB"],
        orientations: castOrient({
          "opp.cbR": o(mirrorDeg(10), "half-open-left", {
            visionTarget: { type: "teammate", playerId: "opp.rb" },
            nextActionIntent: "play-forward",
            receivingFoot: "left",
          }),
          "opp.rb": o(mirrorDeg(188), "side-on", {
            visionTarget: { type: "ball" },
            nextActionIntent: "play-forward",
          }),
          "us.LW": o(angleToward(US.LW, CBR), "half-open-left", {
            visionTarget: { type: "ball" },
            nextActionIntent: "press",
            prePassScan: true,
            receivingFoot: "right",
          }),
          "us.L6": o(angleToward(US.L6, OPP8), "half-open", {
            visionTarget: { type: "opponent", playerId: "opp.8" },
            nextActionIntent: "cover",
          }),
          "opp.8": o(mirrorDeg(198), "open", { visionTarget: { type: "ball" } }),
        }),
      },
    ),

    step(
      "t1-scan",
      DS02_SEEKS.t1,
      t1dur,
      "SCAN",
      [
        { kind: "phase", phase: "recognition" },
        { kind: "highlight", playerIds: ["opp.rb", "opp.8", "us.LW"] },
        {
          kind: "setZones",
          zones: [
            {
              x: 62,
              y: 20,
              w: 16,
              h: 14,
              kind: "risk",
              label: "",
              geometry: {
                type: "corridor",
                from: { x: 78, y: 18 },
                to: OPP8,
                width: 6.5,
              },
            },
          ],
        },
        move(
          "opp.cbR",
          { x: 81.4, y: 35.2 },
          "easeInOut",
          undefined,
          o(mirrorDeg(22), "half-open-left", {
            visionTarget: { type: "teammate", playerId: "opp.rb" },
            nextActionIntent: "play-forward",
            receivingFoot: "left",
          }),
        ),
        move(
          "opp.rb",
          { x: 80.4, y: 15 },
          "easeInOut",
          undefined,
          o(mirrorDeg(198), "closed", {
            visionTarget: { type: "ball" },
            receivingFoot: "left",
            nextActionIntent: "play-forward",
          }),
        ),
        move(
          "us.LW",
          { x: 41.8, y: 21.6 },
          "linear",
          undefined,
          o(angleToward({ x: 41.8, y: 21.6 }, OPP_RB), "half-open-left", {
            visionTarget: { type: "ball" },
            nextActionIntent: "press",
            prePassScan: true,
          }),
        ),
        move(
          "us.L6",
          { x: 41.2, y: 38.8 },
          "linear",
          undefined,
          o(mirrorDeg(14), "half-open", {
            visionTarget: { type: "opponent", playerId: "opp.8" },
            nextActionIntent: "cover",
          }),
        ),
        move(
          "us.R6",
          { x: 40.5, y: 55 },
          "linear",
          undefined,
          o(mirrorDeg(10), "half-open", { visionTarget: { type: "ball" }, nextActionIntent: "cover" }),
        ),
        move(
          "us.LB",
          { x: 31, y: 21.8 },
          "linear",
          undefined,
          o(mirrorDeg(-6), "side-on", { visionTarget: { type: "ball" }, nextActionIntent: "cover" }),
        ),
        move(
          "us.10",
          { x: 51.5, y: 52 },
          "linear",
          undefined,
          o(mirrorDeg(-5), "half-open", { visionTarget: { type: "ball" }, nextActionIntent: "cover" }),
        ),
        move("opp.8", { x: 64.5, y: 31.5 }, "linear", undefined, o(mirrorDeg(200), "open", { visionTarget: { type: "ball" } })),
        { kind: "possession", holderId: "opp.cbR" },
      ],
      {
        teachingPoint: "Zie back + binnenlijn, nu links",
        zoom: 1.18,
        follow: ["opp.cbR", "opp.rb", "opp.8", "us.LW", "us.L6"],
      },
    ),

    step(
      "t2-trigger",
      DS02_SEEKS.t2,
      t2dur,
      "TRIGGER",
      [
        { kind: "phase", phase: "prepare" },
        { kind: "highlight", playerIds: ["opp.rb", "us.LW"] },
        { kind: "setZones", zones: [] },
        ...passCbrToRb(DS02_SEEKS.t2, t2dur),
        move(
          "opp.cbR",
          { x: 81.2, y: 35.5 },
          "easeOut",
          undefined,
          o(mirrorDeg(28), "half-open-left", {
            visionTarget: { type: "teammate", playerId: "opp.rb" },
            nextActionIntent: "play-forward",
          }),
        ),
        move(
          "opp.rb",
          OPP_RB,
          "easeOut",
          undefined,
          o(mirrorDeg(205), "closed", {
            visionTarget: { type: "ball" },
            receivingFoot: "left",
            nextActionIntent: "play-forward",
          }),
        ),
        // Micro tense — not solving
        move(
          "us.LW",
          { x: 43.5, y: 21.2 },
          "easeOut",
          undefined,
          o(angleToward({ x: 43.5, y: 21.2 }, OPP_RB), "side-on", {
            visionTarget: { type: "ball" },
            nextActionIntent: "press",
          }),
        ),
        move(
          "us.L6",
          { x: 42.5, y: 38 },
          "easeOut",
          undefined,
          o(mirrorDeg(16), "half-open", {
            visionTarget: { type: "opponent", playerId: "opp.8" },
            nextActionIntent: "cover",
          }),
        ),
        move("us.LB", { x: 32.5, y: 21.4 }, "easeOut"),
        move("us.R6", { x: 41.5, y: 53.5 }, "easeOut"),
      ],
      {
        teachingPoint: "Pass naar de back, linkerflank",
        isTrigger: true,
        zoom: 1.24,
        follow: ["opp.rb", "us.LW", "opp.8", "us.L6", "opp.cbR"],
        orientations: castOrient({
          "opp.rb": o(mirrorDeg(205), "closed", {
            visionTarget: { type: "ball" },
            receivingFoot: "left",
            nextActionIntent: "play-forward",
          }),
          "us.LW": o(angleToward({ x: 43.5, y: 21.2 }, OPP_RB), "side-on", {
            visionTarget: { type: "ball" },
            nextActionIntent: "press",
          }),
          "us.L6": o(mirrorDeg(16), "half-open", {
            visionTarget: { type: "opponent", playerId: "opp.8" },
            nextActionIntent: "cover",
          }),
          "opp.8": o(mirrorDeg(202), "open", { visionTarget: { type: "ball" } }),
        }),
      },
    ),

    /** First-touch micro — contact → settle → body; then freeze. */
    step(
      "t2b-first-touch",
      DS02_SEEKS.t2Arrive,
      touchDur,
      "AANNAME",
      [
        { kind: "phase", phase: "prepare" },
        { kind: "highlight", playerIds: ["opp.rb", "us.LW", "opp.8"] },
        { kind: "setLines", lines: [] },
        { kind: "setZones", zones: [] },
        { kind: "possession", holderId: "opp.rb" },
        {
          kind: "ballMove",
          from: BALL_ARRIVE,
          to: BALL_SETTLE,
          easing: "easeOut",
          syncLane: false,
          trajectoryId: "rb-first-touch",
          releaseLocal: 0,
          arrivalLocal: 0.18,
        },
        { kind: "possession", holderId: "opp.rb" },
        move(
          "opp.rb",
          { x: 80.15, y: 15.75 },
          "easeOut",
          undefined,
          o(mirrorDeg(212), "closed", {
            visionTarget: { type: "teammate", playerId: "opp.8" },
            receivingFoot: "left",
            nextActionIntent: "play-forward",
          }),
        ),
        move(
          "us.LW",
          { x: 44.2, y: 20.9 },
          "easeInOut",
          undefined,
          o(angleToward({ x: 44.2, y: 20.9 }, OPP8), "half-open-left", {
            visionTarget: { type: "opponent", playerId: "opp.8" },
            nextActionIntent: "press",
            prePassScan: true,
          }),
        ),
        move(
          "us.L6",
          { x: 43.2, y: 37.6 },
          "easeInOut",
          undefined,
          o(mirrorDeg(18), "half-open", {
            visionTarget: { type: "opponent", playerId: "opp.8" },
            nextActionIntent: "cover",
          }),
        ),
        move(
          "us.R6",
          { x: 42, y: 53 },
          "easeInOut",
          undefined,
          o(mirrorDeg(12), "half-open", { visionTarget: { type: "ball" }, nextActionIntent: "cover" }),
        ),
        move(
          "us.LB",
          { x: 33.5, y: 21 },
          "easeInOut",
          undefined,
          o(mirrorDeg(-4), "side-on", { visionTarget: { type: "ball" }, nextActionIntent: "cover" }),
        ),
        move(
          "opp.8",
          { x: 64.2, y: 31.8 },
          "easeInOut",
          undefined,
          o(mirrorDeg(195), "open", {
            visionTarget: { type: "ball" },
            nextActionIntent: "play-forward",
          }),
        ),
      ],
      {
        teachingPoint: "Eerste aanname — binnen nog open",
        zoom: 1.26,
        follow: ["opp.rb", "us.LW", "opp.8", "us.L6"],
        orientations: castOrient({
          "opp.rb": o(mirrorDeg(212), "closed", {
            visionTarget: { type: "teammate", playerId: "opp.8" },
            receivingFoot: "left",
            nextActionIntent: "play-forward",
          }),
          "us.LW": o(angleToward({ x: 44.2, y: 20.9 }, OPP8), "half-open-left", {
            visionTarget: { type: "opponent", playerId: "opp.8" },
            nextActionIntent: "press",
            prePassScan: true,
          }),
          "us.L6": o(mirrorDeg(18), "half-open", {
            visionTarget: { type: "opponent", playerId: "opp.8" },
            nextActionIntent: "cover",
          }),
          "opp.8": o(mirrorDeg(195), "open", {
            visionTarget: { type: "ball" },
            nextActionIntent: "play-forward",
          }),
        }),
      },
    ),

    step(
      "t3-freeze",
      DS02_SEEKS.t3,
      t3dur,
      "BESLIS",
      [
        { kind: "phase", phase: "recognition" },
        { kind: "highlight", playerIds: ["us.LW", "opp.rb", "opp.8"] },
        {
          kind: "setZones",
          zones: [
            {
              x: 63,
              y: 20,
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
        { kind: "possession", holderId: "opp.rb" },
        // Breath only — curve NOT started
        move(
          "us.LW",
          { x: 44.4, y: 20.85 },
          "linear",
          undefined,
          o(angleToward({ x: 44.4, y: 20.85 }, OPP8), "half-open-left", {
            visionTarget: { type: "opponent", playerId: "opp.8" },
            nextActionIntent: "press",
            prePassScan: true,
          }),
        ),
        { kind: "hold" },
      ],
      {
        teachingPoint: "Welke lijn is open, gespiegeld links?",
        zoom: 1.28,
        follow: ["us.LW", "opp.rb", "opp.8", "us.L6"],
        orientations: castOrient({
          "opp.rb": o(mirrorDeg(214), "closed", {
            visionTarget: { type: "teammate", playerId: "opp.8" },
            receivingFoot: "left",
            nextActionIntent: "play-forward",
          }),
          "us.LW": o(angleToward({ x: 44.4, y: 20.85 }, OPP8), "half-open-left", {
            visionTarget: { type: "opponent", playerId: "opp.8" },
            nextActionIntent: "press",
            prePassScan: true,
          }),
          "us.L6": o(mirrorDeg(20), "half-open", {
            visionTarget: { type: "opponent", playerId: "opp.8" },
            nextActionIntent: "cover",
          }),
          "us.R6": o(mirrorDeg(14), "half-open", {
            visionTarget: { type: "ball" },
            nextActionIntent: "cover",
          }),
          "us.LB": o(mirrorDeg(-2), "side-on", {
            visionTarget: { type: "ball" },
            nextActionIntent: "cover",
          }),
          "opp.8": o(mirrorDeg(192), "open", {
            visionTarget: { type: "ball" },
            nextActionIntent: "play-forward",
          }),
        }),
      },
    ),
  ];
}

export const DS02_ANIM_LIVE: TacticalAnimationDefinition = {
  id: `anim.${IDS.live}`,
  situationId: IDS.live,
  complexity: "pattern",
  durationMs: DS02_SEEKS.liveEnd,
  pauseAtStartMs: 0,
  pauseAtEndMs: 2600,
  defaultPlaybackRate: 1,
  autoplay: true,
  loop: false,
  positioningMode: "authored",
  steps: buildPrelude(DS02_SEEKS.liveEnd),
};

export const DS02_ANIM_GOOD: TacticalAnimationDefinition = {
  id: `anim.${IDS.good}`,
  situationId: IDS.good,
  complexity: "pattern",
  durationMs: DS02_SEEKS.end,
  pauseAtStartMs: 0,
  pauseAtEndMs: 2200,
  defaultPlaybackRate: 1,
  autoplay: true,
  loop: false,
  positioningMode: "authored",
  steps: [
    ...buildPrelude(DS02_SEEKS.t4),
    step(
      "t4-curve",
      DS02_SEEKS.t4,
      DS02_SEEKS.t5 - DS02_SEEKS.t4,
      "BINNEN DICHT",
      [
        { kind: "phase", phase: "action" },
        { kind: "highlight", playerIds: ["us.LW"] },
        { kind: "setZones", zones: [] },
        // Accelerate on curve — inside cut first, toward centre
        move(
          "us.LW",
          flipY({ x: 66, y: 78 }),
          "easeOut",
          LW_ARC.slice(0, Math.max(1, LW_ARC.length - 1)),
          o(angleToward(flipY({ x: 66, y: 78 }), OPP_RB), "side-on", {
            visionTarget: { type: "ball" },
            nextActionIntent: "press",
          }),
        ),
        // 8 starts later — not teleport sync
        move(
          "us.L6",
          { x: 50, y: 36 },
          "easeInOut",
          undefined,
          o(mirrorDeg(22), "half-open", {
            visionTarget: { type: "opponent", playerId: "opp.8" },
            nextActionIntent: "cover",
          }),
        ),
        move("us.LB", { x: 46, y: 24.5 }, "easeInOut"),
        {
          kind: "setLines",
          lines: [{ kind: "press", from: flipY({ x: 66, y: 78 }), to: BALL_SETTLE }],
        },
        { kind: "possession", holderId: "opp.rb" },
      ],
      {
        teachingPoint: "Eerst de lijn, gespiegeld",
        zoom: 1.26,
        follow: ["us.LW", "opp.rb", "opp.8", "us.L6"],
      },
    ),
    step(
      "t5-connect",
      DS02_SEEKS.t5,
      DS02_SEEKS.t6 - DS02_SEEKS.t5,
      "TEAM",
      [
        { kind: "phase", phase: "follow" },
        { kind: "highlight", playerIds: ["us.LW", "us.L6", "us.R6", "us.LB"] },
        move(
          "us.LW",
          flipY({ x: 71.2, y: 80.5 }),
          "easeIn",
          undefined,
          o(angleToward(flipY({ x: 71.2, y: 80.5 }), OPP_RB), "side-on", {
            visionTarget: { type: "ball" },
            nextActionIntent: "press",
          }),
        ),
        move(
          "us.L6",
          G.L6,
          "easeInOut",
          undefined,
          o(mirrorDeg(28), "half-open", {
            visionTarget: { type: "opponent", playerId: "opp.8" },
            nextActionIntent: "cover",
          }),
        ),
        move(
          "us.R6",
          G.R6,
          "easeInOut",
          undefined,
          o(mirrorDeg(18), "half-open", { visionTarget: { type: "ball" }, nextActionIntent: "cover" }),
        ),
        move(
          "us.LB",
          G.LB,
          "easeInOut",
          undefined,
          o(mirrorDeg(-6), "side-on", { visionTarget: { type: "ball" }, nextActionIntent: "cover" }),
        ),
        move("us.LCV", G.LCV, "easeInOut"),
        move("us.RCV", { x: 31, y: 57 }, "easeOut"),
        move("us.RB", G.RB, "easeOut"),
        move("us.RW", G.RW, "easeOut"),
        move("us.10", G["10"], "easeInOut"),
        move("us.SP", G.SP, "easeInOut"),
        move("opp.8", { x: 61.5, y: 29.5 }, "easeOut"),
        move(
          "opp.rb",
          { x: 82.2, y: 13.8 },
          "easeIn",
          undefined,
          o(mirrorDeg(235), "closed", {
            visionTarget: { type: "teammate", playerId: "opp.cbR" },
            nextActionIntent: "recycle",
            receivingFoot: "left",
          }),
        ),
        {
          kind: "setLines",
          lines: [
            { kind: "press", from: flipY({ x: 71.2, y: 80.5 }), to: { x: 82.2, y: 13.8 } },
            { kind: "press", from: G.L6, to: { x: 61.5, y: 29.5 }, dashed: true },
          ],
        },
        {
          kind: "setZones",
          zones: [
            {
              x: 64,
              y: 18,
              w: 14,
              h: 12,
              kind: "cover-shadow",
              label: "",
              geometry: {
                type: "taper-shadow",
                apex: { x: 70, y: 20 },
                dirDeg: 38,
                nearWidth: 2.2,
                farWidth: 9,
                length: 12,
              },
            },
          ],
        },
        { kind: "possession", holderId: "opp.rb" },
      ],
      {
        teachingPoint: "8 dekt — lijn dicht, links",
        zoom: 1.22,
        follow: ["us.LW", "us.L6", "opp.rb", "us.LB", "us.10"],
      },
    ),
    step(
      "t6-recycle",
      DS02_SEEKS.t6,
      DS02_SEEKS.t7 - DS02_SEEKS.t6,
      "GEVOLG",
      [
        { kind: "phase", phase: "result" },
        { kind: "highlight", playerIds: ["us.LW", "us.L6", "opp.cbR"] },
        {
          kind: "ballMove",
          from: { x: 82.2, y: 13.8 },
          to: flipY(PRESS_V2_GOOD_BALL_RESULT),
          easing: "easeOut",
          syncLane: true,
          trajectoryId: "rb-recycle",
          passerId: "opp.rb",
          laneStatus: "pass",
          releaseLocal: 0.16,
          arrivalLocal: 0.8,
        },
        { kind: "possession", holderId: null },
        move("opp.cbR", flipY(PRESS_V2_GOOD_BALL_RESULT), "easeOut"),
        { kind: "possession", holderId: "opp.cbR" },
        { kind: "setZones", zones: [] },
      ],
      {
        teachingPoint: "Alleen terug of wijd",
        zoom: 1.18,
        follow: ["us.LW", "opp.cbR", "us.L6", "opp.rb"],
      },
    ),
    step(
      "t7-hold",
      DS02_SEEKS.t7,
      DS02_SEEKS.end - DS02_SEEKS.t7,
      "DICHT",
      [
        { kind: "phase", phase: "result" },
        { kind: "highlight", playerIds: ["us.LW", "us.L6", "us.R6", "us.LB"] },
        { kind: "possession", holderId: "opp.cbR" },
        {
          kind: "setLines",
          lines: [
            { kind: "press", from: flipY({ x: 71.2, y: 80.5 }), to: { x: 82.2, y: 13.8 }, dashed: true },
            { kind: "press", from: G.L6, to: { x: 61.5, y: 29.5 }, dashed: true },
          ],
        },
        { kind: "hold" },
      ],
      {
        teachingPoint: "Binnenkant dicht, links",
        zoom: 1.16,
        follow: ["us.LW", "us.L6", "us.LB", "opp.cbR"],
      },
    ),
  ],
};

export const DS02_ANIM_BAD: TacticalAnimationDefinition = {
  id: `anim.${IDS.bad}`,
  situationId: IDS.bad,
  complexity: "pattern",
  durationMs: DS02_SEEKS.t7,
  pauseAtStartMs: 0,
  pauseAtEndMs: 2200,
  defaultPlaybackRate: 1,
  autoplay: true,
  loop: false,
  positioningMode: "authored",
  steps: [
    ...buildPrelude(DS02_SEEKS.t4),
    step(
      "t4-straight",
      DS02_SEEKS.t4,
      DS02_SEEKS.t5 - DS02_SEEKS.t4,
      "RECHT OP BAL",
      [
        { kind: "phase", phase: "action" },
        { kind: "highlight", playerIds: ["us.LW", "opp.8"] },
        {
          kind: "setZones",
          zones: [
            {
              x: 63,
              y: 20,
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
          "us.LW",
          B.LW,
          "easeOut",
          LW_STRAIGHT_VIA,
          o(angleToward(B.LW, OPP_RB), "closed", {
            visionTarget: { type: "ball" },
            nextActionIntent: "press",
          }),
        ),
        move("us.L6", { x: 42, y: 37.5 }, "easeInOut"),
        move("us.R6", { x: 41, y: 53 }, "easeInOut"),
        move("us.LB", { x: 34, y: 21 }, "easeInOut"),
        move(
          "opp.8",
          { x: 65, y: 33 },
          "easeOut",
          undefined,
          o(mirrorDeg(185), "open", {
            visionTarget: { type: "ball" },
            nextActionIntent: "play-forward",
          }),
        ),
        {
          kind: "setLines",
          lines: [
            { kind: "fault", from: { x: 44, y: 21 }, to: BALL_SETTLE, dashed: true },
            { kind: "fault", from: BALL_SETTLE, to: { x: 65, y: 33 }, dashed: true },
          ],
        },
        { kind: "possession", holderId: "opp.rb" },
      ],
      {
        teachingPoint: "Lijn blijft open",
        zoom: 1.26,
        follow: ["us.LW", "opp.rb", "opp.8"],
      },
    ),
    step(
      "t5-inside",
      DS02_SEEKS.t5,
      DS02_SEEKS.t6 - DS02_SEEKS.t5,
      "BINNEN OPEN",
      [
        { kind: "phase", phase: "reaction" },
        { kind: "highlight", playerIds: ["opp.8", "us.LW"] },
        {
          kind: "ballMove",
          from: BALL_SETTLE,
          to: flipY(PRESS_V2_BAD_BALL_RESULT),
          easing: "easeOut",
          syncLane: true,
          trajectoryId: "rb-inside",
          passerId: "opp.rb",
          laneStatus: "fault",
          releaseLocal: 0.14,
          arrivalLocal: 0.74,
        },
        { kind: "possession", holderId: null },
        move(
          "opp.8",
          flipY(PRESS_V2_BAD_BALL_RESULT),
          "easeOut",
          undefined,
          o(mirrorDeg(178), "open", {
            visionTarget: { type: "ball" },
            nextActionIntent: "play-forward",
            receivingFoot: "left",
          }),
        ),
        move("us.LW", { x: 73, y: 17 }, "easeIn"),
        move("us.L6", B.L6, "easeInOut"),
        { kind: "possession", holderId: "opp.8" },
        {
          kind: "setZones",
          zones: [
            {
              x: 58,
              y: 26,
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
        teachingPoint: "Hun 8 is vrij, links",
        zoom: 1.22,
        follow: ["opp.8", "us.LW", "opp.rb"],
      },
    ),
    step(
      "t6-broken",
      DS02_SEEKS.t6,
      DS02_SEEKS.t7 - DS02_SEEKS.t6,
      "PRESS WEG",
      [
        { kind: "phase", phase: "result" },
        { kind: "highlight", playerIds: ["opp.8", "us.LW"] },
        { kind: "possession", holderId: "opp.8" },
        { kind: "setLines", lines: [] },
        { kind: "hold" },
      ],
      {
        teachingPoint: "Press breekt",
        zoom: 1.16,
        follow: ["opp.8", "us.LW", "us.L6"],
      },
    ),
  ],
};

export const DS02_BUNDLE = {
  sessionId: SESSION_ID,
  slug: SLUG,
  freezeMs: DS02_SEEKS.freeze,
  previewMs: DS02_SEEKS.previewOpening,
  activeRole: "us.LW",
  mobileFocusIds: ["us.LW", "us.L6", "us.LB", "us.10"],
  situations: {
    [IDS.live]: DS02_SITUATION,
    [IDS.good]: DS02_SITUATION_GOOD,
    [IDS.bad]: DS02_SITUATION_BAD,
  } as Record<string, TacticalSituationDefinition>,
  animations: {
    [IDS.live]: DS02_ANIM_LIVE,
    [IDS.good]: DS02_ANIM_GOOD,
    [IDS.bad]: DS02_ANIM_BAD,
  } as Record<string, TacticalAnimationDefinition>,
};
