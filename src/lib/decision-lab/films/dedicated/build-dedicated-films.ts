/**
 * Dedicated session film builder — LessonFilmSpec → compiled animations.
 * Each session gets unique situation IDs (no generic press-good fallback).
 */

import { compileFilm } from "@/lib/academie/tactical-engine";
import type { LessonFilmSpec, LessonFilmPhase } from "@/lib/academie/tactical-engine/types";
import type { TacticalAnimationDefinition } from "@/lib/academie/tactical-animation-types";
import {
  PRESS_V2_US_START,
  PRESS_V2_OPP_START,
  PRESS_V2_GOOD_US_END,
  PRESS_V2_BAD_US_END,
  PRESS_V2_GOOD_BALL_RESULT,
  PRESS_V2_BAD_BALL_RESULT,
  pressV2UsMarkers,
} from "@/lib/academie/tactical-press-reference-v2";
import {
  FORMATION_4231_US,
  ballAtReceivingFoot,
  usPlayersFromFormation,
  type TacticalOurPosition,
  type TacticalPoint,
  type TacticalPlayerMarker,
  type TacticalSituationDefinition,
} from "@/lib/academie/tactical-visual-system";
import {
  DEDICATED_FREEZE_MS,
  DEDICATED_SESSION_FILM_DEFS,
  filmIdsForSlug,
  type DedicatedFilmDef,
} from "@/lib/decision-lab/films/dedicated/ids";
import { getPressBatchABundle } from "@/lib/decision-lab/films/press-batch-a";

function flipY(p: TacticalPoint): TacticalPoint {
  return { x: p.x, y: 100 - p.y };
}

function flipFormation(
  f: Record<TacticalOurPosition, TacticalPoint>,
): Record<TacticalOurPosition, TacticalPoint> {
  // Mirror across horizontal midfield; keep role identities by swapping flank pairs.
  const flipped = {} as Record<TacticalOurPosition, TacticalPoint>;
  for (const key of Object.keys(f) as TacticalOurPosition[]) {
    flipped[key] = flipY(f[key]);
  }
  const swapPair = (a: TacticalOurPosition, b: TacticalOurPosition) => {
    const tmp = flipped[a];
    flipped[a] = flipped[b];
    flipped[b] = tmp;
  };
  swapPair("LB", "RB");
  swapPair("LCV", "RCV");
  swapPair("L6", "R6");
  swapPair("LW", "RW");
  return flipped;
}

function flipOpp(markers: TacticalPlayerMarker[]): TacticalPlayerMarker[] {
  const labelSwap: Record<string, string> = {
    LB: "RB",
    RB: "LB",
    LCB: "RCB",
    RCB: "LCB",
    LW: "RW",
    RW: "LW",
  };
  return markers.map((p) => {
    const raw = p.id.replace("opp.", "");
    let newId = p.id;
    let label = p.label;
    if (raw === "lb") {
      newId = "opp.rb";
      label = "RB";
    } else if (raw === "rb") {
      newId = "opp.lb";
      label = "LB";
    } else if (raw === "cbL") {
      newId = "opp.cbR";
      label = "RCB";
    } else if (raw === "cbR") {
      newId = "opp.cbL";
      label = "LCB";
    } else if (raw === "lw") {
      newId = "opp.rw";
      label = "RW";
    } else if (raw === "rw") {
      newId = "opp.lw";
      label = "LW";
    } else if (labelSwap[p.label]) {
      label = labelSwap[p.label]!;
    }
    return { ...p, id: newId, label, at: flipY(p.at), hasBall: p.hasBall };
  });
}

const CBL = { x: 82, y: 60 };
const LB = { x: 80, y: 84 };
const OPP8 = { x: 64, y: 68 };

function pressStartSituation(
  id: string,
  title: string,
  subtitle: string,
  mirror: boolean,
  ballHolder: string,
): TacticalSituationDefinition {
  const us = mirror ? flipFormation(PRESS_V2_US_START) : PRESS_V2_US_START;
  const opp = mirror ? flipOpp(PRESS_V2_OPP_START) : PRESS_V2_OPP_START;
  const holderAt = opp.find((p) => p.id === ballHolder)?.at ?? (mirror ? flipY(CBL) : CBL);
  return {
    id: id as TacticalSituationDefinition["id"],
    eyebrow: "SITUATIE",
    title,
    subtitle,
    homeShape: { formation: "4-4-2", phase: "high-press", direction: "left-to-right" },
    opponentShape: { formation: "4-2-3-1", phase: "build-up", direction: "right-to-left" },
    players: [
      ...pressV2UsMarkers(us),
      ...opp.map((p) => ({ ...p, hasBall: p.id === ballHolder })),
    ],
    ball: ballAtReceivingFoot(holderAt, { foot: "right", facingDeg: mirror ? -12 : 12 }),
    lines: [],
    zones: [],
  };
}

