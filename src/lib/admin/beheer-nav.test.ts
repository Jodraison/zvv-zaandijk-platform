/**
 * Admin 2.0 nav config tests.
 * Run: `npx tsx src/lib/admin/beheer-nav.test.ts`
 */
import assert from "node:assert/strict";
import {
  BEHEER_NAV_GROUP_LABELS,
  BEHEER_OPS_NAV,
  BEHEER_PRIMARY_NAV,
  isBeheerNavActive,
  withSeason,
} from "@/lib/admin/beheer-nav";

assert.equal(BEHEER_NAV_GROUP_LABELS.primary, "Teambeheer");
assert.equal(BEHEER_NAV_GROUP_LABELS.ops, "Controle");

assert.ok(BEHEER_PRIMARY_NAV.some((i) => i.href === "/beheer/wedstrijden"));
assert.ok(BEHEER_PRIMARY_NAV.every((i) => !/Integrity|Disputes|Audit/i.test(i.label)));
assert.ok(BEHEER_OPS_NAV.some((i) => i.label === "Datacontrole"));
assert.ok(BEHEER_OPS_NAV.some((i) => i.label === "Wijzigingslog"));
assert.ok(BEHEER_OPS_NAV.some((i) => i.label === "Correcties"));

assert.equal(isBeheerNavActive("/beheer", "/beheer"), true);
assert.equal(isBeheerNavActive("/beheer/wedstrijden", "/beheer"), false);
assert.equal(isBeheerNavActive("/beheer/wedstrijden/abc", "/beheer/wedstrijden"), true);

assert.equal(withSeason("/beheer/spelers", "s1"), "/beheer/spelers?season=s1");

console.log("beheer-nav.test.ts: ok");
