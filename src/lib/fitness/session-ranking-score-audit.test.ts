/**
 * Dense-rank positiepunten — 7 september 2026 + regressie A–D.
 * Run: npx tsx src/lib/fitness/session-ranking-score-audit.test.ts
 */
import assert from "node:assert/strict";
import type { ClubDatabase } from "@/types";
import { FITNESS_COMPONENTS } from "@/lib/fitness/protocol";
import {
  FITNESS_SCORE_LEGEND_TIE,
  fitnessScoreLegendMax,
  fitnessScoreLegendScale,
} from "@/lib/fitness/fitness-score-copy";
import {
  denseRankAndPoints,
  denseRankByValue,
  fitnessSessionFieldSize,
  positionPoints,
} from "@/lib/fitness/fitness-position-points";
import {
  isFullFitnessResult,
  rankFitnessComponent,
  rankFitnessTotal,
  sessionFieldSize,
} from "@/lib/fitness/session-ranking";

type Athlete = {
  id: string;
  name: string;
  shirt: number;
  run: number | null;
  sprint: number | null;
  agility: number | null;
  plank: number | null;
};

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

{
  // CASE A — higher better, dense ranks + N=13 punten
  const values = [1050, 1000, 1000, 1000, 1000, 900];
  const ranks = denseRankByValue(values, "higher_better");
  assert.deepEqual(
    values.map((v) => ranks.get(v)),
    [1, 2, 2, 2, 2, 3],
  );
  assert.deepEqual(
    values.map((v) => denseRankAndPoints(v, ranks, 13).points),
    [13, 12, 12, 12, 12, 11],
  );
}

{
  // CASE B — lower better, gelijke 10.0
  const values = [10.0, 10.0, 11.0, 12.0];
  const ranks = denseRankByValue(values, "lower_better");
  assert.deepEqual(
    values.map((v) => ranks.get(v)),
    [1, 1, 2, 3],
  );
}

{
  // CASE C — higher better, gelijke 125
  const values = [150, 132, 125, 125, 100];
  const ranks = denseRankByValue(values, "higher_better");
  assert.deepEqual(
    values.map((v) => ranks.get(v)),
    [1, 2, 3, 3, 4],
  );
}

{
  // CASE D — NULL geen rank/punten
  const db = sept7Db();
  const sprint = rankFitnessComponent(db, "sess-sept7", "flying_sprint_30m_seconds");
  assert.equal(sprint.find((r) => r.player_id === "mariska"), undefined);
  const raw = db.fitness_test_results.find((r) => r.player_id === "mariska")!;
  assert.equal(raw.flying_sprint_30m_seconds, null);
  assert.equal(isFullFitnessResult(raw), false);
  assert.equal(rankFitnessTotal(db, "sess-sept7").find((r) => r.player_id === "mariska"), undefined);
}

{
  assert.equal(positionPoints(1, 13), 13);
  assert.equal(positionPoints(2, 13), 12);
  assert.equal(positionPoints(6, 13), 8);
  assert.equal(sessionFieldSize(sept7Db(), "sess-sept7"), 13);
}

{
  const run = rankFitnessComponent(sept7Db(), "sess-sept7", "six_minute_run_meters");
  const byName = new Map(run.map((r) => [r.full_name, r]));
  const expected: Array<[string, number, number, number]> = [
    ["Marisha Prins", 1050, 1, 13],
    ["Dionne van Dijk", 1000, 2, 12],
    ["Renée Koopman", 1000, 2, 12],
    ["Danique van Heeringen", 1000, 2, 12],
    ["Nienke Hoffman", 1000, 2, 12],
    ["Andrada Timmer", 900, 3, 11],
    ["Melissa Rietveld", 850, 4, 10],
    ["Lorelai Bakker", 850, 4, 10],
    ["Jelisa De Jonge", 800, 5, 9],
    ["Mariska Oosterhuis", 800, 5, 9],
    ["Emie Agema", 800, 5, 9],
    ["Anouk Aafjes", 800, 5, 9],
    ["Tess Luijting", 750, 6, 8],
  ];
  for (const [name, value, rank, points] of expected) {
    const row = byName.get(name)!;
    assert.equal(row.value, value);
    assert.equal(row.rank, rank, `${name} rank`);
    assert.equal(row.points, points, `${name} points`);
  }
  assert.deepEqual(
    run.slice(0, 6).map((r) => r.full_name),
    [
      "Marisha Prins",
      "Dionne van Dijk",
      "Renée Koopman",
      "Danique van Heeringen",
      "Nienke Hoffman",
      "Andrada Timmer",
    ],
  );
}

