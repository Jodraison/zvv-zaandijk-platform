/**
 * Bevestigde toekomstige opstelling blijft wijzigbaar.
 * Run: npx tsx src/lib/match/lineup-editability.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  futureConfirmedLineupIsEditable,
  isUnplayedMatchStatus,
  lineupSaveRequiresValidFormation,
  resolveLineupSaveStatus,
  shouldStayOnLineupEditorAfterSave,
} from "@/lib/match/lineup-editability";

assert.equal(isUnplayedMatchStatus("scheduled"), true);
assert.equal(isUnplayedMatchStatus("postponed"), true);
assert.equal(isUnplayedMatchStatus("played"), false);
assert.equal(isUnplayedMatchStatus("cancelled"), false);

assert.equal(futureConfirmedLineupIsEditable("scheduled", "confirmed"), true);
assert.equal(futureConfirmedLineupIsEditable("scheduled", "draft"), false);
assert.equal(futureConfirmedLineupIsEditable("played", "confirmed"), false);

assert.equal(
  resolveLineupSaveStatus({
    matchStatus: "scheduled",
    currentLineupStatus: "confirmed",
    confirm: false,
    formationValid: true,
  }),
  "confirmed",
);
assert.equal(
  resolveLineupSaveStatus({
    matchStatus: "scheduled",
    currentLineupStatus: "draft",
    confirm: false,
    formationValid: true,
  }),
  "draft",
);
assert.equal(
  resolveLineupSaveStatus({
    matchStatus: "scheduled",
    currentLineupStatus: "draft",
    confirm: true,
    formationValid: true,
  }),
  "confirmed",
);
assert.equal(
  resolveLineupSaveStatus({
    matchStatus: "played",
    currentLineupStatus: "confirmed",
    confirm: false,
    formationValid: true,
  }),
  "draft",
);
assert.equal(
  lineupSaveRequiresValidFormation({
    matchStatus: "scheduled",
    currentLineupStatus: "confirmed",
    confirm: false,
  }),
  true,
);
assert.equal(shouldStayOnLineupEditorAfterSave("scheduled"), true);
assert.equal(shouldStayOnLineupEditorAfterSave("played"), false);

const editor = readFileSync(join(process.cwd(), "src/components/admin/match-formation-editor.tsx"), "utf8");
assert.match(editor, /Wijzigingen opslaan/);
assert.match(editor, /tot de wedstrijd nog wijzigbaar/);
assert.match(editor, /shouldStayOnLineupEditorAfterSave/);
assert.doesNotMatch(editor, /setPrepComplete\(true\)/);

const action = readFileSync(join(process.cwd(), "src/actions/match-formation.ts"), "utf8");
assert.match(action, /resolveLineupSaveStatus/);
assert.match(action, /lineupSaveRequiresValidFormation/);
assert.doesNotMatch(action, /match\.lineup_status = raw\.confirm \? "confirmed" : "draft"/);

console.log("lineup-editability.test.ts: ok");
