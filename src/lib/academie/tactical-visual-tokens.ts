/**
 * Tactical Visual System V2 — Premium Analysis
 * HUDL × Wyscout × UEFA Pro design tokens.
 * Single source for colors, shadows, strokes, motion, typography, surfaces.
 */

import { academyDisplayRole } from "@/lib/academie/tactical-film-standard-v1";

export const TACTICAL_COLORS = {
  /** Eigen team — diep clubblauw */
  us: "#1B4FD8",
  usInner: "#2B63F0",
  usStroke: "#0B2A7A",
  usLabel: "#F8FAFC",
  usHighlight: "rgba(147, 197, 253, 0.35)",

  /** Tegenstander — diep coral/rood */
  opponent: "#C43B3B",
  opponentInner: "#D45E4E",
  opponentStroke: "#7A1F1F",
  opponentLabel: "#FFF7F7",

  /** Bal */
  ball: "#E8922A",
  ballCore: "#F5B045",
  ballStroke: "#9A4E0C",
  ballHalo: "rgba(255, 245, 230, 0.88)",
  ballTrail: "rgba(232, 146, 42, 0.35)",

  /** Lijnen */
  runLine: "rgba(226, 232, 240, 0.72)",
  passLine: "rgba(45, 180, 150, 0.85)",
  passLineActive: "rgba(52, 211, 168, 0.95)",
  pressLine: "rgba(124, 110, 220, 0.88)",
  faultLine: "rgba(232, 120, 110, 0.9)",
  riskLine: "rgba(217, 160, 70, 0.85)",

  /** Zones */
  zone: "rgba(100, 130, 160, 0.14)",
  zoneStroke: "rgba(200, 220, 240, 0.28)",
  zoneSpace: "rgba(45, 160, 140, 0.16)",
  zoneSpaceStroke: "rgba(80, 200, 175, 0.45)",
  zoneRisk: "rgba(200, 100, 70, 0.14)",
  zoneRiskStroke: "rgba(230, 150, 90, 0.4)",
  zonePress: "rgba(110, 95, 190, 0.14)",
  zonePressStroke: "rgba(150, 135, 220, 0.4)",
  zoneCompact: "rgba(90, 120, 160, 0.12)",
  zoneCompactStroke: "rgba(160, 185, 210, 0.35)",
  zoneHighlight: "rgba(45, 180, 150, 0.22)",
  zoneHighlightStroke: "rgba(80, 210, 175, 0.55)",

  /** Pitch */
  pitch: "#0C2E1C",
  pitchDeep: "#081F14",
  pitchLight: "#123D26",
  pitchStripe: "rgba(255,255,255,0.028)",
  pitchLine: "rgba(232, 240, 236, 0.55)",
  pitchLineSoft: "rgba(232, 240, 236, 0.32)",
  pitchVignette: "rgba(0,0,0,0.35)",

  /** Focus */
  focusRing: "rgba(212, 168, 75, 0.7)",
  focusGlow: "rgba(212, 168, 75, 0.22)",
  possessionHalo: "rgba(245, 200, 90, 0.45)",

  /** UI chrome */
  titleInk: "#0F172A",
  captionMuted: "#64748B",
  panelBg: "#0A1628",
  panelBorder: "rgba(148, 180, 200, 0.18)",
  panelInset: "#071018",
  captionBg: "rgba(8, 16, 28, 0.88)",
  captionText: "#E8EEF5",
  captionMutedText: "#94A3B8",
} as const;

export const TACTICAL_SHADOWS = {
  player: "drop-shadow(0 2px 3px rgba(0,0,0,0.45))",
  ball: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
  panel: "0 12px 40px rgba(0,0,0,0.28)",
  card: "0 4px 20px rgba(15, 23, 42, 0.08)",
} as const;

export const TACTICAL_STROKES = {
  pitchOuter: 2,
  pitchInner: 1.35,
  pitchSoft: 1.1,
  playerOuter: 1.75,
  playerInner: 1,
  focus: 1.6,
  possession: 1.8,
  run: 1.65,
  pass: 1.45,
  press: 2.1,
  fault: 2.0,
  zone: 1.15,
  zoneLit: 1.6,
  arrow: 7,
} as const;

export const TACTICAL_MOTION = {
  trailMax: 5,
  impactMs: 200,
  cameraEaseMs: 700,
  zoneFadeMs: 400,
  maxZoom: 0.16,
  focusPadding: 72,
  breathingOpacity: [0.45, 0.85] as const,
} as const;

export const TACTICAL_TYPOGRAPHY = {
  playerLabel: {
    family: "var(--font-sans, ui-sans-serif, system-ui, sans-serif)",
    weight: 700,
    size: 12.5,
    sizeLong: 10.5,
    tracking: "0.02em",
  },
  zoneLabel: {
    family: "var(--font-sans, ui-sans-serif, system-ui, sans-serif)",
    weight: 650,
    size: 10,
    tracking: "0.06em",
  },
  phase: {
    tracking: "0.2em",
    size: "10px",
    weight: 700,
  },
  caption: {
    size: "12px",
    weight: 500,
  },
} as const;

export const TACTICAL_SURFACES = {
  analysisPanel:
    "overflow-hidden rounded-2xl border border-[rgba(148,180,200,0.18)] bg-[#0A1628] shadow-[0_12px_40px_rgba(0,0,0,0.28)]",
  analysisInset: "rounded-xl bg-[#071018] p-1 sm:p-1.5",
  controlBar:
    "rounded-2xl border border-slate-200/90 bg-slate-950 text-slate-100 shadow-[0_8px_28px_rgba(15,23,42,0.12)]",
  controlGroup: "inline-flex items-center gap-0.5 rounded-xl bg-white/5 p-0.5",
  controlBtn:
    "inline-flex h-10 min-w-10 items-center justify-center rounded-lg px-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 disabled:opacity-35",
  controlBtnActive: "bg-sky-500/20 text-sky-200 ring-1 ring-sky-400/30",
  phaseChip:
    "rounded-lg border border-white/10 bg-black/45 px-2.5 py-1.5 backdrop-blur-[2px]",
} as const;

