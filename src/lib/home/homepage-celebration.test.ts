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
  CELEBRATION_NAV_COOLDOWN_MS,
  celebrationSessionKey,
  findTodayOfficialVictory,
  getHomepageCelebration,
  hasBirthdayCelebrationToday,
  isPublicCelebrationPreviewAllowed,
  isTodayOfficialVictory,
  markHomepageCelebrationStarted,
  resetHomepageCelebrationGuardForTests,
  resolveCelebrationHoldPreview,
  resolveCelebrationPreviewType,
  shouldReplayHomepageCelebration,
} from "@/lib/home/homepage-celebration";
import {
  CELEBRATION_DURATION_MS,
  CELEBRATION_START_DELAY_MS,
  celebrationChoreography,
  celebrationColors,
  celebrationOverlayClassName,
  celebrationParticleBudget,
  celebrationParticleScale,
  celebrationViewportTier,
} from "@/lib/home/celebration-visual";
import {
  buildCelebrationDomLayout,
  celebrationDomBudget,
  celebrationDomNodeCount,
} from "@/lib/home/celebration-dom";
import {
  HARD_FALLBACK_COLORS,
  HARD_FALLBACK_ROOT_STYLE,
  HARD_FALLBACK_Z_INDEX,
  hardFallbackDurationMs,
  hardFallbackPeakConfetti,
  hardFallbackWaves,
} from "@/lib/home/celebration-hard-fallback";
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

{
  resetHomepageCelebrationGuardForTests();
  const key = celebrationSessionKey("birthday", "2026-08-31");
  assert.equal(shouldReplayHomepageCelebration(key, 1_000), true);
  markHomepageCelebrationStarted(key, 1_000);
  assert.equal(shouldReplayHomepageCelebration(key, 1_000 + 10_000), false);
  assert.equal(shouldReplayHomepageCelebration(key, 1_000 + CELEBRATION_NAV_COOLDOWN_MS - 1), false);
  assert.equal(shouldReplayHomepageCelebration(key, 1_000 + CELEBRATION_NAV_COOLDOWN_MS), true);
  assert.equal(shouldReplayHomepageCelebration(celebrationSessionKey("victory", "2026-08-31"), 1_000), true);
  resetHomepageCelebrationGuardForTests();
  assert.equal(shouldReplayHomepageCelebration(key, 1_000), true);
  assert.ok(CELEBRATION_NAV_COOLDOWN_MS >= 30_000 && CELEBRATION_NAV_COOLDOWN_MS <= 60_000);
}

// --- Visual / performance config ---
assert.ok(CELEBRATION_DURATION_MS.birthday >= 12500 && CELEBRATION_DURATION_MS.birthday <= 14000);
assert.ok(CELEBRATION_DURATION_MS.victory >= 14500 && CELEBRATION_DURATION_MS.victory <= 16000);
assert.ok(CELEBRATION_DURATION_MS.birthday_victory >= 15500 && CELEBRATION_DURATION_MS.birthday_victory <= 17000);
assert.ok(CELEBRATION_DURATION_MS.victory > CELEBRATION_DURATION_MS.birthday);
assert.ok(CELEBRATION_DURATION_MS.birthday_victory > CELEBRATION_DURATION_MS.victory);
assert.ok(CELEBRATION_START_DELAY_MS >= 650 && CELEBRATION_START_DELAY_MS <= 750);
assert.equal(celebrationChoreography("birthday").startDelayMs, CELEBRATION_START_DELAY_MS);
assert.ok(celebrationChoreography("birthday").fadeStartMs >= 9000);

assert.equal(celebrationViewportTier(375), "mobile-375");
assert.equal(celebrationViewportTier(390), "mobile-390");
assert.equal(celebrationViewportTier(430), "mobile-430");
assert.equal(celebrationViewportTier(1440), "desktop");

assert.ok(celebrationParticleScale(375) < celebrationParticleScale(390));
assert.ok(celebrationParticleScale(390) < celebrationParticleScale(430));
assert.ok(celebrationParticleScale(430) < celebrationParticleScale(1440));

