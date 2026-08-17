/**
 * Collective Tactical Organisation Engine V2 — UEFA Pro team organisation.
 * Linies zijn relaties; last-line, rest-defense, opponent block en team length
 * zijn expliciete state — geen losse coördinaten.
 */

import type { TacticalPoint } from "@/lib/academie/tactical-visual-system";
import { clampPitch } from "@/lib/academie/tactical-intelligence-roles";
import { dist } from "@/lib/academie/tactical-animation-collision";
import type { TacticalFormationId } from "@/lib/academie/tactical-formation-presets";

export type CollectiveTeamId = "us" | "opponent";

export type CollectivePhase =
  | "build-up"
  | "progression"
  | "final-third"
  | "high-press"
  | "mid-block"
  | "low-block"
  | "attacking-transition"
  | "defensive-transition";

export type CollectiveBlockHeight = "high" | "mid" | "low";

export type CollectivePressure =
  | "none"
  | "passive"
  | "controlled"
  | "strong";

export type CollectiveDepthThreat =
  | "none"
  | "limited"
  | "active"
  | "immediate";

export type RestDefenseStructure = "2+1" | "3+1" | "3+2" | "4+1";

export type LastLineAction = "step" | "hold" | "drop" | "track-run" | "handover";

export type BallSide = "left" | "center" | "right";

export type CollectiveLineId = "attack" | "midfield" | "defense";

export type CollectiveLine = {
  id: CollectiveLineId;
  height: number;
  width: number;
  centerY: number;
  spacing: number;
  orientationToBall: BallSide;
  linkedForward?: CollectiveLineId;
  linkedBehind?: CollectiveLineId;
};

export type CollectiveTeamState = {
  team: CollectiveTeamId;
  formation:
    | "4-2-3-1"
    | "4-3-3"
    | "4-4-2"
    | "4-4-1-1"
    | "4-5-1"
    | "3-2-4-1"
    | "2-3-2-3"
    | "3-1-5-1";
  phase: CollectivePhase;
  blockHeight: CollectiveBlockHeight;
  lineHeights: {
    attack: number;
    midfield: number;
    defense: number;
  };
  compactness: {
    teamLength: number;
    teamWidth: number;
    attackMidfieldGap: number;
    midfieldDefenseGap: number;
  };
  ballSide: BallSide;
  pressureOnBall: CollectivePressure;
  depthThreat: CollectiveDepthThreat;
  restDefenseStructure?: RestDefenseStructure;
  lastLineAction?: LastLineAction;
  frontFootCbId?: string;
  coverCbId?: string;
  transitionThreatPlayerIds?: string[];
};

export type OpponentTacticalBrief = {
  formation: "4-3-3" | "4-2-3-1" | "4-4-2" | "4-4-1-1" | "4-5-1";
  block: CollectiveBlockHeight;
  pressingIntent: "protect-center" | "force-wide" | "press-forward" | "delay";
  transitionThreats: string[];
  keyMarkers: Record<string, string>;
};

/** Handmatige UEFA-brief — verplicht voor hoofdsequences. */
export type CollectiveSequenceBrief = {
  situationId: string;
  ourFormation: CollectiveTeamState["formation"];
  opponentFormation: OpponentTacticalBrief["formation"];
  possessionPhase: CollectivePhase;
  ballZone: string;
  ourIntendedStructure: string;
  opponentIntendedStructure: string;
  primaryAdvantage: string;
  primaryThreat: string;
  restDefensePlan: string;
  lastLineRule: string;
  expectedOpponentReaction: string;
  endStructure: string;
  transitionThreatPlayerIds: string[];
  opponentBrief: OpponentTacticalBrief;
};

/** Pitch-% guidelines (~1 unit ≈ 1m). */
export const TEAM_LENGTH_GUIDE = {
  organisedPossession: { min: 30, max: 45 },
  finalThird: { min: 25, max: 40 },
  highPress: { min: 25, max: 35 },
  midBlock: { min: 25, max: 40 },
  /** Hard fail for main sequences when sustained above this. */
  excessive: 50,
} as const;

export const LINE_GAP_GUIDE = {
  normal: { min: 8, max: 15 },
  transition: { min: 15, max: 20 },
  excessive: 20,
} as const;

export const CB_PAIR_SPACING = { min: 10, max: 14 } as const;

const US_ATTACK = ["us.SP", "us.LW", "us.RW"] as const;
const US_MID = ["us.L6", "us.R6", "us.10"] as const;
const US_DEF = ["us.LB", "us.LCV", "us.RCV", "us.RB"] as const;

