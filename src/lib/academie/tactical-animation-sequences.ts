/**
 * Tactical Animation System V3/V4 — helpers + Chapter 1 sequences.
 * V4: pressing-keten, curved runs, teamblok-state per fase.
 */

import {
  FORMATION_4231_US,
  FORMATION_KW_R6,
  FORMATION_PRESS_BASE,
  PRESS_BALL,
  type TacticalLine,
  type TacticalPoint,
  type TacticalZone,
} from "@/lib/academie/tactical-visual-system";
import type {
  TacticalAnimationComplexity,
  TacticalAnimationDefinition,
  TacticalAnimationStep,
  TacticalAnimationAction,
} from "@/lib/academie/tactical-animation-types";
import type { TacticalPhaseState } from "@/lib/academie/tactical-animation-v4-state";
import {
  createCurvedRun,
  createPressingArc,
} from "@/lib/academie/tactical-animation-collision";

export function animStep(
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

export function buildAnimation(
  id: string,
  situationId: string,
  steps: TacticalAnimationStep[],
  opts?: Partial<
    Pick<
      TacticalAnimationDefinition,
      | "pauseAtEndMs"
      | "pauseAtStartMs"
      | "autoplay"
      | "loop"
      | "complexity"
      | "defaultPlaybackRate"
      | "positioningMode"
    >
  >,
): TacticalAnimationDefinition {
  const last = steps.reduce((max, s) => Math.max(max, s.startMs + s.durationMs), 0);
  return {
    id,
    situationId,
    complexity: opts?.complexity ?? "situation",
    durationMs: last,
    pauseAtStartMs: opts?.pauseAtStartMs ?? 0,
    pauseAtEndMs: opts?.pauseAtEndMs ?? 2000,
    defaultPlaybackRate: opts?.defaultPlaybackRate ?? 1,
    autoplay: opts?.autoplay ?? true,
    loop: opts?.loop ?? false,
    positioningMode: opts?.positioningMode ?? "generated",
    steps,
  };
}

/** ——— Semantische helpers ——— */

export function passBall(
  from: TacticalPoint,
  to: TacticalPoint,
  opts?: { interceptProgress?: number; dashed?: boolean; kind?: TacticalLine["kind"] },
): TacticalAnimationAction[] {
  return [
    {
      kind: "setLines",
      lines: [{ kind: opts?.kind ?? "pass", from, to, dashed: opts?.dashed }],
    },
    {
      kind: "ballMove",
      from,
      to,
      interceptProgress: opts?.interceptProgress,
      easing: "easeOut",
    },
    { kind: "possession", holderId: null },
  ];
}

export function receiveBall(holderId: string): TacticalAnimationAction {
  return { kind: "possession", holderId };
}

export function movePlayer(
  playerId: string,
  to: TacticalPoint,
  easing: "easeIn" | "easeOut" | "easeInOut" | "linear" = "easeInOut",
  via?: TacticalPoint[],
): TacticalAnimationAction {
  return { kind: "playerMove", playerId, to, via, easing };
}

export function movePlayerCurved(
  playerId: string,
  from: TacticalPoint,
  to: TacticalPoint,
  opts?: { bulge?: number; side?: "left" | "right" | "auto"; easing?: "easeOut" | "easeInOut" },
): TacticalAnimationAction {
  const via = createCurvedRun(from, to, { bulge: opts?.bulge, side: opts?.side });
  return movePlayer(playerId, to, opts?.easing ?? "easeInOut", via);
}

export function moveGroup(
  moves: Array<{ id: string; to: TacticalPoint; via?: TacticalPoint[] }>,
): TacticalAnimationAction {
  return {
    kind: "groupMove",
    moves: moves.map((m) => ({
      playerId: m.id,
      to: m.to,
      via: m.via,
      easing: "easeInOut" as const,
    })),
  };
}

export function highlightSpace(
  zones: TacticalZone[],
  playerIds?: string[],
): TacticalAnimationAction[] {
  return [
    { kind: "setZones", zones },
    { kind: "highlight", playerIds, zoneIndexes: zones.map((_, i) => i) },
  ];
}

export function showPassingLane(
  from: TacticalPoint,
  to: TacticalPoint,
  kind: TacticalLine["kind"] = "pass",
  dashed = true,
): TacticalAnimationAction {
  return { kind: "setLines", lines: [{ kind, from, to, dashed }] };
}

/** V4 default step durations — micro ~12s, situation ~16s before end pause. */
const V3_LINE_MICRO = {
  situatie: 1600,
  herken: 1800,
  speel: 1800,
  reactie: 1800,
  vervolg: 1700,
  gevolg: 2400,
} as const;
const V3_LINE_SITUATION = {
  situatie: 1800,
  herken: 2000,
  speel: 2000,
  reactie: 2000,
  vervolg: 1900,
  gevolg: 2600,
} as const;

/** Generieke multi-fase line-follow (micro/situation) — V4: cover/balance/last-line. */
export function buildLineFollowAnimation(
  situationId: string,
  opts: {
    ballFrom: TacticalPoint;
    ballTo: TacticalPoint;
    holderStart: string;
    holderEnd: string;
    movers?: Array<{ id: string; to: TacticalPoint }>;
    prepareMovers?: Array<{ id: string; to: TacticalPoint }>;
    followMovers?: Array<{ id: string; to: TacticalPoint }>;
    /** V4: rugdekking / aansluiting achter de actie. */
    coverMovers?: Array<{ id: string; to: TacticalPoint }>;
    /** V4: balans / verre zijde. */
    balanceMovers?: Array<{ id: string; to: TacticalPoint }>;
    /** V4: laatste lijn reactie. */
    lastLineMovers?: Array<{ id: string; to: TacticalPoint }>;
    opponentReact?: Array<{ id: string; to: TacticalPoint }>;
    passKind?: TacticalLine["kind"];
    endZones?: TacticalZone[];
    interceptProgress?: number;
    interceptHolder?: string;
    complexity?: TacticalAnimationComplexity;
    secondPass?: { to: TacticalPoint; holderEnd: string; from?: TacticalPoint };
    teachingPoints?: Partial<
      Record<"situatie" | "herken" | "speel" | "reactie" | "vervolg" | "gevolg", string>
    >;
    tacticalBrief?: Partial<TacticalPhaseState>;
  },
): TacticalAnimationDefinition {
  const intercept = opts.interceptProgress;
  const endHolder = opts.interceptHolder ?? opts.holderEnd;
  const complexity = opts.complexity ?? (opts.secondPass ? "situation" : "micro");
  const D = complexity === "micro" ? V3_LINE_MICRO : V3_LINE_SITUATION;
  const tp = opts.teachingPoints ?? {};
  const opponentOnBall = opts.opponentReact?.length ? [moveGroup(opts.opponentReact)] : [];
  const coverBalance = [
    ...(opts.coverMovers ?? []),
    ...(opts.balanceMovers ?? []),
    ...(opts.lastLineMovers ?? []),
  ];

  const steps: TacticalAnimationStep[] = [];
  let t = 0;

  steps.push(
    animStep(
      "situatie",
      t,
      D.situatie,
      "Situatie",
      [
        { kind: "phase", phase: "initial" },
        { kind: "highlight", playerIds: [opts.holderStart] },
        { kind: "hold" },
      ],
      tp.situatie,
    ),
  );
  t += D.situatie;

  steps.push(
    animStep(
      "herken",
      t,
      D.herken,
      "Herken",
      [
        { kind: "phase", phase: "recognition" },
        { kind: "highlight", playerIds: [opts.holderStart] },
        showPassingLane(opts.ballFrom, opts.ballTo, opts.passKind ?? "pass", true),
        ...(opts.prepareMovers ?? []).map((m) => movePlayer(m.id, m.to)),
      ],
      tp.herken,
    ),
  );
  t += D.herken;

  steps.push(
    animStep(
      "speel",
      t,
      D.speel,
      "Speel",
      [
        { kind: "phase", phase: "action" },
        ...passBall(opts.ballFrom, opts.ballTo, {
          interceptProgress: intercept,
          kind: opts.passKind ?? "pass",
        }),
        ...(opts.movers ?? []).map((m) => movePlayer(m.id, m.to, "easeOut")),
        ...opponentOnBall,
      ],
      tp.speel,
    ),
  );
  t += D.speel;

  if (opts.secondPass && !intercept) {
    steps.push(
      animStep(
        "reactie",
        t,
        D.reactie,
        "Reactie",
        [
          { kind: "phase", phase: "reaction" },
          receiveBall(opts.holderEnd),
          { kind: "highlight", playerIds: [opts.holderEnd] },
          ...(opts.followMovers ?? []).slice(0, 2).map((m) => movePlayer(m.id, m.to)),
          ...coverBalance.slice(0, 3).map((m) => movePlayer(m.id, m.to)),
        ],
        tp.reactie,
        opts.tacticalBrief,
      ),
    );
    t += D.reactie;

    const from = opts.secondPass.from ?? opts.ballTo;
    steps.push(
      animStep(
        "vervolg",
        t,
        D.vervolg,
        "Vervolg",
        [
          { kind: "phase", phase: "follow" },
          ...passBall(from, opts.secondPass.to),
          ...(opts.followMovers ?? []).map((m) => movePlayer(m.id, m.to)),
          ...coverBalance.map((m) => movePlayer(m.id, m.to)),
          ...opponentOnBall,
        ],
        tp.vervolg,
      ),
    );
    t += D.vervolg;

    steps.push(
      animStep(
        "gevolg",
        t,
        D.gevolg,
        "Gevolg",
        [
          { kind: "phase", phase: "result" },
          receiveBall(opts.secondPass.holderEnd),
          ...(opts.endZones ? highlightSpace(opts.endZones, [opts.secondPass.holderEnd]) : []),
          { kind: "highlight", playerIds: [opts.secondPass.holderEnd] },
          { kind: "hold" },
        ],
        tp.gevolg,
        opts.tacticalBrief,
      ),
    );
  } else {
    steps.push(
      animStep(
        "reactie",
        t,
        D.reactie,
        "Reactie",
        [
          { kind: "phase", phase: "reaction" },
          receiveBall(endHolder),
          ...(opts.followMovers ?? []).map((m) => movePlayer(m.id, m.to)),
          ...coverBalance.map((m) => movePlayer(m.id, m.to)),
          { kind: "highlight", playerIds: [endHolder] },
        ],
        tp.reactie,
        opts.tacticalBrief,
      ),
    );
    t += D.reactie;

    steps.push(
      animStep(
        "gevolg",
        t,
        D.gevolg,
        "Gevolg",
        [
          { kind: "phase", phase: "result" },
          ...(opts.endZones ? highlightSpace(opts.endZones, [endHolder]) : []),
          { kind: "highlight", playerIds: [endHolder] },
          { kind: "hold" },
        ],
        tp.gevolg,
      ),
    );
  }

  return buildAnimation(`anim.${situationId}`, situationId, steps, {
    complexity,
    pauseAtEndMs: 2000,
    autoplay: true,
  });
}

/** V4 step anchors for inline registry sequences (situation ≈16s, micro ≈12s). */
export const V3S = {
  situatie: 0,
  dSit: 1800,
  herken: 1800,
  dHer: 2000,
  speel: 3800,
  dSp: 2000,
  reactie: 5800,
  dRe: 2000,
  vervolg: 7800,
  dVe: 1900,
  gevolg: 9700,
  dGe: 2600,
} as const;

export const V3M = {
  situatie: 0,
  dSit: 1600,
  herken: 1600,
  dHer: 1800,
  speel: 3400,
  dSp: 1800,
  reactie: 5200,
  dRe: 1800,
  vervolg: 7000,
  dVe: 1700,
  gevolg: 8700,
  dGe: 2400,
} as const;

/** ——— Pilots V4 ——— */

const HP = FORMATION_PRESS_BASE;
const K = FORMATION_KW_R6;
const F = FORMATION_4231_US;

// ANIM_CONNECTED_TEAM: see tactical-animation-connected-team.ts

/**
 * Press pair V1 — identical FORMATION_PRESS_BASE + PRESS_OPPONENTS start.
 * Bad delta: only first press; team does NOT connect (second/inside/depth/far-side absent).
 * Formations stay readable — no chaos clusters.
 */
export const ANIM_PRESS_BAD_V1_LEGACY = buildAnimation(
  "anim.press-bad",
  "press-bad",
  [
    animStep(
      "p0-start",
      0,
      2000,
      "Start",
      [
        { kind: "phase", phase: "initial" },
        { kind: "highlight", playerIds: ["opp.cbL", "us.SP", "us.10"] },
        { kind: "hold" },
      ],
      "Zelfde start als GOED — compacte 4-4-2",
      {
        ballZone: "final-third",
        possessionTeam: "opponent",
        defensiveBlock: "mid",
        lastLineHeight: 29,
        depthThreatPlayerIds: ["opp.st"],
        teamCompactness: { width: 36, length: 26 },
      },
    ),
    animStep(
      "p1-trigger",
      2000,
      1800,
      "TRIGGER",
      [
        { kind: "phase", phase: "recognition" },
        { kind: "highlight", playerIds: ["us.SP", "opp.cbL"] },
        showPassingLane(HP.SP, PRESS_BALL, "fault", true),
      ],
      "Spits jaagt alleen — recht op de bal",
      {
        ballZone: "final-third",
        possessionTeam: "opponent",
        defensiveBlock: "mid",
        primaryPressurePlayerId: "us.SP",
        coverPlayerIds: [],
        balancePlayerIds: [],
      },
    ),
    animStep(
      "p2-first-alone",
      3800,
      2400,
      "Alleen jagen",
      [
        { kind: "phase", phase: "action" },
        movePlayer("us.SP", { x: 74, y: 36 }, "easeOut"),
        {
          kind: "setLines",
          lines: [{ kind: "fault", from: HP.SP, to: PRESS_BALL, dashed: true }],
        },
        { kind: "highlight", playerIds: ["us.SP"] },
        // Rest blijft — bewust géén second press / inside cover
        movePlayer("us.10", { x: 52, y: 56 }),
        movePlayer("us.L6", { x: 40, y: 40 }),
        movePlayer("us.R6", { x: 40, y: 56 }),
        movePlayer("us.LW", { x: 40, y: 22 }),
        movePlayer("us.RW", { x: 40, y: 74 }),
      ],
      "Geen tweede druk — binnenlijn open",
      {
        ballZone: "final-third",
        possessionTeam: "opponent",
        defensiveBlock: "mid",
        primaryPressurePlayerId: "us.SP",
        coverPlayerIds: [],
        lastLineHeight: 29,
      },
    ),
    animStep(
      "p3-through",
      6200,
      2400,
      "Uitweg",
      [
        { kind: "phase", phase: "reaction" },
        ...passBall(PRESS_BALL, { x: 66, y: 50 }),
        movePlayer("opp.6", { x: 64, y: 48 }, "easeOut"),
        movePlayer("opp.8", { x: 58, y: 34 }),
        { kind: "highlight", playerIds: ["opp.6", "us.10"] },
        movePlayer("us.SP", { x: 72, y: 40 }),
      ],
      "Vrije 6 draait open — team stond stil",
      {
        ballZone: "middle-third",
        possessionTeam: "opponent",
        defensiveBlock: "mid",
        primaryPressurePlayerId: "us.SP",
        coverPlayerIds: [],
        localNumbers: [{ zone: "central", us: 0, opponent: 1, note: "vrije 6" }],
      },
    ),
    animStep(
      "p4-consequence",
      8600,
      3200,
      "Gevolg",
      [
        { kind: "phase", phase: "result" },
        receiveBall("opp.6"),
        movePlayer("opp.6", { x: 58, y: 48 }, "easeOut"),
        movePlayer("opp.st", { x: 48, y: 50 }),
        // Linies blijven herkenbaar — zakken licht, geen chaos
        movePlayer("us.10", { x: 48, y: 52 }),
        movePlayer("us.L6", { x: 38, y: 40 }),
        movePlayer("us.R6", { x: 38, y: 56 }),
        movePlayer("us.LCV", { x: 26, y: 38 }),
        movePlayer("us.RCV", { x: 26, y: 56 }),
        { kind: "highlight", playerIds: ["us.SP", "opp.6"] },
        { kind: "hold" },
      ],
      "Losse druk faalt — linies blijven leesbaar",
      {
        ballZone: "middle-third",
        possessionTeam: "opponent",
        defensiveBlock: "low",
        lastLineHeight: 26,
        teamCompactness: { width: 36, length: 28 },
      },
    ),
  ],
  { complexity: "situation", pauseAtEndMs: 2400 },
);

/** Press-good V1 — full five-role pressing chain, same start as bad. */
const PG_SP_CUT: TacticalPoint = { x: 68, y: 44 };
const PG_SP_END: TacticalPoint = { x: 72, y: 34 };
const PG_10_END: TacticalPoint = { x: 60, y: 48 };
const PG_L6_COVER: TacticalPoint = { x: 52, y: 42 };
const PG_R6_BALANCE: TacticalPoint = { x: 44, y: 56 };
const PG_LW_PRESS: TacticalPoint = { x: 70, y: 22 };
const PG_BALL_WIDE: TacticalPoint = { x: 82, y: 18 };
const PG_SP_VIA = createPressingArc(HP.SP, PG_SP_CUT, PG_SP_END, { bulge: 7 });

export const ANIM_PRESS_GOOD_V1_LEGACY = buildAnimation(
  "anim.press-good",
  "press-good",
  [
    animStep(
      "p0-start",
      0,
      2000,
      "Start",
      [
        { kind: "phase", phase: "initial" },
        { kind: "highlight", playerIds: ["opp.cbL", "opp.6", "us.SP", "us.10", "us.L6"] },
        { kind: "hold" },
      ],
      "Compacte 4-4-2 vs BUILDUP 4-3-3",
      {
        ballZone: "final-third",
        possessionTeam: "opponent",
        defensiveBlock: "mid",
        lastLineHeight: 29,
        depthThreatPlayerIds: ["opp.st"],
        markedOpponentIds: ["opp.st"],
        teamCompactness: { width: 36, length: 26 },
      },
    ),
    animStep(
      "p1-trigger",
      2000,
      1800,
      "TRIGGER",
      [
        { kind: "phase", phase: "recognition" },
        { kind: "highlight", playerIds: ["opp.cbL", "us.SP", "us.10"] },
        showPassingLane(HP.SP, PRESS_BALL, "press", true),
        showPassingLane(PRESS_BALL, { x: 66, y: 50 }, "pass", true),
        showPassingLane(PRESS_BALL, { x: 80, y: 16 }, "pass", true),
      ],
      "Traag — lichaam gesloten",
      {
        ballZone: "final-third",
        possessionTeam: "opponent",
        defensiveBlock: "mid",
        pressingDirection: "outside",
        primaryPressurePlayerId: "us.SP",
        closedPassLanes: [{ label: "binnen/GK" }, { label: "opp.6" }],
      },
    ),
    animStep(
      "p2-first-press",
      3800,
      2400,
      "Eerste druk",
      [
        { kind: "phase", phase: "action" },
        movePlayer("us.SP", PG_SP_END, "easeOut", PG_SP_VIA),
        movePlayer("us.10", { x: 54, y: 50 }),
        movePlayer("us.LW", { x: 48, y: 26 }),
        {
          kind: "setLines",
          lines: [
            { kind: "press", from: PG_SP_END, to: PRESS_BALL },
            { kind: "press", from: { x: 54, y: 50 }, to: { x: 66, y: 50 }, dashed: true },
          ],
        },
        { kind: "highlight", playerIds: ["us.SP", "us.10"] },
      ],
      "ST stuurt — sluit binnen",
      {
        ballZone: "final-third",
        possessionTeam: "opponent",
        defensiveBlock: "mid",
        pressingDirection: "touchline",
        primaryPressurePlayerId: "us.SP",
        coverPlayerIds: ["us.10"],
        balancePlayerIds: ["us.R6"],
        closedPassLanes: [
          { fromId: "opp.cbL", toId: "opp.gk" },
          { fromId: "opp.cbL", toId: "opp.cbR" },
        ],
        lastLineHeight: 29,
      },
    ),
    animStep(
      "p3-second-press",
      6200,
      2200,
      "Tweede druk",
      [
        { kind: "phase", phase: "action" },
        movePlayer("us.10", PG_10_END, "easeInOut"),
        movePlayer("us.L6", { x: 48, y: 42 }),
        movePlayer("us.R6", PG_R6_BALANCE),
        {
          kind: "setLines",
          lines: [
            { kind: "press", from: PG_SP_END, to: PRESS_BALL },
            { kind: "press", from: PG_10_END, to: { x: 66, y: 50 } },
          ],
        },
        { kind: "highlight", playerIds: ["us.10", "us.SP", "opp.6"] },
      ],
      "10 sluit hun 6",
      {
        ballZone: "final-third",
        possessionTeam: "opponent",
        defensiveBlock: "mid",
        primaryPressurePlayerId: "us.SP",
        coverPlayerIds: ["us.10"],
        balancePlayerIds: ["us.R6"],
        markedOpponentIds: ["opp.6"],
        lastLineHeight: 30,
      },
    ),
    animStep(
      "p4-inside",
      8400,
      2200,
      "Binnen dicht",
      [
        { kind: "phase", phase: "action" },
        movePlayer("us.L6", PG_L6_COVER),
        movePlayer("us.R6", { x: 46, y: 54 }),
        movePlayer("us.RW", { x: 42, y: 66 }),
        movePlayer("opp.cbL", { x: 80, y: 32 }),
        {
          kind: "setLines",
          lines: [
            { kind: "press", from: PG_SP_END, to: { x: 80, y: 32 } },
            { kind: "press", from: PG_10_END, to: { x: 66, y: 50 } },
            { kind: "press", from: PG_L6_COVER, to: { x: 60, y: 32 }, dashed: true },
          ],
        },
        { kind: "highlight", playerIds: ["us.L6", "us.10", "us.R6"] },
      ],
      "6 sluit binnenlijn — 8 balans",
      {
        ballZone: "final-third",
        possessionTeam: "opponent",
        defensiveBlock: "mid",
        primaryPressurePlayerId: "us.SP",
        coverPlayerIds: ["us.10", "us.L6"],
        balancePlayerIds: ["us.R6"],
        markedOpponentIds: ["opp.6", "opp.8"],
        lastLineHeight: 30,
      },
    ),
    animStep(
      "p5-line-shift",
      10600,
      2600,
      "Lijn schuift",
      [
        { kind: "phase", phase: "follow" },
        ...passBall({ x: 80, y: 32 }, PG_BALL_WIDE),
        movePlayer("opp.lb", { x: 84, y: 14 }),
        movePlayer("us.LW", PG_LW_PRESS, "easeOut"),
        movePlayer("us.LB", { x: 48, y: 20 }),
        moveGroup([
          { id: "us.LCV", to: { x: 36, y: 36 } },
          { id: "us.RCV", to: { x: 34, y: 54 } },
          { id: "us.RB", to: { x: 34, y: 68 } },
          { id: "us.RW", to: { x: 44, y: 62 } },
          { id: "us.R6", to: { x: 48, y: 52 } },
        ]),
        {
          kind: "setLines",
          lines: [
            { kind: "press", from: PG_LW_PRESS, to: PG_BALL_WIDE },
            { kind: "press", from: PG_10_END, to: { x: 66, y: 50 }, dashed: true },
          ],
        },
        { kind: "highlight", playerIds: ["us.LW", "us.LB", "us.LCV", "us.RW"] },
      ],
      "Back four + verre zijde knijpt",
      {
        ballZone: "left-flank",
        possessionTeam: "opponent",
        defensiveBlock: "high",
        pressingDirection: "touchline",
        primaryPressurePlayerId: "us.LW",
        coverPlayerIds: ["us.LB", "us.L6", "us.LCV"],
        balancePlayerIds: ["us.R6", "us.RCV", "us.RB", "us.RW"],
        depthThreatPlayerIds: ["opp.st"],
        lastLineHeight: 36,
        teamCompactness: { width: 34, length: 28 },
      },
    ),
    animStep(
      "p6-result",
      13200,
      3600,
      "Resultaat",
      [
        { kind: "phase", phase: "result" },
        receiveBall("opp.lb"),
        ...passBall(PG_BALL_WIDE, { x: 88, y: 28 }),
        movePlayer("opp.cbL", { x: 86, y: 30 }),
        movePlayer("us.SP", { x: 74, y: 30 }),
        movePlayer("us.10", { x: 62, y: 44 }),
        movePlayer("us.L6", { x: 54, y: 38 }),
        ...highlightSpace(
          [{ x: 40, y: 16, w: 40, h: 52, label: "Compact" }],
          ["us.SP", "us.10", "us.LW", "us.L6", "us.LCV"],
        ),
        { kind: "hold" },
      ],
      "Terug of buitenom — blok blijft verbonden",
      {
        ballZone: "left-flank",
        possessionTeam: "opponent",
        defensiveBlock: "high",
        primaryPressurePlayerId: "us.LW",
        coverPlayerIds: ["us.LB", "us.L6", "us.10"],
        balancePlayerIds: ["us.R6", "us.RCV", "us.RB", "us.RW"],
        lastLineHeight: 36,
        teamCompactness: { width: 34, length: 28 },
        intentionalDoubleMark: false,
      },
    ),
  ],
  { complexity: "situation", pauseAtEndMs: 2600 },
);

export const ANIM_KW_CHOICE_FORCE = buildAnimation(
  "anim.kw-choice-force",
  "kw-choice-force",
  [
    animStep(
      "situatie",
      0,
      1800,
      "Situatie",
      [
        { kind: "phase", phase: "initial" },
        { kind: "highlight", playerIds: ["us.R6", "us.L6", "us.10"] },
        { kind: "hold" },
      ],
      "Bal bij onze R6",
      {
        ballZone: "middle-third",
        possessionTeam: "us",
        defensiveBlock: "mid",
        balancePlayerIds: ["us.L6"],
        lastLineHeight: 21,
      },
    ),
    animStep(
      "herken",
      1800,
      2200,
      "Herken",
      [
        { kind: "phase", phase: "recognition" },
        { kind: "highlight", playerIds: ["us.R6", "us.10", "opp.rdm", "opp.10"] },
        showPassingLane(K.R6, K["10"], "fault", true),
        showPassingLane(K.R6, K.RB, "pass", true),
        ...highlightSpace([{ x: 50, y: 40, w: 20, h: 22, label: "Gesloten" }], ["us.10"]),
        moveGroup([
          { id: "opp.rdm", to: { x: 58, y: 52 } },
          { id: "opp.10", to: { x: 56, y: 48 } },
          { id: "opp.ldm", to: { x: 60, y: 42 } },
        ]),
      ],
      "Lijn naar tien dicht",
      {
        ballZone: "middle-third",
        possessionTeam: "us",
        defensiveBlock: "mid",
        closedPassLanes: [{ fromId: "us.R6", toId: "us.10" }],
        markedOpponentIds: ["opp.rdm", "opp.10"],
      },
    ),
    animStep(
      "keuze",
      4000,
      1800,
      "Keuze",
      [
        { kind: "phase", phase: "prepare" },
        movePlayer("us.10", { x: K["10"].x - 2, y: K["10"].y - 4 }),
        movePlayer("us.RB", { x: K.RB.x - 2, y: K.RB.y }),
        movePlayer("opp.10", { x: 54, y: 54 }),
        { kind: "highlight", playerIds: ["us.R6", "us.10"] },
        showPassingLane(K.R6, K["10"], "fault", true),
      ],
      "Toch forceert vooruit",
    ),
    animStep(
      "speel",
      5800,
      2000,
      "Speel",
      [
        { kind: "phase", phase: "action" },
        ...passBall(K.R6, { x: K["10"].x - 2, y: K["10"].y - 4 }, { interceptProgress: 0.52, kind: "fault" }),
        movePlayer("opp.rdm", { x: 56, y: 50 }, "easeOut"),
        movePlayer("opp.ldm", { x: 54, y: 46 }),
        movePlayer("us.L6", { x: K.L6.x + 2, y: K.L6.y }),
      ],
      "Pass wordt onderschept",
    ),
    animStep(
      "reactie",
      7800,
      2200,
      "Reactie",
      [
        { kind: "phase", phase: "reaction" },
        receiveBall("opp.rdm"),
        movePlayer("opp.rdm", { x: 50, y: 50 }, "easeOut"),
        movePlayer("opp.st", { x: 40, y: 50 }),
        moveGroup([
          { id: "us.R6", to: { x: 42, y: 56 } },
          { id: "us.10", to: { x: 46, y: 44 } },
          { id: "us.L6", to: { x: 38, y: 42 } },
        ]),
        ...highlightSpace([{ x: 46, y: 42, w: 16, h: 16, label: "Balverlies" }], ["opp.rdm"]),
      ],
      "Zij draaien open",
      {
        ballZone: "middle-third",
        possessionTeam: "opponent",
        defensiveBlock: "transition",
        primaryPressurePlayerId: "us.10",
        coverPlayerIds: ["us.R6", "us.L6"],
        depthThreatPlayerIds: ["opp.st"],
      },
    ),
    animStep(
      "vervolg",
      10000,
      2400,
      "Vervolg",
      [
        { kind: "phase", phase: "follow" },
        ...passBall({ x: 50, y: 50 }, { x: 36, y: 46 }),
        movePlayer("opp.10", { x: 40, y: 42 }),
        movePlayer("opp.rdm", { x: 48, y: 52 }),
        moveGroup([
          { id: "us.RCV", to: { x: 24, y: 54 } },
          { id: "us.LCV", to: { x: 22, y: 40 } },
          { id: "us.RB", to: { x: 32, y: 74 } },
          { id: "us.LB", to: { x: 24, y: 22 } },
          { id: "us.R6", to: { x: 36, y: 54 } },
          { id: "us.10", to: { x: 44, y: 46 } },
        ]),
      ],
      "Diepte bedreigd — zakken",
      {
        ballZone: "middle-third",
        possessionTeam: "opponent",
        defensiveBlock: "low",
        coverPlayerIds: ["us.RCV", "us.LCV"],
        balancePlayerIds: ["us.L6"],
        depthThreatPlayerIds: ["opp.st", "opp.10"],
        lastLineHeight: 23,
      },
    ),
    animStep(
      "gevolg",
      12400,
      3000,
      "Gevolg",
      [
        { kind: "phase", phase: "result" },
        receiveBall("opp.10"),
        moveGroup([
          { id: "us.RB", to: { x: 30, y: 70 } },
          { id: "us.R6", to: { x: 34, y: 54 } },
          { id: "us.10", to: { x: 44, y: 48 } },
        ]),
        ...highlightSpace(
          [
            { x: 20, y: 34, w: 22, h: 30, label: "Risico" },
            { x: 32, y: 40, w: 14, h: 14, label: "Herstel" },
          ],
          ["opp.10", "us.L6"],
        ),
        { kind: "hold" },
      ],
      "Restverdediging te laat",
      {
        ballZone: "defensive-third",
        possessionTeam: "opponent",
        defensiveBlock: "low",
        balancePlayerIds: ["us.L6"],
        lastLineHeight: 23,
      },
    ),
  ],
  { complexity: "situation", pauseAtEndMs: 2600 },
);

const K_RB_RECEIVE: TacticalPoint = { x: K.RB.x + 2, y: K.RB.y - 2 };
const K_RW_CONNECT: TacticalPoint = { x: 80, y: 72 };

export const ANIM_KW_CHOICE_RELOCATE = buildAnimation(
  "anim.kw-choice-relocate",
  "kw-choice-relocate",
  [
    animStep(
      "situatie",
      0,
      1800,
      "Situatie",
      [
        { kind: "phase", phase: "initial" },
        { kind: "highlight", playerIds: ["us.R6", "us.L6"] },
        { kind: "hold" },
      ],
      "Bal bij onze R6",
      {
        ballZone: "middle-third",
        possessionTeam: "us",
        defensiveBlock: "mid",
        balancePlayerIds: ["us.L6"],
      },
    ),
    animStep(
      "herken",
      1800,
      2200,
      "Herken",
      [
        { kind: "phase", phase: "recognition" },
        { kind: "highlight", playerIds: ["us.R6", "us.RB", "us.10"] },
        {
          kind: "setLines",
          lines: [
            { kind: "pass", from: K.R6, to: K.RB, dashed: true },
            { kind: "pass", from: K.R6, to: K.L6, dashed: true },
            { kind: "fault", from: K.R6, to: K["10"], dashed: true },
          ],
        },
        ...highlightSpace([{ x: 34, y: 74, w: 14, h: 14, label: "Ruimte" }], ["us.RB"]),
        moveGroup([
          { id: "opp.rdm", to: { x: 58, y: 52 } },
          { id: "opp.10", to: { x: 56, y: 48 } },
        ]),
      ],
      "Tien dicht — RB vrij",
    ),
    animStep(
      "keuze",
      4000,
      1800,
      "Keuze",
      [
        { kind: "phase", phase: "prepare" },
        movePlayer("us.RB", K_RB_RECEIVE),
        movePlayerCurved("us.RW", K.RW, { x: K.RW.x - 2, y: K.RW.y - 2 }, { bulge: 4 }),
        movePlayer("us.L6", { x: K.L6.x + 2, y: K.L6.y + 2 }),
        { kind: "highlight", playerIds: ["us.R6", "us.RB"] },
      ],
      "Eerst verplaatsen",
    ),
    animStep(
      "speel",
      5800,
      2000,
      "Speel",
      [
        { kind: "phase", phase: "action" },
        ...passBall(K.R6, K_RB_RECEIVE),
        moveGroup([
          { id: "opp.ldm", to: { x: 58, y: 56 } },
          { id: "opp.rdm", to: { x: 60, y: 50 } },
          { id: "opp.rw", to: { x: 58, y: 72 } },
        ]),
      ],
      "Bal naar vrije RB",
    ),
    animStep(
      "reactie",
      7800,
      2200,
      "Reactie",
      [
        { kind: "phase", phase: "reaction" },
        receiveBall("us.RB"),
        movePlayer("opp.rw", { x: 64, y: 70 }),
        movePlayerCurved("us.RW", { x: K.RW.x - 2, y: K.RW.y - 2 }, { x: 78, y: 70 }, {
          bulge: 5,
          side: "right",
        }),
        movePlayer("us.10", { x: 62, y: 52 }),
        movePlayer("us.R6", { x: K.R6.x + 4, y: K.R6.y - 2 }),
        ...highlightSpace([{ x: 64, y: 58, w: 20, h: 20, label: "Ruimte" }], ["us.RB", "us.RW"]),
      ],
      "Blok schuift — ruimte",
      {
        ballZone: "right-flank",
        possessionTeam: "us",
        defensiveBlock: "mid",
        coverPlayerIds: ["us.R6"],
        balancePlayerIds: ["us.L6"],
        localNumbers: [{ zone: "right-flank", us: 2, opponent: 1 }],
      },
    ),
    animStep(
      "vervolg",
      10000,
      2200,
      "Vervolg",
      [
        { kind: "phase", phase: "follow" },
        ...passBall(K_RB_RECEIVE, K_RW_CONNECT),
        movePlayer("us.RCV", { x: K.RCV.x + 6, y: K.RCV.y }),
        movePlayer("us.LCV", { x: K.LCV.x + 4, y: K.LCV.y }),
        movePlayer("us.L6", { x: K.L6.x + 6, y: K.L6.y + 2 }),
        showPassingLane(K_RB_RECEIVE, { x: 62, y: 52 }, "pass", true),
      ],
      "Tweede pass breed",
    ),
    animStep(
      "aansluiten",
      12200,
      2400,
      "SCHUIF DOOR",
      [
        { kind: "phase", phase: "follow" },
        receiveBall("us.RW"),
        moveGroup([
          { id: "us.10", to: { x: 66, y: 54 } },
          { id: "us.RB", to: { x: K.RB.x + 8, y: K.RB.y - 8 } },
          { id: "us.R6", to: { x: 54, y: 56 } },
          { id: "us.SP", to: { x: K.SP.x + 2, y: K.SP.y + 2 } },
          { id: "us.LW", to: { x: K.LW.x + 2, y: K.LW.y + 4 } },
        ]),
        showPassingLane(K_RW_CONNECT, { x: 66, y: 54 }),
      ],
      "Team + rest 2+1",
      {
        ballZone: "right-flank",
        possessionTeam: "us",
        defensiveBlock: "mid",
        coverPlayerIds: ["us.RB", "us.R6"],
        balancePlayerIds: ["us.L6"],
        lastLineHeight: 26,
      },
    ),
    animStep(
      "gevolg",
      14600,
      3000,
      "BALANS",
      [
        { kind: "phase", phase: "result" },
        receiveBall("us.RW"),
        ...highlightSpace([{ x: 48, y: 40, w: 36, h: 36, label: "Balans + optie" }], [
          "us.RW",
          "us.10",
          "us.R6",
          "us.L6",
        ]),
        { kind: "hold" },
      ],
      "Verplaatst — opties open",
      {
        ballZone: "right-flank",
        possessionTeam: "us",
        defensiveBlock: "mid",
        balancePlayerIds: ["us.L6"],
        coverPlayerIds: ["us.R6"],
      },
    ),
  ],
  { complexity: "pattern", pauseAtEndMs: 2800 },
);

/** Remaining named pilots used by registry. */
const TA_L6_SUPPORT: TacticalPoint = { x: F.L6.x - 4, y: F.L6.y + 6 };
const TA_10_TARGET: TacticalPoint = { x: F["10"].x - 6, y: F["10"].y + 2 };

export const ANIM_TA_LCV = buildAnimation(
  "anim.ta-lcv-buildup",
  "ta-lcv-buildup",
  [
    animStep(
      "situatie",
      0,
      1800,
      "Situatie",
      [
        { kind: "phase", phase: "initial" },
        { kind: "highlight", playerIds: ["us.LCV", "us.RCV", "us.L6"] },
        { kind: "hold" },
      ],
      "LCV bouwt op",
      { ballZone: "defensive-third", possessionTeam: "us", defensiveBlock: "low", balancePlayerIds: ["us.R6"] },
    ),
    animStep(
      "herken",
      1800,
      2000,
      "Herken",
      [
        { kind: "phase", phase: "recognition" },
        movePlayer("us.L6", { x: F.L6.x - 2, y: F.L6.y + 4 }),
        movePlayer("us.10", { x: F["10"].x - 3, y: F["10"].y }),
        movePlayer("us.LW", { x: F.LW.x, y: F.LW.y - 2 }),
        movePlayer("us.LB", { x: F.LB.x - 2, y: F.LB.y }),
        movePlayer("us.R6", { x: F.R6.x - 2, y: F.R6.y }),
        movePlayer("opp.9", { x: 34, y: 36 }),
        { kind: "highlight", playerIds: ["us.LCV", "us.L6", "us.10"] },
      ],
      "Druk op opbouw",
    ),
    animStep(
      "keuze",
      3800,
      1800,
      "Keuze",
      [
        { kind: "phase", phase: "prepare" },
        movePlayer("us.L6", TA_L6_SUPPORT),
        movePlayer("us.RCV", { x: F.RCV.x + 2, y: F.RCV.y }),
        showPassingLane(F.LCV, TA_L6_SUPPORT),
      ],
      "Korte steun zoeken",
    ),
    animStep(
      "speel",
      5600,
      1800,
      "Speel",
      [
        { kind: "phase", phase: "action" },
        ...passBall(F.LCV, TA_L6_SUPPORT),
        movePlayer("us.LB", { x: F.LB.x + 2, y: F.LB.y }),
      ],
      "Pass naar L6",
    ),
    animStep(
      "reactie",
      7400,
      2000,
      "Reactie",
      [
        { kind: "phase", phase: "reaction" },
        receiveBall("us.L6"),
        movePlayer("us.LCV", { x: F.LCV.x + 6, y: F.LCV.y - 2 }),
        movePlayer("us.10", TA_10_TARGET),
        movePlayer("us.R6", { x: F.R6.x + 2, y: F.R6.y - 2 }),
        movePlayer("us.RCV", { x: F.RCV.x + 4, y: F.RCV.y }),
      ],
      "LCV stapt — R6 balans",
      {
        ballZone: "middle-third",
        possessionTeam: "us",
        defensiveBlock: "mid",
        coverPlayerIds: ["us.L6"],
        balancePlayerIds: ["us.R6"],
        lastLineHeight: 24,
      },
    ),
    animStep(
      "vervolg",
      9400,
      2000,
      "Vervolg",
      [
        { kind: "phase", phase: "follow" },
        ...passBall(TA_L6_SUPPORT, TA_10_TARGET),
        moveGroup([
          { id: "us.LW", to: { x: F.LW.x + 4, y: F.LW.y } },
          { id: "us.LB", to: { x: F.LB.x + 6, y: F.LB.y } },
          { id: "us.SP", to: { x: F.SP.x - 2, y: F.SP.y } },
        ]),
      ],
      "Door naar tien",
    ),
    animStep(
      "gevolg",
      11400,
      2800,
      "BALANS",
      [
        { kind: "phase", phase: "result" },
        receiveBall("us.10"),
        moveGroup([
          { id: "us.R6", to: { x: F.R6.x + 4, y: F.R6.y } },
          { id: "us.RB", to: { x: F.RB.x + 4, y: F.RB.y } },
        ]),
        ...highlightSpace([{ x: 48, y: 28, w: 22, h: 24, label: "Twee opties" }], ["us.10", "us.R6"]),
        { kind: "hold" },
      ],
      "Twee opties open",
    ),
  ],
  { complexity: "situation", pauseAtEndMs: 2600 },
);

export const ANIM_GR_10_LOSS = buildAnimation(
  "anim.gr-10-loss",
  "gr-10-loss",
  [
    animStep(
      "situatie",
      0,
      1600,
      "Situatie",
      [
        { kind: "phase", phase: "initial" },
        { kind: "highlight", playerIds: ["us.10", "us.L6", "us.R6"] },
        { kind: "hold" },
      ],
      "Bal bij onze tien",
      { ballZone: "middle-third", possessionTeam: "us", defensiveBlock: "mid", balancePlayerIds: ["us.L6", "us.R6"] },
    ),
    animStep(
      "speel",
      1600,
      1800,
      "Speel",
      [
        { kind: "phase", phase: "action" },
        ...passBall(F["10"], { x: 62, y: 40 }, { interceptProgress: 0.55, kind: "fault" }),
        movePlayer("opp.8", { x: 60, y: 44 }, "easeOut"),
      ],
      "Foute pass verloren",
    ),
    animStep(
      "reactie",
      3400,
      1600,
      "Reactie",
      [
        { kind: "phase", phase: "reaction" },
        receiveBall("opp.8"),
        { kind: "highlight", playerIds: ["opp.8", "us.10"] },
      ],
      "Fout is voorbij",
    ),
    animStep(
      "herken",
      5000,
      1600,
      "TRIGGER",
      [
        { kind: "phase", phase: "recognition" },
        { kind: "highlight", playerIds: ["us.10", "us.L6"] },
        { kind: "hold" },
      ],
      "Volgende actie telt",
    ),
    animStep(
      "herstel",
      6600,
      2200,
      "TWEEDE DRUK",
      [
        { kind: "phase", phase: "follow" },
        movePlayerCurved("us.10", F["10"], { x: 48, y: 48 }, { bulge: 5, easing: "easeOut" }),
        movePlayer("us.L6", { x: 44, y: 42 }),
        movePlayer("us.R6", { x: 46, y: 54 }),
        movePlayer("opp.8", { x: 54, y: 46 }),
      ],
      "Sprint + 6’en dekken",
      {
        ballZone: "middle-third",
        possessionTeam: "opponent",
        defensiveBlock: "transition",
        primaryPressurePlayerId: "us.10",
        coverPlayerIds: ["us.L6"],
        balancePlayerIds: ["us.R6"],
      },
    ),
    animStep(
      "aansluiten",
      8800,
      2200,
      "SCHUIF DOOR",
      [
        { kind: "phase", phase: "follow" },
        moveGroup([
          { id: "us.LCV", to: { x: 30, y: 42 } },
          { id: "us.RCV", to: { x: 30, y: 56 } },
          { id: "us.LB", to: { x: 34, y: 24 } },
          { id: "us.RB", to: { x: 34, y: 74 } },
          { id: "us.SP", to: { x: 62, y: 48 } },
          { id: "us.RW", to: { x: 58, y: 70 } },
        ]),
        ...highlightSpace([{ x: 28, y: 36, w: 24, h: 28, label: "Compact" }], ["us.10", "us.L6"]),
      ],
      "Laatste lijn sluit aan",
      {
        ballZone: "middle-third",
        possessionTeam: "opponent",
        defensiveBlock: "mid",
        coverPlayerIds: ["us.L6", "us.10"],
        balancePlayerIds: ["us.R6"],
        lastLineHeight: 32,
      },
    ),
    animStep(
      "gevolg",
      11000,
      2800,
      "BALANS",
      [
        { kind: "phase", phase: "result" },
        { kind: "highlight", playerIds: ["us.10", "us.L6", "us.R6"], zoneIndexes: [0] },
        { kind: "hold" },
      ],
      "Blok staat weer dicht",
    ),
  ],
  { complexity: "situation", pauseAtEndMs: 2600 },
);

const IN_R6_AT: TacticalPoint = { x: 52, y: 54 };
const IN_RW_TARGET: TacticalPoint = { x: F.RW.x + 4, y: F.RW.y - 4 };

export const ANIM_IN_R6_WIN = buildAnimation(
  "anim.in-r6-win",
  "in-r6-win",
  [
    animStep(
      "situatie",
      0,
      1600,
      "Situatie",
      [
        { kind: "phase", phase: "initial" },
        { kind: "highlight", playerIds: ["opp.8", "us.R6", "us.L6"] },
        { kind: "hold" },
      ],
      "Tegenstander speelt centraal",
      {
        ballZone: "middle-third",
        possessionTeam: "opponent",
        defensiveBlock: "mid",
        balancePlayerIds: ["us.L6"],
      },
    ),
    animStep(
      "herken",
      1600,
      1800,
      "TRIGGER",
      [
        { kind: "phase", phase: "recognition" },
        ...passBall({ x: 62, y: 40 }, IN_R6_AT, { interceptProgress: 0.48, kind: "pass" }),
        movePlayer("us.R6", IN_R6_AT, "easeOut"),
        movePlayer("us.L6", { x: F.L6.x + 4, y: F.L6.y + 2 }),
        movePlayer("us.RCV", { x: F.RCV.x + 4, y: F.RCV.y }),
      ],
      "R6 leest de pass",
      {
        ballZone: "middle-third",
        possessionTeam: "loose",
        defensiveBlock: "mid",
        primaryPressurePlayerId: "us.R6",
        coverPlayerIds: ["us.L6"],
        balancePlayerIds: ["us.L6"],
      },
    ),
    animStep(
      "speel",
      3400,
      1600,
      "Speel",
      [
        { kind: "phase", phase: "action" },
        receiveBall("us.R6"),
        { kind: "highlight", playerIds: ["us.R6", "us.L6"] },
      ],
      "Balwinst bij R6",
    ),
    animStep(
      "keuze",
      5000,
      1800,
      "Keuze",
      [
        { kind: "phase", phase: "prepare" },
        movePlayer("us.RW", { x: IN_RW_TARGET.x - 2, y: IN_RW_TARGET.y }),
        movePlayer("us.10", { x: F["10"].x + 2, y: F["10"].y + 2 }),
        movePlayer("us.SP", { x: F.SP.x - 2, y: F.SP.y }),
        movePlayer("us.RB", { x: F.RB.x + 4, y: F.RB.y - 2 }),
        showPassingLane(IN_R6_AT, IN_RW_TARGET, "pass", true),
      ],
      "Ruimte op rechts",
    ),
    animStep(
      "vervolg",
      6800,
      2000,
      "Vervolg",
      [
        { kind: "phase", phase: "follow" },
        ...passBall(IN_R6_AT, IN_RW_TARGET),
        movePlayer("us.RB", { x: F.RB.x + 8, y: F.RB.y - 6 }),
        movePlayer("us.L6", { x: 48, y: 46 }),
      ],
      "Snel naar rechtsbuiten",
    ),
    animStep(
      "aansluiten",
      8800,
      2200,
      "SCHUIF DOOR",
      [
        { kind: "phase", phase: "follow" },
        receiveBall("us.RW"),
        moveGroup([
          { id: "us.10", to: { x: 64, y: 56 } },
          { id: "us.SP", to: { x: F.SP.x + 2, y: F.SP.y + 2 } },
          { id: "us.L6", to: { x: 50, y: 44 } },
          { id: "us.R6", to: { x: 54, y: 56 } },
          { id: "us.LCV", to: { x: F.LCV.x + 6, y: F.LCV.y } },
          { id: "us.RCV", to: { x: F.RCV.x + 6, y: F.RCV.y } },
          { id: "opp.rcm", to: { x: 58, y: 62 } },
        ]),
      ],
      "Linies schuiven mee",
      {
        ballZone: "right-flank",
        possessionTeam: "us",
        defensiveBlock: "mid",
        coverPlayerIds: ["us.RB", "us.R6"],
        balancePlayerIds: ["us.L6"],
        lastLineHeight: 28,
      },
    ),
    animStep(
      "gevolg",
      11000,
      2800,
      "BALANS",
      [
        { kind: "phase", phase: "result" },
        receiveBall("us.RW"),
        ...highlightSpace([{ x: 50, y: 40, w: 34, h: 36, label: "Tempo" }], ["us.RW", "us.10", "us.L6"]),
        { kind: "hold" },
      ],
      "Rest 2+1 + tempo",
    ),
  ],
  { complexity: "pattern", pauseAtEndMs: 2600 },
);

const IN_REST_10: TacticalPoint = { x: F["10"].x + 4, y: F["10"].y - 4 };

export const ANIM_IN_REST = buildAnimation(
  "anim.in-moment-rest",
  "in-moment-rest",
  [
    animStep(
      "situatie",
      0,
      1800,
      "Situatie",
      [
        { kind: "phase", phase: "initial" },
        { kind: "highlight", playerIds: ["us.RCV", "us.L6", "us.R6"] },
        { kind: "hold" },
      ],
      "Geen voordeel nu",
      {
        ballZone: "defensive-third",
        possessionTeam: "us",
        defensiveBlock: "low",
        balancePlayerIds: ["us.L6"],
      },
    ),
    animStep(
      "herken",
      1800,
      2000,
      "Herken",
      [
        { kind: "phase", phase: "recognition" },
        {
          kind: "setLines",
          lines: [
            { kind: "fault", from: F.RCV, to: F["10"], dashed: true },
            { kind: "pass", from: F.RCV, to: F.R6, dashed: true },
          ],
        },
        ...highlightSpace([{ x: 48, y: 44, w: 18, h: 18, label: "Gesloten" }], ["us.RCV"]),
        movePlayer("us.L6", { x: F.L6.x + 2, y: F.L6.y }),
      ],
      "Vooruitlijn is dicht",
    ),
    animStep(
      "speel",
      3800,
      1800,
      "Speel",
      [
        { kind: "phase", phase: "action" },
        ...passBall(F.RCV, F.R6),
        movePlayer("opp.8", { x: 58, y: 52 }),
        movePlayer("us.RB", { x: F.RB.x + 2, y: F.RB.y }),
      ],
      "Rustig naar R6",
    ),
    animStep(
      "reactie",
      5600,
      2000,
      "Reactie",
      [
        { kind: "phase", phase: "reaction" },
        receiveBall("us.R6"),
        moveGroup([
          { id: "opp.6", to: { x: 56, y: 48 } },
          { id: "opp.8", to: { x: 60, y: 56 } },
          { id: "us.10", to: IN_REST_10 },
          { id: "us.L6", to: { x: F.L6.x + 4, y: F.L6.y + 2 } },
          { id: "us.LCV", to: { x: 40, y: 42 } },
          { id: "us.RCV", to: { x: 42, y: 58 } },
          { id: "us.LB", to: { x: 38, y: 28 } },
          { id: "us.RB", to: { x: 40, y: 74 } },
          { id: "us.GK", to: { x: 20, y: 52 } },
        ]),
        ...highlightSpace([{ x: 58, y: 36, w: 18, h: 18, label: "Ruimte" }], ["us.10"]),
      ],
      "Blok schuift — L6 balans",
      {
        ballZone: "middle-third",
        possessionTeam: "us",
        defensiveBlock: "mid",
        coverPlayerIds: ["us.R6"],
        balancePlayerIds: ["us.L6"],
        depthThreatPlayerIds: ["opp.lst", "opp.rst"],
        lastLineHeight: 41,
        teamCompactness: { width: 52, length: 36 },
        restDefenseStructure: "2+1",
      },
    ),
    animStep(
      "vervolg",
      7600,
      2000,
      "Vervolg",
      [
        { kind: "phase", phase: "follow" },
        ...passBall(F.R6, IN_REST_10),
        movePlayer("us.RW", { x: F.RW.x - 2, y: F.RW.y - 6 }),
        movePlayer("us.SP", { x: F.SP.x - 2, y: F.SP.y }),
        movePlayer("opp.rm", { x: 66, y: 78 }),
        moveGroup([
          { id: "us.LCV", to: { x: 42, y: 42 } },
          { id: "us.RCV", to: { x: 44, y: 56 } },
          { id: "us.L6", to: { x: 48, y: 44 } },
          { id: "us.GK", to: { x: 22, y: 52 } },
        ]),
      ],
      "Nieuwe lijn naar tien",
      {
        ballZone: "middle-third",
        possessionTeam: "us",
        defensiveBlock: "mid",
        lastLineHeight: 43,
        restDefenseStructure: "2+1",
      },
    ),
    animStep(
      "gevolg",
      9600,
      3000,
      "BALANS",
      [
        { kind: "phase", phase: "result" },
        receiveBall("us.10"),
        moveGroup([
          { id: "us.LCV", to: { x: 40, y: 40 } },
          { id: "us.RCV", to: { x: 42, y: 56 } },
          { id: "us.L6", to: { x: 48, y: 44 } },
          { id: "us.R6", to: { x: 50, y: 56 } },
          { id: "us.GK", to: { x: 20, y: 50 } },
        ]),
        ...highlightSpace([{ x: 48, y: 30, w: 28, h: 28, label: "Tempo klaar" }], [
          "us.10",
          "us.R6",
          "us.L6",
        ]),
        { kind: "hold" },
      ],
      "Geduld — rest georganiseerd",
      {
        ballZone: "middle-third",
        possessionTeam: "us",
        defensiveBlock: "mid",
        balancePlayerIds: ["us.L6"],
        coverPlayerIds: ["us.R6", "us.RCV"],
        depthThreatPlayerIds: ["opp.lst"],
        lastLineHeight: 41,
        teamCompactness: { width: 54, length: 34 },
        restDefenseStructure: "2+1",
      },
    ),
  ],
  { complexity: "situation", pauseAtEndMs: 2600 },
);

export const ANIM_ME_SPITS = buildAnimation(
  "anim.me-spits-miss",
  "me-spits-miss",
  [
    animStep(
      "situatie",
      0,
      1200,
      "Situatie",
      [
        { kind: "phase", phase: "initial" },
        { kind: "highlight", playerIds: ["us.SP"] },
        { kind: "hold" },
      ],
      "Grote kans voor spits",
    ),
    animStep(
      "speel",
      1200,
      1300,
      "Speel",
      [
        { kind: "phase", phase: "action" },
        ...passBall({ x: 78, y: 48 }, { x: 92, y: 48 }, { kind: "pass" }),
        movePlayer("us.SP", { x: 90, y: 48 }, "easeOut"),
      ],
      "Schot op doel",
    ),
    animStep(
      "gevolg-mis",
      2500,
      1200,
      "Gevolg",
      [
        { kind: "phase", phase: "result" },
        { kind: "possession", holderId: null },
        {
          kind: "setZones",
          zones: [{ x: 88, y: 40, w: 10, h: 16, label: "Mis" }],
        },
        { kind: "highlight", playerIds: ["us.SP"] },
      ],
      "Kans is voorbij",
    ),
    animStep(
      "herken",
      3700,
      1200,
      "Herken",
      [
        { kind: "phase", phase: "recognition" },
        movePlayer("us.SP", { x: 86, y: 50 }),
        { kind: "hold" },
      ],
      "Wedstrijd gaat door",
    ),
    animStep(
      "reactie",
      4900,
      1400,
      "Reactie",
      [
        { kind: "phase", phase: "reaction" },
        ...passBall({ x: 88, y: 52 }, { x: 74, y: 50 }),
        receiveBall("opp.cb"),
      ],
      "Tegenstander uitverdedigen",
    ),
    animStep(
      "herfocus",
      6300,
      1600,
      "Herfocus",
      [
        { kind: "phase", phase: "follow" },
        movePlayer("us.SP", { x: 74, y: 46 }, "easeOut"),
        movePlayer("us.10", { x: 62, y: 48 }),
        movePlayer("us.LW", { x: 70, y: 32 }),
        {
          kind: "setLines",
          lines: [{ kind: "press", from: { x: 74, y: 46 }, to: { x: 74, y: 50 } }],
        },
      ],
      "Spits sprint terug",
    ),
    animStep(
      "aansluiten",
      7900,
      2200,
      "SCHUIF DOOR",
      [
        { kind: "phase", phase: "follow" },
        moveGroup([
          { id: "us.R6", to: { x: 52, y: 54 } },
          { id: "us.L6", to: { x: 48, y: 40 } },
          { id: "us.LCV", to: { x: 34, y: 40 } },
          { id: "us.RCV", to: { x: 34, y: 58 } },
          { id: "us.LB", to: { x: 38, y: 22 } },
          { id: "us.RB", to: { x: 38, y: 76 } },
        ]),
        ...highlightSpace([{ x: 56, y: 36, w: 24, h: 28, label: "Opnieuw druk" }], ["us.SP", "us.10"]),
      ],
      "Blok herstelt druk",
      {
        ballZone: "final-third",
        possessionTeam: "opponent",
        defensiveBlock: "mid",
        primaryPressurePlayerId: "us.SP",
        coverPlayerIds: ["us.10", "us.L6"],
        balancePlayerIds: ["us.R6"],
        lastLineHeight: 36,
      },
    ),
    animStep(
      "gevolg",
      10100,
      2800,
      "BALANS",
      [
        { kind: "phase", phase: "result" },
        { kind: "highlight", playerIds: ["us.SP", "us.10", "us.LW", "us.L6"], zoneIndexes: [0] },
        { kind: "hold" },
      ],
      "Volgende actie begint",
    ),
  ],
  { complexity: "situation", pauseAtEndMs: 2600 },
);

export const ANIM_ME_10_REFOCUS = buildAnimation(
  "anim.me-10-refocus",
  "me-10-refocus",
  [
    animStep(
      "situatie",
      0,
      1600,
      "Situatie",
      [
        { kind: "phase", phase: "initial" },
        { kind: "highlight", playerIds: ["us.10", "us.L6", "us.R6"] },
        { kind: "hold" },
      ],
      "Balverlies bij tien",
      {
        ballZone: "middle-third",
        possessionTeam: "us",
        defensiveBlock: "mid",
        balancePlayerIds: ["us.L6", "us.R6"],
      },
    ),
    animStep(
      "speel",
      1600,
      1800,
      "Speel",
      [
        { kind: "phase", phase: "action" },
        ...passBall(F["10"], { x: 58, y: 44 }, { interceptProgress: 0.5, kind: "fault" }),
        movePlayer("opp.8", { x: 56, y: 46 }, "easeOut"),
      ],
      "Pass wordt onderschept",
    ),
    animStep(
      "herfocus",
      3400,
      2000,
      "TRIGGER",
      [
        { kind: "phase", phase: "follow" },
        receiveBall("opp.8"),
        movePlayerCurved("us.10", F["10"], { x: 52, y: 48 }, { bulge: 5, easing: "easeOut" }),
        {
          kind: "setLines",
          lines: [{ kind: "press", from: { x: 52, y: 48 }, to: { x: 56, y: 46 } }],
        },
      ],
      "Accepteer en sprint terug",
      {
        ballZone: "middle-third",
        possessionTeam: "opponent",
        defensiveBlock: "transition",
        primaryPressurePlayerId: "us.10",
        coverPlayerIds: ["us.L6"],
      },
    ),
    animStep(
      "reactie",
      5400,
      2000,
      "TWEEDE DRUK",
      [
        { kind: "phase", phase: "reaction" },
        movePlayer("opp.8", { x: 50, y: 50 }),
        movePlayer("us.L6", { x: 48, y: 44 }),
        { kind: "highlight", playerIds: ["us.10", "opp.8", "us.L6"] },
      ],
      "Druk + rugdekking",
    ),
    animStep(
      "aansluiten",
      7400,
      2400,
      "SCHUIF DOOR",
      [
        { kind: "phase", phase: "follow" },
        moveGroup([
          { id: "us.L6", to: { x: 46, y: 42 } },
          { id: "us.R6", to: { x: 48, y: 56 } },
          { id: "us.SP", to: { x: 68, y: 48 } },
          { id: "us.LCV", to: { x: 32, y: 42 } },
          { id: "us.RCV", to: { x: 32, y: 58 } },
          { id: "us.LB", to: { x: 36, y: 24 } },
          { id: "us.RB", to: { x: 36, y: 74 } },
        ]),
      ],
      "Team helpt mee",
      {
        ballZone: "middle-third",
        possessionTeam: "opponent",
        defensiveBlock: "mid",
        primaryPressurePlayerId: "us.10",
        coverPlayerIds: ["us.L6"],
        balancePlayerIds: ["us.R6"],
        lastLineHeight: 34,
      },
    ),
    animStep(
      "gevolg",
      9800,
      3000,
      "BALANS",
      [
        { kind: "phase", phase: "result" },
        ...highlightSpace([{ x: 36, y: 36, w: 28, h: 28, label: "Vertraagd" }], [
          "us.10",
          "us.L6",
          "us.R6",
        ]),
        { kind: "hold" },
      ],
      "Nieuwe situatie begint",
    ),
  ],
  { complexity: "situation", pauseAtEndMs: 2600 },
);
