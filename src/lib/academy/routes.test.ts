/**
 * T-01-02 unit checks for central routing helper.
 * Run via `npm run test:academy-foundation`.
 */
import assert from "node:assert/strict";
import { ACADEMY_MOUNT_PATH } from "@/lib/academy/feature-flag";
import {
  academyContentPath,
  academyProbleemPath,
  academyRoutes,
  academyWedstrijdFasePath,
} from "@/lib/academy/routes";

assert.equal(academyRoutes.root, ACADEMY_MOUNT_PATH);
assert.equal(academyRoutes.positie, "/academy/positie");
assert.equal(academyRoutes.zoek, "/academy/zoek");
assert.equal(academyRoutes.teamCaptain, "/academy/team/captain");
assert.equal(academyProbleemPath("uitstappen-twijfel"), "/academy/probleem/uitstappen-twijfel");
assert.equal(academyWedstrijdFasePath("voor"), "/academy/wedstrijd/voor");
assert.equal(academyContentPath("pb.27", { layer: "L2" }), "/academy/content/pb.27?layer=L2");

console.log("routes.test.ts: ok");