function buildupStartSituation(
  id: string,
  title: string,
  subtitle: string,
  ballHolder: TacticalOurPosition,
): TacticalSituationDefinition {
  const us = usPlayersFromFormation(FORMATION_4231_US, ballHolder);
  const opp = PRESS_V2_OPP_START.map((p) => ({
    ...p,
    at: { x: Math.min(96, p.at.x + 4), y: p.at.y },
    hasBall: false,
  }));
  return {
    id: id as TacticalSituationDefinition["id"],
    eyebrow: "SITUATIE",
    title,
    subtitle,
    homeShape: { formation: "4-2-3-1", phase: "build-up", direction: "left-to-right" },
    opponentShape: { formation: "4-4-2", phase: "high-press", direction: "right-to-left" },
    players: [...us, ...opp],
    ball: ballAtReceivingFoot(FORMATION_4231_US[ballHolder], { foot: "right", facingDeg: 0 }),
    lines: [],
    zones: [],
  };
}

/** Final third / flank: attack L→R from advanced 4-2-3-1 occupation. */
function finalThirdStartSituation(
  id: string,
  title: string,
  subtitle: string,
  family: DedicatedFilmDef["family"],
): TacticalSituationDefinition {
  const usFormation = {} as Record<TacticalOurPosition, TacticalPoint>;
  for (const k of Object.keys(FORMATION_4231_US) as TacticalOurPosition[]) {
    usFormation[k] = {
      x: Math.min(92, FORMATION_4231_US[k].x + 18),
      y: FORMATION_4231_US[k].y,
    };
  }
  usFormation.GK = { x: 28, y: 50 };
  usFormation.LB = { x: 48, y: 24 };
  usFormation.LCV = { x: 50, y: 40 };
  usFormation.RCV = { x: 50, y: 60 };
  usFormation.RB = { x: 48, y: 76 };

  const wingBall = { x: 78, y: 88 };
  const holder: TacticalOurPosition | undefined = family === "flank-1v1" ? undefined : "RW";
  const us = usPlayersFromFormation(usFormation, holder);

  const oppBase: TacticalPlayerMarker[] = [
    { id: "opp.gk", team: "opponent", label: "GK", at: { x: 94, y: 50 } },
    { id: "opp.cbL", team: "opponent", label: "LCB", at: { x: 88, y: 40 } },
    { id: "opp.cbR", team: "opponent", label: "RCB", at: { x: 88, y: 60 } },
    { id: "opp.lb", team: "opponent", label: "LB", at: { x: 84, y: 22 } },
    { id: "opp.rb", team: "opponent", label: "RB", at: { x: 84, y: 78 } },
    { id: "opp.6", team: "opponent", label: "6", at: { x: 78, y: 48 } },
    { id: "opp.8", team: "opponent", label: "8", at: { x: 76, y: 62 } },
    { id: "opp.lw", team: "opponent", label: "LW", at: { x: 72, y: 88 }, hasBall: family === "flank-1v1" },
    { id: "opp.rw", team: "opponent", label: "RW", at: { x: 72, y: 18 } },
    { id: "opp.st", team: "opponent", label: "ST", at: { x: 70, y: 50 } },
    { id: "opp.10", team: "opponent", label: "10", at: { x: 74, y: 52 } },
  ];

  return {
    id: id as TacticalSituationDefinition["id"],
    eyebrow: "SITUATIE",
    title,
    subtitle,
    homeShape: {
      formation: "4-2-3-1",
      phase: family === "flank-1v1" ? "mid-block" : "final-third",
      direction: "left-to-right",
    },
    opponentShape: { formation: "4-4-2", phase: "low-block", direction: "right-to-left" },
    players: [...us, ...oppBase],
    ball: ballAtReceivingFoot(family === "flank-1v1" ? wingBall : usFormation.RW, {
      foot: "right",
      facingDeg: family === "flank-1v1" ? -20 : 10,
    }),
    lines: [],
    zones: [],
  };
}