const mobile = celebrationParticleBudget("victory", 390);
const desktop = celebrationParticleBudget("victory", 1440);
const birthdayDesktop = celebrationParticleBudget("birthday", 1440);
const birthdayMobile = celebrationParticleBudget("birthday", 390);
assert.ok(mobile.confetti < desktop.confetti);
assert.ok(mobile.confetti >= 90);
assert.ok(desktop.confetti >= 220);
assert.ok(birthdayMobile.confetti >= 140);
assert.ok(birthdayDesktop.confetti >= 280);
assert.ok(birthdayMobile.confetti <= 280);
assert.ok(!celebrationColors("birthday").includes("#1d4ed8"));
assert.ok(!celebrationColors("birthday").includes("#0b1f5f"));
assert.ok(!celebrationColors("victory").includes("#1e3a8a"));
assert.match(celebrationOverlayClassName(), /pointer-events-none/);
assert.match(celebrationOverlayClassName(), /fixed/);
assert.match(celebrationOverlayClassName(), /inset-0/);
assert.match(celebrationOverlayClassName(), /zvv-celebration-root/);
assert.ok(celebrationColors("victory").includes("#ffffff"));
assert.ok(celebrationColors("victory").includes("#d4af37"));
assert.ok(celebrationColors("birthday").includes("#fbbf24"));
assert.ok(celebrationColors("birthday").includes("#ffffff"));

{
  const desk = celebrationDomBudget("birthday", 1440);
  const mob = celebrationDomBudget("birthday", 390);
  assert.ok(desk.confetti >= 50 && desk.confetti <= 80);
  assert.ok(desk.streamers >= 8 && desk.streamers <= 12);
  assert.ok(desk.bursts >= 3);
  assert.ok(mob.confetti >= 30 && mob.confetti <= 50);
  assert.ok(celebrationDomNodeCount(desk, 1440) <= 110);
  assert.ok(celebrationDomNodeCount(mob, 390) <= 70);
  const a = buildCelebrationDomLayout({ kind: "birthday", width: 1440, seed: "birthday:2026-08-31" });
  const b = buildCelebrationDomLayout({ kind: "birthday", width: 1440, seed: "birthday:2026-08-31" });
  assert.deepEqual(a, b);
  const c = buildCelebrationDomLayout({ kind: "victory", width: 1440, seed: "victory:2026-08-31" });
  assert.notEqual(a.length, 0);
  assert.ok(c.filter((p) => p.kind === "confetti").length > a.filter((p) => p.kind === "confetti").length);
  assert.ok(a.some((p) => p.kind === "burst"));
  assert.ok(a.some((p) => p.kind === "streamer"));
  assert.ok(a.filter((p) => p.kind === "confetti").every((p) => p.width >= 8 && p.height >= 12));
}

{
  assert.ok(HARD_FALLBACK_Z_INDEX >= 2_147_483_000);
  assert.equal(HARD_FALLBACK_ROOT_STYLE.position, "fixed");
  assert.equal(HARD_FALLBACK_ROOT_STYLE.pointerEvents, "none");
  assert.equal(HARD_FALLBACK_ROOT_STYLE.opacity, 1);
  assert.ok(HARD_FALLBACK_COLORS.includes("#FFFFFF"));
  assert.ok(HARD_FALLBACK_COLORS.includes("#FFD84D"));
  assert.ok(!(HARD_FALLBACK_COLORS as readonly string[]).includes("#1d4ed8"));
  const waves = hardFallbackWaves("birthday", 1440);
  assert.ok(waves.length >= 4);
  assert.equal(waves[0]?.at, 0);
  assert.ok(waves.some((w) => w.at >= 6000));
  assert.ok(waves[0]!.confetti + waves[0]!.streamers >= 20);
  assert.ok(hardFallbackPeakConfetti("birthday", 1440) >= 18);
  assert.ok(hardFallbackDurationMs("birthday") >= 10000);
  assert.ok(hardFallbackDurationMs("victory") > hardFallbackDurationMs("birthday"));
  assert.ok(hardFallbackDurationMs("birthday_victory") >= hardFallbackDurationMs("victory"));
  assert.ok(hardFallbackWaves("birthday", 390).reduce((n, w) => n + w.confetti, 0) < waves.reduce((n, w) => n + w.confetti, 0));
}

