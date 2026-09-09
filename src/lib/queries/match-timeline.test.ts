/**
 * Wisselmomenten compact in de publieke tijdlijn.
 * Run: npx tsx src/lib/queries/match-timeline.test.ts
 */
import assert from "node:assert/strict";
import type { ClubDatabase } from "@/types";
import { buildMatchTimeline } from "@/lib/queries/match-timeline";

const db = {
  players: [
    { id: "dionne", full_name: "Dionne van Dijk" },
    { id: "renee", full_name: "Renée Koopman" },
    { id: "andrada", full_name: "Andrada Timmer" },
    { id: "lorelai", full_name: "Lorelai Bakker" },
  ],
  match_goal_events: [],
  match_card_events: [],
  match_substitutions: [
    {
      id: "s1",
      match_id: "m1",
      player_in_id: "lorelai",
      player_out_id: "renee",
      minute: 75,
      to_slot: "RB",
      sort_order: 0,
      change_group_id: "g-75",
    },
  ],
  match_position_changes: [
    {
      id: "p1",
      match_id: "m1",
      player_id: "dionne",
      minute: 75,
      from_slot: "RM",
      to_slot: "RCVM",
      change_group_id: "g-75",
      sort_order: 1,
      stoppage_time: 0,
      notes: null,
    },
    {
      id: "p2",
      match_id: "m1",
      player_id: "andrada",
      minute: 75,
      from_slot: "RB",
      to_slot: "RM",
      change_group_id: "g-75",
      sort_order: 2,
      stoppage_time: 0,
      notes: null,
    },
  ],
} as unknown as ClubDatabase;

const rows = buildMatchTimeline(db, "m1");
assert.equal(rows.length, 1);
assert.equal(rows[0]?.kind, "tactical_moment");
if (rows[0]?.kind === "tactical_moment") {
  assert.equal(rows[0].minute, 75);
  assert.equal(rows[0].substitutions[0]?.playerInName, "Lorelai Bakker");
  assert.equal(rows[0].substitutions[0]?.playerOutName, "Renée Koopman");
  assert.equal(rows[0].positionChanges.length, 2);
  assert.ok(rows[0].positionChanges.some((c) => c.playerName === "Dionne van Dijk" && c.fromSlot === "RM" && c.toSlot === "RCVM"));
  assert.ok(rows[0].positionChanges.some((c) => c.playerName === "Andrada Timmer" && c.fromSlot === "RB" && c.toSlot === "RM"));
}

console.log("match-timeline.test.ts: ok");
