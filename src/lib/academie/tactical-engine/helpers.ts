/**
 * Engine helpers — pressing shadow, lanes, triggers, first touch, camera.
 * Lessons call these; they never invent SVG.
 */

import type { TacticalAnimationEasing } from "@/lib/academie/tactical-animation-types";
import type { EngineAcceleration, LessonFilmCamera } from "@/lib/academie/tactical-engine/types";
import type { PlayerOrientation } from "@/lib/academie/tactical-orientation";
import { angleToward } from "@/lib/academie/tactical-orientation";
import type { TacticalLine, TacticalPoint, TacticalZone } from "@/lib/academie/tactical-visual-system";
import { ballAtReceivingFoot } from "@/lib/academie/tactical-visual-system";

/** Map acceleration profile → easing (sprint easeOut / decelerate easeIn). */
export function easingFromAcceleration(profile?: EngineAcceleration): TacticalAnimationEasing {
  switch (profile) {
    case "walk-adjust":
      return "linear";
    case "jog":
      return "easeInOut";
    case "accelerate":
      return "easeInOut";
    case "sprint":
      return "easeOut";
    case "decelerate":
      return "easeIn";
    default:
      return "easeInOut";
  }
}

/** Pressing shadow — taper cover-shadow from presser toward carrier. */
export function pressingShadowZone(
  presser: TacticalPoint,
  carrier: TacticalPoint,
  opts?: { label?: string; length?: number },
): TacticalZone {
  const dx = carrier.x - presser.x;
  const dy = carrier.y - presser.y;
  const len = Math.hypot(dx, dy) || 1;
  const dirDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
  const shadowLen = opts?.length ?? Math.min(16, Math.max(8, len * 0.55));
  const pad = 4;
  return {
    x: Math.min(presser.x, carrier.x) - pad,
    y: Math.min(presser.y, carrier.y) - pad,
    w: Math.abs(dx) + pad * 2,
    h: Math.abs(dy) + pad * 2,
    kind: "cover-shadow",
    label: opts?.label ?? "Drukschaduw",
    geometry: {
      type: "taper-shadow",
      apex: { ...presser },
      dirDeg,
      nearWidth: 2.5,
      farWidth: 10,
      length: shadowLen,
    },
  };
}

/** Passing lane highlight between two points. */
export function passingLaneLine(
  from: TacticalPoint,
  to: TacticalPoint,
  status: "pass" | "fault" | "press" = "pass",
): TacticalLine {
  return {
    kind: status,
    from,
    to,
    dashed: status === "press",
  };
}

/** Open body toward next target (receive / first touch). */
export function openBodyToward(
  from: TacticalPoint,
  toward: TacticalPoint,
  extras?: Partial<PlayerOrientation>,
): PlayerOrientation {
  return {
    facingAngleDeg: angleToward(from, toward),
    bodyShape: extras?.bodyShape ?? "half-open",
    visionTarget: extras?.visionTarget ?? { type: "ball" },
    receivingFoot: extras?.receivingFoot,
    nextActionIntent: extras?.nextActionIntent ?? "play-forward",
    prePassScan: extras?.prePassScan,
  };
}

/** Ball settle at receiving foot after a pass. */
export function receiveAtFoot(
  receiverAt: TacticalPoint,
  opts?: {
    foot?: "left" | "right" | "front" | "back-foot" | "either";
    facingDeg?: number;
  },
): TacticalPoint {
  return ballAtReceivingFoot(receiverAt, opts);
}

/** Camera follow pack — ids the renderer may zoom toward. */
export function cameraFollow(
  playerIds: string[],
  preset: LessonFilmCamera["preset"] = "press-detail",
): LessonFilmCamera {
  return {
    preset,
    followPlayerIds: playerIds,
    maxZoomHint: preset === "press-detail" ? 1.35 : preset === "final-third" ? 1.2 : 1,
  };
}

/** Arc via for curved runs (field %). */
export function motionArc(
  from: TacticalPoint,
  to: TacticalPoint,
  bulge = 3,
  side: 1 | -1 = 1,
): TacticalPoint[] {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * bulge * side;
  const ny = (dx / len) * bulge * side;
  return [{ x: mx + nx, y: my + ny }];
}
