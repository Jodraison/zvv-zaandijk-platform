/**
 * Academy Tactical Film Standard V1 — single source of truth for all
 * tactical Academy animations (roles, formations, spacing, pressing, markers).
 *
 * Validators report/block. They never rewrite authored coordinates.
 */

import { PCT_X_TO_M, PCT_Y_TO_M } from "@/lib/academie/tactical-pitch-meters";

/* -------------------------------------------------------------------------- */
/* Roles                                                                      */
/* -------------------------------------------------------------------------- */

/** Visible us roles — nothing else may appear on markers. */
export const ACADEMY_US_DISPLAY_ROLES = [
  "GK",
  "LB",
  "LCB",
  "RCB",
  "RB",
  "6",
  "8",
  "10",
  "LW",
  "RW",
  "ST",
] as const;

export type AcademyUsDisplayRole = (typeof ACADEMY_US_DISPLAY_ROLES)[number];

/** Visible opponent roles (formation-dependent subset). */
export const ACADEMY_OPP_DISPLAY_ROLES = [
  "GK",
  "LB",
  "LCB",
  "RCB",
  "RB",
  "6",
  "8",
  "10",
  "LM",
  "RM",
  "LW",
  "RW",
  "LST",
  "RST",
  "ST",
] as const;

export type AcademyOppDisplayRole = (typeof ACADEMY_OPP_DISPLAY_ROLES)[number];

/** Forbidden visible tokens (internal IDs may still use these). */
export const ACADEMY_FORBIDDEN_DISPLAY_LABELS = [
  "L6",
  "R6",
  "LCV",
  "RCV",
  "SP",
  "1C",
  "6C",
  "AT",
  "LCM",
  "RCM",
  "CB",
  "CV",
  "CDM",
  "CAM",
] as const;

/**
 * Central display mapping — internal playerId → visible role.
 * Internal IDs (us.L6, opp.lcm, …) stay stable; only the label changes.
 */
export const ACADEMY_DISPLAY_ROLE_BY_ID: Record<string, string> = {
  "us.GK": "GK",
  "us.LB": "LB",
  "us.LCV": "LCB",
  "us.RCV": "RCB",
  "us.RB": "RB",
  "us.L6": "6",
  "us.R6": "8",
  "us.10": "10",
  "us.LW": "LW",
  "us.RW": "RW",
  "us.SP": "ST",
  "opp.gk": "GK",
  "opp.lb": "LB",
  "opp.lcb": "LCB",
  "opp.rcb": "RCB",
  "opp.rb": "RB",
  "opp.cbL": "LCB",
  "opp.cbR": "RCB",
  "opp.lcm": "6",
  "opp.rcm": "8",
  "opp.ldm": "6",
  "opp.rdm": "8",
  "opp.6": "6",
  "opp.8": "8",
  "opp.10": "10",
  "opp.lm": "LM",
  "opp.rm": "RM",
  "opp.lw": "LW",
  "opp.rw": "RW",
  "opp.lst": "LST",
  "opp.rst": "RST",
  "opp.st": "ST",
};

/** Raw position token → display (when only the short label is known). */
export const ACADEMY_RAW_LABEL_TO_DISPLAY: Record<string, string> = {
  GK: "GK",
  LB: "LB",
  LCV: "LCB",
  RCV: "RCB",
  LCB: "LCB",
  RCB: "RCB",
  RB: "RB",
  L6: "6",
  R6: "8",
  "6": "6",
  "8": "8",
  "10": "10",
  LW: "LW",
  RW: "RW",
  SP: "ST",
  ST: "ST",
  LM: "LM",
  RM: "RM",
  LST: "LST",
  RST: "RST",
  LCM: "6",
  RCM: "8",
  CB: "LCB",
  CV: "LCB",
};

export function academyDisplayRole(playerIdOrLabel: string): string {
  if (ACADEMY_DISPLAY_ROLE_BY_ID[playerIdOrLabel]) {
    return ACADEMY_DISPLAY_ROLE_BY_ID[playerIdOrLabel]!;
  }
  const raw = playerIdOrLabel.includes(".")
    ? (playerIdOrLabel.split(".").pop() ?? playerIdOrLabel)
    : playerIdOrLabel;
  if (ACADEMY_RAW_LABEL_TO_DISPLAY[raw]) return ACADEMY_RAW_LABEL_TO_DISPLAY[raw]!;
  if (raw === "10") return "10";
  return raw.toUpperCase();
}

export function isForbiddenDisplayLabel(label: string): boolean {
  return (ACADEMY_FORBIDDEN_DISPLAY_LABELS as readonly string[]).includes(label);
}

export function isValidUsDisplayRole(label: string): boolean {
  return (ACADEMY_US_DISPLAY_ROLES as readonly string[]).includes(label);
}

export function isValidOppDisplayRole(label: string): boolean {
  return (ACADEMY_OPP_DISPLAY_ROLES as readonly string[]).includes(label);
}

/* -------------------------------------------------------------------------- */
/* Formations                                                                 */
/* -------------------------------------------------------------------------- */

export type AcademyUsFormationModel = "4-2-3-1" | "3-2-5" | "4-4-2";

