/**
 * T-03-03 — PositieAnker accessor: getAnkers(pos) returns exactly 3.
 * Acceptatie: LB / RB / L6 samples non-empty.
 */
import assert from "node:assert/strict";
import {
  clearAcademyRegistryCache,
  getAnkers,
  getPosition,
  loadAnchors,
  loadPositions,
} from "@/lib/academy/registry/loaders";
import { validateAcademyRegistries } from "@/lib/academy/registry/validate";

clearAcademyRegistryCache();

function assertTriplet(pos: string, abbrev: string) {
  const position = getPosition(pos);
  assert.ok(position, `position ${pos} exists`);
  assert.equal(position?.abbrev, abbrev);

  const tasks = getAnkers(pos);
  assert.ok(tasks, `getAnkers(${pos}) defined`);
  assert.equal(tasks!.length, 3, `getAnkers(${pos}) returns exactly 3`);

  for (const [i, task] of tasks!.entries()) {
    assert.ok(task.label.trim().length > 0, `${pos} task[${i}] label non-empty`);
    assert.ok(task.pb_ref.startsWith("pb."), `${pos} task[${i}] pb_ref present`);
  }
}

assertTriplet("lb", "LB");
assertTriplet("rb", "RB");
assertTriplet("l6", "L6");

// All 11 positions resolve to exactly 3 tasks
assert.equal(loadPositions().length, 11);
assert.equal(loadAnchors().length, 11);
for (const p of loadPositions()) {
  const tasks = getAnkers(p.slug);
  assert.ok(tasks, `getAnkers(${p.slug})`);
  assert.equal(tasks!.length, 3, `${p.slug} exactly 3`);
}

assert.equal(getAnkers("not-a-position"), undefined, "unknown pos → undefined");

const issues = validateAcademyRegistries();
assert.equal(issues.length, 0, issues.map((i) => i.message).join("; "));

console.log("get-ankers.test.ts: ok");
