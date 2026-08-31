/**
 * Admin 2.0 — canonieke wedstrijd-data contract.
 *
 * Bron van waarheid:
 * - Goals + assists → match_goal_events (events zijn canonieke)
 * - MVP → match_wotm_winners (0..n; matches.wotm_player_id is legacy-spiegel)
 * - Cards → match_card_events
 * - Wissels → match_substitutions
 * - Opstelling → match_lineup_entries
 * - goals_for / match_player_stats → afgeleid van events (zelfde save)
 *
 * Ranking/statistieken lezen events + wotm-winnaars via aggregateSeasonMatchStats.
 */

export const MATCH_CANONICAL_SOURCES = {
  goalsAssists: "match_goal_events",
  mvp: "match_wotm_winners",
  cards: "match_card_events",
  substitutions: "match_substitutions",
  lineup: "match_lineup_entries",
  scoreForDerived: "matches.goals_for",
  statsDerived: "match_player_stats",
} as const;

/** Centrale revalidation-targets na wedstrijdmutatie (aanvulling op revalidateClubDataAfterMutation). */
export const MATCH_REVALIDATE_PATHS = [
  "/",
  "/ranking",
  "/statistieken",
  "/wedstrijden",
  "/selectie",
  "/beheer",
  "/beheer/wedstrijden",
] as const;

export type MatchIntegrityCheckInput = {
  status: string;
  goalsFor: number;
  goalEventCount: number;
  assistEventCount: number;
  statsGoalSum: number;
  statsAssistSum: number;
  mvpPlayerIds: string[];
  mvpAllInSelection: boolean;
};

export type MatchIntegrityIssue = {
  code: string;
  message: string;
};

/** Pure integrity checks — unit-tested; used after in-memory rebuild before persist. */
export function collectMatchIntegrityIssues(input: MatchIntegrityCheckInput): MatchIntegrityIssue[] {
  const issues: MatchIntegrityIssue[] = [];
  if (input.status !== "played") {
    if (input.goalEventCount > 0 || input.statsGoalSum > 0 || input.statsAssistSum > 0) {
      issues.push({
        code: "scheduled_has_events",
        message: "Een niet-gespeelde wedstrijd mag geen doelpunten of assists bevatten.",
      });
    }
    if (input.goalsFor !== 0) {
      issues.push({
        code: "scheduled_goals_for",
        message: "Eindstand (voor) moet 0 zijn bij een niet-gespeelde wedstrijd.",
      });
    }
    if (input.mvpPlayerIds.length > 0) {
      issues.push({
        code: "scheduled_mvp",
        message: "MVP is alleen toegestaan bij een gespeelde wedstrijd.",
      });
    }
    return issues;
  }

  if (input.goalsFor !== input.goalEventCount) {
    issues.push({
      code: "goals_for_mismatch",
      message: `Eindstand (${input.goalsFor}) komt niet overeen met het aantal doelpunten (${input.goalEventCount}).`,
    });
  }
  if (input.statsGoalSum !== input.goalEventCount) {
    issues.push({
      code: "stats_goals_mismatch",
      message: "Spelerstatistieken (goals) komen niet overeen met de doelpunt-gebeurtenissen.",
    });
  }
  if (input.statsAssistSum !== input.assistEventCount) {
    issues.push({
      code: "stats_assists_mismatch",
      message: "Spelerstatistieken (assists) komen niet overeen met de assist-gebeurtenissen.",
    });
  }
  const uniqueMvp = [...new Set(input.mvpPlayerIds.filter(Boolean))];
  if (uniqueMvp.length !== input.mvpPlayerIds.filter(Boolean).length) {
    issues.push({
      code: "mvp_duplicate",
      message: "Dezelfde speelster kan niet twee keer speelster van de wedstrijd zijn.",
    });
  }
  if (uniqueMvp.length > 0 && !input.mvpAllInSelection) {
    issues.push({
      code: "mvp_not_in_selection",
      message: "Elke MVP moet in de wedstrijdselectie staan.",
    });
  }
  return issues;
}

/** Idempotent content key for a goal event (stable across re-saves without client ids). */
export function goalEventContentKey(g: {
  scorer_player_id: string;
  assist_player_id?: string | null;
  minute: number;
  sort_order?: number;
}): string {
  const assist = (g.assist_player_id ?? "").trim() || "-";
  const order = g.sort_order ?? 0;
  return `${g.scorer_player_id}|${assist}|${g.minute}|${order}`;
}

/**
 * Map incoming goals to stable ids: reuse previous id when content key matches.
 * Prevents needless UUID churn and reduces duplicate-risk on retry.
 */
export function assignStableGoalEventIds<T extends {
  scorer_player_id: string;
  assist_player_id?: string | null;
  minute: number;
  sort_order?: number;
}>(
  incoming: T[],
  previous: Array<{ id: string; scorer_player_id: string; assist_player_id?: string | null; minute: number; sort_order: number }>,
  newId: () => string,
): Array<T & { id: string }> {
  const prevByKey = new Map(previous.map((e) => [goalEventContentKey(e), e.id]));
  const used = new Set<string>();
  return incoming.map((g, index) => {
    const key = goalEventContentKey({ ...g, sort_order: g.sort_order ?? index });
    const reused = prevByKey.get(key);
    if (reused && !used.has(reused)) {
      used.add(reused);
      return { ...g, id: reused };
    }
    return { ...g, id: newId() };
  });
}
