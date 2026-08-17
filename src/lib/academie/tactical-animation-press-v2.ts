/**
 * Press-bad / press-good — Tactical Film Standard V2 teaching films.
 * Shared immutable start from PRESS_REFERENCE_START_STATE.
 * Principle delta: RW presses alone (bad) vs team connects (good).
 */

import {
  FORMATION_PRESS_BASE,
  PRESS_BALL,
  type TacticalLine,
  type TacticalPoint,
} from "@/lib/academie/tactical-visual-system";
import type {
  TacticalAnimationAction,
  TacticalAnimationDefinition,
  TacticalAnimationStep,
} from "@/lib/academie/tactical-animation-types";
import type { TacticalPhaseState } from "@/lib/academie/tactical-animation-v4-state";
import {
  PRESS_V2_BAD_US_END,
  PRESS_V2_GOOD_US_END,
  PRESS_V2_BAD_BALL_RESULT,
  PRESS_V2_GOOD_BALL_RESULT,
  PRESS_V2_SEEKS as PV2,
} from "@/lib/academie/tactical-press-reference-v2";
import { createPressingArc } from "@/lib/academie/tactical-animation-collision";

function animStep(
  id: string,
  startMs: number,
  durationMs: number,
  label: string,
  actions: TacticalAnimationStep["actions"],
  teachingPoint?: string,
  tacticalState?: TacticalPhaseState | Partial<TacticalPhaseState>,
): TacticalAnimationStep {
  return {
    id,
    startMs,
    durationMs,
    label,
    actions,
    teachingPoint,
    tacticalState: tacticalState as TacticalPhaseState | undefined,
  };
}

function buildAnimation(
  id: string,
  situationId: string,
  steps: TacticalAnimationStep[],
  opts?: Partial<Pick<TacticalAnimationDefinition, "pauseAtEndMs" | "complexity">>,
): TacticalAnimationDefinition {
  const last = steps.reduce((max, s) => Math.max(max, s.startMs + s.durationMs), 0);
  return {
    id,
    situationId,
    complexity: opts?.complexity ?? "situation",
    durationMs: last,
    pauseAtStartMs: 0,
    pauseAtEndMs: opts?.pauseAtEndMs ?? 2000,
    defaultPlaybackRate: 1,
    autoplay: true,
    loop: false,
    positioningMode: "generated",
    steps,
  };
}

function passBall(from: TacticalPoint, to: TacticalPoint): TacticalAnimationAction[] {
  return [
    { kind: "setLines", lines: [{ kind: "pass", from, to }] },
    { kind: "ballMove", from, to, easing: "easeOut" },
    { kind: "possession", holderId: null },
  ];
}

function receiveBall(holderId: string): TacticalAnimationAction {
  return { kind: "possession", holderId };
}

function movePlayer(
  playerId: string,
  to: TacticalPoint,
  easing: "easeOut" | "easeInOut" = "easeInOut",
  via?: TacticalPoint[],
): TacticalAnimationAction {
  return { kind: "playerMove", playerId, to, via, easing };
}

function showPassingLane(
  from: TacticalPoint,
  to: TacticalPoint,
  kind: TacticalLine["kind"] = "pass",
  dashed = true,
): TacticalAnimationAction {
  return { kind: "setLines", lines: [{ kind, from, to, dashed }] };
}

const HP = FORMATION_PRESS_BASE;
const G = PRESS_V2_GOOD_US_END;
const B = PRESS_V2_BAD_US_END;
const RW_ARC = createPressingArc(HP.RW, { x: 58, y: 78 }, G.RW, { bulge: 6 });

