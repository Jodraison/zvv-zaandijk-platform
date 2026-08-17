/**
 * Tactical Analysis Camera V6 — soft pan/zoom via viewBox interpolation.
 * Presentation-only; does not change field % coordinates.
 */

import { TACTICAL_MOTION, type TacticalVisualPreset } from "@/lib/academie/tactical-visual-tokens";
import { TACTICAL_VIEWBOX, fieldPointToSvg, type TacticalPoint } from "@/lib/academie/tactical-visual-system";

export type CameraViewBox = { x: number; y: number; w: number; h: number };

const FULL: CameraViewBox = {
  x: 0,
  y: 0,
  w: TACTICAL_VIEWBOX.width,
  h: TACTICAL_VIEWBOX.height,
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/** Focus rect around ball + highlighted players (field %). */
export function computeFocusViewBox(
  points: TacticalPoint[],
  preset: TacticalVisualPreset,
  reducedMotion: boolean,
): CameraViewBox {
  if (reducedMotion || points.length === 0 || preset.maxZoom <= 0.02) return FULL;

  const svgPts = points.map(fieldPointToSvg);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of svgPts) {
    minX = Math.min(minX, p.cx);
    minY = Math.min(minY, p.cy);
    maxX = Math.max(maxX, p.cx);
    maxY = Math.max(maxY, p.cy);
  }

  const pad = TACTICAL_MOTION.focusPadding;
  minX -= pad;
  minY -= pad;
  maxX += pad;
  maxY += pad;

  let w = maxX - minX;
  let h = maxY - minY;
  const aspect = FULL.w / FULL.h;
  if (w / h < aspect) w = h * aspect;
  else h = w / aspect;

  // Cap zoom: never crop more than maxZoom of full frame.
  const minW = FULL.w * (1 - preset.maxZoom);
  const minH = FULL.h * (1 - preset.maxZoom);
  if (w < minW) {
    const cx = (minX + maxX) / 2;
    w = minW;
    h = minH;
    minX = cx - w / 2;
    minY = (minY + maxY) / 2 - h / 2;
  }

  // Keep inside full canvas
  minX = clamp(minX, 0, FULL.w - w);
  minY = clamp(minY, 0, FULL.h - h);
  w = clamp(w, minW, FULL.w);
  h = clamp(h, minH, FULL.h);

  return { x: minX, y: minY, w, h };
}

export function interpolateViewBox(from: CameraViewBox, to: CameraViewBox, t: number): CameraViewBox {
  const e = easeInOut(clamp(t, 0, 1));
  return {
    x: from.x + (to.x - from.x) * e,
    y: from.y + (to.y - from.y) * e,
    w: from.w + (to.w - from.w) * e,
    h: from.h + (to.h - from.h) * e,
  };
}

export function viewBoxToString(vb: CameraViewBox): string {
  return `${vb.x.toFixed(2)} ${vb.y.toFixed(2)} ${vb.w.toFixed(2)} ${vb.h.toFixed(2)}`;
}

export function fullViewBox(): CameraViewBox {
  return { ...FULL };
}

/**
 * Fixed field-% crop → SVG viewBox (for teaching cameras like press-detail).
 * `rect` is field %: x/y top-left, w/h size. Maintains full canvas aspect.
 */
export function fieldPercentRectToViewBox(rect: {
  x: number;
  y: number;
  w: number;
  h: number;
}): CameraViewBox {
  const { field } = TACTICAL_VIEWBOX;
  let x = field.x + (rect.x / 100) * field.w;
  let y = field.y + (rect.y / 100) * field.h;
  let w = (rect.w / 100) * field.w;
  let h = (rect.h / 100) * field.h;
  const aspect = FULL.w / FULL.h;
  if (w / h < aspect) w = h * aspect;
  else h = w / aspect;
  // Prefer showing ~40–55% of full frame for teaching crops
  const minW = FULL.w * 0.4;
  const minH = FULL.h * 0.4;
  if (w < minW) {
    const cx = x + w / 2;
    const cy = y + h / 2;
    w = minW;
    h = minH;
    x = cx - w / 2;
    y = cy - h / 2;
  }
  x = clamp(x, 0, FULL.w - w);
  y = clamp(y, 0, FULL.h - h);
  return { x, y, w, h };
}

/** Infer preset from situation id / phase (presentation heuristic). */
export function inferPresetId(
  situationId: string,
  statusLabel?: string,
): import("@/lib/academie/tactical-visual-tokens").TacticalVisualPresetId {
  const id = situationId.toLowerCase();
  const phase = (statusLabel ?? "").toLowerCase();
  if (id.includes("connected")) return "full-team-tactical";
  if (id.includes("press") || phase.includes("druk")) return "pressing";
  if (id.includes("build") || id.includes("lcv") || id.includes("gk")) return "build-up";
  if (id.includes("choice") || id.includes("kw-") || id.includes("forward") || id.includes("relocate"))
    return "final-third";
  if (id.includes("solo") || id.includes("blind") || id.includes("hang") || id.includes("freeze"))
    return id.includes("support") || id.includes("press") || id.includes("recover") || id.includes("refocus") || id.includes("tempo")
      ? "comparison-good"
      : "comparison-bad";
  if (phase.includes("vervolg") || phase.includes("transit")) return "transition";
  if (phase.includes("gevolg") || phase.includes("begin") || phase.includes("situatie")) return "overview";
  return "overview";
}
