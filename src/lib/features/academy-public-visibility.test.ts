/**
 * WP-1 — Academy public visibility config (no test framework; tsx runner).
 * Run: `npx tsx src/lib/features/academy-public-visibility.test.ts`
 */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import {
  ACADEMIE_PUBLIC_MOUNT_PATH,
  ACADEMY_PUBLIC_VISIBLE_ENV,
  getAcademyFeatures,
  isAcademiePublicPath,
  isAcademiePublicVisible,
  shouldBlockAcademiePublicAccess,
} from "@/lib/features/academy-public-visibility";

const original = process.env[ACADEMY_PUBLIC_VISIBLE_ENV];

function restore() {
  if (original === undefined) {
    delete process.env[ACADEMY_PUBLIC_VISIBLE_ENV];
  } else {
    process.env[ACADEMY_PUBLIC_VISIBLE_ENV] = original;
  }
}

try {
  delete process.env[ACADEMY_PUBLIC_VISIBLE_ENV];
  assert.equal(isAcademiePublicVisible(), false, "missing env → hidden (fail closed)");
  assert.equal(getAcademyFeatures().academy.publicVisible, false);
  assert.equal(getAcademyFeatures().academy.adminVisible, true);

  process.env[ACADEMY_PUBLIC_VISIBLE_ENV] = "false";
  assert.equal(isAcademiePublicVisible(), false, "explicit false → hidden");

  process.env[ACADEMY_PUBLIC_VISIBLE_ENV] = "0";
  assert.equal(isAcademiePublicVisible(), false, "0 → hidden");

  process.env[ACADEMY_PUBLIC_VISIBLE_ENV] = "no";
  assert.equal(isAcademiePublicVisible(), false, "invalid → hidden (fail closed)");

  process.env[ACADEMY_PUBLIC_VISIBLE_ENV] = "";
  assert.equal(isAcademiePublicVisible(), false, "empty → hidden");

  process.env[ACADEMY_PUBLIC_VISIBLE_ENV] = "true";
  assert.equal(isAcademiePublicVisible(), true, "true → visible");

  process.env[ACADEMY_PUBLIC_VISIBLE_ENV] = "1";
  assert.equal(isAcademiePublicVisible(), true, "1 → visible");
  assert.equal(getAcademyFeatures().academy.publicVisible, true);

  assert.equal(ACADEMIE_PUBLIC_MOUNT_PATH, "/academie");
  assert.equal(isAcademiePublicPath("/academie"), true);
  assert.equal(isAcademiePublicPath("/academie/"), true);
  assert.equal(isAcademiePublicPath("/academie/decision-lab"), true);
  assert.equal(isAcademiePublicPath("/academie/onze-voetbalvisie/onze-identiteit"), true);
  assert.equal(isAcademiePublicPath("/academy"), false, "/academy is separate mount");
  assert.equal(isAcademiePublicPath("/academy/positie"), false);
  assert.equal(isAcademiePublicPath("/"), false);
  assert.equal(isAcademiePublicPath("/fitheid"), false);

  assert.equal(shouldBlockAcademiePublicAccess("/academie", false), true);
  assert.equal(shouldBlockAcademiePublicAccess("/academie/decision-lab", false), true);
  assert.equal(shouldBlockAcademiePublicAccess("/academie", true), false);
  assert.equal(shouldBlockAcademiePublicAccess("/", false), false);
  assert.equal(shouldBlockAcademiePublicAccess("/academy", false), false);
  assert.equal(shouldBlockAcademiePublicAccess("/fitheid", false), false);

  // Redirect target must not be an academie path (no loop)
  assert.equal(isAcademiePublicPath("/"), false, "redirect target / is safe");

  // Code retention — route tree still present
  const root = path.resolve(process.cwd());
  const mustExist = [
    "src/app/(site)/academie/page.tsx",
    "src/app/(site)/academie/decision-lab/page.tsx",
    "src/app/(site)/academie/[category]/page.tsx",
    "src/app/(site)/academie/[category]/[topic]/page.tsx",
    "src/app/(site)/academie/layout.tsx",
    "src/components/academie/academy-home-dashboard.tsx",
    "src/lib/academie/registry.ts",
    "src/middleware.ts",
  ];
  for (const rel of mustExist) {
    assert.ok(existsSync(path.join(root, rel)), `retained: ${rel}`);
  }

  console.log("academy-public-visibility.test.ts: ok");
} finally {
  restore();
}
