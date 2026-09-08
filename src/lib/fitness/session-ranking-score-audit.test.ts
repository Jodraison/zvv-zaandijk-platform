/**
 * Fitness score audit — 7 september 2026 dataset + regressie A–D.
 * Gebruikt dezelfde `rankFitnessTotal` als de production UI.
 * Run: npx tsx src/lib/fitness/session-ranking-score-audit.test.ts
 */
import assert from "node:assert/strict";
import type { ClubDatabase, FitnessTestResult } from "@/types";
import { layoutFitnessPodium } from "@/lib/fitness/fitness-podium-layout";
import { FITNESS_COMPONENTS } from "@/lib/fitness/protocol";
import { isFullFitnessResult, rankFitnessTotal } from "@/lib/fitness/session-ranking";
import {
  FITNESS_SCORE_LEGEND_BULLETS,
  FITNESS_SCORE_LEGEND_NORMALIZATION,
} from "@/lib/fitness/fitness-score-copy";

type Athlete = {
  id: string;
  name: string;
  shirt: number;
  run: number | null;
  sprint: number | null;
  agility: number | null;
  plank: number | null;
};

/** Exacte meetwaarden 7 september 2026 — niet muteren. */
const SEPT7: Athlete[] = [
  { id: "jelisa", name: "Jelisa De Jonge", shirt: 1, run: 800, sprint: 3.85, agility: 12.65, plank: 29 },
  { id: "mariska", name: "Mariska Oosterhuis", shirt: 16, run: 800, sprint: null, agility: null, plank: 125 },
  { id: "marisha", name: "Marisha Prins", shirt: 5, run: 1050, sprint: 3.23, agility: 12.2, plank: 150 },
  { id: "emie", name: "Emie Agema", shirt: 17, run: 800, sprint: 3.71, agility: 11.21, plank: 60 },
  { id: "nienke", name: "Nienke Hoffman", shirt: 11, run: 1000, sprint: 3.56, agility: 11.85, plank: 100 },
  { id: "anouk", name: "Anouk Aafjes", shirt: 19, run: 800, sprint: 3.56, agility: 12.25, plank: 15 },
  { id: "renee", name: "Renée Koopman", shirt: 8, run: 1000, sprint: 3.43, agility: 11.3, plank: 132 },
  { id: "melissa", name: "Melissa Rietveld", shirt: 9, run: 850, sprint: 3.81, agility: 10.83, plank: 56 },
  { id: "tess", name: "Tess Luijting", shirt: 4, run: 750, sprint: 3.93, agility: 12.86, plank: 45 },
  { id: "lorelai", name: "Lorelai Bakker", shirt: 18, run: 850, sprint: 3.9, agility: 13.28, plank: 72 },
  { id: "danique", name: "Danique van Heeringen", shirt: 7, run: 1000, sprint: 3.98, agility: 12.78, plank: 63 },
  { id: "andrada", name: "Andrada Timmer", shirt: 12, run: 900, sprint: 3.38, agility: 13.18, plank: 84 },
  { id: "dionne", name: "Dionne van Dijk", shirt: 10, run: 1000, sprint: 3.21, agility: 10.61, plank: 88 },
];

function emptyArrays(): Pick<
  ClubDatabase,
  | "matches"
  | "match_matchday_roster"
  | "match_lineup_entries"
  | "match_player_stats"
  | "match_goal_events"
  | "match_card_events"
  | "match_substitutions"
  | "match_position_changes"
  | "training_sessions"
  | "training_attendance"
  | "fitness_tests"
  | "fitness_score_configs"
> {
  return {
    matches: [],
    match_matchday_roster: [],
    match_lineup_entries: [],
    match_player_stats: [],
    match_goal_events: [],
    match_card_events: [],
    match_substitutions: [],
    match_position_changes: [],
    training_sessions: [],
    training_attendance: [],
    fitness_tests: [],
    fitness_score_configs: [],
  };
}

