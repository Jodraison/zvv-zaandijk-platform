/**
 * Homepage celebration — triggercontract, preview, visual config, UI-bron.
 * Run: npm run test:homepage-celebration
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Match } from "@/types";
import {
  buildCelebrationAdminPreviewHref,
  buildCelebrationHomepagePreviewHref,
  celebrationSessionKey,
  findTodayOfficialVictory,
  getHomepageCelebration,
  hasBirthdayCelebrationToday,
  isPublicCelebrationPreviewAllowed,
  isTodayOfficialVictory,
  resolveCelebrationHoldPreview,
  resolveCelebrationPreviewType,
} from "@/lib/home/homepage-celebration";
import {
  CELEBRATION_DURATION_MS,
  celebrationColors,
  celebrationOverlayClassName,
  celebrationParticleBudget,
  celebrationParticleScale,
  celebrationViewportTier,
} from "@/lib/home/celebration-visual";
import { getBirthdayPlayersForDate, type BirthdayPerson } from "@/lib/players/birthdays";

const root = process.cwd();
console.log("→ test:homepage-celebration");

const SEASON = "season-vrz1";
const OTHER = "season-other";

function match(partial: Partial<Match> & Pick<Match, "id" | "kickoff_at" | "status">): Match {
  return {
    season_id: SEASON,
    opponent: "Sporting Andijk VR1",
    is_home: true,
    match_type: "competition",
    location: null,
    referee: null,
    notes: null,
    goals_for: 2,
    goals_against: 0,
    wotm_player_id: null,
    integrity_state: "verified",
    data_scope: "production",
    ...partial,
  };
}

const people: BirthdayPerson[] = [
  { id: "j", full_name: "Jelisa De Jonge", birth_date: "2006-08-01" },
  { id: "n", full_name: "Nienke Hoffman", birth_date: "2002-06-23" },
];

const noonAug1 = new Date("2026-08-01T12:00:00+02:00");
const noonAug2 = new Date("2026-08-02T12:00:00+02:00");

// --- Birthday ---
{
  const today = getBirthdayPlayersForDate(people, noonAug1);
  assert.equal(today.length, 1);
  assert.equal(hasBirthdayCelebrationToday(today.length), true);
  assert.equal(getHomepageCelebration({ birthdayCount: today.length, matches: [], seasonId: SEASON, now: noonAug1 }).type, "birthday");
}

{
  const none = getBirthdayPlayersForDate(people, noonAug2);
  assert.equal(none.length, 0);
  assert.equal(hasBirthdayCelebrationToday(0), false);
  assert.equal(getHomepageCelebration({ birthdayCount: 0, matches: [], seasonId: SEASON, now: noonAug2 }).type, null);
}

// --- Victory: thuis gewonnen ---
{
  const homeWin = match({
    id: "home-win",
    kickoff_at: "2026-08-01T14:00:00+02:00",
    status: "played",
    is_home: true,
    goals_for: 3,
    goals_against: 1,
  });
  assert.equal(isTodayOfficialVictory(homeWin, SEASON, noonAug1), true);
  assert.equal(getHomepageCelebration({ birthdayCount: 0, matches: [homeWin], seasonId: SEASON, now: noonAug1 }).type, "victory");
}

// --- Victory: uit gewonnen ---
{
  const awayWin = match({
    id: "away-win",
    kickoff_at: "2026-08-01T16:00:00+02:00",
    status: "played",
    is_home: false,
    goals_for: 2,
    goals_against: 1,
  });
  assert.equal(isTodayOfficialVictory(awayWin, SEASON, noonAug1), true);
  assert.equal(getHomepageCelebration({ birthdayCount: 0, matches: [awayWin], seasonId: SEASON, now: noonAug1 }).type, "victory");
}

// --- Gelijk ---
{
  const draw = match({
    id: "draw",
    kickoff_at: "2026-08-01T14:00:00+02:00",
    status: "played",
    goals_for: 1,
    goals_against: 1,
  });
  assert.equal(isTodayOfficialVictory(draw, SEASON, noonAug1), false);
  assert.equal(getHomepageCelebration({ birthdayCount: 0, matches: [draw], seasonId: SEASON, now: noonAug1 }).type, null);
}

// --- Verloren ---
{
  const lossHome = match({
    id: "loss-home",
    kickoff_at: "2026-08-01T14:00:00+02:00",
    status: "played",
    is_home: true,
    goals_for: 0,
    goals_against: 2,
  });
  const lossAway = match({
    id: "loss-away",
    kickoff_at: "2026-08-01T14:00:00+02:00",
    status: "played",
    is_home: false,
    goals_for: 1,
    goals_against: 3,
  });
  assert.equal(isTodayOfficialVictory(lossHome, SEASON, noonAug1), false);
  assert.equal(isTodayOfficialVictory(lossAway, SEASON, noonAug1), false);
}

// --- scheduled / cancelled / postponed ---
{
  for (const status of ["scheduled", "cancelled", "postponed"] as const) {
    const m = match({
      id: status,
      kickoff_at: "2026-08-01T14:00:00+02:00",
      status,
      goals_for: 4,
      goals_against: 0,
    });
    assert.equal(isTodayOfficialVictory(m, SEASON, noonAug1), false, status);
  }
}

// --- gisteren / morgen ---
{
  const yesterday = match({
    id: "y",
    kickoff_at: "2026-07-31T14:00:00+02:00",
    status: "played",
    goals_for: 2,
    goals_against: 0,
  });
  const tomorrow = match({
    id: "t",
    kickoff_at: "2026-08-02T14:00:00+02:00",
    status: "played",
    goals_for: 2,
    goals_against: 0,
  });
  assert.equal(isTodayOfficialVictory(yesterday, SEASON, noonAug1), false);
  assert.equal(isTodayOfficialVictory(tomorrow, SEASON, noonAug1), false);
}

// --- Europe/Amsterdam grens ---
{
  const lateKickoff = match({
    id: "late",
    kickoff_at: "2026-08-01T23:30:00+02:00",
    status: "played",
    goals_for: 1,
    goals_against: 0,
  });
  assert.equal(isTodayOfficialVictory(lateKickoff, SEASON, new Date("2026-08-01T23:50:00+02:00")), true);
  assert.equal(isTodayOfficialVictory(lateKickoff, SEASON, new Date("2026-08-02T00:10:00+02:00")), false);

  const utcNextClubDay = match({
    id: "utc-next",
    kickoff_at: "2026-08-01T22:30:00.000Z", // 00:30 Europe/Amsterdam 2 aug
    status: "played",
    goals_for: 2,
    goals_against: 0,
  });
  assert.equal(isTodayOfficialVictory(utcNextClubDay, SEASON, new Date("2026-08-01T23:00:00+02:00")), false);
  assert.equal(isTodayOfficialVictory(utcNextClubDay, SEASON, new Date("2026-08-02T00:40:00+02:00")), true);
}

// --- QA / demo telt niet ---
{
  const qa = match({
    id: "qa",
    kickoff_at: "2026-08-01T14:00:00+02:00",
    status: "played",
    opponent: "OWF Accept 1785433933391",
    notes: "__qa_fixture__",
    data_scope: "qa",
    goals_for: 5,
    goals_against: 0,
  });
  const demo = match({
    id: "demo",
    kickoff_at: "2026-08-01T14:00:00+02:00",
    status: "played",
    data_scope: "demo",
    goals_for: 3,
    goals_against: 0,
  });
  const patternQa = match({
    id: "pattern",
    kickoff_at: "2026-08-01T14:00:00+02:00",
    status: "played",
    opponent: "Test FC Debug",
    data_scope: undefined,
    goals_for: 2,
    goals_against: 0,
  });
  assert.equal(isTodayOfficialVictory(qa, SEASON, noonAug1), false);
  assert.equal(isTodayOfficialVictory(demo, SEASON, noonAug1), false);
  assert.equal(isTodayOfficialVictory(patternQa, SEASON, noonAug1), false);
}

// --- ander seizoen / invalid integrity ---
{
  const otherSeason = match({
    id: "os",
    season_id: OTHER,
    kickoff_at: "2026-08-01T14:00:00+02:00",
    status: "played",
    goals_for: 2,
    goals_against: 0,
  });
  const invalid = match({
    id: "inv",
    kickoff_at: "2026-08-01T14:00:00+02:00",
    status: "played",
    integrity_state: "invalid",
    goals_for: 2,
    goals_against: 0,
  });
  assert.equal(isTodayOfficialVictory(otherSeason, SEASON, noonAug1), false);
  assert.equal(isTodayOfficialVictory(invalid, SEASON, noonAug1), false);
}

// --- één overwinning is genoeg; geen dubbele type ---
{
  const win = match({
    id: "w1",
    kickoff_at: "2026-08-01T12:00:00+02:00",
    status: "played",
    goals_for: 2,
    goals_against: 0,
  });
  const win2 = match({
    id: "w2",
    kickoff_at: "2026-08-01T18:00:00+02:00",
    status: "played",
    is_home: false,
    goals_for: 1,
    goals_against: 0,
  });
  const found = findTodayOfficialVictory([win, win2], SEASON, noonAug1);
  assert.ok(found);
  assert.equal(getHomepageCelebration({ birthdayCount: 0, matches: [win, win2], seasonId: SEASON, now: noonAug1 }).type, "victory");
}

// --- Combined ---
{
  const win = match({
    id: "combo",
    kickoff_at: "2026-08-01T14:00:00+02:00",
    status: "played",
    goals_for: 2,
    goals_against: 1,
  });
  const decision = getHomepageCelebration({
    birthdayCount: getBirthdayPlayersForDate(people, noonAug1).length,
    matches: [win],
    seasonId: SEASON,
    now: noonAug1,
  });
  assert.equal(decision.type, "birthday_victory");
  assert.equal(decision.birthday, true);
  assert.equal(decision.victory, true);
}

// --- Preview: productie negeert ---
{
  assert.equal(isPublicCelebrationPreviewAllowed("production"), false);
  assert.equal(isPublicCelebrationPreviewAllowed("development"), true);
  assert.equal(isPublicCelebrationPreviewAllowed("test"), true);
  assert.equal(resolveCelebrationPreviewType("birthday", { allowPreview: false }), null);
  assert.equal(resolveCelebrationPreviewType("victory", { allowPreview: true }), "victory");
  assert.equal(resolveCelebrationPreviewType("combined", { allowPreview: true }), "birthday_victory");
  assert.equal(resolveCelebrationHoldPreview("1", { allowPreview: false }), false);
  assert.equal(resolveCelebrationHoldPreview("1", { allowPreview: true }), true);
  assert.equal(
    getHomepageCelebration({
      birthdayCount: 0,
      matches: [],
      seasonId: SEASON,
      now: noonAug2,
      previewType: "victory",
    }).type,
    "victory",
  );
}

{
  const href = buildCelebrationHomepagePreviewHref({
    seasonId: SEASON,
    kind: "combined",
    hold: true,
    vandaag: "2026-08-01",
  });
  assert.match(href, /celebration=combined/);
  assert.match(href, /celebrationHold=1/);
  assert.match(href, /vandaag=2026-08-01/);
  const admin = buildCelebrationAdminPreviewHref({ seasonId: SEASON, kind: "birthday", datum: "2026-08-01" });
  assert.match(admin, /\/beheer\/voorbeeld\/celebration/);
  assert.match(admin, /kind=birthday/);
}

assert.equal(celebrationSessionKey("birthday", "2026-08-31"), "zvv-celebration-2026-08-31-birthday");
assert.equal(celebrationSessionKey("birthday_victory", "2026-08-31"), "zvv-celebration-2026-08-31-birthday_victory");

// --- Visual / performance config ---
assert.ok(CELEBRATION_DURATION_MS.birthday >= 4000 && CELEBRATION_DURATION_MS.birthday <= 6000);
assert.ok(CELEBRATION_DURATION_MS.victory >= 5000 && CELEBRATION_DURATION_MS.victory <= 8000);
assert.ok(CELEBRATION_DURATION_MS.birthday_victory <= 8000);
assert.ok(CELEBRATION_DURATION_MS.victory > CELEBRATION_DURATION_MS.birthday);

assert.equal(celebrationViewportTier(375), "mobile-375");
assert.equal(celebrationViewportTier(390), "mobile-390");
assert.equal(celebrationViewportTier(430), "mobile-430");
assert.equal(celebrationViewportTier(1440), "desktop");

assert.ok(celebrationParticleScale(375) < celebrationParticleScale(390));
assert.ok(celebrationParticleScale(390) < celebrationParticleScale(430));
assert.ok(celebrationParticleScale(430) < celebrationParticleScale(1440));

const mobile = celebrationParticleBudget("victory", 390);
const desktop = celebrationParticleBudget("victory", 1440);
assert.ok(mobile.confetti < desktop.confetti);
assert.ok(mobile.confetti < 80);
assert.match(celebrationOverlayClassName(), /pointer-events-none/);
assert.match(celebrationOverlayClassName(), /fixed/);
assert.match(celebrationOverlayClassName(), /inset-0/);
assert.ok(celebrationColors("victory").includes("#1d4ed8"));
assert.ok(celebrationColors("birthday").includes("#fbbf24"));

// --- UI source contracts ---
{
  const overlay = readFileSync(join(root, "src/components/home/homepage-celebration.tsx"), "utf8");
  const page = readFileSync(join(root, "src/app/(site)/page.tsx"), "utf8");
  const engine = readFileSync(join(root, "src/lib/home/celebration-engine.ts"), "utf8");
  const hero = readFileSync(join(root, "src/components/home/club-home-hero.tsx"), "utf8");
  const spotlight = readFileSync(join(root, "src/components/home/home-birthday-spotlight.tsx"), "utf8");

  assert.match(overlay, /pointer-events-none/);
  assert.match(overlay, /prefers-reduced-motion/);
  assert.match(overlay, /sessionStorage/);
  assert.match(overlay, /homepage-celebration/);
  assert.match(overlay, /aria-hidden/);
  assert.match(overlay, /cancelAnimationFrame|handle\?\.stop/);
  assert.doesNotMatch(overlay, /autoplay|Audio|new Audio/);

  assert.match(page, /getHomepageCelebration/);
  assert.match(page, /HomepageCelebration/);
  assert.match(page, /celebration/);
  assert.match(page, /isPublicCelebrationPreviewAllowed/);
  assert.doesNotMatch(page, /home_score|away_score/);

  assert.match(engine, /cancelAnimationFrame/);
  assert.match(engine, /clearTimeout/);
  assert.match(engine, /canvas\.width = 0/);
  assert.match(engine, /elapsed >= duration/);
  assert.match(engine, /stopped = true/);

  assert.match(hero, /HomeBirthdaySpotlight/);
  assert.match(hero, /HomeTeamSpotlight/);
  assert.match(spotlight, /birthday-hero-spotlight/);
  assert.doesNotMatch(hero, /HomepageCelebration/);
}

{
  const admin = readFileSync(join(root, "src/app/(site)/beheer/voorbeeld/celebration/page.tsx"), "utf8");
  assert.match(admin, /requireAdmin|niet openbaar|Voorbeeldweergave/);
  assert.match(admin, /HomepageCelebration/);
  assert.match(admin, /ClubHomeHero/);
}

console.log("homepage-celebration.test.ts: ok");