function phasesPressFamily(def: DedicatedFilmDef, branch: "live" | "good" | "bad"): LessonFilmPhase[] {
  const mirror = def.family === "press-mirror" || def.family === "press-farside";
  const us = mirror ? flipFormation(PRESS_V2_US_START) : PRESS_V2_US_START;
  const good = mirror ? flipFormation(PRESS_V2_GOOD_US_END) : PRESS_V2_GOOD_US_END;
  const bad = mirror ? flipFormation(PRESS_V2_BAD_US_END) : PRESS_V2_BAD_US_END;
  const ballStart = mirror ? flipY(CBL) : CBL;
  const ballLb = mirror ? flipY(LB) : LB;
  const ballOpp8 = mirror ? flipY(OPP8) : OPP8;
  const ballGood = mirror ? flipY(PRESS_V2_GOOD_BALL_RESULT) : PRESS_V2_GOOD_BALL_RESULT;
  const ballBad = mirror ? flipY(PRESS_V2_BAD_BALL_RESULT) : PRESS_V2_BAD_BALL_RESULT;
  const firstPress = def.activeRole;
  // For second-press family, RW still presses but decision is R6
  const moverId =
    def.family === "press-second"
      ? "us.R6"
      : def.family === "press-depth"
        ? "us.RB"
        : def.family === "press-steer"
          ? "us.SP"
          : firstPress;

  const oppCb = mirror ? "opp.cbR" : "opp.cbL";
  const oppLb = mirror ? "opp.rb" : "opp.lb";
  const opp8 = "opp.8";

  const setup: LessonFilmPhase[] = [
    {
      id: "setup",
      title: "Situatie",
      startMs: 0,
      durationMs: 1600,
      statusLabel: "Situatie",
      teachingPoint: "Vanuit onze 4-2-3-1 naar pressbezetting",
      phase: "initial",
      highlightPlayerIds: [oppCb, firstPress],
      camera: { preset: "press-detail", followPlayerIds: [oppCb, oppLb, firstPress, "us.R6"], maxZoomHint: 1.12 },
      freezeMs: 200,
    },
    {
      id: "trigger",
      title: "Trigger",
      startMs: 1800,
      durationMs: 2200,
      statusLabel: "Scan",
      teachingPoint: "Bal gaat naar hun back",
      phase: "recognition",
      ball: {
        id: "wide-pass",
        start: ballStart,
        end: ballLb,
        passerId: oppCb,
        receiverId: oppLb,
        receiveHolderId: oppLb,
        releaseTimeMs: 2000,
        arrivalTimeMs: 3600,
        firstTouchSettleMs: 280,
        path: "quadratic",
        via: [{ x: (ballStart.x + ballLb.x) / 2, y: (ballStart.y + ballLb.y) / 2 - 2 }],
      },
      highlightPlayerIds: [oppLb, firstPress, ...def.supportRoles.slice(0, 2)],
      camera: { preset: "press-detail", followPlayerIds: [oppLb, firstPress, "us.R6", opp8], maxZoomHint: 1.2 },
      players: [
        {
          playerId: firstPress,
          to: { x: us[roleKey(firstPress)].x + 4, y: us[roleKey(firstPress)].y },
          acceleration: "jog",
        },
      ],
    },
    {
      id: "freeze",
      title: "Beslis",
      startMs: 4200,
      durationMs: 800,
      statusLabel: "Wat kies jij?",
      teachingPoint: "Beslismoment — nog geen antwoord",
      phase: "prepare",
      isTrigger: true,
      freezeMs: DEDICATED_FREEZE_MS - 4200,
      highlightPlayerIds: [firstPress, moverId, oppLb, opp8],
      zones: [
        {
          x: Math.min(ballLb.x, ballOpp8.x) - 4,
          y: Math.min(ballLb.y, ballOpp8.y) - 4,
          w: 18,
          h: 16,
          label: "Risico",
          kind: "risk",
        },
      ],
      lines: [
        {
          kind: "pass",
          from: ballLb,
          to: ballOpp8,
          dashed: true,
          opacity: 0.45,
        },
      ],
      camera: {
        preset: "press-detail",
        followPlayerIds: [oppLb, firstPress, moverId, opp8, "us.RB"],
        maxZoomHint: 1.24,
      },
    },
  ];

  if (branch === "live") return setup;

  const endUs = branch === "good" ? good : bad;
  const endBall = branch === "good" ? ballGood : ballBad;

  return [
    ...setup,
    {
      id: "execute",
      title: branch === "good" ? "Goede keuze" : "Foute keuze",
      startMs: DEDICATED_FREEZE_MS + 200,
      durationMs: 2400,
      statusLabel: branch === "good" ? "Uitvoering" : "Fout gevolg",
      teachingPoint: branch === "good" ? "Prioriteit klopt" : "Lijn blijft open",
      phase: "action",
      highlightPlayerIds: [moverId, oppLb, opp8],
      players: (Object.keys(endUs) as TacticalOurPosition[])
        .filter((k) => {
          const a = us[k];
          const b = endUs[k];
          return Math.hypot(a.x - b.x, a.y - b.y) > 1.5;
        })
        .map((k) => ({
          playerId: `us.${k}`,
          to: endUs[k],
          acceleration: k === roleKey(moverId) ? ("accelerate" as const) : ("jog" as const),
        })),
      camera: { preset: "press-detail", followPlayerIds: [moverId, oppLb, opp8], maxZoomHint: 1.2 },
    },
    {
      id: "consequence",
      title: "Gevolg",
      startMs: DEDICATED_FREEZE_MS + 2800,
      durationMs: 2200,
      statusLabel: "Gevolg",
      teachingPoint: branch === "good" ? "Bal moet terug of wijd" : "Binnenoptie speelt door",
      phase: "result",
      ball:
        branch === "good"
          ? {
              id: "recycle",
              start: ballLb,
              end: endBall,
              passerId: oppLb,
              receiverId: oppCb,
              receiveHolderId: oppCb,
              releaseTimeMs: DEDICATED_FREEZE_MS + 3000,
              arrivalTimeMs: DEDICATED_FREEZE_MS + 4200,
              path: "quadratic",
            }
          : {
              id: "inside",
              start: ballLb,
              end: endBall,
              passerId: oppLb,
              receiverId: opp8,
              receiveHolderId: opp8,
              releaseTimeMs: DEDICATED_FREEZE_MS + 3000,
              arrivalTimeMs: DEDICATED_FREEZE_MS + 4000,
              path: "linear",
              status: "open",
            },
      lines:
        branch === "bad"
          ? [{ kind: "pass", from: ballLb, to: endBall, opacity: 0.85 }]
          : [{ kind: "pass", from: ballLb, to: endBall, opacity: 0.7 }],
      camera: { preset: "press-detail", followPlayerIds: [oppLb, moverId, opp8], maxZoomHint: 1.18 },
      freezeMs: 800,
    },
  ];
}

