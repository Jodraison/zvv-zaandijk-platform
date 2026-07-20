import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ADMIN_EMAIL } from "@/lib/auth/is-admin";
import {
  ACADEMY_CAPTAIN_LOCKED_HINT,
  resolveAcademyRoleGrants,
} from "@/lib/academy/academy-role-grants";

describe("resolveAcademyRoleGrants (T-01-04)", () => {
  it("non-admin: Captain and Trainer locked (acceptance)", () => {
    const g = resolveAcademyRoleGrants({
      email: "speelster@example.com",
      displayName: "Lisa",
    });
    assert.equal(g.canSpeelster, true);
    assert.equal(g.canCaptain, false);
    assert.equal(g.canTrainer, false);
    assert.equal(g.canAdmin, false);
    assert.equal(g.displayName, "Lisa");
    assert.ok(ACADEMY_CAPTAIN_LOCKED_HINT.length > 10);
  });

  it("admin (existing role): Captain and Trainer unlocked", () => {
    const g = resolveAcademyRoleGrants({ email: ADMIN_EMAIL });
    assert.equal(g.canCaptain, true);
    assert.equal(g.canTrainer, true);
    assert.equal(g.canAdmin, true);
  });

  it("falls back to email then Profiel for displayName", () => {
    assert.equal(resolveAcademyRoleGrants({ email: "a@b.nl" }).displayName, "a@b.nl");
    assert.equal(resolveAcademyRoleGrants({}).displayName, "Profiel");
  });
});
