/**
 * Seizoensfitheidsranking — definitief contract (geen provisional productbesluit).
 *
 * Deelnamegrens:
 * - minimaal 50% van de gepubliceerde testmomenten volledig afgerond;
 * - én minimaal 2 volledige deelnames zodra er ≥ 2 gepubliceerde tests bestaan.
 *
 * Primaire score: gemiddelde sessie-totaalscore over alle volledige deelnames.
 * Bij precies 1 gepubliceerde sessie: status "Voorlopige seizoenstand" (seizoen loopt nog).
 */
import type { ClubDatabase } from "@/types";
import { FITNESS_COMPONENTS, type FitnessComponentKey } from "@/lib/fitness/protocol";
import {
  isFullFitnessResult,
  publishedFitnessSessions,
  rankFitnessTotal,
} from "@/lib/fitness/session-ranking";

export type SeasonBestRow = {
  player_id: string;
  full_name: string;
  shirt_number: number;
  value: number;
  session_id: string;
  test_on: string;
};

export type SeasonConsistencyRow = {
  player_id: string;
  full_name: string;
  shirt_number: number;
  fullParticipations: number;
  avgTotalScore: number | null;
  bestTotalScore: number | null;
  firstPlaces: number;
  podiums: number;
};

export type SeasonFitnessStandingStatus = "voorlopig" | "officieel_tussenstand";

function playerMeta(db: ClubDatabase, seasonId: string, playerId: string) {
  const p = db.players.find((x) => x.id === playerId);
  const mem = db.player_season_memberships.find((m) => m.player_id === playerId && m.season_id === seasonId);
  return {
    full_name: p?.full_name ?? "—",
    shirt_number: mem?.shirt_number ?? 99,
  };
}

/** Minimum volledige deelnames voor seizoensranking. */
export function seasonFitnessMinParticipations(publishedSessionCount: number): number {
  if (publishedSessionCount <= 1) return 1;
  return Math.max(2, Math.ceil(publishedSessionCount * 0.5));
}

export function seasonFitnessStandingStatus(publishedSessionCount: number): SeasonFitnessStandingStatus {
  return publishedSessionCount <= 1 ? "voorlopig" : "officieel_tussenstand";
}

export function seasonBestPerComponent(
  db: ClubDatabase,
  seasonId: string,
  key: FitnessComponentKey,
): SeasonBestRow | null {
  const sessions = publishedFitnessSessions(db, seasonId);
  const meta = FITNESS_COMPONENTS.find((c) => c.key === key)!;
  let best: SeasonBestRow | null = null;
  for (const s of sessions) {
    const results = db.fitness_test_results.filter((r) => r.session_id === s.id && r[key] != null);
    for (const r of results) {
      const value = r[key] as number;
      const m = playerMeta(db, seasonId, r.player_id);
      const row: SeasonBestRow = {
        player_id: r.player_id,
        full_name: m.full_name,
        shirt_number: m.shirt_number,
        value,
        session_id: s.id,
        test_on: s.test_on,
      };
      if (!best) {
        best = row;
        continue;
      }
      const better = meta.direction === "lower_better" ? value < best.value : value > best.value;
      if (better) best = row;
    }
  }
  return best;
}

export function seasonFitnessConsistency(db: ClubDatabase, seasonId: string): SeasonConsistencyRow[] {
  const sessions = publishedFitnessSessions(db, seasonId);
  const minPart = seasonFitnessMinParticipations(sessions.length);
  const byPlayer = new Map<
    string,
    {
      totals: number[];
      firstPlaces: number;
      podiums: number;
    }
  >();

  for (const s of sessions) {
    const total = rankFitnessTotal(db, s.id);
    for (const row of total) {
      const cur = byPlayer.get(row.player_id) ?? { totals: [], firstPlaces: 0, podiums: 0 };
      cur.totals.push(row.totalScore);
      if (row.rank === 1) cur.firstPlaces += 1;
      if (row.rank <= 3) cur.podiums += 1;
      byPlayer.set(row.player_id, cur);
    }
    for (const r of db.fitness_test_results.filter((x) => x.session_id === s.id && isFullFitnessResult(x))) {
      if (!byPlayer.has(r.player_id)) {
        byPlayer.set(r.player_id, { totals: [], firstPlaces: 0, podiums: 0 });
      }
    }
  }

  const rows: SeasonConsistencyRow[] = [];
  for (const [player_id, stats] of byPlayer) {
    if (stats.totals.length < minPart) continue;
    const m = playerMeta(db, seasonId, player_id);
    const avg =
      stats.totals.length > 0
        ? Math.round((stats.totals.reduce((a, b) => a + b, 0) / stats.totals.length) * 100) / 100
        : null;
    const best = stats.totals.length > 0 ? Math.max(...stats.totals) : null;
    rows.push({
      player_id,
      full_name: m.full_name,
      shirt_number: m.shirt_number,
      fullParticipations: stats.totals.length,
      avgTotalScore: avg,
      bestTotalScore: best,
      firstPlaces: stats.firstPlaces,
      podiums: stats.podiums,
    });
  }

  rows.sort((a, b) => {
    const aa = a.avgTotalScore ?? -1;
    const bb = b.avgTotalScore ?? -1;
    if (bb !== aa) return bb - aa;
    if (b.fullParticipations !== a.fullParticipations) return b.fullParticipations - a.fullParticipations;
    if (b.firstPlaces !== a.firstPlaces) return b.firstPlaces - a.firstPlaces;
    if (b.podiums !== a.podiums) return b.podiums - a.podiums;
    const ba = a.bestTotalScore ?? -1;
    const bb2 = b.bestTotalScore ?? -1;
    if (bb2 !== ba) return bb2 - ba;
    if (a.shirt_number !== b.shirt_number) return a.shirt_number - b.shirt_number;
    return a.full_name.localeCompare(b.full_name, "nl");
  });

  return rows;
}

export const SEASON_FITNESS_CONTRACT_VERSION = "2026-07-30-final" as const;