function roleKey(playerId: string): TacticalOurPosition {
  return playerId.replace("us.", "") as TacticalOurPosition;
}

function phasesTransition(def: DedicatedFilmDef, branch: "live" | "good" | "bad"): LessonFilmPhase[] {
  const us = PRESS_V2_US_START;
  const lossAt = { x: 48, y: 58 };
  const setup: LessonFilmPhase[] = [
    {
      id: "setup",
      title: "Situatie",
      startMs: 0,
      durationMs: 1400,
      statusLabel: "Situatie",
      teachingPoint: "Wij in 4-2-3-1 — balmoment verandert",
      phase: "initial",
      highlightPlayerIds: [def.activeRole, "us.10"],
      camera: { preset: "transition", followPlayerIds: [def.activeRole, "us.RW", "us.R6"], maxZoomHint: 1.1 },
    },
    {
      id: "trigger",
      title: "Trigger",
      startMs: 1500,
      durationMs: 2000,
      statusLabel: "Scan",
      teachingPoint:
        def.family === "transition-counter"
          ? "Balverlies — wie is dichtstbij?"
          : def.family === "transition-rest"
            ? "Je bent geslagen — herstel de lijn"
            : "Bal teruggewonnen — eerste pass",
      phase: "recognition",
      highlightPlayerIds: [def.activeRole, ...def.supportRoles],
      ball: {
        id: "loose",
        start: { x: 52, y: 50 },
        end: lossAt,
        passerId: "us.10",
        receiverId: def.family === "transition-firstpass" ? def.activeRole : "opp.8",
        receiveHolderId: def.family === "transition-firstpass" ? def.activeRole : "opp.8",
        releaseTimeMs: 1700,
        arrivalTimeMs: 3100,
        path: "linear",
      },
      camera: { preset: "transition", followPlayerIds: [def.activeRole, "opp.8", "us.RB"], maxZoomHint: 1.2 },
    },
    {
      id: "freeze",
      title: "Beslis",
      startMs: 3700,
      durationMs: 900,
      statusLabel: "Wat kies jij?",
      teachingPoint: "Beslismoment",
      phase: "prepare",
      isTrigger: true,
      freezeMs: DEDICATED_FREEZE_MS - 3700,
      highlightPlayerIds: [def.activeRole, ...def.supportRoles.slice(0, 2)],
      camera: { preset: "press-detail", followPlayerIds: [def.activeRole, ...def.supportRoles], maxZoomHint: 1.22 },
    },
  ];
  if (branch === "live") return setup;
  const goodTo = { x: us[roleKey(def.activeRole)].x + 8, y: us[roleKey(def.activeRole)].y + 4 };
  const badTo = { x: us[roleKey(def.activeRole)].x - 2, y: us[roleKey(def.activeRole)].y - 6 };
  return [
    ...setup,
    {
      id: "execute",
      title: branch === "good" ? "Goede keuze" : "Foute keuze",
      startMs: DEDICATED_FREEZE_MS + 200,
      durationMs: 2600,
      statusLabel: "Gevolg",
      teachingPoint: branch === "good" ? "Team blijft compact" : "Ruimte ontstaat tegen ons",
      phase: "action",
      players: [
        {
          playerId: def.activeRole,
          to: branch === "good" ? goodTo : badTo,
          acceleration: branch === "good" ? "accelerate" : "walk-adjust",
        },
      ],
      highlightPlayerIds: [def.activeRole],
      camera: { preset: "transition", followPlayerIds: [def.activeRole, "us.RCV", "opp.st"], maxZoomHint: 1.15 },
      freezeMs: 600,
    },
  ];
}

