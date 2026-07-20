/**
 * T-02-01 — route foundation checks (builders + canonical paths).
 * Run via `npm run test:academy-foundation`.
 */
import assert from "node:assert/strict";
import { ACADEMY_MOUNT_PATH } from "@/lib/academy/feature-flag";
import {
  academyContentPath,
  academyOefeningPath,
  academyPositiePath,
  academyProbleemPath,
  academyReflectiePath,
  academyRoutes,
  academySeizoenReflectiesPath,
  academySituatieDetailPath,
  academySituatiePoortPath,
  academyWedstrijdFasePath,
  isAcademyRoutePath,
} from "@/lib/academy/routes";

assert.equal(academyRoutes.root, ACADEMY_MOUNT_PATH);
assert.equal(academyRoutes.positie, "/academy/positie");
assert.equal(academyRoutes.zoek, "/academy/zoek");

// Root redirect target (page uses redirect(academyRoutes.positie))
assert.notEqual(academyRoutes.root, academyRoutes.positie, "no redirect loop: root ≠ positie");

// No double slashes in builders
const paths = [
  academyRoutes.positie,
  academyRoutes.situatie,
  academyRoutes.probleem,
  academyRoutes.wedstrijd,
  academyRoutes.seizoen,
  academyRoutes.zoek,
  academyRoutes.onboardingPositie,
  academyRoutes.onboardingProblemen,
  academyRoutes.teamCaptain,
  academyRoutes.teamTrainer,
  academyPositiePath({ highlight: "week" }).split("?")[0]!,
  academySituatiePoortPath("wij-hebben-bal"),
  academySituatieDetailPath("wij-hebben-bal", "opbouwen"),
  academyProbleemPath("uitstappen-twijfel"),
  academyContentPath("pb.27"),
  academyContentPath("pb.27", { layer: "L2" }),
  academyWedstrijdFasePath("voor"),
  academyOefeningPath("ex.27"),
  academyReflectiePath("match.1"),
  academySeizoenReflectiesPath(),
];

for (const p of paths) {
  assert.equal(p.includes("//"), false, `no double slash: ${p}`);
  assert.ok(p.startsWith("/academy"), `under mount: ${p}`);
}

assert.equal(academyContentPath("pb.27", { layer: "L2" }), "/academy/content/pb.27?layer=L2");
assert.equal(academyPositiePath({ highlight: "week" }), "/academy/positie?highlight=week");
assert.ok(isAcademyRoutePath("/academy/positie"));
assert.equal(isAcademyRoutePath("/academie"), false);

/** Must entrypoints that T-02-01 pages cover (App Router). */
const mustPagePaths = [
  academyRoutes.positie,
  academyRoutes.situatie,
  academyRoutes.probleem,
  academyRoutes.wedstrijd,
  academyRoutes.seizoen,
  academyRoutes.zoek,
  academyRoutes.teamCaptain,
  academyRoutes.teamTrainer,
  academyRoutes.onboardingPositie,
  academyRoutes.onboardingProblemen,
] as const;

assert.equal(mustPagePaths.length, 10);

console.log("route-foundation.test.ts: ok");
