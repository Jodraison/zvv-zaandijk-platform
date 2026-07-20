/**
 * T-C-01 — pb.27 sidecar load + DoD checks.
 */
import assert from "node:assert/strict";
import { getPlaybook } from "@/lib/academy/registry/loaders";
import {
  listSidecarPositionKeys,
  loadPlaybookSidecar,
  sidecarFilenameForPb,
  validatePilotSidecarDoD,
} from "@/lib/academy/sidecar/loaders";

assert.equal(sidecarFilenameForPb(27), "sidecars/pb-27-meta.yaml");

const sidecar = loadPlaybookSidecar(27);
assert.equal(sidecar.pb, 27);
assert.equal(sidecar.slug, "eerste-pass-na-balverovering");
assert.ok(sidecar.exercise && sidecar.exercise.includes("eerste pass"));
assert.ok(sidecar.captain_points.length >= 1);
assert.ok(sidecar.layers.L0.shared.length > 0);
assert.equal("L5" in sidecar.layers, false);

assert.equal(listSidecarPositionKeys(sidecar, "L2").length, 11);
assert.equal(listSidecarPositionKeys(sidecar, "L3").length, 11);
assert.equal(listSidecarPositionKeys(sidecar, "L4").length, 11);

assert.notDeepEqual(sidecar.layers.L2.lb, sidecar.layers.L2.rb, "LB ≠ RB");

const issues = validatePilotSidecarDoD(sidecar);
assert.equal(issues.length, 0, issues.map((i) => i.message).join("; "));

const pb = getPlaybook("pb.27");
assert.ok(pb);
assert.equal(pb!.title, "Eerste pass na balverovering");
assert.equal(/PB\s*27|pb\.27/i.test(pb!.title), false);
assert.equal(pb!.sidecar_path, "sidecars/pb-27-meta.yaml");
assert.equal(pb!.sidecar_status, "in_progress");

console.log("sidecar-pb27.test.ts: ok");
