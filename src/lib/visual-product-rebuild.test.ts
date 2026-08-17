/**
 * Visual product rebuild — demodata-isolatie + pitch + podium invarianten.
 * Run: npm run test:visual-product-rebuild
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { isQaMatchOpponent } from "@/lib/match/qa-fixture-patterns";
import { isProductionMatch, resolveMatchDataScope } from "@/lib/match/match-data-scope";
import { aggregateSeasonMatchStats } from "@/lib/queries/season-match-stats";
import { seasonMatches, nextScheduledMatch } from "@/lib/queries/matches";
import type { ClubDatabase, Match } from "@/types";

const root = process.cwd();
console.log("→ visual-product-rebuild");

assert.equal(isQaMatchOpponent("OWF Accept 1785433933391"), true);
assert.equal(isQaMatchOpponent("OWF Debug 1"), true);
assert.equal(isQaMatchOpponent("vfdvgs"), true);
assert.equal(isQaMatchOpponent("Sporting Andijk VR1"), false);

assert.equal(resolveMatchDataScope({ opponent: "OWF Accept x", notes: null }), "qa");
assert.equal(resolveMatchDataScope({ opponent: "Real FC", notes: "__qa_fixture__" }), "qa");
assert.equal(resolveMatchDataScope({ opponent: "Real FC", notes: null, data_scope: "demo" }), "demo");
assert.equal(isProductionMatch({ opponent: "Real FC", notes: null }), true);

const seasonId = "season-1";
const qaPlayed: Match = {
  id: "m-qa",
  season_id: seasonId,
  opponent: "OWF Accept 1785433933391",
  kickoff_at: "2026-08-01T13:00:00.000Z",
  is_home: true,
  match_type: "competition",
  location: null,
  referee: null,
  notes: null,
  goals_for: 3,
  goals_against: 1,
  status: "played",
  wotm_player_id: "p1",
  integrity_state: "verified",
};
const realScheduled: Match = {
  ...qaPlayed,
  id: "m-real",
  opponent: "Sporting Andijk VR1",
  status: "scheduled",
  goals_for: 0,
  goals_against: 0,
  wotm_player_id: null,
  kickoff_at: "2026-09-01T12:00:00.000Z",
};

const db = {
  matches: [qaPlayed, realScheduled],
  match_goal_events: [
    {
      id: "g1",
      match_id: "m-qa",
      scorer_player_id: "p1",
      assist_player_id: null,
      sort_order: 0,
      minute: 10,
    },
  ],
  players: [{ id: "p1", full_name: "Test", is_guest: false }],
} as unknown as ClubDatabase;

const agg = aggregateSeasonMatchStats(db, seasonId);
assert.equal(agg.goals.get("p1") ?? 0, 0, "demo goals mogen niet aggregaten");
assert.equal(agg.mvp.get("p1") ?? 0, 0, "demo MVP mag niet aggregaten");

const publicList = seasonMatches(db, seasonId);
assert.equal(publicList.length, 1);
assert.equal(publicList[0]!.opponent, "Sporting Andijk VR1");
assert.equal(seasonMatches(db, seasonId, { includeNonProduction: true }).length, 2);

const next = nextScheduledMatch(db, seasonId, new Date("2026-08-15T12:00:00.000Z"));
assert.ok(next);
assert.equal(next!.opponent, "Sporting Andijk VR1");

const pitch = readFileSync(join(root, "src/components/match/formation-pitch.tsx"), "utf8");
assert.match(pitch, /clamp\(720px, 78vw, 940px\)/);
assert.match(pitch, /data-testid=\"formation-pitch\"/);
assert.ok(!pitch.includes("inset-[3.5%]"), "geen Tailwind arbitrary inset die 0×0 collapst");

const podium = readFileSync(join(root, "src/components/ranking/ranking-podium.tsx"), "utf8");
assert.match(podium, /data-testid=\"ranking-podium\"/);
assert.match(podium, /data-podium-place/);
assert.match(podium, /md:order-2/);
assert.match(podium, /prefers-reduced-motion|motion-safe/);

const card = readFileSync(join(root, "src/components/matches/match-card.tsx"), "utf8");
assert.match(card, /Overwinning|emerald/);
assert.match(card, /Bekijk wedstrijd/);

assert.ok(existsSync(join(root, ".review-artifacts/visual-product-rebuild-lineup-reality/current-ui-audit.md")));
assert.ok(existsSync(join(root, ".review-artifacts/visual-product-rebuild-lineup-reality/visual-design-contract.md")));

console.log("visual-product-rebuild.test.ts: ok");