// --- UI source contracts ---
{
  const overlay = readFileSync(join(root, "src/components/home/homepage-celebration.tsx"), "utf8");
  const page = readFileSync(join(root, "src/app/(site)/page.tsx"), "utf8");
  const engine = readFileSync(join(root, "src/lib/home/celebration-engine.ts"), "utf8");
  const hero = readFileSync(join(root, "src/components/home/club-home-hero.tsx"), "utf8");
  const spotlight = readFileSync(join(root, "src/components/home/home-birthday-spotlight.tsx"), "utf8");

  assert.match(overlay, /prefers-reduced-motion/);
  assert.match(overlay, /CelebrationHardFallback/);
  assert.match(overlay, /waitUntilCelebrationCanStart/);
  assert.match(overlay, /createPortal/);
  assert.doesNotMatch(overlay, /sessionStorage/);
  assert.doesNotMatch(overlay, /shouldReplayHomepageCelebration/);
  assert.match(overlay, /CELEBRATION_START_DELAY_MS/);
  assert.match(overlay, /useLayoutEffect/);
  assert.doesNotMatch(overlay, /autoplay|Audio|new Audio/);

  assert.match(page, /getHomepageCelebration/);
  assert.match(page, /HomepageCelebration/);
  assert.match(page, /celebration-server-type/);
  assert.match(page, /isPublicCelebrationPreviewAllowed/);
  assert.doesNotMatch(page, /home_score|away_score/);

  const fallback = readFileSync(join(root, "src/components/home/celebration-hard-fallback.tsx"), "utf8");
  const fallbackLib = readFileSync(join(root, "src/lib/home/celebration-hard-fallback.ts"), "utf8");
  assert.match(fallback, /createPortal/);
  assert.match(fallback, /HARD_FALLBACK_ROOT_STYLE/);
  assert.match(fallback, /runHardFallback/);
  assert.doesNotMatch(fallback, /globals\.css/);
  assert.doesNotMatch(fallback, /className/);
  assert.match(fallbackLib, /\.animate\(/);
  assert.match(fallbackLib, /backgroundColor/);
  assert.doesNotMatch(fallbackLib, /@keyframes/);
  assert.doesNotMatch(fallbackLib, /globals\.css/);
  assert.doesNotMatch(fallbackLib, /sessionStorage/);

  assert.match(engine, /cancelAnimationFrame/);
  assert.match(engine, /clearTimeout/);
  assert.match(engine, /canvas\.width = 0/);
  assert.match(engine, /elapsed >= duration/);
  assert.match(engine, /stopped = true/);
  assert.match(engine, /spawnFirework|kind === "flash"/);
  assert.match(engine, /createRadialGradient/);

  assert.match(hero, /HomeBirthdaySpotlight/);
  assert.match(hero, /HomeTeamSpotlight/);
  assert.match(spotlight, /birthday-hero-spotlight/);
  assert.doesNotMatch(hero, /HomepageCelebration/);

  const css = readFileSync(join(root, "src/app/globals.css"), "utf8");
  assert.match(css, /#homepage-celebration-root/);
  assert.match(css, /z-index:\s*9999/);
  assert.match(css, /@keyframes zvv-dom-confetti-fall/);
  assert.match(css, /@keyframes zvv-dom-confetti-drift/);
  assert.match(css, /@keyframes zvv-dom-streamer-wave/);
  assert.match(css, /@keyframes zvv-dom-burst-pop/);
  assert.match(css, /\.zvv-dom-confetti-layer/);
  assert.match(css, /\.zvv-dom-burst-spark/);

  const domLayer = readFileSync(join(root, "src/components/home/celebration-dom-layer.tsx"), "utf8");
  assert.match(domLayer, /homepage-celebration-dom/);
  assert.match(domLayer, /homepage-celebration-burst/);
  assert.doesNotMatch(domLayer, /sessionStorage/);
}

{
  const admin = readFileSync(join(root, "src/app/(site)/beheer/voorbeeld/celebration/page.tsx"), "utf8");
  assert.match(admin, /requireAdmin|niet openbaar|Voorbeeldweergave/);
  assert.match(admin, /HomepageCelebration/);
  assert.match(admin, /ClubHomeHero/);
}

console.log("homepage-celebration.test.ts: ok");
