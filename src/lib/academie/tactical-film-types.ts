/**
 * Canonical tactical film production types — connected-team baseline.
 * Coordinates remain field %; this layer describes choreography + visual direction.
 */

import type { TacticalPoint } from "@/lib/academie/tactical-visual-system";
import type { PlayerOrientation } from "@/lib/academie/tactical-orientation";

export type PresentationMode = "academy" | "coach" | "author" | "debug";

export type AuthoredBallTrajectory = {
  id: string;
  sceneId: string;
  releaseTimeMs: number;
  arrivalTimeMs: number;
  start: TacticalPoint;
  end: TacticalPoint;
  via?: TacticalPoint[];
  path: "linear" | "quadratic" | "cubic";
  status: "open" | "pressured" | "blocked" | "intercepted";
  passerId: string;
  receiverId?: string;
  releaseFoot?: "left" | "right";
};

export type AuthoredMotionPath = {
  playerId: string;
  sceneId: string;
  startMs: number;
  endMs: number;
  points: TacticalPoint[];
  movementType:
    | "scan-adjust"
    | "check-away"
    | "come-short"
    | "support"
    | "overlap"
    | "underlap"
    | "third-player"
    | "press"
    | "cover"
    | "recover"
    | "shift"
    | "hold-width"
    | "protect-depth";
  accelerationProfile: "walk-adjust" | "jog" | "accelerate" | "sprint" | "decelerate";
};

export type AuthoredPlayerAction = {
  playerId: string;
  to: TacticalPoint;
  via?: TacticalPoint[];
  movementType?: AuthoredMotionPath["movementType"];
  acceleration?: AuthoredMotionPath["accelerationProfile"];
  orientation?: PlayerOrientation;
};

export type AuthoredBallAction = {
  trajectory: AuthoredBallTrajectory;
  receiveHolderId?: string;
};

export type AuthoredCameraState = {
  preset: "full-team-tactical" | "overview" | "transition" | "final-third" | "coach-mode";
  maxZoomHint?: number;
};

export type AuthoredAnnotation =
  | { type: "caption"; label: string; text: string }
  | { type: "option-line"; fromId: string; toId: string }
  | { type: "press-route"; fromId: string; toId: string };

export type TacticalFilmFocus =
  | { type: "player"; playerId: string }
  | { type: "ball" }
  | { type: "space"; zoneId: string }
  | { type: "relationship"; playerIds: string[] };

export type TacticalFilmScene = {
  id: string;
  title: string;
  coachingObjective: string;
  startMs: number;
  durationMs: number;
  primaryFocus: TacticalFilmFocus;
  secondaryFocusIds?: string[];
  ballAction?: AuthoredBallAction;
  playerActions: AuthoredPlayerAction[];
  opponentActions: AuthoredPlayerAction[];
  camera: AuthoredCameraState;
  visibleAnnotations: AuthoredAnnotation[];
  hiddenAnnotations: string[];
  endHoldMs: number;
  /** Story chip label on controls / overlay. */
  statusLabel: string;
  teachingPoint: string;
  phase:
    | "initial"
    | "recognition"
    | "prepare"
    | "action"
    | "reaction"
    | "follow"
    | "result";
};

export type TacticalFilmScript = {
  id: string;
  situationId: "connected-team";
  presentationDefault: PresentationMode;
  attackDirection: "left-to-right";
  totalDurationMs: number;
  scenes: TacticalFilmScene[];
};

/** Map acceleration profile → engine easing. */
export function easingFromAcceleration(
  profile?: AuthoredMotionPath["accelerationProfile"],
): "linear" | "easeIn" | "easeOut" | "easeInOut" {
  switch (profile) {
    case "sprint":
    case "accelerate":
      return "easeOut";
    case "decelerate":
      return "easeIn";
    case "walk-adjust":
      return "linear";
    default:
      return "easeInOut";
  }
}

export function motionVia(points: TacticalPoint[]): {
  to: TacticalPoint;
  via?: TacticalPoint[];
} {
  if (points.length === 0) return { to: { x: 50, y: 50 } };
  if (points.length === 1) return { to: points[0]! };
  return { to: points[points.length - 1]!, via: points.slice(0, -1) };
}
