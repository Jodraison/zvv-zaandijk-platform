import type { CelebrationType } from "@/lib/home/homepage-celebration";

export type CelebrationKind = Exclude<CelebrationType, null>;

export type CelebrationViewportTier = "mobile-375" | "mobile-390" | "mobile-430" | "tablet" | "desktop";

/** Totale speelduur — daarna is de homepage volledig rustig. */
export const CELEBRATION_DURATION_MS: Record<CelebrationKind, number> = {
  birthday: 5600,
  victory: 7400,
  birthday_victory: 7800,
};

export const CELEBRATION_REDUCED_MOTION_MS = 1400;
export const CELEBRATION_HOLD_AT_MS = 1400;

/** High-contrast only — dark club-blue particles vanish on the hero. */
const BIRTHDAY_COLORS = ["#ffffff", "#fef3c7", "#fde68a", "#fbbf24", "#facc15", "#93c5fd", "#bfdbfe"] as const;
const VICTORY_COLORS = ["#ffffff", "#f8fafc", "#fde68a", "#d4af37", "#fbbf24", "#93c5fd", "#60a5fa"] as const;
const COMBINED_COLORS = ["#ffffff", "#fde68a", "#d4af37", "#fbbf24", "#93c5fd", "#bfdbfe", "#fef3c7"] as const;

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
  if (tier === "mobile-375") return 0.62;
  if (tier === "mobile-390") return 0.7;
  if (tier === "mobile-430") return 0.78;
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
      ? { confetti: 240, streamers: 22, burstSparks: 56, burstCount: 5 }
      : kind === "victory"
        ? { confetti: 320, streamers: 28, burstSparks: 72, burstCount: 6 }
        : { confetti: 280, streamers: 24, burstSparks: 64, burstCount: 6 };
  return {
    confetti: Math.max(90, Math.round(base.confetti * scale)),
    streamers: Math.max(10, Math.round(base.streamers * scale)),
    burstSparks: Math.max(24, Math.round(base.burstSparks * scale)),
    burstCount: width <= 430 ? Math.min(base.burstCount, 4) : base.burstCount,
  };
}

export function celebrationOverlayClassName(): string {
  return "pointer-events-none fixed inset-0 z-[45] overflow-hidden";
}
