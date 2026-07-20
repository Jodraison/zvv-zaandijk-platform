/**
 * T-03-02 loader smoke tests.
 * Run via `npm run test:academy-foundation`.
 */
import assert from "node:assert/strict";
import {
  clearAcademyRegistryCache,
  getAnkers,
  getPlaybook,
  getProblem,
  listMvpProblems,
  loadMoments,
  loadPositions,
  loadProblems,
} from "@/lib/academy/registry/loaders";
import { validateAcademyRegistries } from "@/lib/academy/registry/validate";

clearAcademyRegistryCache();

const problems = loadProblems();
assert.ok(problems.length >= 10, "problems loaded");

const mvp = listMvpProblems();
assert.equal(mvp.length, 7, "MVP 7 problems");

const uitstappen = getProblem("uitstappen-twijfel");
assert.ok(uitstappen, "getProblem by slug");
assert.equal(uitstappen?.id, "prob.uitstappen-twijfel");

assert.equal(loadMoments().length, 6, "6 ACE moments");
assert.equal(loadPositions().length, 11, "11 positions");

const lbAnker = getAnkers("lb");
assert.ok(lbAnker, "getAnkers lb");
assert.equal(lbAnker?.tasks.length, 3);

const pb27 = getPlaybook("pb.27");
assert.ok(pb27, "getPlaybook pb.27");
assert.equal(pb27?.title.includes("pass") || pb27?.slug.includes("pass"), true);

const issues = validateAcademyRegistries();
assert.equal(issues.length, 0, `expected 0 validation issues, got ${issues.map((i) => i.message).join("; ")}`);

console.log("loaders.test.ts: ok");
