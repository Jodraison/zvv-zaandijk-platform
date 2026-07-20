/**
 * T-01-05 — OfflineBanner flag + visibility.
 * Run via: `tsx src/lib/academy/offline-flag.test.ts` (also in test:academy-foundation).
 */
import assert from "node:assert/strict";
import {
  ACADEMY_OFFLINE_BANNER_COPY,
  isAcademyOfflineFlagEnabled,
  shouldShowAcademyOfflineBanner,
} from "@/lib/academy/offline-flag";

const original = process.env.ACADEMY_OFFLINE;

function restore() {
  if (original === undefined) {
    delete process.env.ACADEMY_OFFLINE;
  } else {
    process.env.ACADEMY_OFFLINE = original;
  }
}

try {
  delete process.env.ACADEMY_OFFLINE;
  assert.equal(isAcademyOfflineFlagEnabled(), false, "default OFF — banner hidden");
  assert.equal(shouldShowAcademyOfflineBanner(false), false);

  process.env.ACADEMY_OFFLINE = "1";
  assert.equal(isAcademyOfflineFlagEnabled(), true, "1 enables offline flag");
  assert.equal(shouldShowAcademyOfflineBanner(true), true, "flag ON → show banner");

  process.env.ACADEMY_OFFLINE = "true";
  assert.equal(isAcademyOfflineFlagEnabled(), true);

  process.env.ACADEMY_OFFLINE = "0";
  assert.equal(isAcademyOfflineFlagEnabled(), false, "0 disables — banner toggleable off");

  assert.equal(ACADEMY_OFFLINE_BANNER_COPY, "Offline · cached week");

  console.log("offline-flag.test.ts: ok");
} finally {
  restore();
}
