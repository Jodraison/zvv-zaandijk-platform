import assert from "node:assert/strict";
import { AcademyLoadingSkeleton } from "@/components/academy/academy-loading-skeleton";
import { AcademyOfflineBanner } from "@/components/academy/academy-offline-banner";
import { ACADEMY_OFFLINE_BANNER_COPY } from "@/lib/academy/offline-flag";

/** T-01-05 — C-C25 / C-C27 exports + banner copy (acceptance copy). */
assert.equal(typeof AcademyOfflineBanner, "function");
assert.equal(typeof AcademyLoadingSkeleton, "function");
assert.equal(ACADEMY_OFFLINE_BANNER_COPY, "Offline · cached week");

console.log("offline-banner-skeleton.test.ts: ok");
