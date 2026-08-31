/**
 * Canonical celebration show — visible-at-rest DOM pieces.
 * Motion is optional. If CSS/WAAPI/rAF never run, pieces stay in the viewport.
 */
import type { CelebrationType } from "@/lib/home/homepage-celebration";

export type CelebrationKind = Exclude<CelebrationType, null>;

export const CELEBRATION_START_DELAY_MS = 700;

export const CELEBRATION_DURATION_MS: Record<CelebrationKind, number> = {
  birthday: 11000,
  victory: 14000,
  birthday_victory: 15000,
};

export const CELEBRATION_REDUCED_DURATION_MS = 4500;

export const CELEBRATION_Z_INDEX = 9990;

export const CELEBRATION_COLORS: Record<CelebrationKind, readonly string[]> = {
  birthday: ["#FFFFFF", "#FFF4C2", "#FFD84D", "#F59E0B", "#7DD3FC", "#38BDF8", "#FB7185"],
  victory: ["#FFFFFF", "#F8FAFC", "#FFD84D", "#D4AF37", "#FBBF24", "#7DD3FC", "#38BDF8"],
  birthday_victory: ["#FFFFFF", "#FFF4C2", "#FFD84D", "#D4AF37", "#FBBF24", "#7DD3FC", "#38BDF8"],
};

export type CelebrationPieceKind = "confetti" | "streamer" | "burst";

export type CelebrationPiece = {
  id: string;
  kind: CelebrationPieceKind;
  color: string;
  leftPct: number;
  topPct: number;
  width: number;
  height: number;
  rotate: number;
  dx: number;
  delayMs: number;
  durationMs: number;
  sparks?: number;
};

export type CelebrationShowBudget = {
  confetti: number;
  streamers: number;
  bursts: number;
};

export function celebrationShowBudget(kind: CelebrationKind, width: number): CelebrationShowBudget {
  const mobile = width <= 430;
  if (kind === "birthday") {
    return mobile
      ? { confetti: 28, streamers: 6, bursts: 2 }
      : { confetti: 40, streamers: 8, bursts: 3 };
  }
  if (kind === "victory") {
    return mobile
      ? { confetti: 34, streamers: 7, bursts: 3 }
      : { confetti: 52, streamers: 10, bursts: 4 };
  }
  return mobile
    ? { confetti: 32, streamers: 7, bursts: 3 }
    : { confetti: 48, streamers: 9, bursts: 4 };
}

export function celebrationShowNodeCount(budget: CelebrationShowBudget, sparksPerBurst = 8): number {
  return budget.confetti + budget.streamers + budget.bursts * (1 + sparksPerBurst);
}

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(items: readonly T[], rnd: () => number): T {
  return items[Math.floor(rnd() * items.length)]!;
}

const FORBIDDEN_COLORS = new Set(["#1D4ED8", "#0B1F5F", "#1E3A8A", "#020817", "#0B1228"]);

/** Piece occupies the viewport before any animation runs. */
export function celebrationPieceVisibleAtRest(piece: CelebrationPiece): boolean {
  if (piece.leftPct < 2 || piece.leftPct > 97) return false;
  if (piece.topPct < 6 || piece.topPct > 74) return false;
  if (piece.kind === "burst") return piece.width >= 72 && piece.height >= 72;
  if (piece.kind === "streamer") return piece.width >= 7 && piece.height >= 64;
  return piece.width >= 12 && piece.height >= 14 && !FORBIDDEN_COLORS.has(piece.color.toUpperCase());
}

export function celebrationShowQuadrants(pieces: readonly CelebrationPiece[]): {
  nw: boolean;
  ne: boolean;
  sw: boolean;
  se: boolean;
} {
  return {
    nw: pieces.some((p) => p.leftPct < 50 && p.topPct < 40),
    ne: pieces.some((p) => p.leftPct >= 50 && p.topPct < 40),
    sw: pieces.some((p) => p.leftPct < 50 && p.topPct >= 40),
    se: pieces.some((p) => p.leftPct >= 50 && p.topPct >= 40),
  };
}

/**
 * Deterministic in-viewport layout. Seeded so SSR/client stay aligned
 * when the same seed is used after mount (client-only render).
 */
export function buildCelebrationShow(opts: {
  kind: CelebrationKind;
  width: number;
  seed: string;
}): CelebrationPiece[] {
  const rnd = mulberry32(hashSeed(opts.seed));
  const colors = CELEBRATION_COLORS[opts.kind];
  const budget = celebrationShowBudget(opts.kind, opts.width);
  const pieces: CelebrationPiece[] = [];

  for (let i = 0; i < budget.confetti; i += 1) {
    const col = i % 8;
    const row = Math.floor(i / 8);
    pieces.push({
      id: `c-${i}`,
      kind: "confetti",
      color: pick(colors, rnd),
      leftPct: 4 + col * 12 + rnd() * 6,
      topPct: 10 + (row % 5) * 11 + rnd() * 5,
      width: 14 + Math.round(rnd() * 8),
      height: 16 + Math.round(rnd() * 10),
      rotate: Math.round(rnd() * 50 - 25),
      dx: Math.round((rnd() - 0.5) * 80),
      delayMs: Math.round(rnd() * 420),
      durationMs: 5200 + Math.round(rnd() * 2800),
    });
  }

  for (let i = 0; i < budget.streamers; i += 1) {
    const fromLeft = i % 2 === 0;
    pieces.push({
      id: `s-${i}`,
      kind: "streamer",
      color: pick(colors, rnd),
      leftPct: fromLeft ? 5 + rnd() * 14 : 78 + rnd() * 16,
      topPct: 8 + rnd() * 16,
      width: 8 + Math.round(rnd() * 4),
      height: 78 + Math.round(rnd() * 36),
      rotate: Math.round((fromLeft ? -1 : 1) * (8 + rnd() * 14)),
      dx: Math.round((fromLeft ? 1 : -1) * (24 + rnd() * 36)),
      delayMs: Math.round(rnd() * 280),
      durationMs: 6400 + Math.round(rnd() * 2200),
    });
  }

  const burstSlots =
    opts.kind === "birthday"
      ? [
          { left: 16, top: 18 },
          { left: 78, top: 20 },
          { left: 50, top: 28 },
        ]
      : [
          { left: 14, top: 16 },
          { left: 86, top: 18 },
          { left: 50, top: 22 },
          { left: 72, top: 32 },
        ];

  burstSlots.slice(0, budget.bursts).forEach((slot, i) => {
    pieces.push({
      id: `b-${i}`,
      kind: "burst",
      color: pick(["#FFFFFF", "#FFD84D", "#FBBF24"], rnd),
      leftPct: slot.left,
      topPct: slot.top,
      width: 96,
      height: 96,
      rotate: 0,
      dx: 0,
      delayMs: i * 180,
      durationMs: 1600,
      sparks: opts.width <= 430 ? 6 : 8,
    });
  });

  return pieces;
}
