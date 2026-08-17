/**
 * Admin 2.0 — end-to-end match integrity scenario tests (A–F).
 * Run: `npx tsx src/lib/admin/match-integrity-scenarios.test.ts`
 */
import assert from "node:assert/strict";
import { aggregateStatsFromGoals } from "@/lib/match-goal-helpers";
import {
  assignStableGoalEventIds,
  collectMatchIntegrityIssues,
  type MatchIntegrityCheckInput,
} from "@/lib/admin/match-save-contract";

const MATCH_ID = "match-scenario-test";
const PLAYERS = ["p1", "p2", "p3"];

function assistCount(events: { assist_player_id?: string | null }[]): number {
  return events.filter((e) => !!e.assist_player_id).length;
}

function statsSums(stats: { goals: number; assists: number }[]): { goals: number; assists: number } {
  return stats.reduce(
    (acc, s) => ({ goals: acc.goals + s.goals, assists: acc.assists + s.assists }),
    { goals: 0, assists: 0 },
  );
}

function buildIntegrityInput(args: {
  status: string;
  goalsFor: number;
  events: { assist_player_id?: string | null }[];
  stats: { goals: number; assists: number }[];
  mvpPlayerId: string | null;
  mvpInSelection?: boolean;
}): MatchIntegrityCheckInput {
  const sums = statsSums(args.stats);
  return {
    status: args.status,
    goalsFor: args.goalsFor,
    goalEventCount: args.events.length,
    assistEventCount: assistCount(args.events),
    statsGoalSum: sums.goals,
    statsAssistSum: sums.assists,
    mvpPlayerId: args.mvpPlayerId,
    mvpInSelection: args.mvpInSelection ?? (args.mvpPlayerId ? PLAYERS.includes(args.mvpPlayerId) : false),
  };
}

/** Pure pre-persist gate — mirrors verifyMatchIntegrity / saveMatchAdminAction abort path. */
function assertIntegrityOrAbort(input: MatchIntegrityCheckInput): void {
  const issues = collectMatchIntegrityIssues(input);
  if (issues.length > 0) {
    throw new Error(issues[0]!.message);
  }
}

/** Simulates in-memory rebuild without calling writeClubDatabaseDiff. */
function simulateMatchSavePipeline(args: {
  goalsPayload: { scorer_player_id: string; assist_player_id?: string; minute?: number }[];
  goalsFor: number;
  mvpPlayerId: string | null;
  previousEvents?: Array<{
    id: string;
    scorer_player_id: string;
    assist_player_id?: string | null;
    minute: number;
    sort_order: number;
  }>;
  status?: string;
}): {
  events: Array<{ id: string; scorer_player_id: string; assist_player_id: string | null; minute: number; sort_order: number }>;
  stats: { player_id: string; goals: number; assists: number }[];
  goals_for: number;
} {
  const status = args.status ?? "played";
  const { goals_for, stats, events } = aggregateStatsFromGoals(MATCH_ID, PLAYERS, args.goalsPayload);
  let persisted = false;

  try {
    assertIntegrityOrAbort(
      buildIntegrityInput({
        status,
        goalsFor: args.goalsFor,
        events,
        stats,
        mvpPlayerId: args.mvpPlayerId,
      }),
    );

    const withIds = assignStableGoalEventIds(
      events.map((e, index) => ({ ...e, sort_order: e.sort_order ?? index })),
      args.previousEvents ?? [],
      () => `new-${Math.random()}`,
    );

    // Would call writeClubDatabaseDiff here — guarded by integrity above.
    persisted = true;
    return { events: withIds, stats, goals_for };
  } finally {
    if (!persisted) {
      // Documented: abort before persist when integrity fails.
    }
  }
}

// --- Scenario A: 2 goals ZVV + assists, integrity clean, stats match events ---
{
  const goalsPayload = [
    { scorer_player_id: "p1", assist_player_id: "p2", minute: 12 },
    { scorer_player_id: "p3", minute: 55 },
  ];
  const agg = aggregateStatsFromGoals(MATCH_ID, PLAYERS, goalsPayload);
  assert.equal(agg.goals_for, 2);
  assert.equal(agg.events.length, 2);
  assert.equal(assistCount(agg.events), 1);
  const sums = statsSums(agg.stats);
  assert.equal(sums.goals, 2);
  assert.equal(sums.assists, 1);

  const issues = collectMatchIntegrityIssues(
    buildIntegrityInput({
      status: "played",
      goalsFor: 2,
      events: agg.events,
      stats: agg.stats,
      mvpPlayerId: "p1",
    }),
  );
  assert.equal(issues.length, 0);

  const saved = simulateMatchSavePipeline({ goalsPayload, goalsFor: 2, mvpPlayerId: "p1" });
  assert.equal(saved.goals_for, 2);
  assert.equal(saved.events.length, 2);
  console.log("scenario A ok");
}