export const ANIM_PRESS_BAD = buildAnimation(
  "anim.press-bad",
  "press-bad",
  [
    animStep(
      "p0-start",
      0,
      PV2.trigger,
      "Start",
      [
        { kind: "phase", phase: "initial" },
        { kind: "highlight", playerIds: ["opp.lb", "us.RW"] },
        { kind: "hold" },
      ],
      "Zelfde start als GOED — compacte 4-4-2",
      {
        ballZone: "right-flank",
        possessionTeam: "opponent",
        defensiveBlock: "mid",
        lastLineHeight: 29,
        teamCompactness: { width: 36, length: 26 },
      },
    ),
    animStep(
      "p1-trigger",
      PV2.trigger,
      PV2.firstPress - PV2.trigger,
      "TRIGGER",
      [
        { kind: "phase", phase: "recognition" },
        { kind: "highlight", playerIds: ["opp.lb", "us.RW"] },
        showPassingLane(HP.RW, PRESS_BALL, "fault", true),
      ],
      "Trigger: de back ontvangt gesloten aan de zijlijn.",
      {
        ballZone: "right-flank",
        possessionTeam: "opponent",
        defensiveBlock: "mid",
        primaryPressurePlayerId: "us.RW",
        coverPlayerIds: [],
      },
    ),
    animStep(
      "p2-first-alone",
      PV2.firstPress,
      PV2.secondPress - PV2.firstPress,
      "Alleen jagen",
      [
        { kind: "phase", phase: "action" },
        movePlayer("us.RW", B.RW, "easeOut"),
        {
          kind: "setLines",
          lines: [{ kind: "fault", from: HP.RW, to: PRESS_BALL, dashed: true }],
        },
        { kind: "highlight", playerIds: ["us.RW"] },
        movePlayer("us.R6", B.R6),
        movePlayer("us.L6", B.L6),
        movePlayer("us.RB", B.RB),
      ],
      "RW zet druk — team sluit niet aan",
      {
        ballZone: "right-flank",
        possessionTeam: "opponent",
        defensiveBlock: "mid",
        primaryPressurePlayerId: "us.RW",
        coverPlayerIds: [],
      },
    ),
    animStep(
      "p3-open-inside",
      PV2.secondPress,
      PV2.result - PV2.secondPress,
      "Open binnenlijn",
      [
        { kind: "phase", phase: "reaction" },
        ...passBall(PRESS_BALL, PRESS_V2_BAD_BALL_RESULT),
        movePlayer("opp.8", PRESS_V2_BAD_BALL_RESULT, "easeOut"),
        {
          kind: "setLines",
          lines: [{ kind: "pass", from: PRESS_BALL, to: PRESS_V2_BAD_BALL_RESULT }],
        },
        { kind: "highlight", playerIds: ["opp.8", "us.RW"] },
      ],
      "RW zet druk, maar de binnenlijn blijft open.",
      {
        ballZone: "right-flank",
        possessionTeam: "opponent",
        defensiveBlock: "mid",
        primaryPressurePlayerId: "us.RW",
        coverPlayerIds: [],
        localNumbers: [{ zone: "central", us: 0, opponent: 1, note: "vrije 8" }],
      },
    ),
    animStep(
      "p4-result",
      PV2.result,
      PV2.endHold - PV2.result,
      "Gevolg",
      [
        { kind: "phase", phase: "result" },
        receiveBall("opp.8"),
        { kind: "highlight", playerIds: ["opp.8", "us.RW"] },
        { kind: "hold" },
      ],
      "Binnenlijn open — tegenstander speelt door",
      {
        ballZone: "middle-third",
        possessionTeam: "opponent",
        defensiveBlock: "mid",
        lastLineHeight: 29,
        teamCompactness: { width: 36, length: 28 },
      },
    ),
  ],
  { complexity: "situation", pauseAtEndMs: 2200 },
);

