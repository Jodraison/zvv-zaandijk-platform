/**
 * T-01-01 — runnable checks (no test framework in package.json).
 * Run: `npx tsx src/lib/academy/feature-flag.test.ts`
 */
import assert from "node:assert/strict";
import { ACADEMY_MOUNT_PATH, isAcademyEnabled, isAcademyPath } from "@/lib/academy/feature-flag";

const original = process.env.ACADEMY_ENABLED;

function restore() {
  if (original === undefined) {
    delete process.env.ACADEMY_ENABLED;
  } else {
    process.env.ACADEMY_ENABLED = original;
  }
}

try {
  delete process.env.ACADEMY_ENABLED;
  assert.equal(isAcademyEnabled(), false, "default OFF");

  process.env.ACADEMY_ENABLED = "1";
  assert.equal(isAcademyEnabled(), true, "1 enables");

  process.env.ACADEMY_ENABLED = "true";
  assert.equal(isAcademyEnabled(), true, "true enables");

  process.env.ACADEMY_ENABLED = "0";
  assert.equal(isAcademyEnabled(), false, "0 disables");

  assert.equal(ACADEMY_MOUNT_PATH, "/academy");
  assert.equal(isAcademyPath("/academy"), true);
  assert.equal(isAcademyPath("/academy/positie"), true);
  assert.equal(isAcademyPath("/academie"), false);
  assert.equal(isAcademyPath("/"), false);

  console.log("feature-flag.test.ts: ok");
} finally {
  restore();
}