export function ballSideFromPoint(ball: TacticalPoint): BallSide {
  if (ball.y < 38) return "left";
  if (ball.y > 62) return "right";
  return "center";
}

export function avgX(ids: readonly string[], playerAt: Record<string, TacticalPoint>): number | undefined {
  const pts = ids.map((id) => playerAt[id]).filter(Boolean) as TacticalPoint[];
  if (!pts.length) return undefined;
  return pts.reduce((s, p) => s + p.x, 0) / pts.length;
}

export function measureTeamLength(
  playerAt: Record<string, TacticalPoint>,
  team: CollectiveTeamId,
): { length: number; deepest: number; highest: number } {
  const pts = Object.entries(playerAt)
    .filter(([id]) => {
      if (!id.startsWith(team === "us" ? "us." : "opp.")) return false;
      if (id.endsWith(".GK") || id.endsWith(".gk") || id === "us.GK" || id === "opp.gk") return false;
      return true;
    })
    .map(([, p]) => p);
  if (pts.length < 2) return { length: 0, deepest: 0, highest: 0 };
  const xs = pts.map((p) => p.x);
  const deepest = team === "us" ? Math.min(...xs) : Math.max(...xs);
  const highest = team === "us" ? Math.max(...xs) : Math.min(...xs);
  return { length: Math.abs(highest - deepest), deepest, highest };
}

export function measureTeamWidth(
  playerAt: Record<string, TacticalPoint>,
  team: CollectiveTeamId,
): number {
  const pts = Object.entries(playerAt)
    .filter(([id]) => id.startsWith(team === "us" ? "us." : "opp.") && !id.toLowerCase().includes("gk"))
    .map(([, p]) => p);
  if (pts.length < 2) return 0;
  const ys = pts.map((p) => p.y);
  return Math.max(...ys) - Math.min(...ys);
}

export function measureLineHeightsUs(playerAt: Record<string, TacticalPoint>): {
  attack: number;
  midfield: number;
  defense: number;
} {
  return {
    attack: avgX(US_ATTACK, playerAt) ?? 70,
    midfield: avgX(US_MID, playerAt) ?? 45,
    defense: avgX(US_DEF, playerAt) ?? 28,
  };
}

export function measureLineGapsUs(playerAt: Record<string, TacticalPoint>): {
  attackMidfieldGap: number;
  midfieldDefenseGap: number;
} {
  const h = measureLineHeightsUs(playerAt);
  return {
    attackMidfieldGap: h.attack - h.midfield,
    midfieldDefenseGap: h.midfield - h.defense,
  };
}

export function buildCollectiveLine(
  id: CollectiveLineId,
  height: number,
  width: number,
  centerY: number,
  ballSide: BallSide,
): CollectiveLine {
  const linked =
    id === "attack"
      ? { linkedBehind: "midfield" as const }
      : id === "midfield"
        ? { linkedForward: "attack" as const, linkedBehind: "defense" as const }
        : { linkedForward: "midfield" as const };
  return {
    id,
    height,
    width,
    centerY,
    spacing: width / 3,
    orientationToBall: ballSide,
    ...linked,
  };
}

export function connectLines(
  attack: CollectiveLine,
  midfield: CollectiveLine,
  defense: CollectiveLine,
  maxGap = LINE_GAP_GUIDE.normal.max,
): { attack: CollectiveLine; midfield: CollectiveLine; defense: CollectiveLine } {
  let mid = { ...midfield };
  let def = { ...defense };
  const amGap = attack.height - mid.height;
  if (amGap > maxGap) {
    mid = { ...mid, height: attack.height - maxGap };
  }
  const mdGap = mid.height - def.height;
  if (mdGap > maxGap) {
    def = { ...def, height: mid.height - maxGap };
  }
  return { attack, midfield: mid, defense: def };
}

export function compressTeamLength(
  lineHeights: CollectiveTeamState["lineHeights"],
  maxLength: number,
): CollectiveTeamState["lineHeights"] {
  const length = lineHeights.attack - lineHeights.defense;
  if (length <= maxLength) return lineHeights;
  const excess = length - maxLength;
  return {
    attack: lineHeights.attack,
    midfield: lineHeights.midfield + excess * 0.35,
    defense: lineHeights.defense + excess * 0.65,
  };
}

