/**
 * Tactical Animation Engine — public API.
 *
 * Lessons provide: players · movement · timing · ball · camera · phases
 * The engine compiles + evaluates + drives playback (freeze / replay / speed / scrub).
 */

export type {
  EngineAcceleration,
  EngineBallPath,
  EngineBallStatus,
  EngineCameraPreset,
  LessonFilmBall,
  LessonFilmCamera,
  LessonFilmPhase,
  LessonFilmPlayerMove,
  LessonFilmSpec,
} from "@/lib/academie/tactical-engine/types";

export { compileFilm, isLessonFilmSpec } from "@/lib/academie/tactical-engine/compile";
export { filmPass } from "@/lib/academie/tactical-engine/pass";
export {
  cameraFollow,
  easingFromAcceleration,
  motionArc,
  openBodyToward,
  passingLaneLine,
  pressingShadowZone,
  receiveAtFoot,
} from "@/lib/academie/tactical-engine/helpers";

/** Re-export runtime primitives so lessons need one import surface. */
export {
  evaluateTacticalAnimation,
  getAnimationStepEndMs,
  getAnimationStepStartMs,
  lerpPoint,
} from "@/lib/academie/tactical-animation-engine";