{
  // Sprint-tie 3.56: zelfde rank en punten; sorteervolgorde wijzigt score niet
  const db = sept7Db();
  const sprint = rankFitnessComponent(db, "sess-sept7", "flying_sprint_30m_seconds");
  const nienke = sprint.find((r) => r.player_id === "nienke")!;
  const anouk = sprint.find((r) => r.player_id === "anouk")!;
  assert.equal(nienke.value, anouk.value);
  assert.equal(nienke.rank, anouk.rank);
  assert.equal(nienke.points, anouk.points);
  const reversed = rankFitnessComponent(sept7Db([...SEPT7].reverse()), "sess-sept7", "flying_sprint_30m_seconds");
  assert.equal(reversed.find((r) => r.player_id === "nienke")!.points, nienke.points);
  assert.equal(runPointsStable(sprint), runPointsStable(reversed));
}

function runPointsStable(rows: Array<{ player_id: string; points: number; rank: number }>) {
  return [...rows]
    .map((r) => `${r.player_id}:${r.rank}:${r.points}`)
    .sort()
    .join("|");
}

{
  const db = sept7Db();
  const renee = rankFitnessTotal(db, "sess-sept7").find((r) => r.player_id === "renee")!;
  assert.equal(renee.componentScores.six_minute_run_meters, 12);
  assert.equal(renee.componentRanks.six_minute_run_meters, 2);
  assert.equal(renee.componentScores.flying_sprint_30m_seconds, 10);
  assert.equal(renee.componentScores.agility_10_20_10_seconds, 10);
  assert.equal(renee.componentScores.plank_seconds, 12);
  assert.equal(renee.totalScore, 44);
  assert.equal(
    renee.totalScore,
    FITNESS_COMPONENTS.reduce((sum, c) => sum + renee.componentScores[c.key], 0),
  );
}

{
  const totals = rankFitnessTotal(sept7Db(), "sess-sept7");
  assert.equal(totals.length, 12);
  assert.ok(totals.every((r) => Number.isInteger(r.totalScore)));
  assert.equal(totals[0]!.player_id, "dionne");
  assert.equal(totals[0]!.totalScore, 47);
  assert.equal(totals.find((r) => r.player_id === "danique")!.componentScores.six_minute_run_meters, 12);
  assert.equal(totals.find((r) => r.player_id === "nienke")!.componentScores.six_minute_run_meters, 12);
  assert.equal(totals.find((r) => r.player_id === "andrada")!.componentScores.six_minute_run_meters, 11);
}

{
  assert.equal(FITNESS_SCORE_LEGEND_TIE, "Gelijke prestatie = gelijke plaats en gelijke punten.");
  assert.equal(
    fitnessScoreLegendScale(13),
    "1e 13 pt · 2e 12 pt · 3e 11 pt · 4e 10 pt · … · 13e 1 pt",
  );
  assert.equal(fitnessScoreLegendMax(13), "4 onderdelen · max. 52 pt");
}

{
  const table = rankFitnessTotal(sept7Db(), "sess-sept7").map((r) => ({
    name: r.full_name,
    runRank: r.componentRanks.six_minute_run_meters,
    run: r.componentScores.six_minute_run_meters,
    sprintRank: r.componentRanks.flying_sprint_30m_seconds,
    sprint: r.componentScores.flying_sprint_30m_seconds,
    agilityRank: r.componentRanks.agility_10_20_10_seconds,
    agility: r.componentScores.agility_10_20_10_seconds,
    plankRank: r.componentRanks.plank_seconds,
    plank: r.componentScores.plank_seconds,
    total: r.totalScore,
  }));
  console.log("SCORE_AUDIT_TABLE", JSON.stringify(table, null, 2));
}

{
  assert.equal(fitnessSessionFieldSize(sept7Db().fitness_test_results), 13);
}

console.log("session-ranking-score-audit.test.ts: ok");