export function expandForPossession(
  lineHeights: CollectiveTeamState["lineHeights"],
  minLength = TEAM_LENGTH_GUIDE.organisedPossession.min,
): CollectiveTeamState["lineHeights"] {
  const length = lineHeights.attack - lineHeights.defense;
  if (length >= minLength) return lineHeights;
  const need = minLength - length;
  return {
    attack: Math.min(88, lineHeights.attack + need * 0.4),
    midfield: lineHeights.midfield,
    defense: Math.max(14, lineHeights.defense - need * 0.2),
  };
}

export function shiftLineWithBall(
  line: CollectiveLine,
  ball: TacticalPoint,
  opts?: { dxFactor?: number; dyFactor?: number },
): CollectiveLine {
  const dx = opts?.dxFactor ?? 0.15;
  const dy = opts?.dyFactor ?? 0.35;
  return {
    ...line,
    height: clampPitch({ x: line.height + (ball.x - 50) * dx, y: 50 }).x,
    centerY: clampPitch({ x: 50, y: line.centerY + (ball.y - 50) * dy }).y,
    orientationToBall: ballSideFromPoint(ball),
  };
}

export function shiftFarSide(
  playerAt: Record<string, TacticalPoint>,
  ballSide: BallSide,
  team: CollectiveTeamId = "us",
): Record<string, TacticalPoint> {
  const out: Record<string, TacticalPoint> = {};
  if (team !== "us") return out;
  const farBack = ballSide === "right" ? "us.LB" : ballSide === "left" ? "us.RB" : null;
  const farWing = ballSide === "right" ? "us.LW" : ballSide === "left" ? "us.RW" : null;
  if (farBack && playerAt[farBack]) {
    const p = playerAt[farBack]!;
    out[farBack] = clampPitch({
      x: p.x + 2,
      y: ballSide === "right" ? Math.min(36, p.y + 8) : Math.max(64, p.y - 8),
    });
  }
  if (farWing && playerAt[farWing]) {
    const p = playerAt[farWing]!;
    out[farWing] = clampPitch({
      x: p.x,
      y: ballSide === "right" ? Math.min(32, p.y + 6) : Math.max(68, p.y - 6),
    });
  }
  return out;
}

export type LastLineEvalInput = {
  pressureOnBall: CollectivePressure;
  ballCarrierBodyShape: "closed" | "half-open" | "open";
  depthThreat: CollectiveDepthThreat;
  nearestOpponentAttackers: number;
  midfieldHeight: number;
  currentLastLineHeight: number;
  coverBehindPressure: boolean;
  ballZone: string;
  /** True when CBs have no direct mark and midfield is connected. */
  freeToStep?: boolean;
};

export function evaluateLastLineAction(input: LastLineEvalInput): LastLineAction {
  const {
    pressureOnBall,
    ballCarrierBodyShape,
    depthThreat,
    nearestOpponentAttackers,
    midfieldHeight,
    currentLastLineHeight,
    coverBehindPressure,
    freeToStep,
  } = input;

  if (depthThreat === "immediate") return "track-run";
  if (depthThreat === "active" && nearestOpponentAttackers >= 1) return "hold";

  const strongPress =
    (pressureOnBall === "strong" || pressureOnBall === "controlled") &&
    ballCarrierBodyShape !== "open" &&
    coverBehindPressure;

  const gap = midfieldHeight - currentLastLineHeight;

  if (strongPress && depthThreat === "none" && gap > 10) return "step";
  if (freeToStep && depthThreat !== "active" && gap > 12) {
    return "step";
  }
  if (pressureOnBall === "none" && ballCarrierBodyShape === "open") return "drop";
  if (pressureOnBall === "passive" && depthThreat === "limited") return "hold";
  if (nearestOpponentAttackers === 0 && gap > 14 && pressureOnBall !== "none") return "handover";
  if (gap > LINE_GAP_GUIDE.excessive && pressureOnBall !== "none") return "step";
  return "hold";
}

export function stepLastLine(defenseHeight: number, midfieldHeight: number, amount = 8): number {
  const target = midfieldHeight - LINE_GAP_GUIDE.normal.max;
  return Math.min(defenseHeight + amount, target, midfieldHeight - 8);
}

export function dropLastLine(defenseHeight: number, amount = 6): number {
  return Math.max(12, defenseHeight - amount);
}

