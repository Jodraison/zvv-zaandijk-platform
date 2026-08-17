/**
 * Fitness session ranking tests.
 * Run: npx tsx src/lib/fitness/session-ranking.test.ts
 */
import assert from "node:assert/strict";
import type { ClubDatabase } from "@/types";
import { rankFitnessComponent, rankFitnessTotal, isFullFitnessResult } from "@/lib/fitness/session-ranking";

function emptyDb(): ClubDatabase {
  return {
    seasons: [{ id: "s1", name: "T", starts_on: "2026-01-01", ends_on: "2026-12-31", is_active: true }],
    players: [
      { id: "a", full_name: "Anna", photo_url: null, is_guest: false, initials: null, bio: null, preferred_foot: null, strengths: null, role_label: null, tagline: null, card_note: null },
      { id: "b", full_name: "Bente", photo_url: null, is_guest: false, initials: null, bio: null, preferred_foot: null, strengths: null, role_label: null, tagline: null, card_note: null },
      { id: "c", full_name: "Carla", photo_url: null, is_guest: false, initials: null, bio: null, preferred_foot: null, strengths: null, role_label: null, tagline: null, card_note: null },
    ],
    player_season_memberships: [
      { id: "m1", player_id: "a", season_id: "s1", shirt_number: 1, position: "ATT", display_position: "", is_captain: false, is_vice_captain: false, is_guest: false },
      { id: "m2", player_id: "b", season_id: "s1", shirt_number: 2, position: "MID", display_position: "", is_captain: false, is_vice_captain: false, is_guest: false },
      { id: "m3", player_id: "c", season_id: "s1", shirt_number: 3, position: "DEF", display_position: "", is_captain: false, is_vice_captain: false, is_guest: false },
    ],
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
    fitness_test_sessions: [
      {
        id: "sess1",
        season_id: "s1",
        test_on: "2026-08-30",
        protocol_code: "four_part_v1",
        status: "published",
        note: null,
        score_config_id: null,
        created_at: "2026-08-30T12:00:00Z",
        updated_at: "2026-08-30T12:00:00Z",
        published_at: "2026-08-30T18:00:00Z",
        created_by: null,
        published_by: null,
      },
    ],
    fitness_test_results: [
      {
        id: "r1",
        session_id: "sess1",
        player_id: "a",
        flying_sprint_30m_seconds: 4.5,
        agility_10_20_10_seconds: 16,
        plank_seconds: 120,
        six_minute_run_meters: 1400,
        participation_status: "complete",
        participation_reason: null,
        note: null,
        created_at: "",
        updated_at: "",
      },
      {
        id: "r2",
        session_id: "sess1",
        player_id: "b",
        flying_sprint_30m_seconds: 5.0,
        agility_10_20_10_seconds: 17,
        plank_seconds: 90,
        six_minute_run_meters: 1200,
        participation_status: "complete",
        participation_reason: null,
        note: null,
        created_at: "",
        updated_at: "",
      },
      {
        id: "r3",
        session_id: "sess1",
        player_id: "c",
        flying_sprint_30m_seconds: 4.8,
        agility_10_20_10_seconds: null,
        plank_seconds: null,
        six_minute_run_meters: null,
        participation_status: "partial",
        participation_reason: null,
        note: null,
        created_at: "",
        updated_at: "",
      },
    ],
    fitness_score_configs: [],
    team_photo_url: null,
  };
}

const db = emptyDb();

{
  const sprint = rankFitnessComponent(db, "sess1", "flying_sprint_30m_seconds");
  assert.equal(sprint[0]!.player_id, "a");
  assert.equal(sprint[0]!.rank, 1);
  assert.equal(sprint.length, 3);
}

{
  const plank = rankFitnessComponent(db, "sess1", "plank_seconds");
  assert.equal(plank[0]!.player_id, "a");
  assert.equal(plank.length, 2);
}

{
  const total = rankFitnessTotal(db, "sess1");
  assert.equal(total.length, 2);
  assert.equal(total[0]!.player_id, "a");
  assert.ok(total[0]!.totalScore >= total[1]!.totalScore);
  assert.equal(isFullFitnessResult(db.fitness_test_results[2]!), false);
}

console.log("session-ranking.test.ts: ok");
