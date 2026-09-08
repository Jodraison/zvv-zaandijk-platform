/**
 * Fitheidsranking per gepubliceerde sessie — positiepunten (1e = N … laatste = 1).
 * Totaal = som van vier onderdelen. Alleen complete speelsters in het totaalklassement.
 */
import type { ClubDatabase, FitnessTestResult } from "@/types";
import { FITNESS_COMPONENTS, type FitnessComponentKey } from "@/lib/fitness/protocol";
import { layoutFitnessPodium } from "@/lib/fitness/fitness-podium-layout";
import {
  componentPointsOf,
  denseRankAndPoints,
  denseRankByValue,
  fitnessSessionFieldSize,
  isMeasuredFitnessValue,
  measuredComponentEntries,
} from "@/lib/fitness/fitness-position-points";
import { todayInClubTz } from "@/lib/season/season-operations-2026-27";

export type FitnessRankRow = {
  player_id: string;
  full_name: string;
  shirt_number: number;
  value: number;
  rank: number;
  /** Gehele positiepunten (0 als niet gerangschikt). */
  points: number;
};

export type FitnessTotalRankRow = {
  player_id: string;
  full_name: string;
  shirt_number: number;
  /** Som van vier gehele positiepunten. */
  totalScore: number;
  componentScores: Record<FitnessComponentKey, number>;
  componentRanks: Record<FitnessComponentKey, number>;
  firstPlaces: number;
  lowestComponentScore: number;
  rank: number;
};

function playerMeta(db: ClubDatabase, seasonId: string, playerId: string) {
  const p = db.players.find((x) => x.id === playerId);
  const mem = db.player_season_memberships.find((m) => m.player_id === playerId && m.season_id === seasonId);
  return {
    full_name: p?.full_name ?? "—",
    shirt_number: mem?.shirt_number ?? 99,
  };
}

function sessionResults(db: ClubDatabase, sessionId: string): FitnessTestResult[] {
  return db.fitness_test_results.filter((r) => r.session_id === sessionId);
}

function componentBaseRows(
  db: ClubDatabase,
  seasonId: string,
  results: FitnessTestResult[],
  key: FitnessComponentKey,
) {
  return measuredComponentEntries(results, key).map((r) => {
    const m = playerMeta(db, seasonId, r.player_id);
    return {
      player_id: r.player_id,
      full_name: m.full_name,
      shirt_number: m.shirt_number,
      value: r[key] as number,
    };
  });
}

function scoreComponentRows(
  rows: Array<{ player_id: string; full_name: string; shirt_number: number; value: number }>,
  direction: "lower_better" | "higher_better",
  fieldSize: number,
): FitnessRankRow[] {
  const rankByValue = denseRankByValue(
    rows.map((r) => r.value),
    direction,
  );
  return rows.map((row) => {
    const scored = denseRankAndPoints(row.value, rankByValue, fieldSize);
    return { ...row, ...scored };
  });
}

function orderForDisplay(
  rows: FitnessRankRow[],
  direction: "lower_better" | "higher_better",
  totalRankByPlayer: ReadonlyMap<string, number>,
): FitnessRankRow[] {
  const { podium, rest } = layoutFitnessPodium(rows, direction, totalRankByPlayer);
  return [...podium, ...rest];
}

