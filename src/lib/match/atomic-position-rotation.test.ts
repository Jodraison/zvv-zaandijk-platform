/**
 * Atomaire positierotatie: 2-way, 3-way, invalid, compound, position-only.
 * Run: npx tsx src/lib/match/atomic-position-rotation.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ClubDatabase, MatchLineupEntry, MatchPositionChange } from "@/types";
import { emptyFormationMap, type FormationSlotCode } from "@/lib/match/formation-4231";
import {
  evaluateAtomicGroup,
  getMatchShapeAtMinute,
  validateShapeOccupancy,
} from "@/lib/match/match-shape";
import {
  emptyPositionMoment,
  flattenMoments,
  groupRowsIntoMoments,
  SECOND_HALF_START_MINUTE,
} from "@/lib/match/tactical-moments";

function slotsOf(pairs: Partial<Record<FormationSlotCode, string>>) {
  const slots = emptyFormationMap();
  for (const [code, id] of Object.entries(pairs) as [FormationSlotCode, string][]) {
    slots[code] = id;
  }
  return slots;
}

function emptyDb(partial: Partial<ClubDatabase>): ClubDatabase {
  return {
    match_lineup_entries: [],
    match_substitutions: [],
    match_position_changes: [],
    ...partial,
  } as ClubDatabase;
}

const renee = "renee";
const dionne = "dionne";
const andrada = "andrada";
const lorelai = "lorelai";

// A — two player swap
{
  const pre = slotsOf({ LB: "A", LCB: "B" });
  const result = evaluateAtomicGroup(pre, {
    leaving: [],
    entering: [],
    moves: [
      { id: "A", to: "LCB" },
      { id: "B", to: "LB" },
    ],
  });
  assert.equal(result.ok, true);
  assert.equal(result.slots.LCB, "A");
  assert.equal(result.slots.LB, "B");
}

// B — three player cycle (WSV na rust)
{
  const pre = slotsOf({ RB: renee, RCVM: dionne, RM: andrada });
  const result = evaluateAtomicGroup(pre, {
    leaving: [],
    entering: [],
    moves: [
      { id: renee, to: "RCVM" },
      { id: dionne, to: "RM" },
      { id: andrada, to: "RB" },
    ],
  });
  assert.equal(result.ok, true);
  assert.equal(result.slots.RB, andrada);
  assert.equal(result.slots.RCVM, renee);
  assert.equal(result.slots.RM, dionne);
}

// C — invalid final state: two naar RB
{
  const pre = slotsOf({ LB: "A", LCB: "B", RB: "C" });
  const result = evaluateAtomicGroup(pre, {
    leaving: [],
    entering: [],
    moves: [
      { id: "A", to: "RB" },
      { id: "B", to: "RB" },
    ],
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => /RB|bezetters|verdween/i.test(e)));
}

// D — compound sub + rotation
{
  const matchId = "qa-compound";
  const lineup: MatchLineupEntry[] = [
    { id: "l-rm", match_id: matchId, player_id: dionne, role: "starter", position: "RM", absence_reason: null, sort_order: 0 },
    { id: "l-rcvm", match_id: matchId, player_id: renee, role: "starter", position: "RCVM", absence_reason: null, sort_order: 1 },
    { id: "l-rb", match_id: matchId, player_id: andrada, role: "starter", position: "RB", absence_reason: null, sort_order: 2 },
    { id: "l-b", match_id: matchId, player_id: lorelai, role: "bench", position: null, absence_reason: null, sort_order: 3 },
  ];
  const group = "g-75";
  const db = emptyDb({
    match_lineup_entries: lineup,
    match_substitutions: [
      {
        id: "sub",
        match_id: matchId,
        player_out_id: renee,
        player_in_id: lorelai,
        minute: 75,
        to_slot: "RB",
        stoppage_time: 0,
        sort_order: 0,
        change_group_id: group,
        notes: null,
      },
    ],
    match_position_changes: [
      {
        id: "p1",
        match_id: matchId,
        player_id: dionne,
        minute: 75,
        stoppage_time: 0,
        from_slot: "RM",
        to_slot: "RCVM",
        change_group_id: group,
        notes: null,
        sort_order: 1,
      },
      {
        id: "p2",
        match_id: matchId,
        player_id: andrada,
        minute: 75,
        stoppage_time: 0,
        from_slot: "RB",
        to_slot: "RM",
        change_group_id: group,
        notes: null,
        sort_order: 2,
      },
    ],
  });
  const after = getMatchShapeAtMinute(db, matchId, 75);
  assert.equal(after.slots.RCVM, dionne);
  assert.equal(after.slots.RM, andrada);
  assert.equal(after.slots.RB, lorelai);
  assert.ok(after.substitutedOut.includes(renee));
  assert.deepEqual(validateShapeOccupancy(after), []);
}

// E — position-only moment, geen uit/in
{
  const matchId = "qa-pos-only";
  const group = "g-45";
  const lineup: MatchLineupEntry[] = [
    { id: "1", match_id: matchId, player_id: renee, role: "starter", position: "RB", absence_reason: null, sort_order: 0 },
    { id: "2", match_id: matchId, player_id: dionne, role: "starter", position: "RCVM", absence_reason: null, sort_order: 1 },
    { id: "3", match_id: matchId, player_id: andrada, role: "starter", position: "RM", absence_reason: null, sort_order: 2 },
  ];
  const pos: MatchPositionChange[] = [
    { id: "a", match_id: matchId, player_id: renee, minute: 45, stoppage_time: 0, from_slot: "RB", to_slot: "RCVM", change_group_id: group, notes: null, sort_order: 0 },
    { id: "b", match_id: matchId, player_id: dionne, minute: 45, stoppage_time: 0, from_slot: "RCVM", to_slot: "RM", change_group_id: group, notes: null, sort_order: 1 },
    { id: "c", match_id: matchId, player_id: andrada, minute: 45, stoppage_time: 0, from_slot: "RM", to_slot: "RB", change_group_id: group, notes: null, sort_order: 2 },
  ];
  const db = emptyDb({ match_lineup_entries: lineup, match_position_changes: pos });
  const after = getMatchShapeAtMinute(db, matchId, 45);
  assert.equal(after.slots.RB, andrada);
  assert.equal(after.slots.RCVM, renee);
  assert.equal(after.slots.RM, dionne);
  assert.equal(after.substitutedOut.length, 0);
  assert.deepEqual(validateShapeOccupancy(after), []);

  const posOnly = emptyPositionMoment();
  assert.equal(posOnly.minute, SECOND_HALF_START_MINUTE);
  assert.equal(posOnly.substitutions.length, 0);
  assert.ok(posOnly.positionChanges.length >= 1);
  const flat = flattenMoments([
    {
      groupId: group,
      minute: 45,
      substitutions: [],
      positionChanges: pos.map((c) => ({
        player_id: c.player_id,
        from_slot: c.from_slot,
        to_slot: c.to_slot,
      })),
    },
  ]);
  assert.equal(flat.substitutions.length, 0);
  assert.equal(flat.position_changes.length, 3);
  assert.equal(new Set(flat.position_changes.map((c) => c.change_group_id)).size, 1);
}

// Ungrouped same-minute pos rows load as één moment
{
  const rows: MatchPositionChange[] = [
    { id: "a", match_id: "m", player_id: renee, minute: 45, stoppage_time: 0, from_slot: "RB", to_slot: "RCVM", change_group_id: null, notes: null, sort_order: 0 },
    { id: "b", match_id: "m", player_id: dionne, minute: 45, stoppage_time: 0, from_slot: "RCVM", to_slot: "RM", change_group_id: null, notes: null, sort_order: 1 },
    { id: "c", match_id: "m", player_id: andrada, minute: 45, stoppage_time: 0, from_slot: "RM", to_slot: "RB", change_group_id: null, notes: null, sort_order: 2 },
  ];
  const moments = groupRowsIntoMoments([], rows);
  assert.equal(moments.length, 1);
  assert.equal(moments[0]?.positionChanges.length, 3);
  assert.equal(moments[0]?.substitutions.length, 0);
}

// Lone historical swap blijft swap (Krommenie 74′)
{
  const matchId = "qa-lone-swap";
  const db = emptyDb({
    match_lineup_entries: [
      { id: "1", match_id: matchId, player_id: andrada, role: "starter", position: "RB", absence_reason: null, sort_order: 0 },
      { id: "2", match_id: matchId, player_id: dionne, role: "starter", position: "RM", absence_reason: null, sort_order: 1 },
    ],
    match_position_changes: [
      {
        id: "lone",
        match_id: matchId,
        player_id: andrada,
        minute: 74,
        stoppage_time: 0,
        from_slot: "RB",
        to_slot: "RM",
        change_group_id: null,
        notes: null,
        sort_order: 0,
      },
    ],
  });
  const after = getMatchShapeAtMinute(db, matchId, 74);
  assert.equal(after.slots.RM, andrada);
  assert.equal(after.slots.RB, dionne);
}

const editor = readFileSync(join(process.cwd(), "src/components/admin/match-shape-events-editor.tsx"), "utf8");
assert.match(editor, /Positiewijzigingsmoment/);
assert.match(editor, /Opslaan moment/);
assert.match(editor, /komt vrij binnen dit moment/);
assert.match(editor, /emptyPositionMoment/);

const action = readFileSync(join(process.cwd(), "src/actions/match-shape-events.ts"), "utf8");
assert.match(action, /validateShapeOccupancy/);
assert.match(action, /Eindopstelling na dit moment is ongeldig/);

console.log("atomic-position-rotation.test.ts: ok");
