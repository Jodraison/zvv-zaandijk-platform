/**
 * Fitheidsranking per gepubliceerde sessie — gelijke 25% weging, genormaliseerd binnen de sessie.
 * Tie-breaks: zie FITNESS_RANKING_CONTRACT.md (definitief).
 */
import type { ClubDatabase, FitnessTestResult } from "@/types";
import { FITNESS_COMPONENTS, type FitnessComponentKey } from "@/lib/fitness/protocol";
import { todayInClubTz } from "@/lib/season/season-operations-2026-27";

export type FitnessRankRow = {
  player_id: string;
  full_name: string;
  shirt_number: number;
  value: number;
  rank: number;
};

export type FitnessTotalRankRow = {
  player_id: string;
  full_name: string;
  shirt_number: number;
  /** 0–100 genormaliseerd gemiddelde van 4 onderdelen. */
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

function assignRanks<T extends { value: number; player_id: string; shirt_number: number; full_name: string }>(
  sorted: T[],
): Array<T & { rank: number }> {
  let rank = 0;
  let lastValue: number | null = null;
  return sorted.map((row, i) => {
    if (lastValue === null || row.value !== lastValue) {
      rank = i + 1;
      lastValue = row.value;
    }
    return { ...row, rank };
  });
}

export function rankFitnessComponent(
  db: ClubDatabase,
  sessionId: string,
  key: FitnessComponentKey,
): FitnessRankRow[] {
  const session = db.fitness_test_sessions.find((s) => s.id === sessionId);
  if (!session || session.status !== "published") return [];
  const meta = FITNESS_COMPONENTS.find((c) => c.key === key)!;
  const results = db.fitness_test_results.filter((r) => r.session_id === sessionId && r[key] != null);
  const rows = results.map((r) => {
    const m = playerMeta(db, session.season_id, r.player_id);
    return {
      player_id: r.player_id,
      full_name: m.full_name,
      shirt_number: m.shirt_number,
      value: r[key] as number,
    };
  });
  rows.sort((a, b) => {
    const d = meta.direction === "lower_better" ? a.value - b.value : b.value - a.value;
    if (d !== 0) return d;
    if (a.shirt_number !== b.shirt_number) return a.shirt_number - b.shirt_number;
    return a.full_name.localeCompare(b.full_name, "nl");
  });
  return assignRanks(rows);
}

/** Min-max normalisatie binnen sessie → 0–100 (best = 100), keyed by player_id. */
function normalizeByPlayer(
  entries: Array<{ player_id: string; value: number }>,
  direction: "lower_better" | "higher_better",
): Map<string, number> {
  const map = new Map<string, number>();
  if (entries.length === 0) return map;
  const values = entries.map((e) => e.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  for (const e of entries) {
    if (max === min) {
      map.set(e.player_id, 100);
    } else if (direction === "lower_better") {
      map.set(e.player_id, ((max - e.value) / (max - min)) * 100);
    } else {
      map.set(e.player_id, ((e.value - min) / (max - min)) * 100);
    }
  }
  return map;
}

export function isFullFitnessResult(r: FitnessTestResult): boolean {
  return FITNESS_COMPONENTS.every((c) => r[c.key] != null && (r[c.key] as number) > 0);
}

export function rankFitnessTotal(db: ClubDatabase, sessionId: string): FitnessTotalRankRow[] {
  const session = db.fitness_test_sessions.find((s) => s.id === sessionId);
  if (!session || session.status !== "published") return [];
  const results = db.fitness_test_results.filter((r) => r.session_id === sessionId && isFullFitnessResult(r));
  if (results.length === 0) return [];

  const componentRankMaps = Object.fromEntries(
    FITNESS_COMPONENTS.map((c) => {
      const ranked = rankFitnessComponent(db, sessionId, c.key);
      return [c.key, new Map(ranked.map((r) => [r.player_id, r.rank]))];
    }),
  ) as Record<FitnessComponentKey, Map<string, number>>;

  const normMaps = Object.fromEntries(
    FITNESS_COMPONENTS.map((c) => {
      const entries = results.map((r) => ({ player_id: r.player_id, value: r[c.key] as number }));
      return [c.key, normalizeByPlayer(entries, c.direction)];
    }),
  ) as Record<FitnessComponentKey, Map<string, number>>;

  const rows: Omit<FitnessTotalRankRow, "rank">[] = results.map((r) => {
    const m = playerMeta(db, session.season_id, r.player_id);
    const componentScores = Object.fromEntries(
      FITNESS_COMPONENTS.map((c) => [c.key, normMaps[c.key].get(r.player_id) ?? 0]),
    ) as Record<FitnessComponentKey, number>;
    const componentRanks = Object.fromEntries(
      FITNESS_COMPONENTS.map((c) => [c.key, componentRankMaps[c.key].get(r.player_id) ?? 999]),
    ) as Record<FitnessComponentKey, number>;
    const firstPlaces = FITNESS_COMPONENTS.filter((c) => componentRanks[c.key] === 1).length;
    const lowestComponentScore = Math.min(...FITNESS_COMPONENTS.map((c) => componentScores[c.key]));
    const totalScore =
      FITNESS_COMPONENTS.reduce((sum, c) => sum + componentScores[c.key], 0) / FITNESS_COMPONENTS.length;
    return {
      player_id: r.player_id,
      full_name: m.full_name,
      shirt_number: m.shirt_number,
      totalScore: Math.round(totalScore * 100) / 100,
      componentScores,
      componentRanks,
      firstPlaces,
      lowestComponentScore: Math.round(lowestComponentScore * 100) / 100,
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

  let rank = 0;
  let last: number | null = null;
  return rows.map((row, i) => {
    if (last === null || row.totalScore !== last) {
      rank = i + 1;
      last = row.totalScore;
    }
    return { ...row, rank };
  });
}

function isEligiblePublishedSession(
  s: { season_id: string; status: string; test_on: string; note?: string | null },
  seasonId: string,
  today: string,
) {
  if (s.season_id !== seasonId || s.status !== "published") return false;
  if ((s.note ?? "").startsWith("[QA]")) return false;
  // Future-dated published sessions must not drive rankings/homepage.
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
