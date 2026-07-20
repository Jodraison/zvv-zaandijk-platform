/**
 * T-04-01 certification closure — metadata contract + server validation matrix.
 */
import assert from "node:assert/strict";
import { isAcademyOnboardingComplete } from "@/lib/academy/onboarding-complete";
import {
  ACADEMY_ALLOWED_EXPERIENCES,
  ACADEMY_DEFAULT_EXPERIENCE,
  ACADEMY_EXPERIENCE_KEY,
  ACADEMY_ONBOARDING_COMPLETE_KEY,
  ACADEMY_ONBOARDING_PROBLEMS_KEY,
  ACADEMY_PRIMARY_POSITION_KEY,
  ACADEMY_SECONDARY_POSITION_KEY,
  assertCanonicalOnboardingKeysOnly,
  assertNoRoleKeysInOnboardingPayload,
  buildAcademyPositieStepMetadata,
  buildAcademyStartAcademyMetadata,
  readAcademyOnboardingDraft,
} from "@/lib/academy/onboarding-metadata";
import {
  resolveAcademyOnboardingGate,
  ACADEMY_ONBOARDING_ENTRY,
  ACADEMY_POST_ONBOARDING_HOME,
} from "@/lib/academy/onboarding-gate";
import {
  validateAcademyPositieStepInput,
  validateAcademyStartAcademyInput,
} from "@/lib/academy/onboarding-validate";
import { listMvpProblems, loadProblems, loadPositions } from "@/lib/academy/registry/loaders";
import { academyRoutes } from "@/lib/academy/routes";
import { shouldShowAcademyBottomTabBar } from "@/lib/academy/resolve-active-academy-tab";

// ── Canonical keys (Journey Freeze) — not backlog/ARCH shorthand ───────────
assert.equal(ACADEMY_PRIMARY_POSITION_KEY, "primary_position");
assert.notEqual(ACADEMY_PRIMARY_POSITION_KEY, "primary_pos");
assert.equal(ACADEMY_SECONDARY_POSITION_KEY, "secondary_position");
assert.equal(ACADEMY_ONBOARDING_PROBLEMS_KEY, "onboarding_problems");
assert.notEqual(ACADEMY_ONBOARDING_PROBLEMS_KEY, "problems");
assert.equal(ACADEMY_EXPERIENCE_KEY, "experience");
assert.equal(ACADEMY_ONBOARDING_COMPLETE_KEY, "onboarding_complete");
assert.deepEqual([...ACADEMY_ALLOWED_EXPERIENCES], ["4e-klasse"]);

const positiePayload = buildAcademyPositieStepMetadata({
  primaryPositionId: "pos.lb",
  secondaryPositionId: "pos.l6",
  experience: ACADEMY_DEFAULT_EXPERIENCE,
});
assert.ok(!("primary_pos" in positiePayload));
assert.ok(!("problems" in positiePayload));
assert.ok(!("onboarding_complete" in positiePayload));
assert.equal(assertCanonicalOnboardingKeysOnly(positiePayload), true);

const startPayload = buildAcademyStartAcademyMetadata({
  primaryPositionId: "pos.lb",
  secondaryPositionId: null,
  experience: ACADEMY_DEFAULT_EXPERIENCE,
  problemIds: ["prob.te-snel-wegspelen", "prob.uitstappen-twijfel"],
});
assert.equal(startPayload[ACADEMY_ONBOARDING_COMPLETE_KEY], true);
assert.equal(assertCanonicalOnboardingKeysOnly(startPayload), true);
assert.equal(assertNoRoleKeysInOnboardingPayload(startPayload), true);
assert.equal(assertNoRoleKeysInOnboardingPayload({ ...startPayload, role: "admin" }), false);
assert.equal(assertCanonicalOnboardingKeysOnly({ primary_pos: "pos.lb" }), false);

// Merge simulation: existing non-onboarding keys survive when only onboarding patch applied
const existingMeta = {
  full_name: "Lisa",
  avatar_url: "https://example.com/a.png",
  primary_position: "pos.rb",
};
const merged = { ...existingMeta, ...startPayload };
assert.equal(merged.full_name, "Lisa");
assert.equal(merged.avatar_url, "https://example.com/a.png");
assert.equal(merged[ACADEMY_PRIMARY_POSITION_KEY], "pos.lb");
assert.equal(isAcademyOnboardingComplete(merged), true);

