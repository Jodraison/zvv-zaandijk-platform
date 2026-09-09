/**
 * Compound wisselmoment + position history.
 * Run: npx tsx src/lib/match/match-shape-history.test.ts
 */
import assert from "node:assert/strict";
import type { ClubDatabase, MatchLineupEntry, MatchPositionChange, MatchSubstitution } from "@/types";
import {
  computePlayerSlotIntervals,
  getMatchShapeAtMinute,
  validateShapeOccupancy,
} from "@/lib/match/match-shape";

const matchId = "qa-compound-75";
const dionne = "dionne";
const renee = "renee";
const andrada = "andrada";
const lorelai = "lorelai";
const groupId = "g-75";

const lineup: MatchLineupEntry[] = [
  { id: "l-rm", match_id: matchId, player_id: dionne, role: "starter", position: "RM", absence_reason: null, sort_order: 0 },
  { id: "l-rcvm", match_id: matchId, player_id: renee, role: "starter", position: "RCVM", absence_reason: null, sort_order: 1 },
  { id: "l-rb", match_id: matchId, player_id: andrada, role: "starter", position: "RB", absence_reason: null, sort_order: 2 },
  { id: "l-bench", match_id: matchId, player_id: lorelai, role: "bench", position: null, absence_reason: null, sort_order: 3 },
];

const subs: MatchSubstitution[] = [
  {
    id: "sub-75",
    match_id: matchId,
    player_out_id: renee,
    player_in_id: lorelai,
    minute: 75,
    to_slot: "RB",
    stoppage_time: 0,
    sort_order: 0,
    change_group_id: groupId,
    notes: null,
  },
];

const pos: MatchPositionChange[] = [
  {
    id: "pos-dionne",
    match_id: matchId,
    player_id: dionne,
    minute: 75,
    stoppage_time: 0,
    from_slot: "RM",
    to_slot: "RCVM",
    change_group_id: groupId,
    notes: null,
    sort_order: 1,
  },
  {
    id: "pos-andrada",
    match_id: matchId,
    player_id: andrada,
    minute: 75,
    stoppage_time: 0,
    from_slot: "RB",
    to_slot: "RM",
    change_group_id: groupId,
    notes: null,
    sort_order: 2,
  },
];

const db = {
  match_lineup_entries: lineup,
  match_substitutions: subs,
  match_position_changes: pos,
} as unknown as ClubDatabase;

const before = getMatchShapeAtMinute(db, matchId, 74);
assert.equal(before.slots.RM, dionne);
assert.equal(before.slots.RCVM, renee);
assert.equal(before.slots.RB, andrada);
assert.ok(before.bench.includes(lorelai));

const after = getMatchShapeAtMinute(db, matchId, 75);
assert.equal(after.slots.RCVM, dionne);
assert.equal(after.slots.RM, andrada);
assert.equal(after.slots.RB, lorelai);
assert.notEqual(after.slots.RCVM, renee);
assert.ok(after.substitutedOut.includes(renee));
assert.ok(after.bench.includes(renee));
assert.ok(!after.onPitch.includes(renee));
assert.equal(new Set(after.onPitch).size, after.onPitch.length);
assert.deepEqual(validateShapeOccupancy(after), []);

const end = getMatchShapeAtMinute(db, matchId, 90);
assert.equal(end.slots.RCVM, dionne);
assert.equal(end.slots.RM, andrada);
assert.equal(end.slots.RB, lorelai);

const history = computePlayerSlotIntervals(db, matchId, 90);
const of = (id: string) => history.filter((h) => h.player_id === id);

assert.deepEqual(
  of(dionne).map((h) => ({ slot: h.slot, from: h.from_minute, to: h.to_minute })),
  [
    { slot: "RM", from: 0, to: 75 },
    { slot: "RCVM", from: 75, to: null },
  ],
);
assert.deepEqual(
  of(andrada).map((h) => ({ slot: h.slot, from: h.from_minute, to: h.to_minute })),
  [
    { slot: "RB", from: 0, to: 75 },
    { slot: "RM", from: 75, to: null },
  ],
);
assert.deepEqual(
  of(lorelai).map((h) => ({ slot: h.slot, from: h.from_minute, to: h.to_minute })),
  [{ slot: "RB", from: 75, to: null }],
);
assert.deepEqual(
  of(renee).map((h) => ({ slot: h.slot, from: h.from_minute, to: h.to_minute })),
  [{ slot: "RCVM", from: 0, to: 75 }],
);

// Sequential ungrouped same-minute sub-first would lose Andrada; grouped must not.
assert.equal(after.onPitch.includes(andrada), true);
assert.equal(after.onPitch.filter((id) => id === andrada).length, 1);
assert.equal(after.onPitch.filter((id) => id === lorelai).length, 1);

console.log("match-shape-history.test.ts: ok");