function standingFromComponentMaps(
  db: ClubDatabase,
  seasonId: string,
  complete: FitnessTestResult[],
  rankMaps: Record<FitnessComponentKey, Map<string, number>>,
  fieldSize: number,
): Map<string, number> {
  const rows = complete.map((r) => {
    const m = playerMeta(db, seasonId, r.player_id);
    const componentScores = Object.fromEntries(
      FITNESS_COMPONENTS.map((c) => [c.key, componentPointsOf(rankMaps[c.key], r.player_id, fieldSize)]),
    ) as Record<FitnessComponentKey, number>;
    const componentRanks = Object.fromEntries(
      FITNESS_COMPONENTS.map((c) => [c.key, rankMaps[c.key].get(r.player_id) ?? 999]),
    ) as Record<FitnessComponentKey, number>;
    const firstPlaces = FITNESS_COMPONENTS.filter((c) => componentRanks[c.key] === 1).length;
    const lowestComponentScore = Math.min(...FITNESS_COMPONENTS.map((c) => componentScores[c.key]));
    const totalScore = FITNESS_COMPONENTS.reduce((sum, c) => sum + componentScores[c.key], 0);
    return {
      player_id: r.player_id,
      full_name: m.full_name,
      shirt_number: m.shirt_number,
      totalScore,
      componentScores,
      componentRanks,
      firstPlaces,
      lowestComponentScore,
    };
  });

  rows.sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    if (b.firstPlaces !== a.firstPlaces) return b.firstPlaces - a.firstPlaces;
    if (b.lowestComponentScore !== a.lowestComponentScore) return b.lowestComponentScore - a.lowestComponentScore;
    if (a.componentRanks.flying_sprint_30m_seconds !== b.componentRanks.flying_sprint_30m_seconds) {
      return a.componentRanks.flying_sprint_30m_seconds - b.componentRanks.flying_sprint_30m_seconds;
    }
    if (a.componentRanks.agility_10_20_10_seconds !== b.componentRanks.agility_10_20_10_seconds) {
      return a.componentRanks.agility_10_20_10_seconds - b.componentRanks.agility_10_20_10_seconds;
    }
    if (a.shirt_number !== b.shirt_number) return a.shirt_number - b.shirt_number;
    return a.full_name.localeCompare(b.full_name, "nl");
  });

  return new Map(rows.map((row, i) => [row.player_id, i + 1]));
}

function scorePublishedSession(db: ClubDatabase, sessionId: string) {
  const session = db.fitness_test_sessions.find((s) => s.id === sessionId);
  if (!session || session.status !== "published") {
    return {
      fieldSize: 0,
      components: Object.fromEntries(FITNESS_COMPONENTS.map((c) => [c.key, [] as FitnessRankRow[]])) as Record<
        FitnessComponentKey,
        FitnessRankRow[]
      >,
      totals: [] as FitnessTotalRankRow[],
    };
  }

  const results = sessionResults(db, sessionId);
  const fieldSize = fitnessSessionFieldSize(results);
  const complete = results.filter(isFullFitnessResult);
  const bases = Object.fromEntries(
    FITNESS_COMPONENTS.map((c) => [c.key, componentBaseRows(db, session.season_id, results, c.key)]),
  ) as Record<FitnessComponentKey, ReturnType<typeof componentBaseRows>>;

  const scored = Object.fromEntries(
    FITNESS_COMPONENTS.map((c) => [c.key, scoreComponentRows(bases[c.key], c.direction, fieldSize)]),
  ) as Record<FitnessComponentKey, FitnessRankRow[]>;

  const rankMaps = Object.fromEntries(
    FITNESS_COMPONENTS.map((c) => [c.key, new Map(scored[c.key].map((r) => [r.player_id, r.rank]))]),
  ) as Record<FitnessComponentKey, Map<string, number>>;

  const totalsUnranked = complete.map((r) => {
    const m = playerMeta(db, session.season_id, r.player_id);
    const componentScores = Object.fromEntries(
      FITNESS_COMPONENTS.map((c) => [c.key, componentPointsOf(rankMaps[c.key], r.player_id, fieldSize)]),
    ) as Record<FitnessComponentKey, number>;
    const componentRanks = Object.fromEntries(
      FITNESS_COMPONENTS.map((c) => [c.key, rankMaps[c.key].get(r.player_id) ?? 999]),
    ) as Record<FitnessComponentKey, number>;
    const firstPlaces = FITNESS_COMPONENTS.filter((c) => componentRanks[c.key] === 1).length;
    const lowestComponentScore = Math.min(...FITNESS_COMPONENTS.map((c) => componentScores[c.key]));
    const totalScore = FITNESS_COMPONENTS.reduce((sum, c) => sum + componentScores[c.key], 0);
    return {
      player_id: r.player_id,
      full_name: m.full_name,
      shirt_number: m.shirt_number,
      totalScore,
      componentScores,
      componentRanks,
      firstPlaces,
      lowestComponentScore,
    };
  });

  totalsUnranked.sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    if (b.firstPlaces !== a.firstPlaces) return b.firstPlaces - a.firstPlaces;
    if (b.lowestComponentScore !== a.lowestComponentScore) return b.lowestComponentScore - a.lowestComponentScore;
    if (a.componentRanks.flying_sprint_30m_seconds !== b.componentRanks.flying_sprint_30m_seconds) {
      return a.componentRanks.flying_sprint_30m_seconds - b.componentRanks.flying_sprint_30m_seconds;
    }
    if (a.componentRanks.agility_10_20_10_seconds !== b.componentRanks.agility_10_20_10_seconds) {
      return a.componentRanks.agility_10_20_10_seconds - b.componentRanks.agility_10_20_10_seconds;
    }
    if (a.shirt_number !== b.shirt_number) return a.shirt_number - b.shirt_number;
    return a.full_name.localeCompare(b.full_name, "nl");
  });

  let rank = 0;
  let last: number | null = null;
  const totals: FitnessTotalRankRow[] = totalsUnranked.map((row, i) => {
    if (last === null || row.totalScore !== last) {
      rank = i + 1;
      last = row.totalScore;
    }
    return { ...row, rank };
  });

  const totalRanks = standingFromComponentMaps(db, session.season_id, complete, rankMaps, fieldSize);
  const components = Object.fromEntries(
    FITNESS_COMPONENTS.map((c) => [c.key, orderForDisplay(scored[c.key], c.direction, totalRanks)]),
  ) as Record<FitnessComponentKey, FitnessRankRow[]>;

  return { fieldSize, components, totals };
}