export function chooseRestDefenseStructure(opts: {
  ballSide: BallSide;
  phase: CollectivePhase;
  farBackTucked: boolean;
  bothSixesUnder?: boolean;
}): RestDefenseStructure {
  if (opts.bothSixesUnder) return "3+2";
  if (opts.phase === "final-third" && opts.farBackTucked) return "3+1";
  if (opts.phase === "final-third") return "2+1";
  if (opts.ballSide !== "center") return "3+1";
  return "2+1";
}

/**
 * Rest defense height tracks ball + midfield — NOT a static deep line.
 * Possession with control → higher; open depth threat → deeper.
 */
export function restDefenseHeight(opts: {
  ball: TacticalPoint;
  midfieldHeight: number;
  depthThreat: CollectiveDepthThreat;
  pressureOnBall: CollectivePressure;
  phase: CollectivePhase;
}): number {
  const { ball, midfieldHeight, depthThreat, pressureOnBall, phase } = opts;
  let base = midfieldHeight - 12;
  if (phase === "final-third") base = midfieldHeight - 10;
  if (phase === "progression") base = midfieldHeight - 12;
  if (phase === "build-up") base = Math.min(base, ball.x - 18);

  if (depthThreat === "immediate") base -= 10;
  else if (depthThreat === "active") base -= 6;
  else if (depthThreat === "limited") base -= 2;

  if (pressureOnBall === "strong" || pressureOnBall === "controlled") base += 3;
  if (pressureOnBall === "none" && depthThreat !== "none") base -= 4;

  // Ball-relative floor/ceiling — never park at x=20 when ball is at 60+
  const ballFloor = ball.x - 28;
  const ballCeil = ball.x - 16;
  base = Math.max(ballFloor, Math.min(ballCeil, base));
  return Math.max(18, Math.min(52, base));
}

export function positionRestDefenseCollective(opts: {
  ball: TacticalPoint;
  structure?: RestDefenseStructure;
  midfieldHeight?: number;
  depthThreat?: CollectiveDepthThreat;
  pressureOnBall?: CollectivePressure;
  phase?: CollectivePhase;
  ballSide?: BallSide;
}): {
  lcv: TacticalPoint;
  rcv: TacticalPoint;
  six: TacticalPoint;
  lb: TacticalPoint;
  rb: TacticalPoint;
  gk: TacticalPoint;
  frontFoot: "LCV" | "RCV";
  structure: RestDefenseStructure;
} {
  const ballSide = opts.ballSide ?? ballSideFromPoint(opts.ball);
  const mid = opts.midfieldHeight ?? opts.ball.x - 8;
  const depthThreat = opts.depthThreat ?? "limited";
  const pressure = opts.pressureOnBall ?? "controlled";
  const phase = opts.phase ?? "progression";
  const structure =
    opts.structure ??
    chooseRestDefenseStructure({
      ballSide,
      phase,
      farBackTucked: true,
    });

  const baseX = restDefenseHeight({
    ball: opts.ball,
    midfieldHeight: mid,
    depthThreat,
    pressureOnBall: pressure,
    phase,
  });
  const centerY = 50 + (opts.ball.y - 50) * 0.35;
  const pair = (CB_PAIR_SPACING.min + CB_PAIR_SPACING.max) / 2;
  const frontFoot: "LCV" | "RCV" = ballSide === "right" ? "RCV" : "LCV";

  const lcv = clampPitch({
    x: frontFoot === "LCV" ? baseX + 2 : baseX,
    y: centerY - pair / 2,
  });
  const rcv = clampPitch({
    x: frontFoot === "RCV" ? baseX + 2 : baseX,
    y: centerY + pair / 2,
  });
  const six = clampPitch({
    x: baseX + 10,
    y: centerY + (ballSide === "right" ? 4 : ballSide === "left" ? -4 : 0),
  });

  const ballBackHigher = ballSide === "right";
  const rb = clampPitch({
    x: ballBackHigher ? Math.max(baseX + 8, opts.ball.x - 14) : baseX + 2,
    y: ballBackHigher ? Math.min(88, opts.ball.y + 8) : Math.min(72, centerY + 22),
  });
  const lb = clampPitch({
    x: !ballBackHigher && ballSide === "left" ? Math.max(baseX + 8, opts.ball.x - 14) : baseX + 2,
    y:
      ballSide === "left"
        ? Math.max(12, opts.ball.y - 8)
        : Math.max(28, centerY - 22),
  });

  // GK supports behind last line — slides with ball angle, not glued to (8,50)
  const gk = clampPitch({
    x: Math.max(6, Math.min(18, baseX - 16)),
    y: 50 + (opts.ball.y - 50) * 0.28,
  });

  return { lcv, rcv, six, lb, rb, gk, frontFoot, structure };
}

