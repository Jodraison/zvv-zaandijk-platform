/**
 * T-01-03 — BottomTabBar config + active resolver tests.
 */
import assert from "node:assert/strict";
import {
  ACADEMY_BOTTOM_TAB_COUNT,
  ACADEMY_BOTTOM_TABS,
} from "@/lib/academy/academy-bottom-tabs";
import {
  resolveActiveAcademyTab,
  shouldShowAcademyBottomTabBar,
} from "@/lib/academy/resolve-active-academy-tab";
import { academyContentPath, academyRoutes } from "@/lib/academy/routes";

assert.equal(ACADEMY_BOTTOM_TAB_COUNT, 5, "exact five tabs");
assert.equal(ACADEMY_BOTTOM_TABS.length, 5);

assert.deepEqual(
  ACADEMY_BOTTOM_TABS.map((t) => t.label),
  ["Positie", "Situatie", "Probleem", "Wedstrijd", "Seizoen"],
);

assert.deepEqual(
  ACADEMY_BOTTOM_TABS.map((t) => t.href),
  [
    academyRoutes.positie,
    academyRoutes.situatie,
    academyRoutes.probleem,
    academyRoutes.wedstrijd,
    academyRoutes.seizoen,
  ],
);

assert.equal(
  ACADEMY_BOTTOM_TABS.some((t) => t.href === academyRoutes.zoek),
  false,
  "Zoek is not a tab",
);

assert.equal(resolveActiveAcademyTab(academyRoutes.positie), "positie");
assert.equal(resolveActiveAcademyTab(`${academyRoutes.positie}/extra`), "positie");
assert.equal(resolveActiveAcademyTab(academyRoutes.situatie), "situatie");
assert.equal(resolveActiveAcademyTab(`${academyRoutes.situatie}/wij-hebben-bal`), "situatie");
assert.equal(resolveActiveAcademyTab(`${academyRoutes.probleem}/uitstappen-twijfel`), "probleem");
assert.equal(resolveActiveAcademyTab(`${academyRoutes.wedstrijd}/voor`), "wedstrijd");
assert.equal(resolveActiveAcademyTab(`${academyRoutes.seizoen}/reflecties`), "seizoen");

assert.equal(resolveActiveAcademyTab(academyContentPath("pb.27")), null, "content: no tab");
assert.equal(resolveActiveAcademyTab(academyRoutes.zoek), null, "zoek: no tab");
assert.equal(resolveActiveAcademyTab(academyRoutes.teamCaptain), null);
assert.equal(resolveActiveAcademyTab("/academie"), null, "legacy academie");

assert.equal(shouldShowAcademyBottomTabBar(academyRoutes.positie), true);
assert.equal(shouldShowAcademyBottomTabBar(academyRoutes.onboardingPositie), false);
assert.equal(shouldShowAcademyBottomTabBar(academyRoutes.onboardingProblemen), false);
assert.equal(shouldShowAcademyBottomTabBar("/academy/onboarding"), false);
assert.equal(shouldShowAcademyBottomTabBar("/academie"), false);

console.log("bottom-tab-bar.test.ts: ok");