export const ANIM_PRESS_GOOD = buildAnimation(
  "anim.press-good",
  "press-good",
  [
    animStep(
      "p0-start",
      0,
      PV2.trigger,
      "Start",
      [
        { kind: "phase", phase: "initial" },
        { kind: "highlight", playerIds: ["opp.lb", "us.RW"] },
        { kind: "hold" },
      ],
      "Compacte 4-4-2 vs BUILDUP 4-2-3-1",
      {
        ballZone: "right-flank",
        possessionTeam: "opponent",
        defensiveBlock: "mid",
        lastLineHeight: 29,
        teamCompactness: { width: 36, length: 26 },
        markedOpponentIds: ["opp.st"],
      },
    ),
    animStep(
      "p1-trigger",
      PV2.trigger,
      PV2.firstPress - PV2.trigger,
      "TRIGGER",
      [
        { kind: "phase", phase: "recognition" },
        { kind: "highlight", playerIds: ["opp.lb", "us.RW"] },
        showPassingLane(HP.RW, PRESS_BALL, "press", true),
      ],
      "Trigger: de back ontvangt gesloten aan de zijlijn.",
      {
        ballZone: "right-flank",
        possessionTeam: "opponent",
        defensiveBlock: "mid",
        pressingDirection: "outside",
        primaryPressurePlayerId: "us.RW",
        closedPassLanes: [{ label: "vooruit" }],
      },
    ),
    animStep(
      "p2-first",
      PV2.firstPress,
      PV2.secondPress - PV2.firstPress,
      "Eerste druk",
      [
        { kind: "phase", phase: "action" },
        movePlayer("us.RW", G.RW, "easeOut", RW_ARC),
        movePlayer("us.R6", { x: 52, y: 66 }),
        {
          kind: "setLines",
          lines: [{ kind: "press", from: G.RW, to: PRESS_BALL }],
        },
        { kind: "highlight", playerIds: ["us.RW"] },
      ],
      "RW stuurt naar buiten — sluit vooruit",
      {
        ballZone: "right-flank",
        possessionTeam: "opponent",
        defensiveBlock: "mid",
        pressingDirection: "touchline",
        primaryPressurePlayerId: "us.RW",
        coverPlayerIds: ["us.R6"],
        balancePlayerIds: ["us.L6"],
      },
    ),
    animStep(
      "p3-second",
      PV2.secondPress,
      PV2.insideCover - PV2.secondPress,
      "Tweede druk",
      [
        { kind: "phase", phase: "action" },
        movePlayer("us.R6", G.R6, "easeInOut"),
        movePlayer("us.L6", { x: 50, y: 58 }),
        movePlayer("us.RB", { x: 48, y: 76 }),
        {
          kind: "setLines",
          lines: [
            { kind: "press", from: G.RW, to: PRESS_BALL },
            { kind: "press", from: G.R6, to: { x: 64, y: 68 }, dashed: true },
          ],
        },
        { kind: "highlight", playerIds: ["us.RW", "us.R6"] },
      ],
      "8 sluit de binnenoptie",
      {
        ballZone: "right-flank",
        possessionTeam: "opponent",
        defensiveBlock: "mid",
        primaryPressurePlayerId: "us.RW",
        coverPlayerIds: ["us.R6"],
        markedOpponentIds: ["opp.8"],
      },
    ),
    animStep(
      "p4-inside",
      PV2.insideCover,
      PV2.depthCover - PV2.insideCover,
      "Binnen dicht",
      [
        { kind: "phase", phase: "action" },
        movePlayer("us.L6", G.L6),
        movePlayer("us.10", G["10"]),
        movePlayer("us.SP", G.SP),
        {
          kind: "setLines",
          lines: [
            { kind: "press", from: G.RW, to: PRESS_BALL },
            { kind: "press", from: G.R6, to: { x: 64, y: 68 }, dashed: true },
          ],
        },
        { kind: "highlight", playerIds: ["us.L6", "us.R6"] },
      ],
      "6 sluit centrum — 4-4-2 blijft herkenbaar",
      {
        ballZone: "right-flank",
        possessionTeam: "opponent",
        defensiveBlock: "mid",
        primaryPressurePlayerId: "us.RW",
        coverPlayerIds: ["us.R6", "us.L6"],
      },
    ),
    animStep(
      "p5-depth",
      PV2.depthCover,
      PV2.farSide - PV2.depthCover,
      "Rugdekking",
      [
        { kind: "phase", phase: "follow" },
        movePlayer("us.RB", G.RB),
        movePlayer("us.RCV", G.RCV),
        movePlayer("us.LCV", G.LCV),
        movePlayer("us.LB", G.LB),
        movePlayer("us.LW", G.LW),
        { kind: "highlight", playerIds: ["us.RB", "us.RCV", "us.RW"] },
      ],
      "RB/RCB geven diepte — verre zijde knijpt",
      {
        ballZone: "right-flank",
        possessionTeam: "opponent",
        defensiveBlock: "high",
        primaryPressurePlayerId: "us.RW",
        coverPlayerIds: ["us.RB", "us.RCV", "us.R6", "us.L6"],
        balancePlayerIds: ["us.LW", "us.LB"],
        lastLineHeight: 36,
        teamCompactness: { width: 34, length: 28 },
      },
    ),
    animStep(
      "p6-result",
      PV2.farSide,
      PV2.endHold - PV2.farSide,
      "Resultaat",
      [
        { kind: "phase", phase: "result" },
        ...passBall(PRESS_BALL, PRESS_V2_GOOD_BALL_RESULT),
        movePlayer("opp.cbL", PRESS_V2_GOOD_BALL_RESULT),
        movePlayer("opp.lb", { x: 82, y: 86 }),
        receiveBall("opp.cbL"),
        {
          kind: "setLines",
          lines: [{ kind: "pass", from: PRESS_BALL, to: PRESS_V2_GOOD_BALL_RESULT }],
        },
        { kind: "highlight", playerIds: ["us.RW", "us.R6", "opp.cbL"] },
        { kind: "hold" },
      ],
      "Door de aansluiting kan de tegenstander alleen terug.",
      {
        ballZone: "right-flank",
        possessionTeam: "opponent",
        defensiveBlock: "high",
        primaryPressurePlayerId: "us.RW",
        coverPlayerIds: ["us.R6", "us.L6", "us.RB"],
        lastLineHeight: 36,
        teamCompactness: { width: 34, length: 28 },
      },
    ),
  ],
  { complexity: "situation", pauseAtEndMs: 2400 },
);
