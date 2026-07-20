/**
 * Central Academy onboarding route classification + gate (T-02-03).
 * Pure — no I/O. Used by middleware (and layout safety check).
 */
import { ACADEMY_MOUNT_PATH, isAcademyPath } from "@/lib/academy/feature-flag";
import { academyRoutes } from "@/lib/academy/routes";

export type AcademyOnboardingRouteClass =
  /** S-10 / S-11 — gate allows incomplete users here. */
  | "onboarding"
  /** Speelster product surfaces — require onboarding_complete. */
  | "gated"
  /** Outside `/academy` — not this gate’s concern. */
  | "outside";

export type AcademyOnboardingGateDecision =
  | { action: "allow" }
  | { action: "redirect"; to: string; reason: string };

/** First onboarding step (S-10) — canonical incomplete landing. */
export const ACADEMY_ONBOARDING_ENTRY = academyRoutes.onboardingPositie;

/** After first-launch complete, onboarding URLs leave the gate flow. */
export const ACADEMY_POST_ONBOARDING_HOME = academyRoutes.positie;

export function classifyAcademyRouteForOnboarding(pathname: string): AcademyOnboardingRouteClass {
  if (!isAcademyPath(pathname)) return "outside";

  if (
    pathname === academyRoutes.onboardingPositie ||
    pathname.startsWith(`${academyRoutes.onboardingPositie}/`) ||
    pathname === academyRoutes.onboardingProblemen ||
    pathname.startsWith(`${academyRoutes.onboardingProblemen}/`) ||
    pathname === `${ACADEMY_MOUNT_PATH}/onboarding` ||
    pathname.startsWith(`${ACADEMY_MOUNT_PATH}/onboarding/`)
  ) {
    return "onboarding";
  }

  return "gated";
}

/**
 * Server gate decision (first-launch).
 * Incomplete + gated → S-10. Complete + onboarding → Positie (no re-entry as first-launch).
 * No return/origin deep-link restore in T-02-03 — always frozen destinations.
 */
export function resolveAcademyOnboardingGate(input: {
  onboardingComplete: boolean;
  pathname: string;
}): AcademyOnboardingGateDecision {
  const routeClass = classifyAcademyRouteForOnboarding(input.pathname);

  if (routeClass === "outside") {
    return { action: "allow" };
  }

  if (!input.onboardingComplete) {
    if (routeClass === "onboarding") {
      return { action: "allow" };
    }
    // Loop guard: already on entry
    if (input.pathname === ACADEMY_ONBOARDING_ENTRY) {
      return { action: "allow" };
    }
    return {
      action: "redirect",
      to: ACADEMY_ONBOARDING_ENTRY,
      reason: "onboarding_incomplete",
    };
  }

  // Complete: first-launch done — leave onboarding for Positie (T-04 may add revision later).
  if (routeClass === "onboarding") {
    return {
      action: "redirect",
      to: ACADEMY_POST_ONBOARDING_HOME,
      reason: "onboarding_already_complete",
    };
  }

  return { action: "allow" };
}
