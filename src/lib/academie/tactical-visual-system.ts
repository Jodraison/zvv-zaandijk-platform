/**
 * Football Academy — Tactical Visual System
 * Canonieke illustratieregels. Visuele tokens: V2 Premium Analysis.
 */

export {
  TACTICAL_COLORS,
  TACTICAL_SHADOWS,
  TACTICAL_STROKES,
  TACTICAL_MOTION,
  TACTICAL_TYPOGRAPHY,
  TACTICAL_SURFACES,
  TACTICAL_PLAYER_STYLES,
  TACTICAL_CONTROL_STYLES,
  TACTICAL_PRESETS,
  resolveZoneTone,
  normalizePlayerLabel,
} from "@/lib/academie/tactical-visual-tokens";
export type { TacticalVisualPreset, TacticalVisualPresetId } from "@/lib/academie/tactical-visual-tokens";
import { TACTICAL_COLORS } from "@/lib/academie/tactical-visual-tokens";
import { academyDisplayRole } from "@/lib/academie/tactical-film-standard-v1";
import {
  PRESS_V2_US_START,
  PRESS_V2_OPP_START,
  PRESS_V2_BALL_START,
} from "@/lib/academie/tactical-press-reference-v2";

/** ViewBox van ieder Academy-veld — altijd gelijk. */
export const TACTICAL_VIEWBOX = {
  width: 900,
  height: 560,
  /** Speelveld binnen de viewBox (marge voor labels). */
  field: { x: 40, y: 36, w: 820, h: 488 },
} as const;

export type TacticalOurPosition =
  | "GK"
  | "LB"
  | "LCV"
  | "RCV"
  | "RB"
  | "L6"
  | "R6"
  | "10"
  | "LW"
  | "RW"
  | "SP";

export type TacticalTeam = "us" | "opponent";

/** Positie als percentage van het speelveld (0–100). Richting: wij vallen naar rechts aan. */
export type TacticalPoint = { x: number; y: number };

export type TacticalPlayerMarker = {
  id: string;
  team: TacticalTeam;
  label: string;
  at: TacticalPoint;
  /** Optioneel: speelster heeft de bal. */
  hasBall?: boolean;
};

/** Lijntaal — vaste betekenis, geen willekeurige kleuren. */
export type TacticalLineKind = "run" | "pass" | "press" | "fault";

export type TacticalLine = {
  kind: TacticalLineKind;
  from: TacticalPoint;
  to: TacticalPoint;
  /** Override: run is standaard gestreept; pass/press/fault standaard vol. */
  dashed?: boolean;
  /** Optional render opacity 0–1 (synced pass-lane fade). */
  opacity?: number;
};

export type TacticalZoneGeometry =
  | { type: "ellipse" }
  | {
      type: "taper-shadow";
      /** Apex at screening defender (field %). */
      apex: TacticalPoint;
      /** Shadow direction degrees (0 = +x). */
      dirDeg: number;
      nearWidth: number;
      farWidth: number;
      length: number;
    }
  | {
      type: "sector";
      at: TacticalPoint;
      facingDeg: number;
      halfAngleDeg: number;
      length: number;
    }
  | {
      type: "corridor";
      from: TacticalPoint;
      to: TacticalPoint;
      width: number;
    };

export type TacticalZone = {
  /** Bounding box in veld-% (x,y,w,h) — used for highlight / layout. */
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
  /** Perception cue kind — soft professional overlays. */
  kind?: "space" | "risk" | "press" | "cover-shadow" | "pocket" | "scan";
  /** Football-shaped geometry. When set, Academy must not render axis-aligned rounded rect. */
  geometry?: TacticalZoneGeometry;
};

export type TacticalSituationId =
  | "connected-team"
  | "press-good"
  | "press-bad"
  | "fdl-gs-inside-close-live"
  | "fdl-gs-inside-close-good"
  | "fdl-gs-inside-close-bad"
  | "solo-solve"
  | "solo-support"
  | "blind-run"
  | "blind-press"
  | "always-forward"
  | "forward-relocate"
  | "buildup-gk"
  | "kw-r6-ball"
  | "kw-choice-force"
  | "kw-choice-relocate"
  | "kw-moment-hold"
  | "kw-moment-wing"
  | "kw-moment-finish"
  | "ta-lcv-buildup"
  | "ta-rb-alone"
  | "ta-rb-support"
  | "ta-moment-scan"
  | "ta-moment-after-pass"
  | "ta-moment-press"
  | "gr-10-loss"
  | "gr-l6-freeze"
  | "gr-l6-recover"
  | "gr-moment-teammate"
  | "gr-moment-teammate-good"
  | "gr-moment-sub"
  | "gr-moment-sub-good"
  | "gr-moment-disagree"
  | "gr-moment-disagree-good"
  | "in-r6-win"
  | "in-10-late"
  | "in-10-tempo"
  | "in-moment-turnover"
  | "in-moment-press"
  | "in-moment-rest"
  | "me-spits-miss"
  | "me-10-hang"
  | "me-10-refocus"
  | "me-moment-chance"
  | "me-moment-concede"
  | "me-moment-late";