export function isFullFitnessResult(r: FitnessTestResult): boolean {
  return FITNESS_COMPONENTS.every((c) => isMeasuredFitnessValue(r[c.key] as number | null));
}

export function sessionFieldSize(db: ClubDatabase, sessionId: string): number {
  return scorePublishedSession(db, sessionId).fieldSize;
}

export function rankFitnessComponent(
  db: ClubDatabase,
  sessionId: string,
  key: FitnessComponentKey,
): FitnessRankRow[] {
  return scorePublishedSession(db, sessionId).components[key];
}

export function rankFitnessTotal(db: ClubDatabase, sessionId: string): FitnessTotalRankRow[] {
  return scorePublishedSession(db, sessionId).totals;
}

function isEligiblePublishedSession(
  s: { season_id: string; status: string; test_on: string; note?: string | null },
  seasonId: string,
  today: string,
) {
  if (s.season_id !== seasonId || s.status !== "published") return false;
  if ((s.note ?? "").startsWith("[QA]")) return false;
  if (s.test_on > today) return false;
  return true;
}

export function latestPublishedFitnessSession(db: ClubDatabase, seasonId: string, now = new Date()) {
  const today = todayInClubTz(now);
  return (
    (db.fitness_test_sessions ?? [])
      .filter((s) => isEligiblePublishedSession(s, seasonId, today))
      .sort((a, b) => b.test_on.localeCompare(a.test_on) || (b.published_at ?? "").localeCompare(a.published_at ?? ""))[0] ??
    null
  );
}

export function publishedFitnessSessions(db: ClubDatabase, seasonId: string, now = new Date()) {
  const today = todayInClubTz(now);
  return (db.fitness_test_sessions ?? [])
    .filter((s) => isEligiblePublishedSession(s, seasonId, today))
    .sort((a, b) => b.test_on.localeCompare(a.test_on));
}
