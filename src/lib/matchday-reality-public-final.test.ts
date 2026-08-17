/**
 * Matchday reality & public presentation final recovery.
 * Run: npm run test:matchday-reality-public-final
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { getMatchCountdownState, CLUB_TZ } from "@/lib/match/match-countdown";
import {
  FORMATION_4231_SLOTS,
  formationLineSpread,
  type FormationSlotCode,
} from "@/lib/match/formation-4231";
import {
  isQaMatchOpponent,
  isQaFixtureNotes,
  QA_FIXTURE_NOTES_MARKER,
} from "@/lib/match/qa-fixture-patterns";
import {
  withTemporaryMatchFixture,
  buildTemporaryMatch,
} from "@/lib/match/temporary-match-fixture";
import type { ClubDatabase } from "@/types";
import { roleHasCapability } from "@/lib/auth/capabilities";

const root = process.cwd();
console.log("→ matchday-reality-public-final");

async function main() {
const base = new Date("2026-07-30T12:00:00+02:00");

// --- Countdown 1–10 ---
{
  const far = getMatchCountdownState({
    startsAt: "2026-08-17T15:00:00+02:00",
    now: base,
    status: "scheduled",
  });
  assert.equal(far.kind, "far");
  assert.match(far.primaryLabel, /wek|dag/i);

  const h23 = getMatchCountdownState({
    startsAt: "2026-07-31T11:00:00+02:00",
    now: base,
    status: "scheduled",
  });
  assert.ok(h23.kind === "within_24h" || h23.kind === "within_week" || h23.kind === "today");
  assert.match(h23.primaryLabel, /Over|Vandaag|Morgen|uur|dag/i);

  const today = getMatchCountdownState({
    startsAt: "2026-07-30T19:30:00+02:00",
    now: base,
    status: "scheduled",
  });
  assert.equal(today.kind, "today");
  assert.match(today.primaryLabel, /Vandaag om/);

  const soon = getMatchCountdownState({
    startsAt: new Date(base.getTime() + 8 * 60_000).toISOString(),
    now: base,
    status: "scheduled",
  });
  assert.equal(soon.kind, "soon");
  assert.match(soon.primaryLabel, /Begint over 8/);

  const live = getMatchCountdownState({
    startsAt: new Date(base.getTime() - 30 * 60_000).toISOString(),
    now: base,
    status: "scheduled",
    durationMinutes: 105,
  });
  assert.equal(live.kind, "live");
  assert.equal(live.primaryLabel, "Bezig");

  const finished = getMatchCountdownState({
    startsAt: new Date(base.getTime() - 3 * 60 * 60_000).toISOString(),
    now: base,
    status: "scheduled",
    durationMinutes: 105,
  });
  assert.equal(finished.kind, "finished");
  assert.equal(finished.primaryLabel, "Afgelopen");

  const played = getMatchCountdownState({
    startsAt: "2026-08-01T15:00:00+02:00",
    now: base,
    status: "played",
  });
  assert.equal(played.kind, "finished");

  assert.equal(
    getMatchCountdownState({ startsAt: "2026-08-01T15:00:00+02:00", now: base, status: "cancelled" })
      .primaryLabel,
    "Afgelast",
  );
  assert.equal(
    getMatchCountdownState({ startsAt: "2026-08-01T15:00:00+02:00", now: base, status: "postponed" })
      .primaryLabel,
    "Uitgesteld",
  );
  assert.equal(CLUB_TZ, "Europe/Amsterdam");
}

// --- Formation geometry 11–18 ---
{
  const byCode = Object.fromEntries(FORMATION_4231_SLOTS.map((s) => [s.code, s])) as Record<
    FormationSlotCode,
    (typeof FORMATION_4231_SLOTS)[number]
  >;
  assert.equal(byCode.SP.x, 50);
  assert.ok(byCode.SP.y < byCode.CAM.y);
  assert.ok(byCode.LM.x < byCode.CAM.x && byCode.CAM.x < byCode.RM.x);
  assert.ok(Math.abs(byCode.LM.y - byCode.RM.y) <= 5);
  assert.ok(byCode.LCVM.x < byCode.RCVM.x);
  assert.equal(byCode.LCVM.y, byCode.RCVM.y);
  const defXs = [byCode.LB.x, byCode.LCB.x, byCode.RCB.x, byCode.RB.x];
  assert.deepEqual(
    [...defXs].sort((a, b) => a - b),
    defXs,
  );
  assert.equal(byCode.GK.x, 50);
  assert.ok(byCode.GK.y > byCode.LB.y);

  // no same-line overlaps
  for (const line of ["DEF", "CDM", "AM"] as const) {
    const { xs } = formationLineSpread(line);
    assert.equal(new Set(xs).size, xs.length, `line ${line} unique x`);
  }

  const pitch = readFileSync(join(root, "src/components/match/formation-pitch.tsx"), "utf8");
  assert.match(pitch, /left: `\$\{slot\.x\}%`/);
  assert.match(pitch, /top: `\$\{slot\.y\}%`/);
  assert.ok(!pitch.includes("grid-cols-4") || pitch.includes("absolute"));
  assert.match(pitch, /strafschop|Penalty|border-\[2\.5px\]|middencirkel|rounded-full border/i);

  const publicPage = readFileSync(join(root, "src/app/(site)/wedstrijden/[matchId]/page.tsx"), "utf8");
  assert.match(publicPage, /PublicMatchLineup|FormationPitch/);
  assert.match(publicPage, /MatchCountdownLabel/);
  assert.ok(!publicPage.includes("lg:grid-cols-2"));
}

// --- Public match detail 19–24 ---
{
  const lineup = readFileSync(join(root, "src/components/matches/public-match-lineup.tsx"), "utf8");
  assert.match(lineup, /Startopstelling/);
  assert.match(lineup, /Eindopstelling/);
  assert.match(lineup, /Vergelijk start en eind/);
  assert.match(lineup, /size=\"hero\"/);
  const detail = readFileSync(join(root, "src/app/(site)/wedstrijden/[matchId]/page.tsx"), "utf8");
  assert.match(detail, /Nog geen wedstrijdgebeurtenissen/);
}

// --- QA patterns + fixture hygiene 25–30, 39–41 ---
{
  assert.equal(isQaMatchOpponent("UX Final 1785419778094"), true);
  assert.equal(isQaMatchOpponent("Ketenherstel 1785415020401"), true);
  assert.equal(isQaMatchOpponent("Debug FC 1785415294519"), true);
  assert.equal(isQaMatchOpponent("Sporting Andijk VR1"), false);
  assert.equal(isQaFixtureNotes(QA_FIXTURE_NOTES_MARKER), true);

  const emptyDb = {
    matches: [],
    match_lineup_entries: [],
    match_matchday_roster: [],
    match_goal_events: [],
    match_card_events: [],
    match_substitutions: [],
    match_position_changes: [],
    match_player_stats: [],
  } as unknown as ClubDatabase;

  let sawId: string | null = null;
  await withTemporaryMatchFixture(emptyDb, { season_id: "s1" }, async (m, db) => {
    sawId = m.id;
    assert.ok(db.matches.some((x) => x.id === m.id));
    throw new Error("force-fail");
  }).catch((e: Error) => {
    assert.equal(e.message, "force-fail");
  });
  assert.ok(sawId);
  assert.equal(emptyDb.matches.length, 0, "39/40: cleanup ook bij falende test");

  const tmp = buildTemporaryMatch({ season_id: "s1", opponent: "QA Temp 1" });
  assert.ok(isQaFixtureNotes(tmp.notes));
}

// --- Delete contract 31–38 ---
{
  assert.equal(roleHasCapability("owner", "system_admin"), true);
  assert.equal(roleHasCapability("team_manager", "system_admin"), false);
  const delAction = readFileSync(join(root, "src/actions/match-admin.ts"), "utf8");
  assert.match(delAction, /capability: "system_admin"/);
  assert.match(delAction, /match_position_changes/);
  const dialog = readFileSync(join(root, "src/components/admin/match-delete-dialog.tsx"), "utf8");
  assert.match(dialog, /Wedstrijd verwijderen\?/);
  assert.match(dialog, /uitslagen of statistieken/);
  assert.match(dialog, /VERWIJDEREN/);
  const adminList = readFileSync(join(root, "src/app/(site)/beheer/wedstrijden/page.tsx"), "utf8");
  assert.match(adminList, /AdminMatchRowActions|MatchDeleteDialog/);
}

// --- Consumers wired ---
{
  const hero = readFileSync(join(root, "src/components/home/club-home-hero.tsx"), "utf8");
  assert.doesNotMatch(hero, /MatchLiveCountdown/);
  assert.match(hero, /HomeTeamSpotlight|HomeBirthdaySpotlight/);
  const homeCd = readFileSync(join(root, "src/components/home/match-countdown.tsx"), "utf8");
  assert.match(homeCd, /MatchLiveCountdown/);
  assert.match(homeCd, /variant="hero"/);
  const card = readFileSync(join(root, "src/components/matches/match-card.tsx"), "utf8");
  assert.match(card, /MatchCountdownLabel/);
  const prog = readFileSync(join(root, "src/app/(site)/wedstrijden/page.tsx"), "utf8");
  assert.match(prog, /wedstrijdprogramma is nog niet bekend|Nog geen wedstrijden/);
}

// Capture script must cleanup
{
  const capture = join(root, "scripts/capture-matchday-reality-public-final.mjs");
  if (existsSync(capture)) {
    const src = readFileSync(capture, "utf8");
    assert.match(src, /finally|cleanup|delete/i);
  }
}

console.log("matchday-reality-public-final.test.ts: ok");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