export type TacticalTitleEyebrow =
  | "SITUATIE"
  | "GOED"
  | "NIET GOED"
  | "FOUT"
  | "BETER"
  | "VERKEERD"
  | "GEWENST"
  | "KEUZE A"
  | "KEUZE B"
  | "KEUZE";

export type TacticalSituationDefinition = {
  id: TacticalSituationId;
  /** Korte categorie boven de titel. */
  eyebrow: TacticalTitleEyebrow;
  /** Concrete wedstrijdsituatie — geen abstract principe. */
  title: string;
  /** Optionele ondertitel (max 1 zin). */
  subtitle?: string;
  players: TacticalPlayerMarker[];
  ball?: TacticalPoint;
  lines?: TacticalLine[];
  zones?: TacticalZone[];
  /** V3: formatieve metadata voor realism-validatie. */
  homeShape?: import("@/lib/academie/tactical-formation-presets").TacticalTeamShape;
  opponentShape?: import("@/lib/academie/tactical-formation-presets").TacticalTeamShape;
};

/**
 * Basis 4-2-3-1 — aanvallend naar rechts.
 * Coördinaten in veld-% (x: links→rechts, y: boven→onder).
 */
export const FORMATION_4231_US: Record<TacticalOurPosition, TacticalPoint> = {
  GK: { x: 14, y: 50 },
  LB: { x: 32, y: 22 },
  LCV: { x: 34, y: 40 },
  RCV: { x: 34, y: 60 },
  RB: { x: 32, y: 78 },
  L6: { x: 44, y: 40 },
  R6: { x: 44, y: 60 },
  "10": { x: 56, y: 50 },
  LW: { x: 68, y: 20 },
  RW: { x: 68, y: 80 },
  /** Onside vs typische CB-lijn ~76–78; diepte komt uit loopacties na pass. */
  SP: { x: 72, y: 50 },
};

/** Compacte 4-2-3-1 — verbonden linies (teamlengte ~34–38). */
export const FORMATION_4231_US_COMPACT: Record<TacticalOurPosition, TacticalPoint> = {
  GK: { x: 18, y: 50 },
  LB: { x: 36, y: 26 },
  LCV: { x: 38, y: 40 },
  RCV: { x: 38, y: 60 },
  RB: { x: 36, y: 74 },
  L6: { x: 48, y: 42 },
  R6: { x: 48, y: 58 },
  "10": { x: 56, y: 50 },
  LW: { x: 68, y: 26 },
  RW: { x: 68, y: 74 },
  /** Onside vs mid-block CB-lijn ~76 */
  SP: { x: 70, y: 50 },
};

/**
 * Press reference V2 — immutable shared start (see tactical-press-reference-v2.ts).
 * press-good / press-bad MUST share this; do not fork coordinates.
 */
export const FORMATION_PRESS_BASE: Record<TacticalOurPosition, TacticalPoint> = PRESS_V2_US_START;
export const PRESS_OPPONENTS: TacticalPlayerMarker[] = PRESS_V2_OPP_START;
export const PRESS_BALL: TacticalPoint = PRESS_V2_BALL_START;

/**
 * Kernwaarden — gedeelde uitgang: bal bij R6, compacte tegenstander sluit 10 af.
 * V1 Intelligence: ruimere startafstanden — geen centrale cluster.
 * SP onside vs CB-lijn ~78.
 */
/**
 * Kernwaarden start — authored gespreide 4-2-3-1 (geen centrale cluster).
 */
export const FORMATION_KW_R6: Record<TacticalOurPosition, TacticalPoint> = {
  GK: { x: 12, y: 50 },
  LB: { x: 32, y: 16 },
  LCV: { x: 24, y: 36 },
  RCV: { x: 26, y: 64 },
  RB: { x: 36, y: 80 },
  L6: { x: 40, y: 38 },
  R6: { x: 46, y: 58 },
  "10": { x: 56, y: 40 },
  LW: { x: 70, y: 12 },
  RW: { x: 72, y: 88 },
  SP: { x: 76, y: 50 },
};

