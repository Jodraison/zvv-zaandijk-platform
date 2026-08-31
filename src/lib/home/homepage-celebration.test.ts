/**
 * Homepage celebration — trigger, show-v2 layout, orchestrator contracts.
 * Run: npm run test:homepage-celebration
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Match } from "@/types";
import {
  buildCelebrationAdminPreviewHref,
  buildCelebrationHomepagePreviewHref,
  findTodayOfficialVictory,
  getHomepageCelebration,
  hasBirthdayCelebrationToday,
  isPublicCelebrationPreviewAllowed,
  isTodayOfficialVictory,
  resolveCelebrationHoldPreview,
  resolveCelebrationPreviewType,
  resolveCelebrationReducedPreview,
} from "@/lib/home/homepage-celebration";
import {
  CELEBRATION_COLORS,
  CELEBRATION_DURATION_MS,
  CELEBRATION_REDUCED_DURATION_MS,
  CELEBRATION_START_DELAY_MS,
  CELEBRATION_Z_INDEX,
  buildCelebrationShow,
  celebrationPieceVisibleAtRest,
  celebrationShowBudget,
  celebrationShowNodeCount,
  celebrationShowQuadrants,
} from "@/lib/home/celebration-show";
import { getBirthdayPlayersForDate, type BirthdayPerson } from "@/lib/players/birthdays";

const root = process.cwd();
console.log("→ test:homepage-celebration");

const SEASON = "season-vrz1";

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
const noonAug31 = new Date("2026-08-31T12:00:00+02:00");

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
}

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

{
  const yesterday = match({
    id: "y",
    kickoff_at: "2026-07-31T14:00:00+02:00",
    status: "played",
    goals_for: 2,
    goals_against: 0,
  });
  assert.equal(isTodayOfficialVictory(yesterday, SEASON, noonAug1), false);
}

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
}

{
  const win = match({
    id: "combo",
    kickoff_at: "2026-08-01T14:00:00+02:00",
    status: "played",
    goals_for: 2,
    goals_against: 0,
  });
  const combined = getHomepageCelebration({
    birthdayCount: 1,
    matches: [win],
    seasonId: SEASON,
    now: noonAug1,
  });
  assert.equal(combined.type, "birthday_victory");
  assert.equal(combined.birthday, true);
  assert.equal(combined.victory, true);
  assert.equal(findTodayOfficialVictory([win], SEASON, noonAug1)?.id, "combo");
}

{
  const qa = match({
    id: "qa",
    kickoff_at: "2026-08-01T14:00:00+02:00",
    status: "played",
    opponent: "OWF Accept 1",
    data_scope: "qa",
    goals_for: 5,
    goals_against: 0,
  });
  assert.equal(isTodayOfficialVictory(qa, SEASON, noonAug1), false);
}

assert.equal(isPublicCelebrationPreviewAllowed("production"), false);
assert.equal(isPublicCelebrationPreviewAllowed("development"), true);
assert.equal(resolveCelebrationPreviewType("birthday", { allowPreview: false }), null);
assert.equal(resolveCelebrationPreviewType("birthday", { allowPreview: true }), "birthday");
assert.equal(resolveCelebrationPreviewType("combined", { allowPreview: true }), "birthday_victory");
assert.equal(resolveCelebrationHoldPreview("1", { allowPreview: true }), true);
assert.equal(resolveCelebrationHoldPreview("1", { allowPreview: false }), false);
assert.equal(resolveCelebrationReducedPreview("reduce", { allowPreview: true }), true);
assert.equal(resolveCelebrationReducedPreview("reduce", { allowPreview: false }), false);

{
  const href = buildCelebrationHomepagePreviewHref({
    seasonId: SEASON,
    kind: "combined",
    hold: true,
    vandaag: "2026-08-01",
  });
  assert.match(href, /celebration=combined/);
  const admin = buildCelebrationAdminPreviewHref({
    seasonId: SEASON,
    kind: "birthday",
    reduced: true,
    datum: "2026-08-01",
  });
  assert.match(admin, /\/beheer\/voorbeeld\/celebration/);
  assert.match(admin, /motion=reduce/);
}

assert.ok(CELEBRATION_START_DELAY_MS >= 600 && CELEBRATION_START_DELAY_MS <= 800);
assert.ok(CELEBRATION_DURATION_MS.birthday >= 8000 && CELEBRATION_DURATION_MS.birthday <= 13000);
assert.ok(CELEBRATION_DURATION_MS.victory > CELEBRATION_DURATION_MS.birthday);
assert.ok(CELEBRATION_DURATION_MS.birthday_victory >= CELEBRATION_DURATION_MS.victory);
assert.ok(CELEBRATION_REDUCED_DURATION_MS >= 3000);
assert.ok(CELEBRATION_Z_INDEX >= 80);

{
  const colors = CELEBRATION_COLORS.birthday;
  assert.ok(colors.includes("#FFFFFF") || colors.includes("#ffffff"));
  assert.ok(colors.some((c) => c.toUpperCase() === "#FFD84D" || c.toUpperCase() === "#FBBF24"));
  assert.ok(!colors.includes("#1d4ed8"));
  assert.ok(!colors.includes("#0b1f5f"));
}

{
  const desk = celebrationShowBudget("birthday", 1440);
  const mob = celebrationShowBudget("birthday", 390);
  const victory = celebrationShowBudget("victory", 1440);
  assert.ok(desk.confetti >= 32 && desk.confetti <= 56);
  assert.ok(mob.confetti < desk.confetti);
  assert.ok(victory.confetti > desk.confetti);
  assert.ok(celebrationShowNodeCount(desk) <= 90);
  assert.ok(celebrationShowNodeCount(mob) <= 70);
}

{
  const a = buildCelebrationShow({ kind: "birthday", width: 1440, seed: "birthday:2026-08-31" });
  const b = buildCelebrationShow({ kind: "birthday", width: 1440, seed: "birthday:2026-08-31" });
  assert.deepEqual(a, b);
  assert.ok(a.every(celebrationPieceVisibleAtRest));
  const q = celebrationShowQuadrants(a);
  assert.equal(q.nw && q.ne && q.sw && q.se, true);
  assert.ok(a.some((p) => p.kind === "streamer"));
  assert.ok(a.some((p) => p.kind === "burst"));
  const quietCoverage = { nw: false, ne: false, sw: false, se: false };
  assert.notDeepEqual(q, quietCoverage);
}

{
  const victory = buildCelebrationShow({ kind: "victory", width: 1440, seed: "victory:2026-08-31" });
  const birthday = buildCelebrationShow({ kind: "birthday", width: 1440, seed: "birthday:2026-08-31" });
  assert.ok(victory.filter((p) => p.kind === "confetti").length > birthday.filter((p) => p.kind === "confetti").length);
  assert.ok(victory.every(celebrationPieceVisibleAtRest));
}

{
  const combined = getHomepageCelebration({
    birthdayCount: getBirthdayPlayersForDate([{ id: "j", full_name: "Jelisa De Jonge", birth_date: "2006-08-31" }], noonAug31).length,
    matches: [],
    seasonId: SEASON,
    now: noonAug31,
  });
  assert.equal(combined.type, "birthday");
}

{
  const overlay = readFileSync(join(root, "src/components/home/homepage-celebration.tsx"), "utf8");
  const show = readFileSync(join(root, "src/components/home/celebration-show.tsx"), "utf8");
  const lib = readFileSync(join(root, "src/lib/home/homepage-celebration.ts"), "utf8");
  const page = readFileSync(join(root, "src/app/(site)/page.tsx"), "utf8");
  const hero = readFileSync(join(root, "src/components/home/club-home-hero.tsx"), "utf8");
  const spotlight = readFileSync(join(root, "src/components/home/home-birthday-spotlight.tsx"), "utf8");
  const css = readFileSync(join(root, "src/app/globals.css"), "utf8");

  assert.match(overlay, /CelebrationShow/);
  assert.match(overlay, /waitUntilCelebrationCanStart/);
  assert.match(overlay, /prefers-reduced-motion/);
  assert.match(overlay, /forceReducedMotion/);
  assert.doesNotMatch(overlay, /sessionStorage|localStorage/);
  assert.doesNotMatch(overlay, /runClubCelebration|CelebrationHardFallback|canvas/i);
  assert.doesNotMatch(overlay, /shouldReplayHomepageCelebration/);

  assert.match(show, /createPortal/);
  assert.match(show, /homepage-celebration-show/);
  assert.match(show, /show-v2/);
  assert.match(show, /buildCelebrationShow/);
  assert.doesNotMatch(show, /HTMLCanvasElement|getContext\(/);

  assert.doesNotMatch(lib, /sessionStorage|localStorage/);
  assert.doesNotMatch(lib, /CELEBRATION_NAV_COOLDOWN|lastCelebrationGuard/);

  assert.match(page, /getHomepageCelebration/);
  assert.match(page, /HomepageCelebration/);
  assert.match(page, /celebration-server-type/);
  assert.match(page, /isCurrentUserAdmin/);
  assert.match(page, /showBuildMarker/);

  assert.match(hero, /HomeBirthdaySpotlight/);
  assert.match(hero, /showBuildMarker/);
  assert.doesNotMatch(hero, /HomepageCelebration/);

  assert.match(spotlight, /birthday-hero-spotlight/);
  assert.match(spotlight, /birthday-festive-state/);
  assert.match(spotlight, /celebration-fx-marker/);
  assert.match(spotlight, /FX v2/);

  assert.match(css, /#homepage-celebration-root/);
  assert.match(css, /@keyframes zvv-fx-fall/);
  assert.match(css, /@keyframes zvv-fx-burst/);
  assert.doesNotMatch(css, /zvv-dom-confetti-fall/);

  const gone = [
    "src/lib/home/celebration-engine.ts",
    "src/lib/home/celebration-visual.ts",
    "src/lib/home/celebration-dom.ts",
    "src/lib/home/celebration-hard-fallback.ts",
    "src/components/home/celebration-dom-layer.tsx",
    "src/components/home/celebration-hard-fallback.tsx",
  ];
  for (const file of gone) {
    assert.equal(existsSync(join(root, file)), false, file);
  }
}

{
  const admin = readFileSync(join(root, "src/app/(site)/beheer/voorbeeld/celebration/page.tsx"), "utf8");
  assert.match(admin, /niet openbaar|Voorbeeldweergave/);
  assert.match(admin, /HomepageCelebration/);
  assert.match(admin, /forceReducedMotion/);
  assert.match(admin, /motion=reduce/);
}

console.log("homepage-celebration.test.ts: ok");