export type AcademyOpponentModelId =
  | "HIGH_PRESS_4_3_3"
  | "HIGH_PRESS_4_4_2"
  | "MID_BLOCK_4_4_2"
  | "MID_BLOCK_4_2_3_1"
  | "LOW_BLOCK_4_4_2"
  | "LOW_BLOCK_4_5_1"
  | "BUILDUP_4_2_3_1"
  | "BUILDUP_4_3_3"
  | "DEFENSIVE_TRANSITION"
  | "ATTACKING_TRANSITION";

export const ACADEMY_US_FORMATION_LINES = {
  "4-2-3-1": {
    front: ["us.SP"],
    am: ["us.LW", "us.10", "us.RW"],
    pivot: ["us.L6", "us.R6"],
    back: ["us.LB", "us.LCV", "us.RCV", "us.RB"],
  },
  "3-2-5": {
    front: ["us.LW", "us.10", "us.SP", "us.RW", "us.RB"],
    pivot: ["us.L6", "us.R6"],
    back: ["us.LB", "us.LCV", "us.RCV"],
  },
  "4-4-2": {
    front: ["us.SP", "us.10"],
    mid: ["us.LW", "us.L6", "us.R6", "us.RW"],
    back: ["us.LB", "us.LCV", "us.RCV", "us.RB"],
  },
} as const;

/* -------------------------------------------------------------------------- */
/* Spacing (meters on 105×68)                                                 */
/* -------------------------------------------------------------------------- */

export const ACADEMY_PITCH_METERS = { length: 105, width: 68 } as const;

export const ACADEMY_SPACING = {
  usAttack325: {
    teamWidth: [55, 64] as const,
    teamLength: [35, 45] as const,
    backToPivot: [8, 13] as const,
    pivotToFront: [8, 14] as const,
  },
  usDefend442: {
    teamWidth: [35, 42] as const,
    teamLength: [25, 30] as const,
    frontToMid: [8, 11] as const,
    midToBack: [8, 11] as const,
    lineGapMax: 13,
  },
  oppMidblock442: {
    teamWidth: [38, 46] as const,
    teamLength: [26, 32] as const,
    lineGap: [8, 12] as const,
    lineGapMax: 13,
  },
  duelMinM: 2.5,
  duelIdealM: [2.5, 3.5] as const,
  markerMinM: 4,
  markerComfortM: 5,
} as const;

export { PCT_X_TO_M, PCT_Y_TO_M };

/* -------------------------------------------------------------------------- */
/* Pressing                                                                   */
/* -------------------------------------------------------------------------- */

export const ACADEMY_PRESSING_ROLES = [
  "FIRST_PRESS",
  "SECOND_PRESS",
  "INSIDE_COVER",
  "DEPTH_COVER",
  "FAR_SIDE_COMPACTNESS",
] as const;

export type AcademyPressingRole = (typeof ACADEMY_PRESSING_ROLES)[number];

export const ACADEMY_PRESSING_RULES = {
  summary: "druk zetten ≠ iedereen naar de bal",
  roles: ACADEMY_PRESSING_ROLES,
  firstPress: "Eén speler zet druk, stuurt een richting, sluit één speelrichting.",
  secondPress: "Dichtstbijzijnde teamgenoot sluit volgende optie op functionele afstand.",
  insideCover: "6/8 of dichtstbijzijnde MV sluit centrum — staat niet op de bal.",
  depthCover: "Verdediger achter druk bewaakt diepte zonder overlap.",
  farSide: "Verre spelers knijpen, blijven verbonden, bewaken switch.",
} as const;

/* -------------------------------------------------------------------------- */
/* Markers / presentation / motion / ball                                     */
/* -------------------------------------------------------------------------- */

export type TacticalRenderScale = {
  markerRadiusPx: number;
  minimumMarkerGapPx: number;
  labelFontPx: number;
  orientationScale: number;
  lineWidthPx: number;
};

export const ACADEMY_RENDER_SCALES = {
  fullPitch: {
    markerRadiusPx: 13.5,
    minimumMarkerGapPx: 22,
    labelFontPx: 10,
    orientationScale: 1,
    lineWidthPx: 2,
  },
  comparisonCard: {
    markerRadiusPx: 9.5,
    minimumMarkerGapPx: 16,
    labelFontPx: 8,
    orientationScale: 0.82,
    lineWidthPx: 1.5,
  },
  mobile: {
    markerRadiusPx: 8.5,
    minimumMarkerGapPx: 14,
    labelFontPx: 7.5,
    orientationScale: 0.75,
    lineWidthPx: 1.25,
  },
} as const satisfies Record<string, TacticalRenderScale>;

export const ACADEMY_MARKER_RULES = {
  version: "V7",
  layers: ["front", "shoulderLine", "bodyAngle"] as const,
  primaryOnly: ["gaze", "receivingFoot", "openShoulder"] as const,
  sameSemanticsAcross: ["desktop-full", "desktop-comparison", "mobile"] as const,
  maxActiveGaze: 1,
} as const;

