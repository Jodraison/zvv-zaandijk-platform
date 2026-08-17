/**
 * Tactical Animation System V4 — teamblok state bovenop de bestaande timeline.
 * Sequences beschrijven eerst deze relaties; coördinaten volgen daarna.
 */

import type { TacticalPoint } from "@/lib/academie/tactical-visual-system";

export type PitchZone =
  | "defensive-third"
  | "middle-third"
  | "final-third"
  | "left-flank"
  | "right-flank"
  | "central"
  | "box";

export type DefensiveBlockHeight = "high" | "mid" | "low" | "transition";

export type PressingDirection = "inside" | "outside" | "backward" | "touchline";

export type PossessionTeam = "us" | "opponent" | "loose";

/** Per-fase tactische waarheid — voor audit, validators en coach-debug. */
export type TacticalPhaseState = {
  ballZone: PitchZone;
  possessionTeam: PossessionTeam;
  defensiveBlock: DefensiveBlockHeight;
  pressingDirection?: PressingDirection;
  /** Gemiddelde x van laatste linie (LB/LCV/RCV/RB). */
  lastLineHeight?: number;
  teamCompactness?: {
    width: number;
    length: number;
  };
  primaryPressurePlayerId?: string;
  coverPlayerIds?: string[];
  balancePlayerIds?: string[];
  depthThreatPlayerIds?: string[];
  markedOpponentIds?: string[];
  /** Bewuste 2v1 / insluiting toegestaan. */
  intentionalDoubleMark?: boolean;
  closedPassLanes?: Array<{ fromId?: string; toId?: string; label?: string }>;
  localNumbers?: Array<{
    zone: PitchZone | string;
    us: number;
    opponent: number;
    note?: string;
  }>;
  /** Collective V2 — last-line decision for audit. */
  lastLineAction?: "step" | "hold" | "drop" | "track-run" | "handover";
  restDefenseStructure?: "2+1" | "3+1" | "3+2" | "4+1";
  pressureOnBall?: "none" | "passive" | "controlled" | "strong";
};

/** Interne story-kaart vóór coördinaten (documentatie + mute-test checklist). */
export type TacticalSequenceBrief = {
  situationId: string;
  ballLocation: string;
  opponentFormation: string;
  ourFormation: string;
  trigger: string;
  primaryAction: string;
  cover: string;
  balance: string;
  lastLineResponse: string;
  opponentResponse: string;
  secondAction: string;
  endStructure: string;
};

export function pitchZoneFromPoint(p: TacticalPoint): PitchZone {
  if (p.x < 33) return "defensive-third";
  if (p.x > 66) return "final-third";
  if (p.y < 28) return "left-flank";
  if (p.y > 72) return "right-flank";
  if (p.x > 82 && p.y > 35 && p.y < 65) return "box";
  return p.x >= 33 && p.x <= 66 ? "middle-third" : "central";
}

export function lastLineHeight(playerAt: Record<string, TacticalPoint>): number | undefined {
  const ids = ["us.LB", "us.LCV", "us.RCV", "us.RB"];
  const pts = ids.map((id) => playerAt[id]).filter(Boolean) as TacticalPoint[];
  if (!pts.length) return undefined;
  return pts.reduce((s, p) => s + p.x, 0) / pts.length;
}

export function teamCompactness(playerAt: Record<string, TacticalPoint>): {
  width: number;
  length: number;
} {
  const us = Object.entries(playerAt)
    .filter(([id]) => id.startsWith("us.") && !id.endsWith(".GK") && id !== "us.GK")
    .map(([, p]) => p);
  if (us.length < 2) return { width: 0, length: 0 };
  const xs = us.map((p) => p.x);
  const ys = us.map((p) => p.y);
  return {
    width: Math.max(...ys) - Math.min(...ys),
    length: Math.max(...xs) - Math.min(...xs),
  };
}

/** Conditie: laatste lijn mag doorschuiven. */
export function canLastLineStepUp(state: {
  pressureOnBall: boolean;
  bodyClosed: boolean;
  coverBehindPress: boolean;
  depthThreatOpen: boolean;
  holderHasTime: boolean;
}): boolean {
  if (state.depthThreatOpen || state.holderHasTime) return false;
  return state.pressureOnBall && state.bodyClosed && state.coverBehindPress;
}

export const PRESS_GOOD_BRIEF: TacticalSequenceBrief = {
  situationId: "press-good",
  ballLocation: "opp.cbL (balzijde CB)",
  opponentFormation: "4-3-3 opbouw",
  ourFormation: "4-2-3-1 hoge druk",
  trigger: "Traag ontvangst cbL, lichaam gesloten, bal kort los",
  primaryAction: "SP gebogen druk — sluit binnen/GK, dwingt naar LB",
  cover: "10 sluit opp.6; L6 rugdekking achter 10; LB achter LW",
  balance: "R6 bewaakt centrum/2e bal; RW knijpt; RB knijpt",
  lastLineResponse: "Doorschuiven bij effectieve druk + gesloten diepte",
  opponentResponse: "Gedwongen pass naar LB; poging kaats/lijn",
  secondAction: "LW 2e druk van binnen naar buiten; L6 dekt rug",
  endStructure: "Compact blok, geen dubbele 6 op spits, lijn aangesloten",
};

export const PRESS_BAD_BRIEF: TacticalSequenceBrief = {
  situationId: "press-bad",
  ballLocation: "opp.cbL (zelfde start als press-good)",
  opponentFormation: "4-3-3 opbouw",
  ourFormation: "4-2-3-1 (niet aangesloten)",
  trigger: "Spits start te vroeg en recht",
  primaryAction: "Solo jacht zonder passlijn te sluiten",
  cover: "10 te ver van 6; 6’en te laat; geen rugdekking",
  balance: "Verdediging blijft laag; gat middenveld–verdediging",
  lastLineResponse: "Blijft diep (terecht: geen drukketen)",
  opponentResponse: "Pass naar vrije 6; 6 draait open",
  secondAction: "Geen tweede druk — herstel achteruit",
  endStructure: "Uitgespeelde SP, open midden, geforceerd herstel",
};

export const CONNECTED_TEAM_BRIEF: TacticalSequenceBrief = {
  situationId: "connected-team",
  ballLocation: "us.10 tussen linies",
  opponentFormation: "4-4-2 mid-block",
  ourFormation: "4-2-3-1 progressie (verbonden linies)",
  trigger: "10 vrij; SP komt onside naar bal",
  primaryAction: "Pass naar SP; kaats; breedte RW",
  cover: "Eén 6 sluit aan; back achter winger",
  balance: "Andere 6 bewaakt centrum; CV’s schuiven mee",
  lastLineResponse: "STEP met middenveld — geen diepte weggeven",
  opponentResponse: "Collectief herstel mid-block (hele achterlijn + midden)",
  secondAction: "Doorcombinatie naar RW / 10",
  endStructure: "Verbonden 2+1 rest — teamlengte 30–40",
};