/** Tegenstander 4-2-3-1 mid/laag blok — herkenbare horizontale linies. */
export const KW_R6_OPPONENTS: TacticalPlayerMarker[] = [
  { id: "opp.gk", team: "opponent", label: "GK", at: { x: 94, y: 50 } },
  { id: "opp.lb", team: "opponent", label: "LB", at: { x: 80, y: 14 } },
  { id: "opp.lcb", team: "opponent", label: "LCB", at: { x: 78, y: 36 } },
  { id: "opp.rcb", team: "opponent", label: "RCB", at: { x: 78, y: 64 } },
  { id: "opp.rb", team: "opponent", label: "RB", at: { x: 80, y: 86 } },
  { id: "opp.ldm", team: "opponent", label: "6", at: { x: 62, y: 38 } },
  { id: "opp.rdm", team: "opponent", label: "6", at: { x: 62, y: 58 } },
  { id: "opp.10", team: "opponent", label: "10", at: { x: 52, y: 50 } },
  { id: "opp.lw", team: "opponent", label: "LW", at: { x: 56, y: 20 } },
  { id: "opp.rw", team: "opponent", label: "RW", at: { x: 56, y: 80 } },
  { id: "opp.st", team: "opponent", label: "ST", at: { x: 42, y: 50 } },
];

export function fieldPointToSvg(at: TacticalPoint): { cx: number; cy: number } {
  const { field } = TACTICAL_VIEWBOX;
  return {
    cx: field.x + (at.x / 100) * field.w,
    cy: field.y + (at.y / 100) * field.h,
  };
}

/** Bal naast balbezitter — niet overlappend met de marker. */
export function ballBesideHolder(at: TacticalPoint): TacticalPoint {
  return { x: Math.min(97, at.x + 3.8), y: Math.max(4, at.y - 3.2) };
}

/**
 * Arrival / possession offset for receiving foot (field %).
 * Keeps ball outside marker centre.
 */
export function ballAtReceivingFoot(
  holder: TacticalPoint,
  opts?: {
    foot?: "left" | "right" | "front" | "back-foot" | "either";
    facingDeg?: number;
    attackRight?: boolean;
  },
): TacticalPoint {
  const facing = opts?.facingDeg ?? (opts?.attackRight === false ? 180 : 0);
  const rad = (facing * Math.PI) / 180;
  const forward = { x: Math.cos(rad), y: Math.sin(rad) };
  const side = { x: -Math.sin(rad), y: Math.cos(rad) };
  const foot = opts?.foot ?? "right";
  let ox = forward.x * 3.2;
  let oy = forward.y * 3.2;
  if (foot === "left") {
    ox = forward.x * 2.2 + side.x * -2.8;
    oy = forward.y * 2.2 + side.y * -2.8;
  } else if (foot === "right") {
    ox = forward.x * 2.2 + side.x * 2.8;
    oy = forward.y * 2.2 + side.y * 2.8;
  } else if (foot === "back-foot") {
    ox = forward.x * 1.2 + side.x * 2.6;
    oy = forward.y * 1.2 + side.y * 2.6;
  } else if (foot === "front") {
    ox = forward.x * 4.0;
    oy = forward.y * 4.0;
  }
  return {
    x: Math.max(2, Math.min(98, holder.x + ox)),
    y: Math.max(2, Math.min(98, holder.y + oy)),
  };
}

export function usPlayersFromFormation(
  formation: Record<TacticalOurPosition, TacticalPoint>,
  ballHolder?: TacticalOurPosition,
): TacticalPlayerMarker[] {
  return (Object.keys(formation) as TacticalOurPosition[]).map((pos) => ({
    id: `us.${pos}`,
    team: "us" as const,
    label: academyDisplayRole(`us.${pos}`),
    at: formation[pos],
    hasBall: ballHolder === pos,
  }));
}

export const TACTICAL_LEGEND_ITEMS: Array<{ tone: keyof typeof TACTICAL_COLORS; label: string }> = [
  { tone: "us", label: "Wij" },
  { tone: "opponent", label: "Tegenstander" },
  { tone: "ball", label: "Bal" },
  { tone: "runLine", label: "Looplijn" },
  { tone: "passLine", label: "Passlijn" },
  { tone: "pressLine", label: "Druklijn" },
  { tone: "faultLine", label: "Foute actie" },
];
