/**
 * Homepage eerstvolgende verjaardag — actieve selectie, Amsterdam, leap-day.
 * Run: npm run test:home-next-birthday
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ClubDatabase, Player, PlayerSeasonMembership } from "@/types";
import { SEASON_2026_27_ID } from "@/lib/season/season-operations-2026-27";
import {
  ageOnOccurrence,
  effectiveBirthdayMd,
  getNextBirthdayGroup,
  joinPlayerNamesNl,
  nextBirthdayOccurrence,
  type BirthdayPerson,
} from "@/lib/players/birthdays";
import {
  buildHomeNextBirthdayRow,
  buildHomeTeamSpotlight,
} from "@/lib/home/team-spotlight";

const root = process.cwd();
const OTHER_SEASON = "other-season-id";

function emptyDb(seasonId = SEASON_2026_27_ID): ClubDatabase {
  return {
    seasons: [{ id: seasonId, name: "2026/27 Competitie", starts_on: "2026-08-01", ends_on: "2027-06-30", is_active: true }],
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

function addPlayer(
  db: ClubDatabase,
  opts: {
    id: string;
    name: string;
    birth_date: string | null;
    guest?: boolean;
    seasonId?: string;
    membership?: boolean;
  },
): void {
  const player: Player = {
    id: opts.id,
    full_name: opts.name,
    photo_url: null,
    is_guest: opts.guest === true,
    birth_date: opts.birth_date,
  };
  db.players.push(player);
  if (opts.membership === false || opts.guest) return;
  const membership: PlayerSeasonMembership = {
    id: `m-${opts.id}`,
    player_id: opts.id,
    season_id: opts.seasonId ?? SEASON_2026_27_ID,
    shirt_number: db.player_season_memberships.length + 1,
    position: "MID",
    display_position: "Middenvelder",
    is_captain: false,
    is_vice_captain: false,
    is_guest: false,
  };
  db.player_season_memberships.push(membership);
}

const nowAug30 = new Date("2026-08-30T12:00:00+02:00");

// 1. Verjaardag later vandaag / dit jaar
{
  const people: BirthdayPerson[] = [
    { id: "a", full_name: "Speelster A", birth_date: "2002-09-04" },
    { id: "b", full_name: "Speelster B", birth_date: "2001-09-17" },
    { id: "c", full_name: "Speelster C", birth_date: "2000-01-02" },
  ];
  const group = getNextBirthdayGroup(people, nowAug30);
  assert.ok(group);
  assert.equal(group!.nextOccurrence, "2026-09-04");
  assert.equal(group!.daysUntil, 5);
  assert.equal(group!.occurrences[0]!.full_name, "Speelster A");
  assert.equal(ageOnOccurrence("2002-09-04", "2026-09-04"), 24);
}

// 2. Verjaardag morgen
{
  const occ = nextBirthdayOccurrence(
    { id: "m", full_name: "Morgen", birth_date: "2003-08-31" },
    nowAug30,
  );
  assert.ok(occ);
  assert.equal(occ!.daysUntil, 1);
  assert.equal(occ!.nextOccurrence, "2026-08-31");
}

// 3. Verjaardag later in het jaar
{
  const occ = nextBirthdayOccurrence(
    { id: "d", full_name: "December", birth_date: "2001-12-20" },
    nowAug30,
  );
  assert.ok(occ);
  assert.equal(occ!.nextOccurrence, "2026-12-20");
  assert.ok(occ!.daysUntil > 100);
}

// 4. Alle verjaardagen van dit jaar voorbij → volgend kalenderjaar
{
  const occ = nextBirthdayOccurrence(
    { id: "p", full_name: "Mei", birth_date: "2002-05-31" },
    nowAug30,
  );
  assert.ok(occ);
  assert.equal(occ!.nextOccurrence, "2027-05-31");
  assert.ok(occ!.daysUntil > 200);
}

// 5. December → januari
{
  const group = getNextBirthdayGroup(
    [
      { id: "dec", full_name: "Marisha", birth_date: "2001-12-20" },
      { id: "jan", full_name: "Isa", birth_date: "2003-01-28" },
    ],
    new Date("2026-12-25T12:00:00+01:00"),
  );
  assert.ok(group);
  assert.equal(group!.occurrences[0]!.full_name, "Isa");
  assert.equal(group!.nextOccurrence, "2027-01-28");
}

// 6. Vandaag jarig
{
  const db = emptyDb();
  addPlayer(db, { id: "today", name: "Jarige Speelster", birth_date: "2002-08-30" });
  const row = buildHomeNextBirthdayRow(db, SEASON_2026_27_ID, nowAug30);
  assert.ok(row);
  assert.equal(row!.detail, "Jarige Speelster");
  assert.equal(row!.subdetail, "Vandaag · 24 jaar");
}

// 7. Twee speelsters dezelfde eerstvolgende verjaardag
{
  const db = emptyDb();
  addPlayer(db, { id: "e", name: "Emma de Mie", birth_date: "2002-09-04" });
  addPlayer(db, { id: "r", name: "Renée Koopman", birth_date: "2000-09-04" });
  const row = buildHomeNextBirthdayRow(db, SEASON_2026_27_ID, nowAug30);
  assert.ok(row);
  assert.match(row!.detail, /Emma de Mie/);
  assert.match(row!.detail, /Renée Koopman/);
  assert.match(row!.detail, /&/);
  assert.doesNotMatch(row!.subdetail ?? "", /wordt/);
  assert.match(row!.subdetail ?? "", /Vrijdag 4 september/i);
}

// 8. Speler zonder birthdate wordt genegeerd
{
  const db = emptyDb();
  addPlayer(db, { id: "naomi", name: "Naomi Lattig", birth_date: null });
  addPlayer(db, { id: "a", name: "Speelster A", birth_date: "2002-09-04" });
  const row = buildHomeNextBirthdayRow(db, SEASON_2026_27_ID, nowAug30);
  assert.ok(row);
  assert.equal(row!.detail, "Speelster A");
  assert.doesNotMatch(row!.detail, /Naomi|Onbekend|N\/A|Geen geboortedatum/i);
}

// 9. Inactive / gast / ander seizoen wordt genegeerd
{
  const db = emptyDb();
  addPlayer(db, { id: "gone", name: "Vertrokken", birth_date: "2002-08-31", membership: false });
  addPlayer(db, { id: "guest", name: "Gast Speelster", birth_date: "2002-08-31", guest: true });
  addPlayer(db, {
    id: "old",
    name: "Vorig Seizoen",
    birth_date: "2002-08-31",
    seasonId: OTHER_SEASON,
  });
  addPlayer(db, { id: "active", name: "Actieve Speelster", birth_date: "2002-09-17" });
  const row = buildHomeNextBirthdayRow(db, SEASON_2026_27_ID, nowAug30);
  assert.ok(row);
  assert.equal(row!.detail, "Actieve Speelster");
  assert.doesNotMatch(row!.detail, /Vertrokken|Gast|Vorig/);
}

// 10. Leeftijd wordt correct berekend
{
  assert.equal(ageOnOccurrence("2002-09-04", "2026-09-04"), 24);
  assert.equal(ageOnOccurrence("2007-09-19", "2026-09-19"), 19);
  assert.equal(ageOnOccurrence("not-a-date", "2026-09-04"), null);
  const db = emptyDb();
  addPlayer(db, { id: "a", name: "Speelster A", birth_date: "2002-09-04" });
  const row = buildHomeNextBirthdayRow(db, SEASON_2026_27_ID, nowAug30);
  assert.match(row!.subdetail ?? "", /wordt 24/);
}

// 11. Europe/Amsterdam datumgrens
{
  const born31: BirthdayPerson = { id: "b31", full_name: "Grens", birth_date: "2002-08-31" };
  const lateAmsterdam = nextBirthdayOccurrence(born31, new Date("2026-08-30T23:30:00+02:00"));
  const afterMidnightAmsterdam = nextBirthdayOccurrence(born31, new Date("2026-08-30T22:30:00.000Z"));
  assert.equal(lateAmsterdam?.daysUntil, 1);
  assert.equal(lateAmsterdam?.nextOccurrence, "2026-08-31");
  assert.equal(afterMidnightAmsterdam?.daysUntil, 0);
  assert.equal(afterMidnightAmsterdam?.nextOccurrence, "2026-08-31");

  const born30: BirthdayPerson = { id: "b30", full_name: "Dertig", birth_date: "2002-08-30" };
  const stillToday = nextBirthdayOccurrence(born30, new Date("2026-08-30T23:30:00+02:00"));
  const nextYear = nextBirthdayOccurrence(born30, new Date("2026-08-30T22:30:00.000Z"));
  assert.equal(stillToday?.daysUntil, 0);
  assert.equal(nextYear?.nextOccurrence, "2027-08-30");
}

// 12. Leap-year / 29 februari — niet-schrikkeljaar viert administratief op 28 feb
{
  assert.deepEqual(effectiveBirthdayMd(2, 29, 2026), { month: 2, day: 28 });
  assert.deepEqual(effectiveBirthdayMd(2, 29, 2024), { month: 2, day: 29 });
  const leap: BirthdayPerson = { id: "leap", full_name: "Leap", birth_date: "2000-02-29" };
  const before = nextBirthdayOccurrence(leap, new Date("2026-02-27T12:00:00+01:00"));
  const onObs = nextBirthdayOccurrence(leap, new Date("2026-02-28T12:00:00+01:00"));
  const after = nextBirthdayOccurrence(leap, new Date("2026-03-01T12:00:00+01:00"));
  const leapDay = nextBirthdayOccurrence(leap, new Date("2024-02-29T12:00:00+01:00"));
  assert.equal(before?.nextOccurrence, "2026-02-28");
  assert.equal(before?.daysUntil, 1);
  assert.equal(onObs?.daysUntil, 0);
  assert.equal(after?.nextOccurrence, "2027-02-28");
  assert.equal(leapDay?.daysUntil, 0);
  assert.equal(leapDay?.nextOccurrence, "2024-02-29");
}

// 13. Geen geldige birthdays → homepage blijft werken
{
  const db = emptyDb();
  addPlayer(db, { id: "naomi", name: "Naomi Lattig", birth_date: null });
  const row = buildHomeNextBirthdayRow(db, SEASON_2026_27_ID, nowAug30);
  assert.equal(row, null);
  const model = buildHomeTeamSpotlight(db, SEASON_2026_27_ID, nowAug30);
  assert.equal(model.birthday, null);
  assert.ok(model.training || model.fitness || model.mode === "ops" || model.mode === "club");
  assert.doesNotMatch(JSON.stringify(model), /Onbekend|N\/A|Geen geboortedatum/i);
}

{
  assert.equal(joinPlayerNamesNl(["Emma de Mie", "Renée Koopman"]), "Emma de Mie & Renée Koopman");
  assert.equal(joinPlayerNamesNl(["A", "B", "C"]), "A, B & C");
}

// UI-contract: derde rij onder fitheidstest, geen gimmicks
{
  const teamUi = readFileSync(join(root, "src/components/home/home-team-spotlight.tsx"), "utf8");
  const spotlight = readFileSync(join(root, "src/lib/home/team-spotlight.ts"), "utf8");
  const home = readFileSync(join(root, "src/app/(site)/page.tsx"), "utf8");
  assert.match(teamUi, /model\.training, model\.fitness, model\.birthday/);
  assert.match(teamUi, /home-next-birthday/);
  assert.doesNotMatch(teamUi, /confetti|emoji|🎉/i);
  assert.match(spotlight, /Eerstvolgende verjaardag/);
  assert.match(spotlight, /mapSquadToBirthdayPeople/);
  assert.match(spotlight, /getNextBirthdayGroup/);
  assert.match(home, /buildHomeTeamSpotlight\(db, seasonId, birthdayOn\)/);
}

{
  const db = emptyDb();
  addPlayer(db, { id: "a", name: "Speelster A", birth_date: "2002-09-04" });
  const model = buildHomeTeamSpotlight(db, SEASON_2026_27_ID, nowAug30);
  assert.ok(model.training);
  assert.ok(model.fitness);
  assert.ok(model.birthday);
  assert.equal(model.birthday!.title, "Eerstvolgende verjaardag");
  assert.equal(model.birthday!.detail, "Speelster A");
  assert.match(model.birthday!.subdetail ?? "", /Vrijdag 4 september/i);
  assert.match(model.birthday!.subdetail ?? "", /wordt 24/);
}

console.log("home-next-birthday.test.ts: ok");