function sept7Db(athletes: Athlete[] = SEPT7): ClubDatabase {
  return {
    seasons: [{ id: "s1", name: "T", starts_on: "2026-01-01", ends_on: "2026-12-31", is_active: true }],
    players: athletes.map((a) => ({
      id: a.id,
      full_name: a.name,
      photo_url: null,
      is_guest: false,
      initials: null,
      bio: null,
      preferred_foot: null,
      strengths: null,
      role_label: null,
      tagline: null,
      card_note: null,
    })),
    player_season_memberships: athletes.map((a) => ({
      id: `m-${a.id}`,
      player_id: a.id,
      season_id: "s1",
      shirt_number: a.shirt,
      position: "MID",
      display_position: "",
      is_captain: false,
      is_vice_captain: false,
      is_guest: false,
    })),
    ...emptyArrays(),
    fitness_test_sessions: [
      {
        id: "sess-sept7",
        season_id: "s1",
        test_on: "2026-09-07",
        protocol_code: "four_part_v1",
        status: "published",
        note: null,
        score_config_id: null,
        created_at: "2026-09-07T12:00:00Z",
        updated_at: "2026-09-07T12:00:00Z",
        published_at: "2026-09-07T18:00:00Z",
        created_by: null,
        published_by: null,
      },
    ],
    fitness_test_results: athletes.map((a) => ({
      id: `r-${a.id}`,
      session_id: "sess-sept7",
      player_id: a.id,
      flying_sprint_30m_seconds: a.sprint,
      agility_10_20_10_seconds: a.agility,
      plank_seconds: a.plank,
      six_minute_run_meters: a.run,
      participation_status: a.sprint == null || a.agility == null ? "partial" : "complete",
      participation_reason: null,
      note: null,
      created_at: "",
      updated_at: "",
    })),
    team_photo_url: null,
  };
}

function byId(db: ClubDatabase) {
  return new Map(rankFitnessTotal(db, "sess-sept7").map((r) => [r.player_id, r]));
}

function resultOf(db: ClubDatabase, playerId: string): FitnessTestResult {
  return db.fitness_test_results.find((r) => r.player_id === playerId)!;
}

{
  // CASE A — gelijke 1000 m → dezelfde 6-min onderdeelscore
  const totals = byId(sept7Db());
  const runScores = ["dionne", "renee", "danique", "nienke"].map(
    (id) => totals.get(id)!.componentScores.six_minute_run_meters,
  );
  assert.equal(new Set(runScores).size, 1);
  assert.ok(runScores[0]! > 0);
  assert.ok(runScores[0]! < 100);
}

{
  // CASE B — Renée compleet: vier geldige onderdeelscores + totaal
  const renee = byId(sept7Db()).get("renee")!;
  assert.ok(renee);
  for (const c of FITNESS_COMPONENTS) {
    const score = renee.componentScores[c.key];
    assert.ok(Number.isFinite(score), `${c.key} moet een eindig getal zijn`);
    assert.ok(score > 0, `${c.key} mag geen 0 zijn voor Renée`);
    assert.ok(score <= 100);
  }
  assert.ok(renee.totalScore > 0);
  assert.equal(renee.totalScore, Math.round(renee.totalScore * 100) / 100);
  const avg =
    FITNESS_COMPONENTS.reduce((sum, c) => sum + renee.componentScores[c.key], 0) / FITNESS_COMPONENTS.length;
  assert.equal(renee.totalScore, Math.round(avg * 100) / 100);
}

{
  // CASE C — Mariska incompleet: geen totaal, NULL geen 0-seconden
  const db = sept7Db();
  const totals = rankFitnessTotal(db, "sess-sept7");
  assert.equal(totals.find((r) => r.player_id === "mariska"), undefined);
  const raw = resultOf(db, "mariska");
  assert.equal(isFullFitnessResult(raw), false);
  assert.equal(raw.flying_sprint_30m_seconds, null);
  assert.equal(raw.agility_10_20_10_seconds, null);
  assert.notEqual(raw.flying_sprint_30m_seconds, 0);
  assert.notEqual(raw.agility_10_20_10_seconds, 0);
  assert.equal(raw.six_minute_run_meters, 800);
  assert.equal(raw.plank_seconds, 125);
}