export function keeperSupportPosition(
  lastLineHeight: number,
  ball: TacticalPoint,
  team: CollectiveTeamId = "us",
): TacticalPoint {
  if (team === "us") {
    return clampPitch({
      x: Math.max(10, Math.min(24, lastLineHeight - 14)),
      y: 50 + (ball.y - 50) * 0.35,
    });
  }
  return clampPitch({
    x: Math.min(96, Math.max(80, lastLineHeight + 12)),
    y: 50 + (ball.y - 50) * 0.35,
  });
}

/** Full us shape from collective principles (attack L→R). */
export function usCollectiveShape(opts: {
  ball: TacticalPoint;
  phase?: CollectivePhase;
  depthThreat?: CollectiveDepthThreat;
  pressureOnBall?: CollectivePressure;
  formation?: CollectiveTeamState["formation"];
}): Record<string, TacticalPoint> {
  const ball = opts.ball;
  const phase = opts.phase ?? (ball.x > 66 ? "final-third" : ball.x > 40 ? "progression" : "build-up");
  const depthThreat = opts.depthThreat ?? "limited";
  const pressure = opts.pressureOnBall ?? "controlled";
  const ballSide = ballSideFromPoint(ball);
  const flank = ballSide === "right" ? 1 : ballSide === "left" ? -1 : 0;

  const attackH = Math.min(86, Math.max(62, ball.x + (phase === "final-third" ? 8 : 14)));
  const midH = Math.max(36, Math.min(attackH - 12, ball.x - (phase === "final-third" ? 4 : 6)));
  let lines = {
    attack: attackH,
    midfield: midH,
    defense: midH - 12,
  };
  lines = compressTeamLength(
    lines,
    phase === "final-third"
      ? TEAM_LENGTH_GUIDE.finalThird.max
      : TEAM_LENGTH_GUIDE.organisedPossession.max,
  );

  const rest = positionRestDefenseCollective({
    ball,
    midfieldHeight: lines.midfield,
    depthThreat,
    pressureOnBall: pressure,
    phase,
    ballSide,
  });

  // Override defense height from rest model
  lines.defense = (rest.lcv.x + rest.rcv.x) / 2;

  return {
    "us.GK": rest.gk,
    "us.LCV": rest.lcv,
    "us.RCV": rest.rcv,
    "us.LB": rest.lb,
    "us.RB": rest.rb,
    "us.L6":
      rest.structure === "2+1" || rest.structure === "3+1"
        ? rest.six
        : clampPitch({ x: lines.midfield - 2, y: ball.y - 10 }),
    "us.R6": clampPitch({
      x: lines.midfield + (ballSide === "right" ? 4 : 0),
      y: ball.y + (ballSide === "right" ? 6 : 8),
    }),
    "us.10": clampPitch({
      x: Math.min(lines.attack - 8, ball.x + 2),
      y: ball.y - flank * 3,
    }),
    "us.LW": clampPitch({
      x: Math.min(82, lines.attack - (ballSide === "right" ? 4 : 0)),
      y: Math.max(14, ballSide === "right" ? 26 : ball.y - 28),
    }),
    "us.RW": clampPitch({
      x: Math.min(84, lines.attack - (ballSide === "left" ? 4 : 0)),
      y: Math.min(88, ballSide === "left" ? 74 : ball.y + 22),
    }),
    "us.SP": clampPitch({
      x: lines.attack,
      y: 50 + flank * 4,
    }),
  };
}

