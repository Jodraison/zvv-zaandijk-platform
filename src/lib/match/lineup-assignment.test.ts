/**
 * Concept-opstelling: verplaatsen / verwisselen / vervangen zonder eerst leeg te maken.
 * QA-scenario Kadoelen (geen productiedata).
 * Run: npx tsx src/lib/match/lineup-assignment.test.ts
 */
import assert from "node:assert/strict";
import { FORMATION_SLOT_CODES } from "@/lib/match/formation-4231";
import {
  assignPlayerToSlot,
  emptyLineupDraft,
  lineupInvariants,
  locationOfPlayer,
  moveToBench,
  replaceSlot,
  slotOfPlayer,
} from "@/lib/match/lineup-assignment";

const emma = "emma-de-mie";
const mandy = "mandy-kalmeijer";
const dionne = "dionne-van-dijk";
const lorelai = "lorelai-bakker";
const lbOccupant = "lb-speelster";

function kadoelenStart() {
  const draft = emptyLineupDraft();
  draft.slots.SP = emma;
  draft.slots.LCVM = mandy;
  draft.slots.RM = dionne;
  draft.bench = [lorelai];
  return draft;
}

{
  const start = kadoelenStart();
  const moved = assignPlayerToSlot(start, mandy, "LB");
  assert.equal(moved.ok, true);
  if (moved.ok) {
    assert.equal(moved.action, "move");
    assert.equal(moved.draft.slots.LB, mandy);
    assert.equal(moved.draft.slots.LCVM, null);
    assert.equal(moved.draft.slots.SP, emma);
    assert.equal(slotOfPlayer(moved.draft, mandy), "LB");
    assert.equal(lineupInvariants(moved.draft).length, 0);
  }
}

{
  const start = kadoelenStart();
  start.slots.LB = lbOccupant;
  const blocked = assignPlayerToSlot(start, mandy, "LB");
  assert.equal(blocked.ok, false);
  if (!blocked.ok) assert.equal(blocked.occupantId, lbOccupant);

  const swapped = assignPlayerToSlot(start, mandy, "LB", "swap");
  assert.equal(swapped.ok, true);
  if (swapped.ok) {
    assert.equal(swapped.action, "swap");
    assert.equal(swapped.draft.slots.LB, mandy);
    assert.equal(swapped.draft.slots.LCVM, lbOccupant);
    assert.equal(lineupInvariants(swapped.draft).length, 0);
  }

  const replaced = assignPlayerToSlot(start, mandy, "LB", "replace");
  assert.equal(replaced.ok, true);
  if (replaced.ok) {
    assert.equal(replaced.action, "replace");
    assert.equal(replaced.draft.slots.LB, mandy);
    assert.equal(replaced.draft.slots.LCVM, null);
    assert.ok(replaced.draft.bench.includes(lbOccupant));
    assert.equal(lineupInvariants(replaced.draft).length, 0);
  }
}

{
  const start = kadoelenStart();
  const after = replaceSlot(start, "RM", lorelai);
  assert.equal(after.slots.RM, lorelai);
  assert.equal(locationOfPlayer(after, dionne).kind, "bench");
  assert.equal(slotOfPlayer(after, lorelai), "RM");
  assert.ok(!after.bench.includes(lorelai));
  assert.equal(lineupInvariants(after).length, 0);
}

{
  const start = kadoelenStart();
  const benched = moveToBench(start, mandy);
  assert.equal(benched.slots.LCVM, null);
  assert.ok(benched.bench.includes(mandy));
  const back = assignPlayerToSlot(benched, mandy, "LCVM");
  assert.equal(back.ok, true);
  if (back.ok) {
    assert.equal(back.draft.slots.LCVM, mandy);
    assert.ok(!back.draft.bench.includes(mandy));
  }
}

{
  const start = kadoelenStart();
  const viaPicker = assignPlayerToSlot(start, mandy, "LB");
  assert.equal(viaPicker.ok, true);
  if (viaPicker.ok) {
    assert.equal(viaPicker.draft.slots.LCVM, null);
    assert.equal(viaPicker.draft.slots.LB, mandy);
  }
}

{
  const start = kadoelenStart();
  assert.equal(locationOfPlayer(start, mandy).kind, "field");
  const again = assignPlayerToSlot(start, mandy, "LB");
  assert.equal(again.ok, true);
  if (again.ok) {
    assert.equal(again.action, "move");
    assert.equal(again.draft.slots.LB, mandy);
    assert.equal(lineupInvariants(again.draft).length, 0);
  }
}

{
  const full = emptyLineupDraft();
  FORMATION_SLOT_CODES.forEach((code, i) => {
    full.slots[code] = `p-${i}`;
  });
  assert.equal(FORMATION_SLOT_CODES.length, 11);
  assert.equal(lineupInvariants(full).length, 0);
  full.slots.SP = "p-0";
  assert.ok(lineupInvariants(full).some((e) => e.includes("dubbel")));
}

console.log("lineup-assignment.test.ts: ok");
