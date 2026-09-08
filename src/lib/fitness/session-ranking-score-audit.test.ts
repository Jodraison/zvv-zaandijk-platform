/**
 * Positiepunten — 7 september 2026 + regressie.
 * Run: npx tsx src/lib/fitness/session-ranking-score-audit.test.ts
 */
import assert from "node:assert/strict";
import type { ClubDatabase } from "@/types";
import { FITNESS_COMPONENTS } from "@/lib/fitness/protocol";
import {
  fitnessScoreLegendMax,
  fitnessScoreLegendScale,
} from "@/lib/fitness/fitness-score-copy";
import {
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

function byId(rows: Array<{ player_id: string }>) {
  return new Map(rows.map((r) => [r.player_id, r]));
}

{
  // 13 deelnemers → 13 … 1
  assert.equal(positionPoints(1, 13), 13);
  assert.equal(positionPoints(2, 13), 12);
  assert.equal(positionPoints(3, 13), 11);
  assert.equal(positionPoints(13, 13), 1);
  assert.equal(sessionFieldSize(sept7Db(), "sess-sept7"), 13);
}

{
  // Lege extra rij telt niet mee in N
  const extra: Athlete = {
    id: "ghost",
    name: "Ghost",
    shirt: 99,
    run: null,
    sprint: null,
    agility: null,
    plank: null,
  };
  assert.equal(sessionFieldSize(sept7Db([...SEPT7, extra]), "sess-sept7"), 13);
}

{
  const db = sept7Db();
  const run = rankFitnessComponent(db, "sess-sept7", "six_minute_run_meters");
  assert.deepEqual(
    run.map((r) => r.full_name),
    [
      "Marisha Prins",
      "Dionne van Dijk",
      "Renée Koopman",
      "Danique van Heeringen",
      "Nienke Hoffman",
      "Andrada Timmer",
      "Melissa Rietveld",
      "Lorelai Bakker",
      "Jelisa De Jonge",
      "Mariska Oosterhuis",
      "Emie Agema",
      "Anouk Aafjes",
      "Tess Luijting",
    ],
  );
  assert.deepEqual(
    run.map((r) => r.points),
    [13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
  );
  assert.ok(run.every((r) => Number.isInteger(r.points)));
}

{
  // Ontbrekend resultaat: geen ranking, 0 punten
  const db = sept7Db();
  const sprint = rankFitnessComponent(db, "sess-sept7", "flying_sprint_30m_seconds");
  const agility = rankFitnessComponent(db, "sess-sept7", "agility_10_20_10_seconds");
  assert.equal(sprint.find((r) => r.player_id === "mariska"), undefined);
  assert.equal(agility.find((r) => r.player_id === "mariska"), undefined);
  const raw = db.fitness_test_results.find((r) => r.player_id === "mariska")!;
  assert.equal(raw.flying_sprint_30m_seconds, null);
  assert.equal(raw.agility_10_20_10_seconds, null);
  assert.equal(isFullFitnessResult(raw), false);
  const totals = rankFitnessTotal(db, "sess-sept7");
  assert.equal(totals.find((r) => r.player_id === "mariska"), undefined);
}

{
  // Richting + optelling + geen decimalen
  const db = sept7Db();
  const renee = rankFitnessTotal(db, "sess-sept7").find((r) => r.player_id === "renee")!;
  assert.equal(renee.componentScores.six_minute_run_meters, 11);
  assert.equal(renee.componentScores.flying_sprint_30m_seconds, 10);
  assert.equal(renee.componentScores.agility_10_20_10_seconds, 10);
  assert.equal(renee.componentScores.plank_seconds, 12);
  assert.equal(renee.totalScore, 43);
  assert.ok(Number.isInteger(renee.totalScore));
  assert.equal(
    renee.totalScore,
    FITNESS_COMPONENTS.reduce((sum, c) => sum + renee.componentScores[c.key], 0),
  );

  const sprint = rankFitnessComponent(db, "sess-sept7", "flying_sprint_30m_seconds");
  assert.equal(sprint[0]!.player_id, "dionne");
  assert.ok(sprint[0]!.value < sprint[sprint.length - 1]!.value);

  const agility = rankFitnessComponent(db, "sess-sept7", "agility_10_20_10_seconds");
  assert.equal(agility[0]!.player_id, "dionne");
  assert.ok(agility[0]!.value < agility[agility.length - 1]!.value);

  const run = rankFitnessComponent(db, "sess-sept7", "six_minute_run_meters");
  assert.equal(run[0]!.player_id, "marisha");
  assert.ok(run[0]!.value > run[run.length - 1]!.value);

  const plank = rankFitnessComponent(db, "sess-sept7", "plank_seconds");
  assert.equal(plank[0]!.player_id, "marisha");
  assert.ok(plank[0]!.value > plank[plank.length - 1]!.value);
}

{
  // Deterministische volgorde + niemand verdwijnt bij gelijke 1000 m
  const db = sept7Db();
  const run = rankFitnessComponent(db, "sess-sept7", "six_minute_run_meters");
  assert.equal(run.length, 13);
  assert.equal(new Set(run.map((r) => r.player_id)).size, 13);
  const again = rankFitnessComponent(sept7Db([...SEPT7].reverse()), "sess-sept7", "six_minute_run_meters");
  assert.deepEqual(
    run.map((r) => r.player_id),
    again.map((r) => r.player_id),
  );
}

{
  // Totaal: 12 complete, gehele scores, hoogste eerst
  const totals = rankFitnessTotal(sept7Db(), "sess-sept7");
  assert.equal(totals.length, 12);
  assert.ok(totals.every((r) => Number.isInteger(r.totalScore)));
  for (let i = 1; i < totals.length; i++) {
    assert.ok(totals[i - 1]!.totalScore >= totals[i]!.totalScore);
  }
  assert.equal(totals[0]!.player_id, "dionne");
  assert.equal(totals[0]!.totalScore, 47);
  assert.equal(totals[1]!.player_id, "marisha");
  assert.equal(totals[1]!.totalScore, 46);
}

{
  assert.equal(
    fitnessScoreLegendScale(13),
    "1e 13 pt · 2e 12 pt · 3e 11 pt · 4e 10 pt · … · 13e 1 pt",
  );
  assert.equal(fitnessScoreLegendMax(13), "4 onderdelen · max. 52 pt");
}

{
  const table = rankFitnessTotal(sept7Db(), "sess-sept7").map((r) => ({
    name: r.full_name,
    run: r.componentScores.six_minute_run_meters,
    sprint: r.componentScores.flying_sprint_30m_seconds,
    agility: r.componentScores.agility_10_20_10_seconds,
    plank: r.componentScores.plank_seconds,
    total: r.totalScore,
  }));
  console.log("SCORE_AUDIT_TABLE", JSON.stringify(table, null, 2));
}

{
  const n = fitnessSessionFieldSize(sept7Db().fitness_test_results);
  assert.equal(n, 13);
}

console.log("session-ranking-score-audit.test.ts: ok");