/** Opponent block reacts as one unit (defend R→L). */
export function opponentCollectiveShape(opts: {
  ball: TacticalPoint;
  formation?: OpponentTacticalBrief["formation"];
  block?: CollectiveBlockHeight;
  pressingIntent?: OpponentTacticalBrief["pressingIntent"];
  /** Optional id remap for sequences using opp.cbL etc. */
  idStyle?: "kw" | "press" | "442";
}): Record<string, TacticalPoint> {
  const ball = opts.ball;
  const block = opts.block ?? "mid";
  const intent = opts.pressingIntent ?? "protect-center";
  const ballSide = ballSideFromPoint(ball);
  const flank = ballSide === "right" ? 1 : ballSide === "left" ? -1 : 0;

  const backBase = block === "high" ? 72 : block === "low" ? 84 : 78;
  // Shift whole block toward ball
  const shiftY = (ball.y - 50) * 0.4;
  const stepX =
    intent === "press-forward" ? -6 : intent === "delay" ? 2 : ball.x > 60 ? -4 : 0;

  const backX = backBase + stepX;
  const dmX = backX - 12;
  const amX = dmX - 10;
  const stX = Math.max(32, ball.x - 16);

  const ballBackSteps = ballSide === "right"; // our right = their left back steps
  const lb = clampPitch({
    x: ballBackSteps ? backX - 4 : backX,
    y: Math.max(12, 22 + shiftY + (ballBackSteps ? -4 : 0)),
  });
  const rb = clampPitch({
    x: !ballBackSteps && ballSide === "left" ? backX - 4 : backX,
    y: Math.min(88, 78 + shiftY + (!ballBackSteps && ballSide === "left" ? 4 : 0)),
  });
  const lcb = clampPitch({
    x: backX,
    y: 38 + shiftY * 0.7,
  });
  const rcb = clampPitch({
    x: backX,
    y: 62 + shiftY * 0.7,
  });

  // Near DM steps; far DM covers
  const nearDmY = ball.y + flank * 4;
  const farDmY = ball.y - flank * 14;
  const stepDm = clampPitch({
    x: Math.max(ball.x + 8, dmX - 4),
    y: nearDmY,
  });
  const coverDm = clampPitch({
    x: dmX + 2,
    y: Math.max(28, Math.min(72, farDmY)),
  });

  const kw: Record<string, TacticalPoint> = {
    "opp.gk": keeperSupportPosition(backX, ball, "opponent"),
    "opp.lb": lb,
    "opp.lcb": lcb,
    "opp.rcb": rcb,
    "opp.rb": rb,
    "opp.ldm": ballSide !== "right" ? stepDm : coverDm,
    "opp.rdm": ballSide === "right" ? stepDm : coverDm,
    "opp.10": clampPitch({ x: amX + 2, y: ball.y + 6 }),
    "opp.lw": clampPitch({ x: amX, y: Math.max(18, ball.y - 26) }),
    "opp.rw": clampPitch({ x: amX, y: Math.min(82, ball.y + 24) }),
    "opp.st": clampPitch({ x: stX, y: 50 + flank * 2 }),
  };

  if (opts.idStyle === "press") {
    return {
      "opp.gk": kw["opp.gk"]!,
      "opp.lb": kw["opp.lb"]!,
      "opp.cbL": kw["opp.lcb"]!,
      "opp.cbR": kw["opp.rcb"]!,
      "opp.rb": kw["opp.rb"]!,
      "opp.6": clampPitch({ x: dmX, y: 50 + shiftY * 0.5 }),
      "opp.8": kw["opp.ldm"]!,
      "opp.10": kw["opp.rdm"]!,
      "opp.lw": kw["opp.lw"]!,
      "opp.st": kw["opp.st"]!,
      "opp.rw": kw["opp.rw"]!,
    };
  }

  if (opts.idStyle === "442") {
    return {
      "opp.gk": kw["opp.gk"]!,
      "opp.lb": kw["opp.lb"]!,
      "opp.lcb": kw["opp.lcb"]!,
      "opp.rcb": kw["opp.rcb"]!,
      "opp.rb": kw["opp.rb"]!,
      "opp.lm": kw["opp.lw"]!,
      "opp.lcm": kw["opp.ldm"]!,
      "opp.rcm": kw["opp.rdm"]!,
      "opp.rm": kw["opp.rw"]!,
      "opp.lst": clampPitch({ x: stX, y: 42 + shiftY * 0.3 }),
      "opp.rst": clampPitch({ x: stX, y: 58 + shiftY * 0.3 }),
    };
  }

  return kw;
}

export type CollectiveShiftInput = {
  fromBallZone: string;
  toBallZone: string;
  ball: TacticalPoint;
  usState?: Partial<CollectiveTeamState>;
  opponentState?: Partial<CollectiveTeamState>;
  durationMs?: number;
  threatState?: CollectiveDepthThreat;
  opponentIdStyle?: "kw" | "press" | "442";
};

export type CollectiveShiftResult = {
  usTargets: Record<string, TacticalPoint>;
  opponentTargets: Record<string, TacticalPoint>;
  usState: CollectiveTeamState;
  opponentState: CollectiveTeamState;
  lastLineAction: LastLineAction;
  farSideAdjustments: Record<string, TacticalPoint>;
  restDefenseStructure: RestDefenseStructure;
};

