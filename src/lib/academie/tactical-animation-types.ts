/**
 * Tactical Animation System V2/V4 — data-model bovenop Tactical Visual System V1.
 * Situatie-coördinaten blijven de bron van waarheid; animatie beschrijft alleen beweging.
 * V4 voegt curved paths (`via`) en per-step `tacticalState` toe zonder nieuwe engine.
 */

import type { TacticalLine, TacticalPoint, TacticalZone } from "@/lib/academie/tactical-visual-system";
import type { TacticalPhaseState } from "@/lib/academie/tactical-animation-v4-state";
import type { PlayerOrientation } from "@/lib/academie/tactical-orientation";

export type TacticalAnimationComplexity = "micro" | "situation" | "pattern";

export type TacticalAnimationPhase =
  | "initial"
  | "recognition"
  | "prepare"
  | "action"
  | "reaction"
  | "follow"
  | "result"
  | "reset";

export type TacticalAnimationEasing = "linear" | "easeIn" | "easeOut" | "easeInOut";

export type TacticalCameraHint = {
  preset?: string;
  followPlayerIds?: string[];
  maxZoomHint?: number;
};

export type TacticalPlaybackRate = 0.75 | 1 | 1.25;

export type BallMoveAction = {
  kind: "ballMove";
  from: TacticalPoint;
  to: TacticalPoint;
  /** Optional bend control points — same path drives ball, lane, and trail. */
  via?: TacticalPoint[];
  /** 0–1: bal stopt/onderschept vóór `to`. */
  interceptProgress?: number;
  easing?: TacticalAnimationEasing;
  /**
   * When true, engine derives the pass line + trail from this move only
   * (no separate setLines for the pass). Max one syncLane ballMove per step.
   */
  syncLane?: boolean;
  trajectoryId?: string;
  laneStatus?: "pass" | "fault" | "press";
  /** When set with releaseLocal>0, ball stays beside passer until release. */
  passerId?: string;
  /**
   * Local step time (0–1) when the ball leaves the passer.
   * Lane may preview slightly earlier; ball stays at `from` until this point.
   */
  releaseLocal?: number;
  /**
   * Local step time (0–1) when the ball arrives (before lane fade).
   * Defaults to ~0.9 when omitted.
   */
  arrivalLocal?: number;
};

export type PlayerMoveAction = {
  kind: "playerMove";
  playerId: string;
  to: TacticalPoint;
  /** Optionele tussenpunten voor gebogen looplijnen (V4). */
  via?: TacticalPoint[];
  easing?: TacticalAnimationEasing;
  /** Body / gaze at end of move — engine interpolates facing into the frame. */
  orientation?: PlayerOrientation;
};

export type GroupMoveAction = {
  kind: "groupMove";
  moves: Array<{
    playerId: string;
    to: TacticalPoint;
    via?: TacticalPoint[];
    easing?: TacticalAnimationEasing;
    orientation?: PlayerOrientation;
  }>;
};

export type PossessionAction = {
  kind: "possession";
  /** Speler-id of null = vrij/geen holder-ring. */
  holderId: string | null;
};

export type LineSetAction = {
  kind: "setLines";
  lines: TacticalLine[];
};

export type ZoneSetAction = {
  kind: "setZones";
  zones: TacticalZone[];
};

export type HighlightAction = {
  kind: "highlight";
  playerIds?: string[];
  /** Optionele zone-indexen die oplichten. */
  zoneIndexes?: number[];
};

export type PhaseAction = {
  kind: "phase";
  phase: TacticalAnimationPhase;
};

/** Expliciete stilte binnen een step (timing via step.durationMs is voldoende; hold is semantisch). */
export type HoldAction = {
  kind: "hold";
};

export type TacticalAnimationAction =
  | BallMoveAction
  | PlayerMoveAction
  | GroupMoveAction
  | PossessionAction
  | LineSetAction
  | ZoneSetAction
  | HighlightAction
  | PhaseAction
  | HoldAction;

/** V3/V4 story chips — korte fasewoorden (mute-test: max labels). */
export type TacticalStoryLabel =
  | "Situatie"
  | "Herken"
  | "Keuze"
  | "Gesloten"
  | "Ruimte"
  | "Speel"
  | "Schuif"
  | "Druk"
  | "Reactie"
  | "Vervolg"
  | "Herstel"
  | "Aansluiten"
  | "Balans"
  | "Gevolg"
  | "Kijk"
  | "Begin"
  | "Beweeg"
  | "Herfocus"
  | "SCAN"
  | "SPEEL"
  | "HERSTEL"
  | "TRIGGER"
  | "SLUIT BINNEN"
  | "SCHUIF DOOR"
  | "RUGDEKKING"
  | "TWEEDE DRUK"
  | "BALANS";

