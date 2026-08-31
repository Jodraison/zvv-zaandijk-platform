import type { CelebrationType } from "@/lib/home/homepage-celebration";

export type CelebrationKind = Exclude<CelebrationType, null>;

export type CelebrationViewportTier = "mobile-375" | "mobile-390" | "mobile-430" | "tablet" | "desktop";

/** Totale speelduur — daarna is de homepage volledig rustig. */
export const CELEBRATION_DURATION_MS: Record<CelebrationKind, number> = {
  birthday: 5200,
  victory: 6800,
  birthday_victory: 7600,
};

export const CELEBRATION_REDUCED_MOTION_MS = 1400;
export const CELEBRATION_HOLD_AT_MS = 1400;

const BIRTHDAY_COLORS = ["#93c5fd", "#ffffff", "#fde68a", "#1d4ed8", "#fbbf24", "#bfdbfe", "#fef3c7"] as const;
const VICTORY_COLORS = ["#1d4ed8", "#ffffff", "#93c5fd", "#1e3a8a", "#d4af37", "#f8fafc", "#60a5fa"] as const;
const COMBINED_COLORS = ["#1d4ed8", "#ffffff", "#d4af37", "#fbbf24", "#93c5fd", "#1e3a8a", "#fef3c7"] as const;

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

/** Minder particles op smalle viewports — geen zware canvasload. */
export function celebrationParticleScale(width: number): number {
  const tier = celebrationViewportTier(width);
  if (tier === "mobile-375") return 0.42;
  if (tier === "mobile-390") return 0.48;
  if (tier === "mobile-430") return 0.55;
  if (tier === "tablet") return 0.72;
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
      ? { confetti: 108, streamers: 12, burstSparks: 32, burstCount: 3 }
      : kind === "victory"
        ? { confetti: 148, streamers: 16, burstSparks: 40, burstCount: 4 }
        : { confetti: 136, streamers: 14, burstSparks: 36, burstCount: 4 };
  return {
    confetti: Math.max(18, Math.round(base.confetti * scale)),
    streamers: Math.max(3, Math.round(base.streamers * scale)),
    burstSparks: Math.max(10, Math.round(base.burstSparks * scale)),
    burstCount: width <= 430 ? Math.min(base.burstCount, 3) : base.burstCount,
  };
}

export function celebrationOverlayClassName(): string {
  return "pointer-events-none fixed inset-0 z-[45] overflow-hidden";
}
