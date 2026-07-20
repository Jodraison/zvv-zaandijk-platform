/**
 * T-03-01 — Zod schema unit checks (no test runner in package.json).
 * Run: `npx tsx src/lib/academy/schema/schema.test.ts`
 *
 * Acceptatie: invalid fixture fails; valid minimal sidecar parses.
 */
import assert from "node:assert/strict";
import {
  LAYER_ALIASES,
  parsePlaybookSidecar,
  playbookIdSchema,
  problemRegistryEntrySchema,
  safeParsePlaybookSidecar,
} from "@/lib/academy/schema";

const validSidecar = {
  schema_version: "1.1.0",
  pb: 27,
  slug: "eerste-pass-na-balverovering",
  moment_ids: ["moment.s4"],
  situation_ids: ["sit.eerste-pass"],
  problem_ids: ["prob.te-snel-wegspelen"],
  visual_primary: "vis.t294",
  exercise: "Rondje eerste pass · 4 min",
  trainer_points: ["a", "b", "c"],
  captain_points: ["roep1"],
  layers: {
    L0: { shared: "Bal gewonnen — waar is NU het voordeel?", by_position: {} },
    L2: {
      lb: ["Scan voordeel", "Eerste pass vooruit of breed", "Niet blind weg", "Roep optie"],
      rb: ["Scan", "Breed houden", "Niet naar midden", "Communiceer"],
    },
    L3: {
      lb: { checklist: ["Scan", "Kies pass", "Roep"], cue: "Voor!" },
      rb: { checklist: ["Breed", "Klaar", "Roep"], cue: "Breed!" },
    },
    L4: {
      lb: {
        fouten: ["Blind weg", "Geen scan", "Te haastig"],
        afspraken: ["Eerst kijken", "Tempo eruit mag", "Roep"],
        gedragingen: ["Scan", "Open lichaam", "Pass kiezen"],
      },
    },
  },
  completeness: { L0: "draft", L2: "draft", L3: "draft", L4: "draft" },
};

// Valid sidecar parses
const parsed = parsePlaybookSidecar(validSidecar);
assert.equal(parsed.pb, 27);
assert.equal(parsed.slug, "eerste-pass-na-balverovering");
assert.equal(LAYER_ALIASES.twenty_seconds, "L2");

// Invalid: bad playbook id
assert.equal(playbookIdSchema.safeParse("PB27").success, false);
assert.equal(playbookIdSchema.safeParse("pb.27").success, true);

// Invalid: problem without label_player
const badProblem = problemRegistryEntrySchema.safeParse({
  id: "prob.te-snel-wegspelen",
  slug: "te-snel-wegspelen",
  status: "core",
});
assert.equal(badProblem.success, false, "missing label_player must fail");

// Invalid: L5 in sidecar layers (strict object rejects unknown keys via .strict on layers parent —
// inject L5 by bypassing type)
const withL5 = {
  ...validSidecar,
  layers: {
    ...validSidecar.layers,
    L5: { markdown: "forbidden" },
  },
};
const l5Result = safeParsePlaybookSidecar(withL5);
assert.equal(l5Result.success, false, "L5 in sidecar must fail");

// Invalid: wrong schema_version
const badVersion = safeParsePlaybookSidecar({ ...validSidecar, schema_version: "1.0.0" });
assert.equal(badVersion.success, false, "schema_version must be 1.1.0");

// Invalid: checklist > 3
const tooManyChecks = safeParsePlaybookSidecar({
  ...validSidecar,
  layers: {
    ...validSidecar.layers,
    L3: {
      lb: { checklist: ["a", "b", "c", "d"], cue: "x" },
    },
  },
});
assert.equal(tooManyChecks.success, false, "L3 checklist max 3");

console.log("schema.test.ts: ok");
