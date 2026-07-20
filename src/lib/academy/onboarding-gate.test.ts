/**
 * T-02-03 — onboarding_complete parse + gate matrix.
 */
import assert from "node:assert/strict";
import {
  ACADEMY_ONBOARDING_COMPLETE_KEY,
  isAcademyOnboardingComplete,
} from "@/lib/academy/onboarding-complete";
import {
  ACADEMY_ONBOARDING_ENTRY,
  ACADEMY_POST_ONBOARDING_HOME,
  classifyAcademyRouteForOnboarding,
  resolveAcademyOnboardingGate,
} from "@/lib/academy/onboarding-gate";
import {
  academyContentPath,
  academyProbleemPath,
  academyRoutes,
  academyWedstrijdFasePath,
} from "@/lib/academy/routes";
import { shouldShowAcademyBottomTabBar } from "@/lib/academy/resolve-active-academy-tab";

assert.equal(ACADEMY_ONBOARDING_COMPLETE_KEY, "onboarding_complete");
assert.equal(ACADEMY_ONBOARDING_ENTRY, "/academy/onboarding/positie");
assert.equal(ACADEMY_POST_ONBOARDING_HOME, "/academy/positie");

// --- Completion parse ---
assert.equal(isAcademyOnboardingComplete(undefined), false, "missing → incomplete");
assert.equal(isAcademyOnboardingComplete({}), false, "absent key → incomplete");
assert.equal(isAcademyOnboardingComplete({ onboarding_complete: true }), true);
assert.equal(isAcademyOnboardingComplete({ onboarding_complete: false }), false);
assert.equal(isAcademyOnboardingComplete({ onboarding_complete: "true" }), true);
assert.equal(isAcademyOnboardingComplete({ onboarding_complete: "1" }), true);
assert.equal(isAcademyOnboardingComplete({ onboarding_complete: "false" }), false);
assert.equal(isAcademyOnboardingComplete({ onboarding_complete: "yes" }), false, "invalid string");
assert.equal(isAcademyOnboardingComplete({ onboarding_complete: 1 }), true);
assert.equal(isAcademyOnboardingComplete({ onboarding_complete: 2 }), false);
assert.equal(isAcademyOnboardingComplete({ onboarding_complete: null as unknown as boolean }), false);

// --- Route classification ---
assert.equal(classifyAcademyRouteForOnboarding(academyRoutes.onboardingPositie), "onboarding");
assert.equal(classifyAcademyRouteForOnboarding(academyRoutes.onboardingProblemen), "onboarding");
assert.equal(classifyAcademyRouteForOnboarding("/academy/onboarding"), "onboarding");
assert.equal(classifyAcademyRouteForOnboarding(academyRoutes.positie), "gated");
assert.equal(classifyAcademyRouteForOnboarding(academyRoutes.root), "gated");
assert.equal(classifyAcademyRouteForOnboarding(academyWedstrijdFasePath("voor")), "gated");
assert.equal(classifyAcademyRouteForOnboarding(academyProbleemPath("uitstappen-twijfel")), "gated");
assert.equal(classifyAcademyRouteForOnboarding(academyContentPath("pb.27")), "gated");
assert.equal(classifyAcademyRouteForOnboarding(academyRoutes.zoek), "gated");
assert.equal(classifyAcademyRouteForOnboarding(academyRoutes.teamCaptain), "gated");
assert.equal(classifyAcademyRouteForOnboarding("/academie"), "outside");
assert.equal(classifyAcademyRouteForOnboarding("/login"), "outside");

function decide(complete: boolean, pathname: string) {
  return resolveAcademyOnboardingGate({ onboardingComplete: complete, pathname });
}

// Incomplete + positie → S-10 (acceptance: cannot skip)
{
  const d = decide(false, academyRoutes.positie);
  assert.equal(d.action, "redirect");
  if (d.action === "redirect") {
    assert.equal(d.to, ACADEMY_ONBOARDING_ENTRY);
    assert.equal(d.reason, "onboarding_incomplete");
  }
}

// Incomplete + root → S-10 (no loop via /academy → /positie → …)
{
  const d = decide(false, academyRoutes.root);
  assert.equal(d.action, "redirect");
  if (d.action === "redirect") assert.equal(d.to, ACADEMY_ONBOARDING_ENTRY);
}

// Incomplete + deep links → S-10
for (const path of [
  academyWedstrijdFasePath("voor"),
  academyProbleemPath("uitstappen-twijfel"),
  academyContentPath("pb.27", { layer: "L2" }).split("?")[0]!,
  academyRoutes.seizoen + "/reflecties",
]) {
  const d = decide(false, path);
  assert.equal(d.action, "redirect", path);
  if (d.action === "redirect") assert.equal(d.to, ACADEMY_ONBOARDING_ENTRY);
}

// Incomplete + onboarding → allow (no self-loop)
assert.equal(decide(false, academyRoutes.onboardingPositie).action, "allow");
assert.equal(decide(false, academyRoutes.onboardingProblemen).action, "allow");

// Complete + positie → allow
assert.equal(decide(true, academyRoutes.positie).action, "allow");
assert.equal(decide(true, academyRoutes.root).action, "allow");

// Complete + onboarding → Positie (first-launch finished)
{
  const d = decide(true, academyRoutes.onboardingPositie);
  assert.equal(d.action, "redirect");
  if (d.action === "redirect") {
    assert.equal(d.to, ACADEMY_POST_ONBOARDING_HOME);
    assert.equal(d.reason, "onboarding_already_complete");
  }
}

// Shell: tabs hidden on onboarding
assert.equal(shouldShowAcademyBottomTabBar(academyRoutes.onboardingPositie), false);
assert.equal(shouldShowAcademyBottomTabBar(academyRoutes.positie), true);

console.log("onboarding-gate.test.ts: ok");