export const TACTICAL_PLAYER_STYLES = {
  radius: 13.5,
  focusRadius: 15.5,
  possessionRadius: 14.8,
  scaleActive: 1.025,
  directionNotch: 6.4,
  torsoAxis: 7.6,
  /** Academy primary gaze fan (half-angle deg) — short glance, not a laser. */
  gazeConeDeg: 22,
  gazeConeLen: 10,
  /** Crescent arc for open receiving side. */
  frontCrescent: 5.2,
  /** Marker V7 — human-readable body cues (outside label). */
  frontWedgeLen: 9,
  frontWedgeHalfDeg: 22,
  /** Trapezoid front-torso plate: near edge hugs ring, far edge flares wider. */
  frontPlateNearFactor: 0.68,
  shoulderLen: 5.2,
  shoulderThick: 2.6,
  receivingFootOffset: 16.8,
  receivingFootR: 2.9,
  /** Academy "noise rule" — dim body cues when player is not the current focus. */
  quietFrontOpacity: 0.4,
  quietShoulderOpacity: 0.32,
  strongFrontOpacity: 0.98,
  strongShoulderOpacity: 0.95,
} as const;

export const TACTICAL_CONTROL_STYLES = {
  minTouch: 44,
  progressHeight: 3,
  barGap: 8,
} as const;

export type TacticalVisualPresetId =
  | "overview"
  | "pressing"
  | "build-up"
  | "transition"
  | "final-third"
  | "full-team-tactical"
  | "comparison-bad"
  | "comparison-good"
  | "coach-mode";

export type TacticalVisualPreset = {
  id: TacticalVisualPresetId;
  maxZoom: number;
  zoneOpacity: number;
  lineOpacity: number;
  highlightIntensity: number;
  captionPosition: "overlay" | "below";
};

export const TACTICAL_PRESETS: Record<TacticalVisualPresetId, TacticalVisualPreset> = {
  overview: {
    id: "overview",
    maxZoom: 0.06,
    zoneOpacity: 0.85,
    lineOpacity: 0.9,
    highlightIntensity: 0.7,
    captionPosition: "overlay",
  },
  pressing: {
    id: "pressing",
    maxZoom: 0.14,
    zoneOpacity: 0.9,
    lineOpacity: 0.95,
    highlightIntensity: 1,
    captionPosition: "overlay",
  },
  "build-up": {
    id: "build-up",
    maxZoom: 0.12,
    zoneOpacity: 0.8,
    lineOpacity: 0.92,
    highlightIntensity: 0.85,
    captionPosition: "overlay",
  },
  transition: {
    id: "transition",
    maxZoom: 0.1,
    zoneOpacity: 0.75,
    lineOpacity: 0.95,
    highlightIntensity: 1,
    captionPosition: "overlay",
  },
  "full-team-tactical": {
    id: "full-team-tactical",
    maxZoom: 0.04,
    zoneOpacity: 0.7,
    lineOpacity: 0.9,
    highlightIntensity: 0.85,
    captionPosition: "overlay",
  },
  "final-third": {
    id: "final-third",
    maxZoom: 0.12,
    zoneOpacity: 0.88,
    lineOpacity: 0.95,
    highlightIntensity: 1,
    captionPosition: "overlay",
  },
  "comparison-bad": {
    id: "comparison-bad",
    maxZoom: 0.1,
    zoneOpacity: 0.85,
    lineOpacity: 0.9,
    highlightIntensity: 0.9,
    captionPosition: "below",
  },
  "comparison-good": {
    id: "comparison-good",
    maxZoom: 0.1,
    zoneOpacity: 0.85,
    lineOpacity: 0.9,
    highlightIntensity: 0.9,
    captionPosition: "below",
  },
  "coach-mode": {
    id: "coach-mode",
    maxZoom: 0.08,
    zoneOpacity: 1,
    lineOpacity: 1,
    highlightIntensity: 1,
    captionPosition: "below",
  },
};

/** Infer zone visual tone from kind / label keywords (presentation only). */
export function resolveZoneTone(
  label?: string,
  kind?: "space" | "risk" | "press" | "cover-shadow" | "pocket" | "scan",
): "space" | "risk" | "press" | "compact" | "default" {
  if (kind === "cover-shadow") return "risk";
  if (kind === "pocket" || kind === "scan" || kind === "space") return "space";
  if (kind === "press") return "press";
  if (kind === "risk") return "risk";
  if (!label) return "default";
  const t = label.toLowerCase();
  if (/risico|fout|gevaar|onderschep|isolatie|open|gat|alleen|schaduw|cover/.test(t)) return "risk";
  if (/druk|press|trigger/.test(t)) return "press";
  if (/compact|blok|verbonden|steun|aansluit/.test(t)) return "compact";
  if (/ruimte|vrij|optie|lijn|overtal|pocket/.test(t)) return "space";
  return "default";
}

/** Display-normalize player labels via Academy Tactical Film Standard V1. */
export function normalizePlayerLabel(label: string, team: "us" | "opponent", atY?: number): string {
  if (label === "CB" || label === "CV") {
    if (typeof atY === "number") return atY < 50 ? "LCB" : "RCB";
    return "LCB";
  }
  void team;
  return academyDisplayRole(label);
}
