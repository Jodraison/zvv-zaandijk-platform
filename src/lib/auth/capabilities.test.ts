/**
 * Capability matrix tests.
 * Run: npx tsx src/lib/auth/capabilities.test.ts
 */
import assert from "node:assert/strict";
import {
  roleFromProfileRole,
  roleHasCapability,
  capabilitiesForRole,
  ADMIN_EMAIL,
} from "@/lib/auth/capabilities";

{
  const owner = roleFromProfileRole("user", ADMIN_EMAIL);
  assert.equal(owner, "owner");
  assert.equal(roleHasCapability(owner, "system_admin"), true);
  assert.equal(roleHasCapability(owner, "manage_squad"), true);
}

{
  const tm = roleFromProfileRole("team_manager", "captain@example.com");
  assert.equal(tm, "team_manager");
  assert.equal(roleHasCapability(tm, "manage_squad"), true);
  assert.equal(roleHasCapability(tm, "manage_training"), true);
  assert.equal(roleHasCapability(tm, "manage_fitness"), true);
  assert.equal(roleHasCapability(tm, "manage_match_results"), true);
  assert.equal(roleHasCapability(tm, "system_admin"), false);
  assert.equal(roleHasCapability(tm, "manage_seasons"), false);
  assert.equal(roleHasCapability(tm, "view_audit"), false);
}

{
  const cap = roleFromProfileRole("captain", "someone@example.com");
  assert.equal(cap, "team_manager");
}

{
  const none = roleFromProfileRole("user", "player@example.com");
  assert.equal(none, "none");
  assert.equal(capabilitiesForRole(none).length, 0);
}

console.log("capabilities.test.ts: ok");
