/**
 * Admin 2.0 — match integrity + stable goal id contract tests.
 * Run: `npx tsx src/lib/admin/match-save-contract.test.ts`
 */
import assert from "node:assert/strict";
import {
  assignStableGoalEventIds,
  collectMatchIntegrityIssues,
  goalEventContentKey,
} from "@/lib/admin/match-save-contract";

// --- Scenario A-ish: 2 goals ZVV consistent ---
{
  const issues = collectMatchIntegrityIssues({
    status: "played",
    goalsFor: 2,
    goalEventCount: 2,
    assistEventCount: 1,
    statsGoalSum: 2,
    statsAssistSum: 1,
    mvpPlayerIds: ["p1"],
    mvpAllInSelection: true,
  });
  assert.equal(issues.length, 0, "consistent 2-1 style payload");
}

// --- Scenario B: 0-0 ---
{
  const issues = collectMatchIntegrityIssues({
    status: "played",
    goalsFor: 0,
    goalEventCount: 0,
    assistEventCount: 0,
    statsGoalSum: 0,
    statsAssistSum: 0,
    mvpPlayerIds: ["p1"],
    mvpAllInSelection: true,
  });
  assert.equal(issues.length, 0, "0-0 with MVP ok");
}

// --- goals mismatch ---
{
  const issues = collectMatchIntegrityIssues({
    status: "played",
    goalsFor: 3,
    goalEventCount: 2,
    assistEventCount: 0,
    statsGoalSum: 2,
    statsAssistSum: 0,
    mvpPlayerIds: ["p1"],
    mvpAllInSelection: true,
  });
  assert.ok(issues.some((i) => i.code === "goals_for_mismatch"));
}

// --- MVP missing ---
{
  const issues = collectMatchIntegrityIssues({
    status: "played",
    goalsFor: 1,
    goalEventCount: 1,
    assistEventCount: 0,
    statsGoalSum: 1,
    statsAssistSum: 0,
    mvpPlayerIds: [],
    mvpAllInSelection: true,
  });
  assert.equal(issues.length, 0, "0 MVP winners allowed");
}

// --- scheduled must be clean ---
{
  const issues = collectMatchIntegrityIssues({
    status: "scheduled",
    goalsFor: 1,
    goalEventCount: 1,
    assistEventCount: 0,
    statsGoalSum: 1,
    statsAssistSum: 0,
    mvpPlayerIds: ["p1"],
    mvpAllInSelection: true,
  });
  assert.ok(issues.length >= 2);
}

// --- stable goal ids on re-save (idempotency helper) ---
{
  const prev = [
    { id: "g-old-1", scorer_player_id: "a", assist_player_id: "b", minute: 12, sort_order: 0 },
    { id: "g-old-2", scorer_player_id: "c", assist_player_id: null, minute: 40, sort_order: 1 },
  ];
  const incoming = [
    { scorer_player_id: "a", assist_player_id: "b", minute: 12, sort_order: 0 },
    { scorer_player_id: "c", assist_player_id: null, minute: 40, sort_order: 1 },
  ];
  let n = 0;
  const next = assignStableGoalEventIds(incoming, prev, () => `new-${++n}`);
  assert.equal(next[0]!.id, "g-old-1");
  assert.equal(next[1]!.id, "g-old-2");
  assert.equal(n, 0, "no new ids when content matches");
}

// --- corrected result adds one new goal ---
{
  const prev = [{ id: "g1", scorer_player_id: "a", assist_player_id: null, minute: 10, sort_order: 0 }];
  const incoming = [
    { scorer_player_id: "a", assist_player_id: null, minute: 10, sort_order: 0 },
    { scorer_player_id: "b", assist_player_id: "a", minute: 55, sort_order: 1 },
  ];
  let n = 0;
  const next = assignStableGoalEventIds(incoming, prev, () => `new-${++n}`);
  assert.equal(next[0]!.id, "g1");
  assert.equal(next[1]!.id, "new-1");
  assert.equal(goalEventContentKey(next[1]!), "b|a|55|1");
}

console.log("match-save-contract.test.ts: ok");
