/**
 * Pure preference helpers — unit-tested without DOM.
 */
import {
  effectiveTacticalAnimationEnabled,
  parseTacticalAnimationPreference,
} from "@/lib/academie/tactical-animation-types";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(parseTacticalAnimationPreference("true") === "enabled", "true→enabled");
assert(parseTacticalAnimationPreference("false") === "disabled", "false→disabled");
assert(parseTacticalAnimationPreference("on") === "enabled", "on→enabled");
assert(parseTacticalAnimationPreference("off") === "disabled", "off→disabled");
assert(parseTacticalAnimationPreference("enabled") === "enabled", "enabled");
assert(parseTacticalAnimationPreference("disabled") === "disabled", "disabled");
assert(parseTacticalAnimationPreference("system") === "system", "system");
assert(parseTacticalAnimationPreference(null) === "system", "null→system");
assert(parseTacticalAnimationPreference("nope") === "system", "unknown→system");

assert(effectiveTacticalAnimationEnabled("enabled", true) === true, "enabled overrides RM");
assert(effectiveTacticalAnimationEnabled("enabled", false) === true, "enabled no RM");
assert(effectiveTacticalAnimationEnabled("disabled", false) === false, "disabled");
assert(effectiveTacticalAnimationEnabled("disabled", true) === false, "disabled+RM");
assert(effectiveTacticalAnimationEnabled("system", true) === false, "system+RM");
assert(effectiveTacticalAnimationEnabled("system", false) === true, "system no RM");

console.log("tactical-animation-preference.test: ok");
