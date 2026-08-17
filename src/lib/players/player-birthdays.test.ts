/**
 * Verjaardagen — data, privacy, Amsterdam-logica, UI-contracts.
 * Run: npm run test:player-birthdays
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  KNOWN_BIRTHDATES_2026_27,
  MISSING_BIRTHDATE_NAMES,
  birthDateToPreviewDatum,
  birthdayCongratsNl,
  birthdayHeadlineNl,
  buildBirthdayAdminPreviewHref,
  buildBirthdayHomepagePreviewHref,
  effectiveBirthdayMd,
  firstNameFromFullName,
  formatBirthDateFullNL,
  formatBirthdayDateNL,
  getBirthdayPlayersForDate,
  getUpcomingBirthdays,
  isLeapYear,
  isPublicBirthdayPreviewAllowed,
  parseOptionalBirthDateInput,
  relativeBirthdayAdminBadgeNl,
  relativeBirthdayLabelNl,
  resolveBirthdayPreviewDate,
  type BirthdayPerson,
} from "@/lib/players/birthdays";

const root = process.cwd();
console.log("→ test:player-birthdays");

const sample: BirthdayPerson[] = [
  { id: "j", full_name: "Jelisa De Jonge", birth_date: "2006-08-01" },
  { id: "a", full_name: "Andrada Timmer", birth_date: "2005-08-16" },
  { id: "n", full_name: "Nienke Hoffman", birth_date: "2002-06-23" },
  { id: "m", full_name: "Maura Hoffman", birth_date: "2002-06-23" },
  { id: "naomi", full_name: "Naomi Lattig", birth_date: null },
  { id: "mariska", full_name: "Mariska Oosterhuis", birth_date: null },
  { id: "leap", full_name: "Leap Tester", birth_date: "2000-02-29" },
];

// --- Data contract ---
assert.equal(KNOWN_BIRTHDATES_2026_27.length, 18);
assert.equal(MISSING_BIRTHDATE_NAMES.length, 2);
assert.ok(MISSING_BIRTHDATE_NAMES.includes("Naomi Lattig"));
assert.ok(MISSING_BIRTHDATE_NAMES.includes("Mariska Oosterhuis"));
assert.equal(new Set(KNOWN_BIRTHDATES_2026_27.map((x) => x.full_name)).size, 18);

const jelisaKnown = KNOWN_BIRTHDATES_2026_27.find((x) => /jelisa/i.test(x.full_name));
assert.equal(jelisaKnown?.birth_date, "2006-08-01");

// Geboortedatum hoort bij persoon — migratie + types
const migration = readFileSync(join(root, "supabase/migrations/027_players_birth_date.sql"), "utf8");
assert.match(migration, /alter table public\.players/i);
assert.match(migration, /birth_date date null/i);
assert.doesNotMatch(migration, /player_season_memberships/);

const types = readFileSync(join(root, "src/types/index.ts"), "utf8");
assert.match(types, /birth_date\??:\s*string\s*\|\s*null/);

const actions = readFileSync(join(root, "src/actions/players.ts"), "utf8");
assert.match(actions, /parseOptionalBirthDateInput/);
assert.match(actions, /birth_date/);

// --- Validatie ---
const emptyBirth = parseOptionalBirthDateInput("");
assert.equal(emptyBirth.ok, true);
if (emptyBirth.ok) assert.equal(emptyBirth.value, null);
assert.equal(parseOptionalBirthDateInput("2002-04-05").ok, true);
assert.equal(parseOptionalBirthDateInput("2099-01-01").ok, false);
assert.equal(parseOptionalBirthDateInput("1949-01-01").ok, false);
assert.equal(parseOptionalBirthDateInput("not-a-date").ok, false);
assert.equal(parseOptionalBirthDateInput("2002-02-30").ok, false);
const bad = parseOptionalBirthDateInput("2099-01-01");
assert.equal(bad.ok, false);
if (!bad.ok) assert.equal(bad.error, "Vul een geldige geboortedatum in.");

// --- Vandaag jarig ---
const aug1 = getBirthdayPlayersForDate(sample, "2026-08-01");
assert.equal(aug1.length, 1);
assert.equal(aug1[0]!.full_name, "Jelisa De Jonge");

const jul31 = getBirthdayPlayersForDate(sample, "2026-07-31");
assert.equal(jul31.length, 0);

const aug16 = getBirthdayPlayersForDate(sample, new Date("2026-08-16T10:00:00+02:00"));
assert.equal(aug16.length, 1);
assert.equal(aug16[0]!.full_name, "Andrada Timmer");

const jun23 = getBirthdayPlayersForDate(sample, "2026-06-23");
assert.equal(jun23.length, 2);
assert.deepEqual(
  jun23.map((p) => p.full_name).sort(),
  ["Maura Hoffman", "Nienke Hoffman"],
);

// Amsterdam + year boundary (25 dec → Isa 28 jan binnen 60 dagen; Marisha 20 dec al voorbij → volgend jaar)
const upcomingNy = getUpcomingBirthdays(
  [
    { id: "1", full_name: "Marisha Prins", birth_date: "2001-12-20" },
    { id: "2", full_name: "Isa Oosterhoorn", birth_date: "2003-01-28" },
  ],
  new Date("2026-12-25T12:00:00+01:00"),
  60,
  5,
);
const isa = upcomingNy.find((r) => r.full_name === "Isa Oosterhoorn");
assert.ok(isa);
assert.ok(isa!.daysUntil > 0 && isa!.daysUntil <= 40);
assert.ok(isa!.nextOccurrence.startsWith("2027-01-28"));
const marishaNext = upcomingNy.find((r) => r.full_name === "Marisha Prins");
assert.equal(marishaNext, undefined); // > 60 dagen tot 20 dec 2027
assert.ok(upcomingNy.every((r) => r.daysUntil >= 0));

// Jaarwisseling: op 31 dec is een 2-januari-verjaardag "Over 2 dagen"
const nye = getUpcomingBirthdays(
  [{ id: "x", full_name: "Test Speelster", birth_date: "2001-01-02" }],
  new Date("2026-12-31T12:00:00+01:00"),
  60,
  5,
);
assert.equal(nye[0]?.daysUntil, 2);
assert.equal(nye[0]?.nextOccurrence, "2027-01-02");

const upcomingJul31 = getUpcomingBirthdays(sample, new Date("2026-07-31T12:00:00+02:00"), 60, 5);
const jelisaSoon = upcomingJul31.find((r) => r.full_name === "Jelisa De Jonge");
assert.ok(jelisaSoon);
assert.equal(jelisaSoon!.daysUntil, 1);
assert.equal(relativeBirthdayLabelNl(1), "Morgen jarig 🎉");
assert.equal(relativeBirthdayLabelNl(0), "Vandaag jarig 🎉");
assert.equal(relativeBirthdayAdminBadgeNl(5), "Over 5 dagen jarig");
assert.equal(jelisaSoon!.nextOccurrence, "2026-08-01");

// Leap year contract
assert.equal(isLeapYear(2024), true);
assert.equal(isLeapYear(2025), false);
assert.deepEqual(effectiveBirthdayMd(2, 29, 2024), { month: 2, day: 29 });
assert.deepEqual(effectiveBirthdayMd(2, 29, 2025), { month: 2, day: 28 });
const leapDay = getBirthdayPlayersForDate(sample, "2024-02-29");
assert.equal(leapDay.length, 1);
const leapNon = getBirthdayPlayersForDate(sample, "2025-02-28");
assert.ok(leapNon.some((p) => p.id === "leap"));
assert.equal(getBirthdayPlayersForDate(sample, "2025-02-29").length, 0);

// Formatters — geen jaar publiek
assert.equal(formatBirthdayDateNL("2006-08-01"), "1 augustus");
assert.doesNotMatch(formatBirthdayDateNL("2006-08-01"), /2006/);
assert.equal(formatBirthDateFullNL("2002-04-05"), "5 april 2002");

// Copy NL
assert.match(birthdayHeadlineNl(["Jelisa"]), /zonnetje/);
assert.match(birthdayCongratsNl(["Jelisa"]), /Van harte gefeliciteerd/);
assert.match(birthdayHeadlineNl(["Nienke", "Maura"]), /Nienke en Maura/);
assert.equal(birthdayCongratsNl(["Nienke", "Maura"]), "Van harte gefeliciteerd!");
assert.equal(firstNameFromFullName("Jelisa De Jonge"), "Jelisa");

// Preview: development/test OK; production genegeerd
assert.equal(resolveBirthdayPreviewDate("2026-08-01", { allowPreview: false }), null);
assert.ok(resolveBirthdayPreviewDate("2026-08-01", { allowPreview: true }));
assert.equal(resolveBirthdayPreviewDate("nope", { allowPreview: true }), null);
assert.equal(isPublicBirthdayPreviewAllowed("production"), false);
assert.equal(isPublicBirthdayPreviewAllowed("development"), true);
assert.equal(isPublicBirthdayPreviewAllowed("test"), true);

const SEASON = "c0ffee00-0002-4000-8000-000000000001";
const adminPreview = buildBirthdayAdminPreviewHref({ seasonId: SEASON, datum: "2026-08-01" });
assert.match(adminPreview, /\/beheer\/voorbeeld\/verjaardag/);
assert.match(adminPreview, /datum=2026-08-01/);
assert.match(adminPreview, /season=c0ffee00-0002-4000-8000-000000000001/);
const homePreview = buildBirthdayHomepagePreviewHref({ seasonId: SEASON, datum: "2026-08-01" });
assert.match(homePreview, /vandaag=2026-08-01/);
assert.match(homePreview, /season=/);
assert.equal(birthDateToPreviewDatum("2002-04-05"), "2026-04-05");
assert.equal(birthDateToPreviewDatum("2006-08-01"), "2026-08-01");

// 31 juli → geen jarige; 1 aug → Jelisa; 23 jun → twee
assert.equal(getBirthdayPlayersForDate(sample, "2026-07-31").length, 0);
assert.equal(getBirthdayPlayersForDate(sample, "2026-08-01")[0]?.full_name, "Jelisa De Jonge");

// --- Source UI contracts ---
const home = readFileSync(join(root, "src/app/(site)/page.tsx"), "utf8");
assert.match(home, /getBirthdayPlayersForDate/);
assert.match(home, /birthdayPlayers/);
assert.match(home, /vandaag/);
assert.match(home, /isPublicBirthdayPreviewAllowed/);

const hero = readFileSync(join(root, "src/components/home/club-home-hero.tsx"), "utf8");
assert.match(hero, /HomeBirthdaySpotlight/);
assert.match(hero, /HomeTeamSpotlight/);
assert.match(hero, /hasBirthday/);
assert.doesNotMatch(hero, /MatchLiveCountdown/);

const spotlight = readFileSync(join(root, "src/components/home/home-birthday-spotlight.tsx"), "utf8");
assert.match(spotlight, /Vandaag jarig/);
assert.match(spotlight, /Bekijk profiel/);
assert.match(spotlight, /birthday-hero-spotlight/);
assert.match(spotlight, /min\(46vw,\s*620px\)/);
assert.match(spotlight, /min-h-\[400px\]|xl:min-h-\[400px\]/);
assert.match(spotlight, /12\.5rem|h-\[12\.5rem\]/); // hero portrait ~200px
assert.match(spotlight, /9\.5rem|h-\[9\.5rem\]/); // duo portrait >= 110px
assert.match(spotlight, /whitespace-normal/);
assert.doesNotMatch(spotlight, /truncate/);
assert.match(spotlight, /prefers-reduced-motion|motion-safe|birthdayStageIn/);
assert.match(spotlight, /aria-hidden/);
assert.match(spotlight, /Portret van/);
assert.doesNotMatch(spotlight, /jaar geworden|Geboren op|leeftijd/i);
assert.doesNotMatch(spotlight, />\s*Birthday\s*</);
assert.doesNotMatch(spotlight, /Date of birth|\bDOB\b/);

const squadMap = readFileSync(join(root, "src/lib/players/birthday-squad.ts"), "utf8");
assert.match(squadMap, /birthdayPublicPositionLabel/);
assert.match(squadMap, /display_position/);
assert.match(squadMap, /Keeper/);

const heroSrc = readFileSync(join(root, "src/components/home/club-home-hero.tsx"), "utf8");
assert.match(heroSrc, /minmax\(520px/);
assert.match(heroSrc, /data-hero-birthday/);

const beheer = readFileSync(join(root, "src/app/(site)/beheer/page.tsx"), "utf8");
assert.match(beheer, /UpcomingBirthdaysCard|Komende verjaardagen/);

const upcomingCard = readFileSync(join(root, "src/components/admin/upcoming-birthdays-card.tsx"), "utf8");
assert.match(upcomingCard, /Komende verjaardagen/);
assert.match(upcomingCard, /Geboortedatums aanvullen/);
assert.match(upcomingCard, /filter=birthdate/);
assert.match(upcomingCard, /Bekijk verjaardagsspotlight/);
assert.match(upcomingCard, /buildBirthdayAdminPreviewHref/);
assert.match(upcomingCard, /target="_blank"/);
assert.match(upcomingCard, /data-preview-datum/);
assert.match(upcomingCard, /data-preview-season/);
assert.doesNotMatch(upcomingCard, />\s*Upcoming birthdays\s*</);
assert.doesNotMatch(upcomingCard, />\s*Birthday\s*</);

const adminPreviewPage = readFileSync(
  join(root, "src/app/(site)/beheer/voorbeeld/verjaardag/page.tsx"),
  "utf8",
);
assert.match(adminPreviewPage, /ClubHomeHero/);
assert.match(adminPreviewPage, /Voorbeeldweergave — niet openbaar/);
assert.match(adminPreviewPage, /getBirthdayPlayersForDate/);

const spelers = readFileSync(join(root, "src/app/(site)/beheer/spelers/page.tsx"), "utf8");
assert.match(spelers, /birthdate/);
assert.match(spelers, /Geboortedatum ontbreekt/);
assert.match(spelers, /relativeBirthdayAdminBadgeNl/);

const edit = readFileSync(join(root, "src/components/admin/player-edit-card.tsx"), "utf8");
assert.match(edit, /name=\"birth_date\"/);
assert.match(edit, /type=\"date\"/);
assert.match(edit, /niet openbaar zichtbaar/);
assert.match(edit, /Bekijk verjaardag op homepage/);
assert.match(edit, /buildBirthdayAdminPreviewHref/);
assert.match(edit, /birthDate \?/);
// Geen previewknop zonder geboortedatum — knop staat achter birthDate-check
assert.match(edit, /Geboortedatum ontbreekt/);

const create = readFileSync(join(root, "src/components/admin/player-create-form.tsx"), "utf8");
assert.match(create, /name=\"birth_date\"/);

const completeness = readFileSync(join(root, "src/lib/players/profile-completeness.ts"), "utf8");
assert.match(completeness, /birth_date/);
assert.match(completeness, /Geboortedatum ontbreekt/);

assert.ok(existsSync(join(root, "scripts/reconcile-player-birthdays-2026-27.ts")));

console.log("OK test:player-birthdays");
