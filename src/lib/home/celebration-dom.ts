import type { CelebrationKind } from "@/lib/home/celebration-visual";
import { celebrationColors, celebrationViewportTier } from "@/lib/home/celebration-visual";

export type CelebrationDomKind = "confetti" | "streamer" | "burst";

export type CelebrationDomPiece = {
  id: string;
  kind: CelebrationDomKind;
  color: string;
  leftPct: number;
  topPct: number;
  width: number;
  height: number;
  rotate: number;
  dx: number;
  delayMs: number;
  durationMs: number;
  variant: "a" | "b" | "c";
  sparks?: number;
};

export type CelebrationDomBudget = {
  confetti: number;
  streamers: number;
  bursts: number;
};

export const CELEBRATION_CANVAS_ENHANCEMENT_DELAY_MS = 250;

export function celebrationDomBudget(kind: CelebrationKind, width: number): CelebrationDomBudget {
  const mobile = celebrationViewportTier(width) !== "desktop" && celebrationViewportTier(width) !== "tablet";
  if (kind === "birthday") {
    return mobile
      ? { confetti: 38, streamers: 6, bursts: 3 }
      : { confetti: 58, streamers: 10, bursts: 3 };
  }
  if (kind === "victory") {
    return mobile
      ? { confetti: 42, streamers: 6, bursts: 3 }
      : { confetti: 60, streamers: 10, bursts: 4 };
  }
  return mobile
    ? { confetti: 40, streamers: 6, bursts: 3 }
    : { confetti: 62, streamers: 10, bursts: 4 };
}

export function celebrationDomSparksPerBurst(width: number): number {
  return width <= 430 ? 6 : 8;
}

export function celebrationDomNodeCount(budget: CelebrationDomBudget, width = 1440): number {
  return budget.confetti + budget.streamers + budget.bursts * (2 + celebrationDomSparksPerBurst(width));
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

/**
 * Deterministic DOM layout — client-only render, geen hydration mismatch.
 * Waves: opening (0), full rain (400), second wave (2400), card glow (3500),
 * falling (5500), finale (8500).
 */
export function buildCelebrationDomLayout(opts: {
  kind: CelebrationKind;
  width: number;
  seed: string;
}): CelebrationDomPiece[] {
  const rnd = mulberry32(hashSeed(opts.seed));
  const colors = celebrationColors(opts.kind);
  const budget = celebrationDomBudget(opts.kind, opts.width);
  const sparks = celebrationDomSparksPerBurst(opts.width);
  const pieces: CelebrationDomPiece[] = [];
  const variants = ["a", "b", "c"] as const;

  const waveDelays = [0, 0, 400, 2400, 3500, 5500, 8500];

  for (let i = 0; i < budget.confetti; i += 1) {
    const wave = waveDelays[i % waveDelays.length]!;
    const fromLeft = i % 2 === 0;
    pieces.push({
      id: `c-${i}`,
      kind: "confetti",
      color: pick(colors, rnd),
      leftPct: fromLeft ? 2 + rnd() * 44 : 52 + rnd() * 46,
      topPct: -4 + rnd() * 28,
      width: 8 + Math.round(rnd() * 6),
      height: 12 + Math.round(rnd() * 10),
      rotate: Math.round(rnd() * 360),
      dx: Math.round((rnd() - 0.5) * 180),
      delayMs: wave + Math.round(rnd() * 280),
      durationMs: 4200 + Math.round(rnd() * 3800),
      variant: pick(variants, rnd),
    });
  }

  for (let i = 0; i < budget.streamers; i += 1) {
    const fromLeft = i % 2 === 0;
    pieces.push({
      id: `s-${i}`,
      kind: "streamer",
      color: pick(colors, rnd),
      leftPct: fromLeft ? 3 + rnd() * 18 : 76 + rnd() * 20,
      topPct: -8 + rnd() * 10,
      width: 7 + Math.round(rnd() * 5),
      height: 72 + Math.round(rnd() * 50),
      rotate: Math.round((rnd() - 0.5) * 40),
      dx: Math.round((fromLeft ? 1 : -1) * (30 + rnd() * 50)),
      delayMs: (i < 5 ? 0 : 3200) + Math.round(rnd() * 400),
      durationMs: 5200 + Math.round(rnd() * 2800),
      variant: pick(variants, rnd),
    });
  }

  const burstSlots =
    opts.kind === "birthday"
      ? [
          { left: 14, top: 16, delay: 0 },
          { left: 78, top: 18, delay: 80 },
          { left: 72, top: 28, delay: 3500 },
        ]
      : [
          { left: 12, top: 14, delay: 0 },
          { left: 86, top: 16, delay: 60 },
          { left: 50, top: 20, delay: 2800 },
          { left: 74, top: 30, delay: 6200 },
        ];

  burstSlots.slice(0, budget.bursts).forEach((slot, i) => {
    pieces.push({
      id: `b-${i}`,
      kind: "burst",
      color: pick(["#ffffff", "#fde68a", "#fbbf24"], rnd),
      leftPct: slot.left,
      topPct: slot.top,
      width: 128,
      height: 128,
      rotate: 0,
      dx: 0,
      delayMs: slot.delay,
      durationMs: 1400,
      variant: "a",
      sparks,
    });
  });

  return pieces;
}