export function applyCollectiveShift(input: CollectiveShiftInput): CollectiveShiftResult {
  const ball = input.ball;
  const depthThreat = input.threatState ?? input.usState?.depthThreat ?? "limited";
  const pressure = input.usState?.pressureOnBall ?? "controlled";
  const phase = input.usState?.phase ?? (ball.x > 66 ? "final-third" : "progression");
  const ballSide = ballSideFromPoint(ball);

  const usTargets = usCollectiveShape({
    ball,
    phase,
    depthThreat,
    pressureOnBall: pressure,
    formation: input.usState?.formation ?? "4-2-3-1",
  });

  const midH = (usTargets["us.L6"]!.x + usTargets["us.R6"]!.x + usTargets["us.10"]!.x) / 3;
  const defH = (usTargets["us.LCV"]!.x + usTargets["us.RCV"]!.x) / 2;
  const lastLineAction = evaluateLastLineAction({
    pressureOnBall: pressure,
    ballCarrierBodyShape: pressure === "none" ? "open" : "closed",
    depthThreat,
    nearestOpponentAttackers: depthThreat === "none" ? 0 : 1,
    midfieldHeight: midH,
    currentLastLineHeight: defH,
    coverBehindPressure: true,
    ballZone: input.toBallZone,
    freeToStep: depthThreat === "none" || depthThreat === "limited",
  });

  if (lastLineAction === "step") {
    const stepped = stepLastLine(defH, midH, 6);
    const dx = stepped - defH;
    for (const id of ["us.LB", "us.LCV", "us.RCV", "us.RB"] as const) {
      const p = usTargets[id]!;
      usTargets[id] = clampPitch({ x: p.x + dx, y: p.y });
    }
    usTargets["us.GK"] = keeperSupportPosition(stepped, ball, "us");
  } else if (lastLineAction === "drop") {
    const dropped = dropLastLine(defH, 5);
    const dx = dropped - defH;
    for (const id of ["us.LB", "us.LCV", "us.RCV", "us.RB"] as const) {
      const p = usTargets[id]!;
      usTargets[id] = clampPitch({ x: p.x + dx, y: p.y });
    }
    usTargets["us.GK"] = keeperSupportPosition(dropped, ball, "us");
  }

  const farSideAdjustments = shiftFarSide(usTargets, ballSide, "us");
  Object.assign(usTargets, farSideAdjustments);

  const opponentTargets = opponentCollectiveShape({
    ball,
    formation: (input.opponentState?.formation as OpponentTacticalBrief["formation"]) ?? "4-2-3-1",
    block: input.opponentState?.blockHeight ?? "mid",
    idStyle: input.opponentIdStyle,
  });

  const usLen = measureTeamLength(usTargets, "us");
  const usGaps = measureLineGapsUs(usTargets);
  const rest = positionRestDefenseCollective({
    ball,
    midfieldHeight: midH,
    depthThreat,
    pressureOnBall: pressure,
    phase,
    ballSide,
  });

  const usState: CollectiveTeamState = {
    team: "us",
    formation: input.usState?.formation ?? "4-2-3-1",
    phase,
    blockHeight: phase === "final-third" ? "high" : "mid",
    lineHeights: measureLineHeightsUs(usTargets),
    compactness: {
      teamLength: usLen.length,
      teamWidth: measureTeamWidth(usTargets, "us"),
      attackMidfieldGap: usGaps.attackMidfieldGap,
      midfieldDefenseGap: usGaps.midfieldDefenseGap,
    },
    ballSide,
    pressureOnBall: pressure,
    depthThreat,
    restDefenseStructure: rest.structure,
    lastLineAction,
    frontFootCbId: rest.frontFoot === "LCV" ? "us.LCV" : "us.RCV",
    coverCbId: rest.frontFoot === "LCV" ? "us.RCV" : "us.LCV",
    transitionThreatPlayerIds: input.usState?.transitionThreatPlayerIds,
  };

  const oppLen = measureTeamLength(opponentTargets, "opponent");
  const opponentState: CollectiveTeamState = {
    team: "opponent",
    formation: input.opponentState?.formation ?? "4-2-3-1",
    phase: input.opponentState?.phase ?? "mid-block",
    blockHeight: input.opponentState?.blockHeight ?? "mid",
    lineHeights: {
      attack: avgX(["opp.st", "opp.lw", "opp.rw"], opponentTargets) ?? 50,
      midfield: avgX(["opp.ldm", "opp.rdm", "opp.10"], opponentTargets) ?? 64,
      defense: avgX(["opp.lb", "opp.lcb", "opp.rcb", "opp.rb"], opponentTargets) ?? 78,
    },
    compactness: {
      teamLength: oppLen.length,
      teamWidth: measureTeamWidth(opponentTargets, "opponent"),
      attackMidfieldGap: 12,
      midfieldDefenseGap: 12,
    },
    ballSide,
    pressureOnBall: intentPressure(input.opponentState),
    depthThreat: "limited",
  };

  return {
    usTargets,
    opponentTargets,
    usState,
    opponentState,
    lastLineAction,
    farSideAdjustments,
    restDefenseStructure: rest.structure,
  };
}

