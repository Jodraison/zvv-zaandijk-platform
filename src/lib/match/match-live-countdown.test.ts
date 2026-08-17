/**
 * Live matchday countdown — deterministisch met gefixeerde `now`.
 * Run: npm run test:match-live-countdown
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CLUB_TZ,
  getMatchCountdownState,
  getMatchLiveCountdown,
  padLiveUnit,
} from "@/lib/match/match-countdown";
import { clubLocalDateTimeToIso } from "@/lib/season/season-operations-2026-27";

const root = process.cwd();
const SEC = 1_000;
const MIN = 60 * SEC;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

function values(model: ReturnType<typeof getMatchLiveCountdown>) {
  return Object.fromEntries(model.units.map((u) => [u.key, u.value]));
}

function assertNoNegatives(model: ReturnType<typeof getMatchLiveCountdown>) {
  assert.ok(model.remainingMs >= 0);
  for (const u of model.units) {
    assert.ok(u.value >= 0, `${u.key} was negative`);
  }
}

{
  assert.equal(CLUB_TZ, "Europe/Amsterdam");
  assert.equal(padLiveUnit(4), "04");
  assert.equal(padLiveUnit(0), "00");
  assert.equal(padLiveUnit(-3), "00");
}

// 1. Meer dan één week
{
  const kickoff = "2026-08-29T12:00:00.000Z"; // 14:00 Amsterdam
  const now = new Date(Date.parse(kickoff) - (1 * WEEK + 4 * DAY + 23 * HOUR + 55 * MIN + 42 * SEC));
  const model = getMatchLiveCountdown({ startsAt: kickoff, now, status: "scheduled" });
  assert.equal(model.kind, "far");
  assert.equal(getMatchCountdownState({ startsAt: kickoff, now, status: "scheduled" }).kind, "far");
  assert.deepEqual(values(model), { week: 1, dagen: 4, uur: 23, min: 55, sec: 42 });
  assert.equal(model.statusLabel, null);
  assert.equal(model.eyebrow, null);
  assertNoNegatives(model);
}

// 2. Minder dan één week — geen week-unit
{
  const kickoff = "2026-08-29T12:00:00.000Z";
  const now = new Date(Date.parse(kickoff) - (4 * DAY + 23 * HOUR + 55 * MIN + 42 * SEC));
  const model = getMatchLiveCountdown({ startsAt: kickoff, now, status: "scheduled" });
  assert.equal(model.kind, "within_week");
  assert.deepEqual(values(model), { dagen: 4, uur: 23, min: 55, sec: 42 });
  assert.ok(!model.units.some((u) => u.key === "week"));
  assertNoNegatives(model);
}

// 3. Minder dan 24 uur (andere Amsterdam-dag, anders wordt het matchday)
{
  const now = new Date("2026-08-28T18:00:00.000Z"); // 20:00 Amsterdam 28 aug
  const kickoff = new Date(now.getTime() + 8 * HOUR + 14 * MIN + 22 * SEC).toISOString();
  const model = getMatchLiveCountdown({ startsAt: kickoff, now, status: "scheduled" });
  assert.equal(model.kind, "within_24h");
  assert.equal(model.eyebrow, "Start over");
  assert.equal(model.urgent, true);
  assert.deepEqual(values(model), { uur: 8, min: 14, sec: 22 });
  assertNoNegatives(model);
}

// 4. Minder dan één uur
{
  const kickoff = "2026-08-29T12:00:00.000Z";
  const now = new Date(Date.parse(kickoff) - (42 * MIN + 16 * SEC));
  const model = getMatchLiveCountdown({ startsAt: kickoff, now, status: "scheduled" });
  assert.equal(model.kind, "soon");
  assert.equal(model.eyebrow, "Start over");
  assert.deepEqual(values(model), { min: 42, sec: 16 });
  assertNoNegatives(model);
}

// 5. Exact kickoff
{
  const kickoff = "2026-08-29T12:00:00.000Z";
  const now = new Date(kickoff);
  const model = getMatchLiveCountdown({ startsAt: kickoff, now, status: "scheduled" });
  assert.equal(model.kind, "live");
  assert.equal(model.statusLabel, "Bezig");
  assert.equal(model.units.length, 0);
  assert.equal(model.remainingMs, 0);
  assertNoNegatives(model);
}

// 6. Afgelopen
{
  const kickoff = "2026-08-29T12:00:00.000Z";
  const now = new Date(Date.parse(kickoff) + 106 * MIN);
  const model = getMatchLiveCountdown({ startsAt: kickoff, now, status: "scheduled" });
  assert.equal(model.kind, "finished");
  assert.equal(model.statusLabel, "Afgelopen");
  assert.equal(model.units.length, 0);
  assertNoNegatives(model);

  const played = getMatchLiveCountdown({
    startsAt: kickoff,
    now: new Date("2026-08-17T12:00:00.000Z"),
    status: "played",
  });
  assert.equal(played.kind, "finished");
  assert.equal(played.statusLabel, "Afgelopen");
}

// 7. Afgelast
{
  const model = getMatchLiveCountdown({
    startsAt: "2026-08-29T12:00:00.000Z",
    now: new Date("2026-08-17T12:00:00.000Z"),
    status: "cancelled",
  });
  assert.equal(model.kind, "cancelled");
  assert.equal(model.statusLabel, "Afgelast");
  assert.equal(model.units.length, 0);
}

// 8. Uitgesteld
{
  const model = getMatchLiveCountdown({
    startsAt: "2026-08-29T12:00:00.000Z",
    now: new Date("2026-08-17T12:00:00.000Z"),
    status: "postponed",
  });
  assert.equal(model.kind, "postponed");
  assert.equal(model.statusLabel, "Uitgesteld");
  assert.equal(model.units.length, 0);
}

// 9. Europe/Amsterdam — canonieke WSV-kickoff
{
  const kickoff = clubLocalDateTimeToIso("2026-08-29", "14:00");
  assert.equal(kickoff, "2026-08-29T12:00:00.000Z");
  const now = new Date("2026-08-29T11:59:18.000Z"); // 13:59:18 Amsterdam
  const model = getMatchLiveCountdown({ startsAt: kickoff, now, status: "scheduled" });
  assert.equal(model.kind, "soon");
  assert.deepEqual(values(model), { min: 0, sec: 42 });
  assert.equal(model.targetIso, "2026-08-29T12:00:00.000Z");
}

// Matchday (zelfde Amsterdam-dag, > 1 uur)
{
  const kickoff = clubLocalDateTimeToIso("2026-08-29", "14:00");
  const now = new Date("2026-08-29T10:00:00.000Z"); // 12:00 Amsterdam
  const model = getMatchLiveCountdown({ startsAt: kickoff, now, status: "scheduled" });
  assert.equal(model.kind, "today");
  assert.equal(model.eyebrow, "Matchday");
  assert.deepEqual(values(model), { uur: 2, min: 0, sec: 0 });
}

// 10. Maandgrens
{
  const kickoff = "2026-09-01T12:00:00.000Z"; // 14:00 Amsterdam
  const now = new Date("2026-08-31T21:00:00.000Z"); // 23:00 Amsterdam 31 aug
  const model = getMatchLiveCountdown({ startsAt: kickoff, now, status: "scheduled" });
  assert.equal(model.kind, "within_24h");
  assert.deepEqual(values(model), { uur: 15, min: 0, sec: 0 });
  assertNoNegatives(model);
}

// 11. Jaargrens
{
  const kickoff = "2027-01-01T13:00:00.000Z"; // 14:00 Amsterdam (CET)
  const now = new Date("2026-12-31T19:00:00.000Z"); // 20:00 Amsterdam 31 dec
  const model = getMatchLiveCountdown({ startsAt: kickoff, now, status: "scheduled" });
  assert.equal(model.kind, "within_24h");
  assert.deepEqual(values(model), { uur: 18, min: 0, sec: 0 });
  assertNoNegatives(model);
}

// 12. DST — zomertijd vooruit (29 maart 2026): 14:00→14:00 is 23 uur
{
  const now = new Date("2026-03-28T13:00:00.000Z"); // 14:00 CET
  const kickoff = "2026-03-29T12:00:00.000Z"; // 14:00 CEST
  const model = getMatchLiveCountdown({ startsAt: kickoff, now, status: "scheduled" });
  assert.equal(model.remainingMs, 23 * HOUR);
  assert.equal(model.kind, "within_24h");
  assert.deepEqual(values(model), { uur: 23, min: 0, sec: 0 });
}

// DST — wintertijd terug (25 okt 2026): 14:00→14:00 is 25 uur
{
  const now = new Date("2026-10-24T12:00:00.000Z"); // 14:00 CEST
  const kickoff = "2026-10-25T13:00:00.000Z"; // 14:00 CET
  const model = getMatchLiveCountdown({ startsAt: kickoff, now, status: "scheduled" });
  assert.equal(model.remainingMs, 25 * HOUR);
  assert.equal(model.kind, "within_week");
  assert.deepEqual(values(model), { dagen: 1, uur: 1, min: 0, sec: 0 });
}

// Geen negatieve waarden na kickoff (live-venster)
{
  const kickoff = "2026-08-29T12:00:00.000Z";
  const now = new Date(Date.parse(kickoff) + 30 * MIN);
  const model = getMatchLiveCountdown({ startsAt: kickoff, now, status: "scheduled" });
  assert.equal(model.kind, "live");
  assert.equal(model.remainingMs, 0);
  assert.equal(model.units.length, 0);
  assertNoNegatives(model);
}

// Homepage wired; overige surfaces houden MatchCountdownLabel
{
  const hero = readFileSync(join(root, "src/components/home/club-home-hero.tsx"), "utf8");
  const home = readFileSync(join(root, "src/components/home/match-countdown.tsx"), "utf8");
  const live = readFileSync(join(root, "src/components/match/match-live-countdown.tsx"), "utf8");
  const label = readFileSync(join(root, "src/components/match/match-countdown-label.tsx"), "utf8");
  const card = readFileSync(join(root, "src/components/matches/match-card.tsx"), "utf8");
  assert.doesNotMatch(hero, /MatchLiveCountdown/);
  assert.doesNotMatch(hero, /variant="compact"/);
  assert.match(hero, /HomeTeamSpotlight/);
  assert.match(home, /MatchLiveCountdown/);
  assert.match(home, /variant="hero"/);
  assert.match(live, /prefers-reduced-motion|motion-safe/);
  assert.match(live, /tabular-nums/);
  assert.match(live, /aria-label/);
  assert.doesNotMatch(live, /aria-live/);
  assert.match(live, /setInterval/);
  assert.match(live, /clearInterval/);
  assert.match(label, /getMatchCountdownState/);
  assert.match(card, /MatchCountdownLabel/);
}

console.log("match-live-countdown.test.ts: ok");