// ── Registry-backed validation ─────────────────────────────────────────────
const positions = new Set(loadPositions().map((p) => p.id));
const mvp = new Set(listMvpProblems().map((p) => p.id));
const nonMvp = loadProblems().find((p) => p.mvp_priority == null)?.id;
assert.ok(nonMvp, "fixture has non-MVP problem");
assert.ok(positions.has("pos.lb"));
assert.ok(mvp.has("prob.te-snel-wegspelen"));

function positie(input: Parameters<typeof validateAcademyPositieStepInput>[0]["primaryPositionId"] extends string
  ? {
      primaryPositionId: string;
      secondaryPositionId?: string | null;
      experience?: string | null;
    }
  : never) {
  return validateAcademyPositieStepInput({ ...input, allowedPositionIds: positions });
}

assert.equal(positie({ primaryPositionId: "pos.lb" }).ok, true);
assert.equal(positie({ primaryPositionId: "pos.unknown" }).ok, false);
assert.equal(positie({ primaryPositionId: "pos.lb", experience: "pro" }).ok, false);
assert.equal(positie({ primaryPositionId: "pos.lb", secondaryPositionId: "pos.nope" }).ok, false);
assert.equal(positie({ primaryPositionId: "pos.lb", secondaryPositionId: "pos.lb" }).ok, false);
assert.equal(
  positie({ primaryPositionId: "pos.lb", secondaryPositionId: "pos.l6", experience: "4e-klasse" })
    .ok,
  true,
);

function start(problemIds: unknown, draft?: Partial<{
  primary: string | null;
  secondary: string | null;
  experience: string | null;
}>) {
  return validateAcademyStartAcademyInput({
    problemIds,
    draftPrimaryPosition: draft?.primary === undefined ? "pos.lb" : draft.primary,
    draftSecondaryPosition: draft?.secondary === undefined ? null : draft.secondary,
    draftExperience: draft?.experience === undefined ? "4e-klasse" : draft.experience,
    mvpProblemIds: mvp,
    allowedPositionIds: positions,
  });
}

assert.equal(start([]).ok, false, "0 problems");
assert.equal(start(["prob.te-snel-wegspelen"]).ok, true, "1 problem");
assert.equal(
  start(["prob.te-snel-wegspelen", "prob.uitstappen-twijfel"]).ok,
  true,
  "2 problems",
);
assert.equal(
  start(["prob.te-snel-wegspelen", "prob.uitstappen-twijfel", "prob.positie-kwijt"]).ok,
  false,
  "3 problems",
);
assert.equal(
  start(["prob.te-snel-wegspelen", "prob.te-snel-wegspelen"]).ok,
  false,
  "duplicate",
);
assert.equal(start(["prob.does-not-exist"]).ok, false, "unknown");
assert.equal(start([nonMvp!]).ok, false, "non-MVP rejected");
assert.equal(start(["prob.te-snel-wegspelen"], { primary: null }).ok, false, "no S-10 draft");
assert.equal(start(["prob.te-snel-wegspelen"], { experience: "hacked" }).ok, false);

// Invalid validation ⇒ no write path (actions only call updateUser after ok)
const fail = start([]);
assert.equal(fail.ok, false);

const pass = start(["prob.te-snel-wegspelen", "prob.uitstappen-twijfel"]);
assert.equal(pass.ok, true);
if (pass.ok) {
  const payload = buildAcademyStartAcademyMetadata(pass.value);
  assert.equal(payload[ACADEMY_ONBOARDING_COMPLETE_KEY], true);
  assert.equal(payload[ACADEMY_PRIMARY_POSITION_KEY], "pos.lb");
}

const draft = readAcademyOnboardingDraft(positiePayload);
assert.equal(draft.primaryPosition, "pos.lb");
assert.equal(draft.complete, false);

assert.equal(
  resolveAcademyOnboardingGate({
    onboardingComplete: true,
    pathname: academyRoutes.positie,
  }).action,
  "allow",
);
{
  const d = resolveAcademyOnboardingGate({
    onboardingComplete: true,
    pathname: ACADEMY_ONBOARDING_ENTRY,
  });
  assert.equal(d.action, "redirect");
  if (d.action === "redirect") assert.equal(d.to, ACADEMY_POST_ONBOARDING_HOME);
}

assert.equal(shouldShowAcademyBottomTabBar(academyRoutes.onboardingPositie), false);
assert.equal(shouldShowAcademyBottomTabBar(academyRoutes.onboardingProblemen), false);

console.log("onboarding-ui.test.ts: ok");
