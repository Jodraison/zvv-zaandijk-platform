/**
 * Match workflow product UX final — four-step trainer flow.
 * Run: npm run test:match-workflow-ux-final
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  MATCH_WORKFLOW_STEPS,
  parseMatchWorkflowStep,
} from "@/lib/match/match-workflow-steps";
import { sortPlayersBySquadNumber } from "@/lib/players/sort-by-squad-number";

const root = process.cwd();
console.log("→ match-workflow-ux-final");

// 1–9 Flow
{
  assert.equal(MATCH_WORKFLOW_STEPS.length, 4, "1: vier zichtbare stappen");
  assert.deepEqual(
    MATCH_WORKFLOW_STEPS.map((s) => s.id),
    ["wedstrijd", "opstelling", "na-de-wedstrijd", "controle"],
  );
  assert.ok(
    !(MATCH_WORKFLOW_STEPS.map((s) => s.id) as string[]).includes("selectie"),
    "2: Selectie niet primair",
  );
  assert.ok(
    !(MATCH_WORKFLOW_STEPS.map((s) => s.label) as string[]).includes("Verloop"),
    "28: geen Verloop-label",
  );
  assert.equal(parseMatchWorkflowStep("selectie"), "opstelling");
  assert.equal(parseMatchWorkflowStep("verloop"), "na-de-wedstrijd");
  assert.equal(parseMatchWorkflowStep("uitslag"), "na-de-wedstrijd");
  assert.equal(parseMatchWorkflowStep("na-de-wedstrijd"), "na-de-wedstrijd");

  const form = readFileSync(join(root, "src/components/admin/match-admin-form.tsx"), "utf8");
  assert.match(form, /step=opstelling/);
  assert.match(form, /Opslaan/);
  assert.match(form, /opstelling later optioneel/i);
  assert.match(form, /Controleren en afronden/);
  assert.match(form, /Wedstrijd afronden/);

  const nieuw = readFileSync(join(root, "src/app/(site)/beheer/wedstrijden/nieuw/page.tsx"), "utf8");
  assert.match(nieuw, /Opstelling & selectie/);
  assert.ok(!nieuw.includes("workflowStep=\"selectie\""));

  const edit = readFileSync(join(root, "src/app/(site)/beheer/wedstrijden/[matchId]/page.tsx"), "utf8");
  assert.match(edit, /MatchFormationEditor/);
  assert.match(edit, /na-de-wedstrijd/);
  assert.match(edit, /Beschikbaar na de wedstrijd|Na de wedstrijd/);
  assert.ok(!edit.includes('step === "selectie"'));
}

// 10–16 Selectie/opstelling contract
{
  const formEditor = readFileSync(join(root, "src/components/admin/match-formation-editor.tsx"), "utf8");
  assert.match(formEditor, /Bank/);
  assert.match(formEditor, /Afwezig/);
  assert.match(formEditor, /Nog indelen/);
  assert.match(formEditor, /Opstelling bevestigen/);
  assert.match(formEditor, /Wedstrijdvoorbereiding compleet/);
  assert.match(formEditor, /MatchPlayerPicker/);
  assert.match(formEditor, /Gastspeelster toevoegen/);

  const action = readFileSync(join(root, "src/actions/match-formation.ts"), "utf8");
  assert.match(action, /absent/);
  assert.match(action, /role: "absent"/);
}

// 17–20 Sortering
{
  const rows = sortPlayersBySquadNumber([
    { player_id: "a", name: "Anna", shirt_number: 10, is_guest: false },
    { player_id: "b", name: "Bo", shirt_number: 2, is_guest: false },
    { player_id: "c", name: "Chris", shirt_number: 9, is_guest: false },
    { player_id: "d", name: "Demi", shirt_number: null, is_guest: false },
    { player_id: "g", name: "Gast", shirt_number: 1, is_guest: true },
    { player_id: "e", name: "Emma", shirt_number: 1, is_guest: false },
  ]);
  assert.deepEqual(
    rows.map((r) => r.player_id),
    ["e", "b", "c", "a", "d", "g"],
    "17–20: #1,#2,#9,#10, null, gast",
  );
  assert.ok(existsSync(join(root, "src/lib/players/sort-by-squad-number.ts")));
}

// 21–27 Opstellingsmaker
{
  const pitch = readFileSync(join(root, "src/components/match/formation-pitch.tsx"), "utf8");
  assert.match(pitch, /rounded-full border-\[2\.5px\] border-white|left: `\$\{slot\.x\}%`/i);
  assert.match(pitch, /interactive/);
  assert.match(pitch, /onSlotClick/);
  assert.ok(!pitch.includes("<select"));

  const picker = readFileSync(join(root, "src/components/admin/match-player-picker.tsx"), "utf8");
  assert.match(picker, /role="dialog"/);
  assert.match(picker, /sortPlayersBySquadNumber/);
  assert.match(picker, /Escape/);
}

// 28–37 Na de wedstrijd
{
  const form = readFileSync(join(root, "src/components/admin/match-admin-form.tsx"), "utf8");
  assert.match(form, /Wedstrijd afronden/);
  assert.match(form, /niet live tijdens de wedstrijd/);
  assert.match(form, /Eindstand/);
  assert.match(form, /compactAfterMatch/);
  const nav = readFileSync(join(root, "src/components/admin/match-workflow-nav.tsx"), "utf8");
  assert.match(nav, /Na de wedstrijd/);
  assert.ok(!nav.includes(">Verloop<") && !nav.includes('"Verloop"'));
}

console.log("✓ match-workflow-ux-final — assertions OK");
