import type { CelebrationType } from "@/lib/home/homepage-celebration";

export type CelebrationKind = Exclude<CelebrationType, null>;

export type CelebrationViewportTier = "mobile-375" | "mobile-390" | "mobile-430" | "tablet" | "desktop";

/** Totale speelduur vanaf start van de engine — daarna is de homepage rustig. */
export const CELEBRATION_DURATION_MS: Record<CelebrationKind, number> = {
  birthday: 11500,
  victory: 14500,
  birthday_victory: 15500,
};

/** Homepage eerst zichtbaar, daarna pas particles. */
export const CELEBRATION_START_DELAY_MS = 600;

export const CELEBRATION_REDUCED_MOTION_MS = 1400;
export const CELEBRATION_HOLD_AT_MS = 1800;

/**
 * High-contrast only — dark club-navy vanishes on the hero.
 * Bright sky-blue is allowed; #0b1f5f / #1d4ed8 / #1e3a8a are not.
 */
const BIRTHDAY_COLORS = ["#ffffff", "#fff7ed", "#fde68a", "#fbbf24", "#f59e0b", "#7dd3fc", "#38bdf8", "#fb7185"] as const;
const VICTORY_COLORS = ["#ffffff", "#f8fafc", "#fde68a", "#d4af37", "#fbbf24", "#7dd3fc", "#38bdf8"] as const;
const COMBINED_COLORS = ["#ffffff", "#fde68a", "#d4af37", "#fbbf24", "#7dd3fc", "#38bdf8", "#fff7ed"] as const;

export function celebrationColors(kind: CelebrationKind): readonly string[] {
  if (kind === "birthday") return BIRTHDAY_COLORS;
  if (kind === "victory") return VICTORY_COLORS;
  return COMBINED_COLORS;
}

export function celebrationViewportTier(width: number): CelebrationViewportTier {
  if (width <= 375) return "mobile-375";
  if (width <= 390) return "mobile-390";
  if (width <= 430) return "mobile-430";
  if (width <= 768) return "tablet";
  return "desktop";
}

/** Minder particles op smalle viewports — nog steeds overduidelijk feest. */
export function celebrationParticleScale(width: number): number {
  const tier = celebrationViewportTier(width);
  if (tier === "mobile-375") return 0.58;
  if (tier === "mobile-390") return 0.68;
  if (tier === "mobile-430") return 0.76;
  if (tier === "tablet") return 0.88;
  return 1;
}

export type CelebrationParticleBudget = {
  confetti: number;
  streamers: number;
  burstSparks: number;
  burstCount: number;
};

export function celebrationParticleBudget(kind: CelebrationKind, width: number): CelebrationParticleBudget {
  const scale = celebrationParticleScale(width);
  const base =
    kind === "birthday"
      ? { confetti: 360, streamers: 30, burstSparks: 88, burstCount: 8 }
      : kind === "victory"
        ? { confetti: 460, streamers: 36, burstSparks: 110, burstCount: 10 }
        : { confetti: 420, streamers: 32, burstSparks: 100, burstCount: 10 };
  return {
    confetti: Math.max(140, Math.round(base.confetti * scale)),
    streamers: Math.max(14, Math.round(base.streamers * scale)),
    burstSparks: Math.max(36, Math.round(base.burstSparks * scale)),
    burstCount: width <= 430 ? Math.min(base.burstCount, 6) : base.burstCount,
  };
}

export function celebrationOverlayClassName(): string {
  return "zvv-celebration-root pointer-events-none fixed inset-0";
}

export function celebrationChoreography(kind: CelebrationKind): {
  durationMs: number;
  startDelayMs: number;
  fadeStartMs: number;
} {
  return {
    durationMs: CELEBRATION_DURATION_MS[kind],
    startDelayMs: CELEBRATION_START_DELAY_MS,
    fadeStartMs: kind === "birthday" ? 10000 : kind === "victory" ? 12500 : 13800,
  };
}