function phasesBuildOrPossession(def: DedicatedFilmDef, branch: "live" | "good" | "bad"): LessonFilmPhase[] {
  const holder = roleKey(def.activeRole);
  const from = FORMATION_4231_US[holder];
  const forward = { x: Math.min(88, from.x + 14), y: from.y };
  const safe = { x: Math.max(18, from.x - 6), y: from.y + (holder.includes("L") ? 8 : -8) };
  const setup: LessonFilmPhase[] = [
    {
      id: "setup",
      title: "Situatie",
      startMs: 0,
      durationMs: 1500,
      statusLabel: "Situatie",
      teachingPoint: "Opbouw vanuit 4-2-3-1",
      phase: "initial",
      highlightPlayerIds: [def.activeRole],
      camera: { preset: "full-team-tactical", followPlayerIds: [def.activeRole, ...def.supportRoles], maxZoomHint: 1.05 },
    },
    {
      id: "scan",
      title: "Scan",
      startMs: 1600,
      durationMs: 2200,
      statusLabel: "Scan",
      teachingPoint: "Druk, lijn en vrije optie lezen",
      phase: "recognition",
      highlightPlayerIds: [def.activeRole, ...def.supportRoles],
      opponents: [{ playerId: "opp.st", to: { x: 58, y: 50 }, acceleration: "jog" }],
      camera: { preset: "overview", followPlayerIds: [def.activeRole, "opp.st", "us.R6"], maxZoomHint: 1.12 },
    },
    {
      id: "freeze",
      title: "Beslis",
      startMs: 4000,
      durationMs: 800,
      statusLabel: "Wat kies jij?",
      teachingPoint: "Beslismoment",
      phase: "prepare",
      isTrigger: true,
      freezeMs: DEDICATED_FREEZE_MS - 4000,
      highlightPlayerIds: [def.activeRole, ...def.supportRoles.slice(0, 2)],
      lines: [{ kind: "pass", from, to: forward, dashed: true, opacity: 0.4 }],
      camera: { preset: "overview", followPlayerIds: [def.activeRole, ...def.supportRoles], maxZoomHint: 1.15 },
    },
  ];
  if (branch === "live") return setup;
  const target = branch === "good" ? (def.family.includes("safe") ? safe : forward) : forward;
  return [
    ...setup,
    {
      id: "execute",
      title: "Gevolg",
      startMs: DEDICATED_FREEZE_MS + 200,
      durationMs: 2400,
      statusLabel: "Gevolg",
      teachingPoint: branch === "good" ? "Bal blijft speelbaar" : "Balverlies of stilstand",
      phase: "action",
      ball: {
        id: "choice-pass",
        start: from,
        end: target,
        passerId: def.activeRole,
        receiverId: branch === "good" ? def.supportRoles[0] : "opp.6",
        receiveHolderId: branch === "good" ? def.supportRoles[0] : "opp.6",
        releaseTimeMs: DEDICATED_FREEZE_MS + 400,
        arrivalTimeMs: DEDICATED_FREEZE_MS + 1600,
        path: "quadratic",
        status: branch === "good" ? "pressured" : "intercepted",
      },
      camera: { preset: "overview", followPlayerIds: [def.activeRole, def.supportRoles[0]!], maxZoomHint: 1.12 },
      freezeMs: 700,
    },
  ];
}

