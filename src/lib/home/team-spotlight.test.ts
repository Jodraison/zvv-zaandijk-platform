/**
 * Homepage hero spotlight + countdown-deduplicatie.
 * Run: npm run test:hero-spotlight
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SEASON_2026_27_ID } from "@/lib/season/season-operations-2026-27";
import { FITNESS_PROTOCOL_CODE } from "@/lib/fitness/protocol";
import {
  buildHomeTeamSpotlight,
  nextPublicTrainingMoment,
  seasonShortLabel,
} from "@/lib/home/team-spotlight";
import { getBirthdayPlayersForDate } from "@/lib/players/birthdays";
import type { BirthdayPerson } from "@/lib/players/birthdays";
import type { ClubDatabase } from "@/types";

const root = process.cwd();

function emptyDb(seasonId: string, seasonName = "2026/27 Competitie"): ClubDatabase {
  return {
    seasons: [{ id: seasonId, name: seasonName, starts_on: "2026-08-01", ends_on: "2027-06-30", is_active: true }],
    players: [],
    player_season_memberships: [],
    matches: [],
    match_matchday_roster: [],
    match_lineup_entries: [],
    match_player_stats: [],
    match_goal_events: [],
    match_position_changes: [],
    match_card_events: [],
    match_substitutions: [],
    training_sessions: [],
    training_attendance: [],
    fitness_tests: [],
    fitness_test_sessions: [],
    fitness_test_results: [],
    fitness_score_configs: [],
    team_photo_url: null,
  };
}

assert.equal(seasonShortLabel("2026/27 Competitie"), "2026/27");
assert.equal(seasonShortLabel("2026/2027"), "2026/2027");

const nowTue = new Date("2026-08-18T10:00:00+02:00");

// 1 + 7. Normale dag / training-data — kalender ma/wo 20:00
{
  const db = emptyDb(SEASON_2026_27_ID);
  const model = buildHomeTeamSpotlight(db, SEASON_2026_27_ID, nowTue);
  assert.equal(model.mode, "ops");
  assert.equal(model.eyebrow, "Van de week");
  assert.equal(model.title, "ZAANDIJK VRZ1");
  assert.ok(model.training);
  assert.match(model.training.detail, /Woensdag 19 augustus/i);
  assert.match(model.training.detail, /20:00/);
  assert.ok(model.fitness);
  assert.match(model.fitness.detail, /Woensdag 2 september/i);
  assert.match(model.clubLine, /Voorbereiding 2026\/27/);
  assert.doesNotMatch(JSON.stringify(model), /WSV|tegenstander|countdown|thuis|uit|beker/i);
}

// Echte sessie wint van kale kalender
{
  const db = emptyDb(SEASON_2026_27_ID);
  db.training_sessions = [
    {
      id: "t-real",
      season_id: SEASON_2026_27_ID,
      title: "Reguliere training",
      session_at: "2026-08-19T18:00:00.000Z",
      location: null,
      status: "scheduled",
    },
  ];
  const moment = nextPublicTrainingMoment(db, SEASON_2026_27_ID, nowTue);
  assert.equal(moment?.iso, "2026-08-19T18:00:00.000Z");
}

// Past incomplete attendance mag publiek niet de volgende training kapen
{
  const db = emptyDb(SEASON_2026_27_ID);
  db.training_sessions = [
    {
      id: "t-past",
      season_id: SEASON_2026_27_ID,
      title: "Training",
      session_at: "2026-08-17T18:00:00.000Z",
      location: null,
      status: "completed",
    },
  ];
  const moment = nextPublicTrainingMoment(db, SEASON_2026_27_ID, nowTue);
  assert.ok(moment);
  assert.notEqual(moment?.iso, "2026-08-17T18:00:00.000Z");
  assert.match(moment!.dateYmd, /2026-08-19/);
}

// 8. Fitheid — draft sessie
{
  const db = emptyDb(SEASON_2026_27_ID);
  db.fitness_test_sessions = [
    {
      id: "fit-1",
      season_id: SEASON_2026_27_ID,
      test_on: "2026-09-02",
      protocol_code: FITNESS_PROTOCOL_CODE,
      status: "draft",
      note: null,
      score_config_id: null,
      created_at: "2026-08-01T00:00:00.000Z",
      updated_at: "2026-08-01T00:00:00.000Z",
      published_at: null,
      created_by: null,
      published_by: null,
    },
  ];
  const model = buildHomeTeamSpotlight(db, SEASON_2026_27_ID, nowTue);
  assert.equal(model.fitness?.detail.includes("2 september"), true);
}

// 9. Fallback zonder training — wél fitness
{
  const db = emptyDb("s1", "2026/27");
  db.fitness_test_sessions = [
    {
      id: "fit-s1",
      season_id: "s1",
      test_on: "2026-09-02",
      protocol_code: FITNESS_PROTOCOL_CODE,
      status: "draft",
      note: null,
      score_config_id: null,
      created_at: "2026-08-01T00:00:00.000Z",
      updated_at: "2026-08-01T00:00:00.000Z",
      published_at: null,
      created_by: null,
      published_by: null,
    },
  ];
  const model = buildHomeTeamSpotlight(db, "s1", nowTue);
  assert.equal(model.training, null);
  assert.ok(model.fitness);
  assert.doesNotMatch(JSON.stringify(model), /Niet gepland/);
}

// 10. Fallback zonder fitness én zonder training → clubspotlight
{
  const db = emptyDb("s1", "2026/27");
  const model = buildHomeTeamSpotlight(db, "s1", nowTue);
  assert.equal(model.mode, "club");
  assert.equal(model.training, null);
  assert.equal(model.fitness, null);
  assert.match(model.clubLine, /Samen strijden/);
  assert.doesNotMatch(model.clubLine, /undefined|Niet gepland/);
}

// 3–5. Verjaardagsprioriteit (data + source)
{
  const people: BirthdayPerson[] = [
    { id: "j", full_name: "Jelisa De Jonge", birth_date: "2006-08-01" },
    { id: "n", full_name: "Nienke Hoffman", birth_date: "2002-06-23" },
    { id: "m", full_name: "Maura Hoffman", birth_date: "2002-06-23" },
  ];
  const none = getBirthdayPlayersForDate(people, "2026-08-17");
  const jelisa = getBirthdayPlayersForDate(people, "2026-08-01");
  const duo = getBirthdayPlayersForDate(people, "2026-06-23");
  assert.equal(none.length, 0);
  assert.equal(jelisa.length, 1);
  assert.match(jelisa[0]!.full_name, /Jelisa/);
  assert.equal(duo.length, 2);
  assert.ok(duo.some((p) => /Nienke/i.test(p.full_name)));
  assert.ok(duo.some((p) => /Maura/i.test(p.full_name)));
}

{
  const hero = readFileSync(join(root, "src/components/home/club-home-hero.tsx"), "utf8");
  const home = readFileSync(join(root, "src/app/(site)/page.tsx"), "utf8");
  const nextMatch = readFileSync(join(root, "src/components/home/match-countdown.tsx"), "utf8");
  const live = readFileSync(join(root, "src/components/match/match-live-countdown.tsx"), "utf8");
  const teamUi = readFileSync(join(root, "src/components/home/home-team-spotlight.tsx"), "utf8");
  const birthday = readFileSync(join(root, "src/components/home/home-birthday-spotlight.tsx"), "utf8");

  // 2. Geen compacte wedstrijdcountdown in de hero
  assert.doesNotMatch(hero, /MatchLiveCountdown/);
  assert.doesNotMatch(hero, /HomeMatchTeaser/);
  assert.doesNotMatch(hero, /variant="compact"/);
  assert.doesNotMatch(hero, /MATCHDAY/);
  assert.match(hero, /HomeTeamSpotlight/);
  assert.match(hero, /HomeBirthdaySpotlight/);
  assert.match(hero, /hasBirthday \?/);
  assert.match(hero, /data-hero-spotlight/);
  assert.match(hero, /xl:hidden/);

  // 5. Birthday heeft prioriteit
  assert.match(hero, /hasBirthday \? \(\s*<HomeBirthdaySpotlight/);

  // 6. Grote countdown blijft
  assert.match(nextMatch, /MatchLiveCountdown/);
  assert.match(nextMatch, /variant="hero"/);
  assert.match(home, /MatchCountdown/);
  assert.match(live, /setInterval/);
  assert.doesNotMatch(live, /variant="compact"/);

  // 11. Mobiel: spotlight in de hero-kolom
  assert.match(hero, /mt-10 xl:hidden/);

  // 12. Geen agressieve live-region in countdown
  assert.doesNotMatch(live, /aria-live/);

  assert.match(teamUi, /data-testid="home-team-spotlight"/);
  assert.doesNotMatch(teamUi, /WSV|countdown|thuis|uit/);
  assert.match(birthday, /Vandaag jarig/);
  assert.match(home, /buildHomeTeamSpotlight/);
}

console.log("team-spotlight.test.ts: ok");