export type TacticalAnimationStep = {
  id: string;
  startMs: number;
  durationMs: number;
  label?: string;
  /** Max ~5–8 woorden, buiten het veld. */
  teachingPoint?: string;
  actions: TacticalAnimationAction[];
  /** V4: tactische relaties voor deze fase (audit + validators). */
  tacticalState?: TacticalPhaseState;
  /** End-of-step orientations (movers + holds). */
  orientations?: Record<string, PlayerOrientation>;
  /** Decision / trigger beat — coaching overlay emphasis. */
  isTrigger?: boolean;
  /** Camera follow / zoom hint for this phase. */
  cameraHint?: TacticalCameraHint;
};

export type TacticalCoachMode = "auto" | "step";

/**
 * Positioning authority for a sequence.
 * - authored: hand-designed phase positions are source of truth — no collective rewrite
 * - assisted: hand base + explicitly allowed helpers only
 * - generated: legacy soft enrichment (non-canonical examples)
 */
export type TacticalPositioningMode = "authored" | "assisted" | "generated";

export type TacticalAnimationDefinition = {
  id: string;
  situationId: string;
  complexity: TacticalAnimationComplexity;
  durationMs: number;
  /** Stilstaande leestijd aan het begin (meestal al via eerste step). */
  pauseAtStartMs?: number;
  pauseAtEndMs?: number;
  defaultPlaybackRate?: TacticalPlaybackRate;
  autoplay?: boolean;
  loop?: boolean;
  /**
   * Default `"generated"` for legacy; Chapter-1 heroes use `"authored"`.
   * Authored sequences must never be rewritten by collective enrich/compress.
   */
  positioningMode?: TacticalPositioningMode;
  steps: TacticalAnimationStep[];
};

/** Frame-state voor de renderer — afgeleid van situatie + tijd. */
export type TacticalAnimationFrame = {
  timeMs: number;
  phase: TacticalAnimationPhase;
  statusLabel: string;
  ball: TacticalPoint | null;
  /** Actuele posities per player-id. */
  playerAt: Record<string, TacticalPoint>;
  holderId: string | null;
  lines: TacticalLine[];
  zones: TacticalZone[];
  highlightedPlayerIds: string[];
  highlightedZoneIndexes: number[];
  /** 0–1 voortgang over de volledige cyclus (excl. eindpause). */
  progress: number;
  done: boolean;
  activeStepIndex: number;
  activeStepId: string | null;
  /** Korte teaching caption (max ~8 woorden). */
  teachingPoint: string | null;
  /** V4: actieve fase-state (debug overlay / validators). */
  tacticalState: TacticalPhaseState | null;
  /**
   * Unified ball trajectory render state — same source for ball, pass lane, trail.
   * Null when no syncLane ballMove is active.
   */
  ballTrajectory?: {
    id: string;
    from: TacticalPoint;
    to: TacticalPoint;
    via?: TacticalPoint[];
    /** Current ball position on path (same as frame.ball while in flight). */
    ballAt: TacticalPoint;
    /** Samples from start → current for trail. */
    trail: TacticalPoint[];
    /** Lane opacity 0–1 (fades after arrival). */
    laneOpacity: number;
    laneKind: "pass" | "fault" | "press";
    inFlight: boolean;
  } | null;
  /** Hard invariant helper: should be 0 or 1. */
  activeBallTrajectoryCount?: number;
  /** Body / gaze per player for this frame (engine-authored). */
  orientationAt: Record<string, PlayerOrientation>;
  /** Active step is a trigger / decision beat. */
  isTrigger: boolean;
  /** Camera follow hint from active (or last) step. */
  cameraHint: TacticalCameraHint | null;
};

export const TACTICAL_ANIMATION_PREF_KEY = "zvv-academy-tactical-animation";
export const TACTICAL_ANIMATION_SPEED_KEY = "zvv-academy-tactical-animation-speed";
export const TACTICAL_COACH_MODE_KEY = "zvv-academy-tactical-coach-mode";

/** Expliciete gebruikerskeuze; `system` volgt OS reduced-motion. */
export type TacticalAnimationPreference = "system" | "enabled" | "disabled";

export function parseTacticalAnimationPreference(raw: string | null | undefined): TacticalAnimationPreference {
  if (raw === "enabled" || raw === "on" || raw === "true") return "enabled";
  if (raw === "disabled" || raw === "off" || raw === "false") return "disabled";
  if (raw === "system") return "system";
  return "system";
}

export function effectiveTacticalAnimationEnabled(
  preference: TacticalAnimationPreference,
  systemPrefersReducedMotion: boolean,
): boolean {
  if (preference === "enabled") return true;
  if (preference === "disabled") return false;
  return !systemPrefersReducedMotion;
}

export function parseTacticalPlaybackRate(raw: string | null | undefined): TacticalPlaybackRate {
  if (raw === "0.75") return 0.75;
  if (raw === "1.25") return 1.25;
  return 1;
}

export function parseTacticalCoachMode(raw: string | null | undefined): TacticalCoachMode {
  return raw === "step" ? "step" : "auto";
}
