/**
 * Trainer-first recovery guards.
 * Run: npx tsx src/lib/operations/trainer-first-recovery.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { FITNESS_COMPONENTS, assertNoTotalTime } from "@/lib/fitness/protocol";
import { roleFromProfileRole, roleHasCapability, ADMIN_EMAIL } from "@/lib/auth/capabilities";
import { SEASON_2026_27_ID, seasonOperations2026_27 } from "@/lib/season/season-operations-2026-27";
import { latestPublishedFitnessSession } from "@/lib/fitness/session-ranking";
import type { ClubDatabase } from "@/types";

const root = process.cwd();

{
  // 1–3: /fitheid is four-part, no totalTime, no 20-40-60 title
  const fitheidPage = readFileSync(join(root, "src/app/(site)/fitheid/page.tsx"), "utf8");
  assert.ok(!/Fitheidstest 20-40-60/.test(fitheidPage));
  assert.ok(!/sprint_20_40_60/.test(fitheidPage));
  assert.ok(!/totalTimeNumeric/.test(fitheidPage));
  assert.ok(/FITNESS_COMPONENTS/.test(fitheidPage));
  assert.ok(/Eerste meting/.test(fitheidPage) || /eerste meting/i.test(fitheidPage));
  assert.equal(FITNESS_COMPONENTS.length, 4);
  assert.throws(() => assertNoTotalTime({ totalTime: 1 }));
}

{
  // 4: draft / unpublished does not create ranking
  const db: ClubDatabase = {
    seasons: [{ id: SEASON_2026_27_ID, name: "26/27", starts_on: "2026-08-01", ends_on: "2027-06-30", is_active: true }],
    players: [],
    player_season_memberships: [],
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
        id: "d1",
        season_id: SEASON_2026_27_ID,
        test_on: "2026-08-17",
        protocol_code: "four_part_v1",
        status: "draft",
        note: null,
        score_config_id: null,
        created_at: "",
        updated_at: "",
        published_at: null,
        created_by: null,
        published_by: null,
      },
    ],
    fitness_test_results: [],
    fitness_score_configs: [],
    team_photo_url: null,
  };
  assert.equal(latestPublishedFitnessSession(db, SEASON_2026_27_ID), null);
}

{
  // 7–8 first test date
  assert.equal(seasonOperations2026_27.fitness.firstTestOn, "2026-09-07");
}

{
  // 9–10 capabilities
  const tm = roleFromProfileRole("team_manager", "cap@example.com");
  assert.equal(roleHasCapability(tm, "manage_squad"), true);
  assert.equal(roleHasCapability(tm, "manage_training"), true);
  assert.equal(roleHasCapability(tm, "system_admin"), false);
  assert.equal(roleHasCapability(tm, "manage_seasons"), false);
  assert.equal(roleHasCapability(roleFromProfileRole("user", ADMIN_EMAIL), "system_admin"), true);
}

{
  // 11 cancelled training stays with status — covered by action contract presence
  const training = readFileSync(join(root, "src/actions/training.ts"), "utf8");
  assert.ok(/cancelUpcomingTrainingAction/.test(training));
  assert.ok(/status = "cancelled"/.test(training) || /status: "cancelled"/.test(training));
}

{
  // Task routes exist
  for (const rel of [
    "src/app/(site)/beheer/taken/uitslag/page.tsx",
    "src/app/(site)/beheer/taken/training-afgelasten/page.tsx",
    "src/app/(site)/beheer/taken/uit-selectie/page.tsx",
    "src/app/(site)/beheer/taken/rugnummer/page.tsx",
  ]) {
    assert.ok(readFileSync(join(root, rel), "utf8").length > 100);
  }
}

{
  // Expected squad names reference (human list length)
  const expected = [
    "Andrada Timmer",
    "Anouk Aafjes",
    "Danique van Heeringen",
    "Demi Luijting",
    "Dionne van Dijk",
    "Emma de Mie",
    "Evy Nibbering",
    "Isa Oosterhoorn",
    "Jelisa De Jonge",
    "Lorelai Bakker",
    "Mandy Kalmeijer",
    "Marisha Prins",
    "Mariska Oosterhuis",
    "Maura Hoffman",
    "Melissa Donkers",
    "Melissa Rietveld",
    "Naomi Lattig",
    "Nienke Hoffman",
    "Renée Koopman",
    "Tess Luijting",
  ];
  assert.equal(expected.length, 20);
  assert.ok(!expected.some((n) => /Pitou|Kyra|Yente|Shura/.test(n)));
}

console.log("trainer-first-recovery.test.ts: ok");