function intentPressure(state?: Partial<CollectiveTeamState>): CollectivePressure {
  return state?.pressureOnBall ?? "controlled";
}

/** Frame audit sample for validators / debug. */
export type CollectiveFrameAudit = {
  timeMs: number;
  ballZone: string;
  pressureOnBall: CollectivePressure;
  depthThreat: CollectiveDepthThreat;
  ourLineHeights: CollectiveTeamState["lineHeights"];
  opponentLineHeights: CollectiveTeamState["lineHeights"];
  ourTeamLength: number;
  opponentTeamLength: number;
  midDefenseGap: number;
  attackMidGap: number;
  lastLineDecision: LastLineAction;
  restDefenseStructure: RestDefenseStructure;
  keeperPosition: TacticalPoint | null;
};

export function auditCollectiveFrame(opts: {
  timeMs: number;
  ball: TacticalPoint;
  playerAt: Record<string, TacticalPoint>;
  pressureOnBall?: CollectivePressure;
  depthThreat?: CollectiveDepthThreat;
  ballZone?: string;
}): CollectiveFrameAudit {
  const pressure = opts.pressureOnBall ?? "controlled";
  const depthThreat = opts.depthThreat ?? "limited";
  const our = measureLineHeightsUs(opts.playerAt);
  const gaps = measureLineGapsUs(opts.playerAt);
  const ourLen = measureTeamLength(opts.playerAt, "us");
  const oppLen = measureTeamLength(opts.playerAt, "opponent");
  const lastLineDecision = evaluateLastLineAction({
    pressureOnBall: pressure,
    ballCarrierBodyShape: pressure === "none" ? "open" : "half-open",
    depthThreat,
    nearestOpponentAttackers: depthThreat === "none" ? 0 : 1,
    midfieldHeight: our.midfield,
    currentLastLineHeight: our.defense,
    coverBehindPressure: true,
    ballZone: opts.ballZone ?? "middle-third",
    freeToStep: gaps.midfieldDefenseGap > 14 && depthThreat !== "immediate",
  });

  return {
    timeMs: opts.timeMs,
    ballZone: opts.ballZone ?? "middle-third",
    pressureOnBall: pressure,
    depthThreat,
    ourLineHeights: our,
    opponentLineHeights: {
      attack: avgX(["opp.st", "opp.lw", "opp.rw", "opp.lst", "opp.rst"], opts.playerAt) ?? 50,
      midfield: avgX(["opp.ldm", "opp.rdm", "opp.10", "opp.lcm", "opp.rcm", "opp.6"], opts.playerAt) ?? 64,
      defense: avgX(["opp.lb", "opp.lcb", "opp.rcb", "opp.rb", "opp.cbL", "opp.cbR"], opts.playerAt) ?? 78,
    },
    ourTeamLength: ourLen.length,
    opponentTeamLength: oppLen.length,
    midDefenseGap: gaps.midfieldDefenseGap,
    attackMidGap: gaps.attackMidfieldGap,
    lastLineDecision,
    restDefenseStructure: chooseRestDefenseStructure({
      ballSide: ballSideFromPoint(opts.ball),
      phase: opts.ball.x > 66 ? "final-third" : "progression",
      farBackTucked: true,
    }),
    keeperPosition: opts.playerAt["us.GK"] ?? null,
  };
}

export function movesFromTargets(
  targets: Record<string, TacticalPoint>,
  filterPrefix?: string,
): Array<{ id: string; to: TacticalPoint }> {
  return Object.entries(targets)
    .filter(([id]) => (filterPrefix ? id.startsWith(filterPrefix) : true))
    .map(([id, to]) => ({ id, to }));
}

/** Distance between two points — re-export convenience for briefs. */
export function collectiveDist(a: TacticalPoint, b: TacticalPoint): number {
  return dist(a, b);
}

export type { TacticalFormationId };