export const ACADEMY_BALL_RULES = {
  atReceivingFoot: true,
  linearGroundPasses: true,
  noTeleport: true,
} as const;

export const ACADEMY_MOTION_RULES = {
  relationalPreferred: true,
  noTeleport: true,
  preserveLineGapsDuringMorph: true,
  maxClusterInCentralZone: 2,
} as const;

export const ACADEMY_PRESENTATION_RULES = {
  academyModeClean: true,
  noDebugOverlays: true,
  captionsOutsidePitchOnSmallCards: true,
  goodBadIdenticalStart: true,
  goodBadSinglePrincipleDelta: true,
  chaosForbidden: true,
} as const;

export const ACADEMY_CHAOS_FORBIDDEN = [
  "more-than-two-markers-within-one-diameter",
  "three-plus-central-cluster",
  "label-overlap",
  "us-opp-same-position",
  "unreadable-central-stack",
  "unexplained-formation-change",
  "opponent-without-lines",
  "multiple-pressers-same-target-without-cover",
  "everyone-to-ball",
  "floating-outside-structure",
] as const;

/* -------------------------------------------------------------------------- */
/* Situation contract metadata                                                */
/* -------------------------------------------------------------------------- */

export type TacticalFilmStandardMeta = {
  situationId: string;
  usFormation: AcademyUsFormationModel;
  opponentModel: AcademyOpponentModelId;
  kind: "possession" | "defending" | "pressing" | "transition" | "comparison-good" | "comparison-bad" | "other";
  /** When kind is comparison-*: the paired situationId and the single principle delta. */
  comparisonPair?: { otherId: string; principleDelta: string };
  /** Explicit pressing role assignment for pressing films. */
  pressingRoles?: Partial<Record<AcademyPressingRole, string>>;
  /** Reference productions under V1. */
  reference?: "connected-team" | "press-pair";
  /** Block evidence / release until reauthored. */
  blockedUntilCompliant?: boolean;
};

/**
 * Declared metadata for Chapter-1 situations.
 * Unknown / undeclared → audit status REQUIRES_REAUTHORING or BLOCKED.
 */
export const ACADEMY_SITUATION_STANDARD_META: Record<string, TacticalFilmStandardMeta> = {
  "connected-team": {
    situationId: "connected-team",
    usFormation: "4-2-3-1",
    opponentModel: "MID_BLOCK_4_4_2",
    kind: "possession",
    reference: "connected-team",
  },
  "press-good": {
    situationId: "press-good",
    usFormation: "4-4-2",
    opponentModel: "BUILDUP_4_2_3_1",
    kind: "comparison-good",
    comparisonPair: {
      otherId: "press-bad",
      principleDelta: "team-connects-behind-first-press",
    },
    pressingRoles: {
      FIRST_PRESS: "us.RW",
      SECOND_PRESS: "us.R6",
      INSIDE_COVER: "us.L6",
      DEPTH_COVER: "us.RB",
      FAR_SIDE_COMPACTNESS: "us.LW",
    },
    reference: "press-pair",
  },
  "press-bad": {
    situationId: "press-bad",
    usFormation: "4-4-2",
    opponentModel: "BUILDUP_4_2_3_1",
    kind: "comparison-bad",
    comparisonPair: {
      otherId: "press-good",
      principleDelta: "team-connects-behind-first-press",
    },
    pressingRoles: {
      FIRST_PRESS: "us.RW",
    },
    reference: "press-pair",
  },
};

export const ACADEMY_TACTICAL_FILM_STANDARD_V1 = {
  version: "1.0.0",
  roleSystem: {
    usRoles: ACADEMY_US_DISPLAY_ROLES,
    oppRoles: ACADEMY_OPP_DISPLAY_ROLES,
    forbidden: ACADEMY_FORBIDDEN_DISPLAY_LABELS,
    displayById: ACADEMY_DISPLAY_ROLE_BY_ID,
  },
  formationModels: ACADEMY_US_FORMATION_LINES,
  spacingRules: ACADEMY_SPACING,
  pressingPrinciples: ACADEMY_PRESSING_RULES,
  opponentModels: [
    "HIGH_PRESS_4_3_3",
    "HIGH_PRESS_4_4_2",
    "MID_BLOCK_4_4_2",
    "MID_BLOCK_4_2_3_1",
    "LOW_BLOCK_4_4_2",
    "LOW_BLOCK_4_5_1",
    "BUILDUP_4_2_3_1",
    "BUILDUP_4_3_3",
    "DEFENSIVE_TRANSITION",
    "ATTACKING_TRANSITION",
  ] as AcademyOpponentModelId[],
  markerRules: ACADEMY_MARKER_RULES,
  ballRules: ACADEMY_BALL_RULES,
  motionRules: ACADEMY_MOTION_RULES,
  presentationRules: ACADEMY_PRESENTATION_RULES,
  renderScales: ACADEMY_RENDER_SCALES,
  chaosForbidden: ACADEMY_CHAOS_FORBIDDEN,
  situationMeta: ACADEMY_SITUATION_STANDARD_META,
} as const;

export type TacticalFilmStandardV1 = typeof ACADEMY_TACTICAL_FILM_STANDARD_V1;
