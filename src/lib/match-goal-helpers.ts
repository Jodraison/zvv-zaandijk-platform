import type { MatchGoalEvent, MatchPlayerStat } from "@/types";

export type GoalRowInput = { scorer_player_id: string; assist_player_id?: string };

export type PlayerMatchCountInput = Record<string, { goals: number; assists: number } | undefined>;

/**
 * Bouwt doelpunt-rijen uit per-speelster totalen (coach-invoer).
 * Elke assist wordt aan het eerste vrije doelpunt gekoppeld waar de assist ≠ scorer.
 */
export function goalRowsFromPlayerCounts(
  selectedPlayerIds: string[],
  counts: PlayerMatchCountInput,
): { ok: true; goals: GoalRowInput[] } | { ok: false; error: string } {
  const slots: { scorer_player_id: string }[] = [];
  let totalAssists = 0;
  for (const pid of selectedPlayerIds) {
    const raw = counts[pid];
    const g = Math.max(0, Math.min(99, Math.floor(raw?.goals ?? 0)));
    const a = Math.max(0, Math.min(99, Math.floor(raw?.assists ?? 0)));
    totalAssists += a;
    for (let i = 0; i < g; i++) slots.push({ scorer_player_id: pid });
  }
  if (totalAssists > slots.length) {
    return { ok: false, error: "Goals komen niet overeen met totaal" };
  }
  const assistQueue: string[] = [];
  for (const pid of selectedPlayerIds) {
    const a = Math.max(0, Math.min(99, Math.floor(counts[pid]?.assists ?? 0)));
    for (let i = 0; i < a; i++) assistQueue.push(pid);
  }
  const goals: GoalRowInput[] = slots.map((s) => ({ scorer_player_id: s.scorer_player_id }));
  for (const assistPid of assistQueue) {
    const idx = goals.findIndex((r) => !r.assist_player_id && r.scorer_player_id !== assistPid);
    if (idx === -1) {
      return {
        ok: false,
        error: "Goals komen niet overeen met totaal",
      };
    }
    goals[idx] = { ...goals[idx], assist_player_id: assistPid };
  }
  return { ok: true, goals };
}

/** Voor bewerk-scherm: uit events (voorkeur) of uit stats-rijen. */
export function buildInitialPlayerMatchStats(
  statsRows: { player_id: string; goals: number; assists: number }[],
  events: { scorer_player_id: string; assist_player_id: string | null }[],
): Record<string, { goals: number; assists: number }> {
  if (events.length > 0) {
    const acc: Record<string, { goals: number; assists: number }> = {};
    for (const e of events) {
      const s = acc[e.scorer_player_id] ?? { goals: 0, assists: 0 };
      s.goals += 1;
      acc[e.scorer_player_id] = s;
      if (e.assist_player_id) {
        const as = acc[e.assist_player_id] ?? { goals: 0, assists: 0 };
        as.assists += 1;
        acc[e.assist_player_id] = as;
      }
    }
    return acc;
  }
  const acc: Record<string, { goals: number; assists: number }> = {};
  for (const s of statsRows) {
    acc[s.player_id] = { goals: s.goals, assists: s.assists };
  }
  return acc;
}

/** Stats + goals_for afgeleid van doelpunt-rijen; alleen geselecteerde speelsters krijgen een rij. */
export function aggregateStatsFromGoals(
  matchId: string,
  selectedPlayerIds: string[],
  goals: GoalRowInput[],
): { goals_for: number; stats: MatchPlayerStat[]; events: Omit<MatchGoalEvent, "id">[] } {
  const map = new Map<string, { goals: number; assists: number }>();
  for (const pid of selectedPlayerIds) {
    map.set(pid, { goals: 0, assists: 0 });
  }

  const assistNorm = (a: string | undefined) => (a?.trim() ? a.trim() : undefined);

  for (const g of goals) {
    const scorer = map.get(g.scorer_player_id);
    if (scorer) scorer.goals += 1;
    const ast = assistNorm(g.assist_player_id);
    if (ast) {
      const row = map.get(ast);
      if (row) row.assists += 1;
    }
  }

  const stats: MatchPlayerStat[] = selectedPlayerIds.map((player_id) => {
    const v = map.get(player_id)!;
    return { match_id: matchId, player_id, goals: v.goals, assists: v.assists };
  });

  const events: Omit<MatchGoalEvent, "id">[] = goals.map((g, sort_order) => ({
    match_id: matchId,
    scorer_player_id: g.scorer_player_id,
    assist_player_id: assistNorm(g.assist_player_id) ?? null,
    sort_order,
  }));

  return { goals_for: goals.length, stats, events };
}

/**
 * Oude wedstrijden zonder events: expandeer goals per speler naar losse rijen (geen assists).
 */
export function synthesizeGoalRowsFromStats(stats: MatchPlayerStat[]): { scorerId: string; assistId: string }[] {
  const rows: { scorerId: string; assistId: string }[] = [];
  for (const s of stats) {
    for (let i = 0; i < s.goals; i++) {
      rows.push({ scorerId: s.player_id, assistId: "" });
    }
  }
  return rows;
}