function phasesFlankFinal(def: DedicatedFilmDef, branch: "live" | "good" | "bad"): LessonFilmPhase[] {
  const wide = { x: 72, y: 86 };
  const setup: LessonFilmPhase[] = [
    {
      id: "setup",
      title: "Situatie",
      startMs: 0,
      durationMs: 1400,
      statusLabel: "Situatie",
      teachingPoint: "Flank / 16 — vanuit 4-2-3-1",
      phase: "initial",
      highlightPlayerIds: [def.activeRole],
      camera: { preset: "final-third", followPlayerIds: [def.activeRole, ...def.supportRoles], maxZoomHint: 1.15 },
    },
    {
      id: "trigger",
      title: "Trigger",
      startMs: 1500,
      durationMs: 2100,
      statusLabel: "Scan",
      teachingPoint: def.family === "flank-1v1" ? "1v1 op de flank" : "Voorzet komt — near post?",
      phase: "recognition",
      highlightPlayerIds: [def.activeRole, ...def.supportRoles],
      ball: {
        id: "service",
        start: { x: 60, y: 70 },
        end: wide,
        passerId: "us.RW",
        receiverId: def.family === "flank-1v1" ? "opp.lw" : def.activeRole,
        receiveHolderId: def.family === "flank-1v1" ? "opp.lw" : def.activeRole,
        releaseTimeMs: 1700,
        arrivalTimeMs: 3200,
        path: "quadratic",
      },
      camera: { preset: "final-third", followPlayerIds: [def.activeRole, "us.RW", "opp.cbL"], maxZoomHint: 1.22 },
    },
    {
      id: "freeze",
      title: "Beslis",
      startMs: 3800,
      durationMs: 900,
      statusLabel: "Wat kies jij?",
      teachingPoint: "Beslismoment",
      phase: "prepare",
      isTrigger: true,
      freezeMs: DEDICATED_FREEZE_MS - 3800,
      highlightPlayerIds: [def.activeRole, ...def.supportRoles.slice(0, 2)],
      camera: { preset: "final-third", followPlayerIds: [def.activeRole, ...def.supportRoles], maxZoomHint: 1.25 },
    },
  ];
  if (branch === "live") return setup;
  return [
    ...setup,
    {
      id: "execute",
      title: "Gevolg",
      startMs: DEDICATED_FREEZE_MS + 200,
      durationMs: 2500,
      statusLabel: "Gevolg",
      teachingPoint: branch === "good" ? "Juiste loop / stuurhoek" : "Verkeerde keuze — kans weg of 1v1 verloren",
      phase: "action",
      players: [
        {
          playerId: def.activeRole,
          to:
            branch === "good"
              ? { x: 78, y: def.family === "final-nearpost" ? 48 : 88 }
              : { x: 70, y: 55 },
          acceleration: "sprint",
        },
      ],
      camera: { preset: "final-third", followPlayerIds: [def.activeRole, "us.RW"], maxZoomHint: 1.2 },
      freezeMs: 600,
    },
  ];
}

function buildPhases(def: DedicatedFilmDef, branch: "live" | "good" | "bad"): LessonFilmPhase[] {
  if (def.family.startsWith("press-")) return phasesPressFamily(def, branch);
  if (def.family.startsWith("transition-")) return phasesTransition(def, branch);
  if (def.family.startsWith("build-") || def.family.startsWith("possession-")) {
    return phasesBuildOrPossession(def, branch);
  }
  return phasesFlankFinal(def, branch);
}

function buildSpec(def: DedicatedFilmDef, branch: "live" | "good" | "bad", situationId: string): LessonFilmSpec {
  const phases = buildPhases(def, branch);
  const last = phases[phases.length - 1]!;
  return {
    id: `${def.slug}-${branch}`,
    situationId,
    totalDurationMs: last.startMs + last.durationMs + (last.freezeMs ?? 0) + 400,
    pauseAtEndMs: branch === "live" ? 0 : 1200,
    autoplay: branch !== "live",
    loop: false,
    phases,
  };
}

