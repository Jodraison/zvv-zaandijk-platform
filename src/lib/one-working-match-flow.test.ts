/**
 * One working match flow — kerninvarianten.
 * Run: npm run test:one-working-match-flow
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { FORMATION_4231_SLOTS } from "@/lib/match/formation-4231";
import { MATCH_WORKFLOW_STEPS } from "@/lib/match/match-workflow-steps";

const root = process.cwd();
console.log("→ one-working-match-flow");

assert.equal(MATCH_WORKFLOW_STEPS.length, 4);
assert.deepEqual(
  MATCH_WORKFLOW_STEPS.map((s) => s.id),
  ["wedstrijd", "opstelling", "na-de-wedstrijd", "controle"],
);

assert.equal(FORMATION_4231_SLOTS.length, 11);
for (const code of ["SP", "LM", "CAM", "RM", "LCVM", "RCVM", "LB", "LCB", "RCB", "RB", "GK"]) {
  assert.ok(FORMATION_4231_SLOTS.some((s) => s.code === code));
}

const pitch = readFileSync(join(root, "src/components/match/formation-pitch.tsx"), "utf8");
assert.match(pitch, /clamp\(760px/);
assert.match(pitch, /data-testid=\"formation-pitch\"/);
assert.match(pitch, /Kies speelster/);

const editor = readFileSync(join(root, "src/components/admin/match-formation-editor.tsx"), "utf8");
assert.match(editor, /Op veld/);
assert.match(editor, /fieldPickPlayerId/);
assert.match(editor, /Concept bewaren/);
assert.match(editor, /Opstelling bevestigen/);

const picker = readFileSync(join(root, "src/components/admin/match-player-picker.tsx"), "utf8");
assert.match(picker, /items-center justify-center/);
assert.match(picker, /role=\"dialog\"/);

const fitness = readFileSync(join(root, "src/components/admin/fitness/fitness-station-entry.tsx"), "utf8");
assert.ok(
  !/className=\{?["'`][^"'`]*sticky top-\[4\.5rem\]/.test(fitness),
  "fitness kolomkop mag niet sticky overlappen",
);

const failures = join(root, ".review-artifacts/one-working-match-flow/root-causes.md");
assert.ok(existsSync(failures), "root-causes artifact verplicht");

const adminForm = readFileSync(join(root, "src/components/admin/match-admin-form.tsx"), "utf8");
assert.match(adminForm, /defaultStatus === "played"/);
assert.match(adminForm, /Afrondstap: forceer status played/);
assert.match(adminForm, /if \(afterMatchStep\) return;/);
assert.match(adminForm, /position: member\?\.position_label\?\.trim\(\) \|\| ""/);

const lineupSchema = readFileSync(join(root, "src/lib/validations/match-lineup.ts"), "utf8");
assert.match(lineupSchema, /z\.null\(\)/);

const matchAdminAction = readFileSync(join(root, "src/actions/match-admin.ts"), "utf8");
assert.match(matchAdminAction, /keepConfirmedFormation/);

console.log("one-working-match-flow.test.ts: ok");
