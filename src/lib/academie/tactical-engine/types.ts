/**
 * Tactical Animation Engine — lesson-facing film spec.
 * Lessons provide data; the engine compiles + renders.
 */

import type { TacticalAnimationPhase } from "@/lib/academie/tactical-animation-types";
import type { PlayerOrientation } from "@/lib/academie/tactical-orientation";
import type { TacticalLine, TacticalPoint, TacticalZone } from "@/lib/academie/tactical-visual-system";

export type EngineAcceleration =
  | "walk-adjust"
  | "jog"
  | "accelerate"
  | "sprint"
  | "decelerate";

export type EngineBallPath = "linear" | "quadratic" | "cubic";

export type EngineBallStatus = "open" | "pressured" | "blocked" | "intercepted";

export type EngineCameraPreset =
  | "full-team-tactical"
  | "overview"
  | "transition"
  | "final-third"
  | "coach-mode"
  | "press-detail";

/** One player motion within a phase. */
export type LessonFilmPlayerMove = {
  playerId: string;
  to: TacticalPoint;
  via?: TacticalPoint[];
  acceleration?: EngineAcceleration;
  /** Body/gaze at end of this move (engine interpolates facing). */
  orientation?: PlayerOrientation;
};

/** Ball flight + receive within a phase. */
export type LessonFilmBall = {
  id: string;
  start: TacticalPoint;
  end: TacticalPoint;
  via?: TacticalPoint[];
  path?: EngineBallPath;
  status?: EngineBallStatus;
  passerId: string;
  receiverId?: string;
  /** Absolute ms within the film (not only phase-local). */
  releaseTimeMs: number;
  arrivalTimeMs: number;
  receiveHolderId?: string;
  /** First-touch settle after arrival (ms hold with ball at foot). */
  firstTouchSettleMs?: number;
};

export type LessonFilmCamera = {
  preset: EngineCameraPreset;
  followPlayerIds?: string[];
  maxZoomHint?: number;
};

/**
 * One story phase. Lessons compose these; the engine renders motion/timing/overlays.
 */
export type LessonFilmPhase = {
  id: string;
  title: string;
  startMs: number;
  durationMs: number;
  statusLabel: string;
  teachingPoint: string;
  phase: TacticalAnimationPhase;
  players?: LessonFilmPlayerMove[];
  opponents?: LessonFilmPlayerMove[];
  ball?: LessonFilmBall;
  camera?: LessonFilmCamera;
  highlightPlayerIds?: string[];
  zones?: TacticalZone[];
  lines?: TacticalLine[];
  /** Hold (freeze) at end of phase before next starts — ms. */
  freezeMs?: number;
  /** Marks a decision/trigger beat (status + highlight contract). */
  isTrigger?: boolean;
  /** Explicit orientations for players who do not move this phase. */
  holdOrientations?: Record<string, PlayerOrientation>;
};

/**
 * Canonical lesson → engine input.
 * One reusable engine. Not 18 bespoke animations.
 */
export type LessonFilmSpec = {
  id: string;
  situationId: string;
  totalDurationMs: number;
  pauseAtEndMs?: number;
  autoplay?: boolean;
  loop?: boolean;
  phases: LessonFilmPhase[];
};
