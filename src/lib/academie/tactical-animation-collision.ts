/**
 * Tactical Animation System V4 — collision-aware movement helpers.
 */

import type { TacticalPoint } from "@/lib/academie/tactical-visual-system";

export const SAFE_PLAYER_RADIUS = 3.8;

export function dist(a: TacticalPoint, b: TacticalPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Polyline-interpolatie 0–1 over via-punten + eindpunt. */
export function lerpPath(points: TacticalPoint[], t: number): TacticalPoint {
  if (points.length === 0) return { x: 50, y: 50 };
  if (points.length === 1) return { ...points[0]! };
  const clamped = Math.max(0, Math.min(1, t));
  const segs = points.length - 1;
  const x = clamped * segs;
  const i = Math.min(Math.floor(x), segs - 1);
  const local = x - i;
  const a = points[i]!;
  const b = points[i + 1]!;
  return { x: a.x + (b.x - a.x) * local, y: a.y + (b.y - a.y) * local };
}

/** Kwadraatische Bézier via één controlepunt → discrete via-punten. */
export function createCurvedRun(
  from: TacticalPoint,
  to: TacticalPoint,
  opts?: { bulge?: number; side?: "left" | "right" | "auto"; samples?: number },
): TacticalPoint[] {
  const bulge = opts?.bulge ?? 8;
  const samples = Math.max(2, opts?.samples ?? 3);
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  let sign = 1;
  if (opts?.side === "left") sign = -1;
  else if (opts?.side === "right") sign = 1;
  else sign = dy >= 0 ? -1 : 1;
  const ctrl: TacticalPoint = {
    x: mx + nx * bulge * sign,
    y: my + ny * bulge * sign,
  };
  const via: TacticalPoint[] = [];
  for (let i = 1; i <= samples; i++) {
    const t = i / (samples + 1);
    const omt = 1 - t;
    via.push({
      x: omt * omt * from.x + 2 * omt * t * ctrl.x + t * t * to.x,
      y: omt * omt * from.y + 2 * omt * t * ctrl.y + t * t * to.y,
    });
  }
  return via;
}

/**
 * Pressingboog: start → boog die passlijn snijdt → gecontroleerde eindpositie.
 * `cutPoint` = waar de passlijn wordt afgesloten (niet altijd eindpositie).
 */
export function createPressingArc(
  from: TacticalPoint,
  cutPoint: TacticalPoint,
  end: TacticalPoint,
  opts?: { bulge?: number },
): TacticalPoint[] {
  const mid = createCurvedRun(from, cutPoint, { bulge: opts?.bulge ?? 7, samples: 2 });
  const finish = createCurvedRun(cutPoint, end, { bulge: (opts?.bulge ?? 7) * 0.45, samples: 1 });
  return [...mid, cutPoint, ...finish];
}

/** Duw `candidate` weg van `obstacle` tot minimale radius. */
export function avoidPlayerCollision(
  candidate: TacticalPoint,
  obstacle: TacticalPoint,
  minRadius = SAFE_PLAYER_RADIUS,
): TacticalPoint {
  const d = dist(candidate, obstacle);
  if (d >= minRadius || d < 0.001) {
    if (d < 0.001) {
      return { x: obstacle.x + minRadius, y: obstacle.y };
    }
    return candidate;
  }
  const scale = minRadius / d;
  return {
    x: obstacle.x + (candidate.x - obstacle.x) * scale,
    y: obstacle.y + (candidate.y - obstacle.y) * scale,
  };
}

/** Pas via-punten aan zodat geen sample te dicht bij obstacles komt. */
export function bendPathAroundObstacles(
  from: TacticalPoint,
  to: TacticalPoint,
  via: TacticalPoint[],
  obstacles: TacticalPoint[],
  minRadius = SAFE_PLAYER_RADIUS,
): TacticalPoint[] {
  return via.map((p) => {
    let cur = { ...p };
    for (const o of obstacles) {
      cur = avoidPlayerCollision(cur, o, minRadius);
    }
    return cur;
  });
}

/** Bouw veilige curved run die obstakels ontwijkt. */
export function createSafeCurvedRun(
  from: TacticalPoint,
  to: TacticalPoint,
  obstacles: TacticalPoint[],
  opts?: { bulge?: number; side?: "left" | "right" | "auto"; minRadius?: number },
): { via: TacticalPoint[]; to: TacticalPoint } {
  const minR = opts?.minRadius ?? SAFE_PLAYER_RADIUS;
  let via = createCurvedRun(from, to, opts);
  via = bendPathAroundObstacles(from, to, via, obstacles, minR);
  let safeTo = { ...to };
  for (const o of obstacles) {
    safeTo = avoidPlayerCollision(safeTo, o, minR);
  }
  return { via, to: safeTo };
}

/** Sample pad op N tijdstippen (voor collision-validatie). */
export function samplePath(
  from: TacticalPoint,
  to: TacticalPoint,
  via: TacticalPoint[] | undefined,
  samples = 8,
): TacticalPoint[] {
  const points = [from, ...(via ?? []), to];
  const out: TacticalPoint[] = [];
  for (let i = 0; i <= samples; i++) {
    out.push(lerpPath(points, i / samples));
  }
  return out;
}

/** Segment-afstand (dichtste punt tussen twee lijnstukken). */
export function segmentDistance(
  a1: TacticalPoint,
  a2: TacticalPoint,
  b1: TacticalPoint,
  b2: TacticalPoint,
): number {
  // Sample-based — voldoende voor veld-% validatie.
  let min = Infinity;
  for (let i = 0; i <= 6; i++) {
    const t = i / 6;
    const a = { x: a1.x + (a2.x - a1.x) * t, y: a1.y + (a2.y - a1.y) * t };
    for (let j = 0; j <= 6; j++) {
      const u = j / 6;
      const b = { x: b1.x + (b2.x - b1.x) * u, y: b1.y + (b2.y - b1.y) * u };
      min = Math.min(min, dist(a, b));
    }
  }
  return min;
}