{
  // CASE D — richting per onderdeel
  const totals = byId(sept7Db());
  assert.ok(
    totals.get("marisha")!.componentScores.six_minute_run_meters >
      totals.get("tess")!.componentScores.six_minute_run_meters,
  );
  assert.ok(
    totals.get("dionne")!.componentScores.flying_sprint_30m_seconds >
      totals.get("danique")!.componentScores.flying_sprint_30m_seconds,
  );
  assert.ok(
    totals.get("dionne")!.componentScores.agility_10_20_10_seconds >
      totals.get("lorelai")!.componentScores.agility_10_20_10_seconds,
  );
  assert.ok(
    totals.get("marisha")!.componentScores.plank_seconds > totals.get("anouk")!.componentScores.plank_seconds,
  );
}

{
  // Podiumvolgorde mag scores niet wijzigen
  const db = sept7Db();
  const totals = rankFitnessTotal(db, "sess-sept7");
  const runRows = SEPT7.filter((a) => a.run != null).map((a) => ({
    player_id: a.id,
    full_name: a.name,
    shirt_number: a.shirt,
    value: a.run!,
  }));
  const totalRank = new Map(totals.map((r) => [r.player_id, r.rank]));
  const laid = layoutFitnessPodium(runRows, "higher_better", totalRank);
  assert.equal(laid.podium[0]!.player_id, "marisha");
  assert.equal(laid.podium[1]!.player_id, "dionne");
  assert.equal(laid.podium[2]!.player_id, "renee");
  const again = byId(db);
  assert.equal(
    again.get("renee")!.componentScores.six_minute_run_meters,
    again.get("dionne")!.componentScores.six_minute_run_meters,
  );
}

{
  // Arrayvolgorde mag scores niet wijzigen
  const forward = byId(sept7Db(SEPT7));
  const reverse = byId(sept7Db([...SEPT7].reverse()));
  for (const a of SEPT7) {
    const aRow = forward.get(a.id);
    const bRow = reverse.get(a.id);
    if (!aRow && !bRow) continue;
    assert.deepEqual(aRow?.componentScores, bRow?.componentScores);
    assert.equal(aRow?.totalScore, bRow?.totalScore);
  }
}

{
  // Legenda-copy komt overeen met de formule (0–100, 25%, complete only)
  assert.match(FITNESS_SCORE_LEGEND_NORMALIZATION, /100 punten/);
  assert.match(FITNESS_SCORE_LEGEND_NORMALIZATION, /0 punten/);
  assert.match(FITNESS_SCORE_LEGEND_NORMALIZATION, /25%/);
  assert.ok(FITNESS_SCORE_LEGEND_BULLETS.some((b) => b.includes("25%")));
  assert.ok(FITNESS_SCORE_LEGEND_BULLETS.some((b) => b.includes("alle 4 onderdelen")));
}

{
  // Volledige 13-speelster audit: 12 complete, Renée 78,90
  const db = sept7Db();
  const totals = rankFitnessTotal(db, "sess-sept7");
  assert.equal(totals.length, 12);
  assert.equal(db.fitness_test_results.length, 13);

  const renee = totals.find((r) => r.player_id === "renee")!;
  assert.equal(renee.componentScores.six_minute_run_meters, (1000 - 750) / (1050 - 750) * 100);
  assert.equal(renee.componentScores.flying_sprint_30m_seconds, (3.98 - 3.43) / (3.98 - 3.21) * 100);
  assert.equal(renee.componentScores.agility_10_20_10_seconds, (13.28 - 11.3) / (13.28 - 10.61) * 100);
  assert.equal(renee.componentScores.plank_seconds, (132 - 15) / (150 - 15) * 100);
  assert.equal(renee.totalScore, 78.9);

  const table = [
    ...totals.map((r) => ({
      name: r.full_name,
      run: Number(r.componentScores.six_minute_run_meters.toFixed(2)),
      sprint: Number(r.componentScores.flying_sprint_30m_seconds.toFixed(2)),
      agility: Number(r.componentScores.agility_10_20_10_seconds.toFixed(2)),
      plank: Number(r.componentScores.plank_seconds.toFixed(2)),
      total: r.totalScore,
    })),
    { name: "Mariska Oosterhuis", run: null, sprint: null, agility: null, plank: null, total: null },
  ];
  console.log("SCORE_AUDIT_TABLE", JSON.stringify(table, null, 2));
}

console.log("session-ranking-score-audit.test.ts: ok");