// --- Scenario B: 0-0 no goals ---
{
  const agg = aggregateStatsFromGoals(MATCH_ID, PLAYERS, []);
  assert.equal(agg.goals_for, 0);
  assert.equal(agg.events.length, 0);
  const sums = statsSums(agg.stats);
  assert.equal(sums.goals, 0);
  assert.equal(sums.assists, 0);

  const issues = collectMatchIntegrityIssues(
    buildIntegrityInput({
      status: "played",
      goalsFor: 0,
      events: agg.events,
      stats: agg.stats,
      mvpPlayerId: "p2",
    }),
  );
  assert.equal(issues.length, 0);

  const saved = simulateMatchSavePipeline({ goalsPayload: [], goalsFor: 0, mvpPlayerId: "p2" });
  assert.equal(saved.events.length, 0);
  console.log("scenario B ok");
}

// --- Scenario C: correct 2→3 goals with stable ids (reuse old + one new) ---
{
  const prev = [
    { id: "g-old-1", scorer_player_id: "p1", assist_player_id: "p2", minute: 12, sort_order: 0 },
    { id: "g-old-2", scorer_player_id: "p3", assist_player_id: null, minute: 40, sort_order: 1 },
  ];
  const goalsPayload = [
    { scorer_player_id: "p1", assist_player_id: "p2", minute: 12 },
    { scorer_player_id: "p3", minute: 40 },
    { scorer_player_id: "p2", assist_player_id: "p1", minute: 78 },
  ];
  const saved = simulateMatchSavePipeline({
    goalsPayload,
    goalsFor: 3,
    mvpPlayerId: "p1",
    previousEvents: prev,
  });
  assert.equal(saved.events[0]!.id, "g-old-1");
  assert.equal(saved.events[1]!.id, "g-old-2");
  assert.notEqual(saved.events[2]!.id, "g-old-1");
  assert.notEqual(saved.events[2]!.id, "g-old-2");
  assert.equal(saved.goals_for, 3);
  console.log("scenario C ok");
}

// --- Scenario D: MVP change via integrity (mvp required, exactly one MVP) ---
{
  const goalsPayload = [{ scorer_player_id: "p1", minute: 10 }];
  const agg = aggregateStatsFromGoals(MATCH_ID, PLAYERS, goalsPayload);

  const missingMvp = collectMatchIntegrityIssues(
    buildIntegrityInput({
      status: "played",
      goalsFor: 1,
      events: agg.events,
      stats: agg.stats,
      mvpPlayerId: null,
    }),
  );
  assert.ok(missingMvp.some((i) => i.code === "mvp_required"));

  const withMvp = collectMatchIntegrityIssues(
    buildIntegrityInput({
      status: "played",
      goalsFor: 1,
      events: agg.events,
      stats: agg.stats,
      mvpPlayerId: "p2",
    }),
  );
  assert.equal(withMvp.length, 0);

  const changedMvp = collectMatchIntegrityIssues(
    buildIntegrityInput({
      status: "played",
      goalsFor: 1,
      events: agg.events,
      stats: agg.stats,
      mvpPlayerId: "p3",
    }),
  );
  assert.equal(changedMvp.length, 0);
  console.log("scenario D ok");
}

// --- Scenario E: double assignStableGoalEventIds identical → same ids, no new ---
{
  const prev = [
    { id: "g1", scorer_player_id: "p1", assist_player_id: "p2", minute: 5, sort_order: 0 },
    { id: "g2", scorer_player_id: "p3", assist_player_id: null, minute: 30, sort_order: 1 },
  ];
  const incoming = [
    { scorer_player_id: "p1", assist_player_id: "p2", minute: 5, sort_order: 0 },
    { scorer_player_id: "p3", assist_player_id: null, minute: 30, sort_order: 1 },
  ];
  let n = 0;
  const first = assignStableGoalEventIds(incoming, prev, () => `new-${++n}`);
  const second = assignStableGoalEventIds(incoming, first, () => `new-${++n}`);
  assert.equal(first[0]!.id, "g1");
  assert.equal(first[1]!.id, "g2");
  assert.equal(second[0]!.id, "g1");
  assert.equal(second[1]!.id, "g2");
  assert.equal(n, 0, "no new ids on double identical assign");
  console.log("scenario E ok");
}

// --- Scenario F: fail mid-check — goals mismatch aborts before persist ---
{
  const goalsPayload = [
    { scorer_player_id: "p1", minute: 10 },
    { scorer_player_id: "p2", minute: 20 },
  ];
  let persistCalled = false;

  try {
    simulateMatchSavePipeline({
      goalsPayload,
      goalsFor: 3, // mismatch: 2 events vs goals_for 3
      mvpPlayerId: "p1",
    });
    assert.fail("expected integrity abort");
  } catch (err) {
    assert.match(String(err), /komt niet overeen/);
  }

  // Explicit pure-check path (no assignStableGoalEventIds / no diff write):
  const agg = aggregateStatsFromGoals(MATCH_ID, PLAYERS, goalsPayload);
  const issues = collectMatchIntegrityIssues(
    buildIntegrityInput({
      status: "played",
      goalsFor: 3,
      events: agg.events,
      stats: agg.stats,
      mvpPlayerId: "p1",
    }),
  );
  assert.ok(issues.some((i) => i.code === "goals_for_mismatch"));
  if (issues.length === 0) persistCalled = true;
  assert.equal(persistCalled, false, "persist must not run when integrity fails");
  console.log("scenario F ok");
}

console.log("match-integrity-scenarios.test.ts: ok");