function situationFor(def: DedicatedFilmDef, branch: "live" | "good" | "bad"): TacticalSituationDefinition {
  const ids = filmIdsForSlug(def.slug);
  const id = ids[branch];
  const mirror = def.family === "press-mirror" || def.family === "press-farside";
  const titles: Record<string, { title: string; subtitle: string }> = {
    live: {
      title: `${def.activeRole.replace("us.", "")} — beslismoment`,
      subtitle: "Vanuit 4-2-3-1 · blauw ZVV · aanval →",
    },
    good: { title: "Goede keuze", subtitle: "Zo werkt het principe" },
    bad: { title: "Foute keuze", subtitle: "Zo ontstaat het probleem" },
  };
  const t = titles[branch]!;

  if (def.family.startsWith("press-")) {
    const ballHolder = mirror ? "opp.cbR" : "opp.cbL";
    return pressStartSituation(id, t.title, t.subtitle, mirror, ballHolder);
  }
  if (def.family.startsWith("build-") || def.family.startsWith("possession-")) {
    return buildupStartSituation(id, t.title, t.subtitle, roleKey(def.activeRole));
  }
  if (def.family.startsWith("flank-") || def.family.startsWith("final-")) {
    return finalThirdStartSituation(id, t.title, t.subtitle, def.family);
  }
  // transition: press occupation start (balmoment in phases)
  return pressStartSituation(id, t.title, t.subtitle, false, "opp.cbL");
}

export type DedicatedFilmBundle = {
  def: DedicatedFilmDef;
  situations: Record<string, TacticalSituationDefinition>;
  animations: Record<string, TacticalAnimationDefinition>;
  freezeMs: number;
  previewMs: number;
  activeRole: string;
  mobileFocusIds: string[];
};

export function buildDedicatedFilmBundle(def: DedicatedFilmDef): DedicatedFilmBundle {
  // D-002: hand-authored pressing Batch A (#2–#9) overrides factory films.
  const authored = getPressBatchABundle(def.sessionId);
  if (authored) return authored;

  const ids = filmIdsForSlug(def.slug);
  const situations: Record<string, TacticalSituationDefinition> = {
    [ids.live]: situationFor(def, "live"),
    [ids.good]: situationFor(def, "good"),
    [ids.bad]: situationFor(def, "bad"),
  };
  const animations: Record<string, TacticalAnimationDefinition> = {
    [ids.live]: compileFilm(buildSpec(def, "live", ids.live)),
    [ids.good]: compileFilm(buildSpec(def, "good", ids.good)),
    [ids.bad]: compileFilm(buildSpec(def, "bad", ids.bad)),
  };
  return {
    def,
    situations,
    animations,
    freezeMs: DEDICATED_FREEZE_MS,
    previewMs: 2400,
    activeRole: def.activeRole,
    mobileFocusIds: [def.activeRole, ...def.supportRoles],
  };
}

export function buildAllDedicatedFilmBundles(): DedicatedFilmBundle[] {
  return DEDICATED_SESSION_FILM_DEFS.map(buildDedicatedFilmBundle);
}

let _cache: {
  situations: Record<string, TacticalSituationDefinition>;
  animations: Record<string, TacticalAnimationDefinition>;
  bySessionId: Record<string, DedicatedFilmBundle>;
} | null = null;

export function getDedicatedFilmRegistry() {
  if (_cache) return _cache;
  const situations: Record<string, TacticalSituationDefinition> = {};
  const animations: Record<string, TacticalAnimationDefinition> = {};
  const bySessionId: Record<string, DedicatedFilmBundle> = {};
  for (const bundle of buildAllDedicatedFilmBundles()) {
    Object.assign(situations, bundle.situations);
    Object.assign(animations, bundle.animations);
    bySessionId[bundle.def.sessionId] = bundle;
  }
  _cache = { situations, animations, bySessionId };
  return _cache;
}

export function getDedicatedBundleForSession(sessionId: string): DedicatedFilmBundle | undefined {
  return getDedicatedFilmRegistry().bySessionId[sessionId];
}

export function isDedicatedSituationId(id: string): boolean {
  return id.startsWith("fdl-ds-");
}
