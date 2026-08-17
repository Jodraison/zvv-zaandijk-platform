/**
 * Public football product recovery — regressies.
 * Run: npm run test:public-football-product
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  SEASON_2026_27_SQUAD_POSITIONS,
  bindingByName,
  normalizeNameKey,
} from "@/lib/squad/season-2026-27-positions";
import { evaluateProfileCompleteness } from "@/lib/players/profile-completeness";
import { hasAnyMatchPerformance } from "@/components/ranking/match-performance-ranking";
import { FITNESS_COMPONENTS } from "@/lib/fitness/protocol";
import type { Player, PlayerSeasonMembership, PlayerSeasonRankingRow } from "@/types";

const root = process.cwd();

function readSrc(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

// 1–4 Positions
assert.equal(bindingByName("Naomi Lattig")?.display_position, "CB");
assert.equal(bindingByName("Naomi Lattig")?.line, "DEF");
assert.equal(bindingByName("Evy Nibbering")?.display_position, "GK");
assert.equal(bindingByName("Evy Nibbering")?.line, "GK");
assert.equal(SEASON_2026_27_SQUAD_POSITIONS.length, 20);

const expected = [
  ["Jelisa De Jonge", "GK"],
  ["Mandy Kalmeijer", "CVM"],
  ["Naomi Lattig", "CB"],
  ["Tess Luijting", "CB"],
  ["Marisha Prins", "LB"],
  ["Isa Oosterhoorn", "RM"],
  ["Danique van Heeringen", "LM"],
  ["Renée Koopman", "RM"],
  ["Melissa Rietveld", "CAM"],
  ["Dionne van Dijk", "CVM"],
  ["Nienke Hoffman", "SP"],
  ["Andrada Timmer", "LM-RM"],
  ["Maura Hoffman", "LB"],
  ["Melissa Donkers", "RB"],
  ["Evy Nibbering", "GK"],
  ["Mariska Oosterhuis", "CB"],
  ["Lorelai Bakker", "RB"],
  ["Anouk Aafjes", "CB"],
  ["Emma de Mie", "LM-SP"],
  ["Demi Luijting", "LM"],
] as const;

for (const [name, pos] of expected) {
  const b = bindingByName(name);
  assert.ok(b, `missing binding for ${name}`);
  assert.equal(b!.display_position, pos, `${name} position`);
}

assert.equal(normalizeNameKey("Renée Koopman"), normalizeNameKey("Renee Koopman"));

const rankingQuery = readSrc("src/lib/queries/ranking.ts");
const membershipLabel = readSrc("src/lib/membership-position-label.ts");
assert.ok(rankingQuery.includes("display_position"));
assert.ok(membershipLabel.includes("displayPosition"));

// 5–7 Ranking empty / no selection-order klassement
const zeroRows: PlayerSeasonRankingRow[] = Array.from({ length: 3 }, (_, i) => ({
  player_id: `p${i}`,
  season_id: "s1",
  full_name: `Speelster ${i}`,
  shirt_number: i + 1,
  position: "MID",
  display_position: "CM",
  photo_url: null,
  role_label: null,
  is_captain: false,
  is_vice_captain: false,
  goals_total: 0,
  assists_total: 0,
  wotm_total: 0,
  matches_played: 0,
  clean_sheets_total: 0,
}));

assert.equal(hasAnyMatchPerformance(zeroRows), false);
assert.equal(
  hasAnyMatchPerformance([{ ...zeroRows[0]!, goals_total: 1 }]),
  true,
);

const rankingPage = readSrc("src/app/(site)/ranking/page.tsx");
assert.ok(rankingPage.includes("hasAnyMatchPerformance"));
assert.ok(rankingPage.includes("Nog geen wedstrijdklassement"));
assert.ok(rankingPage.includes("!hasMatchScores"));
assert.ok(!rankingPage.includes("RankingBoard"));

const matchPerf = readSrc("src/components/ranking/match-performance-ranking.tsx");
assert.ok(matchPerf.includes("filter((r) => valueOf(r, cat) > 0)"));
assert.ok(matchPerf.includes("RankingPodium"));
assert.ok(!matchPerf.includes("shirt_number -"));

// 8–10 Public copy hygiene
assert.ok(!rankingPage.includes("Databron"));
assert.ok(!rankingPage.includes("match_goal_events"));
assert.ok(!rankingPage.includes("wotm_player_id"));
assert.ok(!rankingPage.includes("Disputes"));
assert.ok(!matchPerf.includes("Databron"));
assert.ok(!matchPerf.includes("Disputes"));
assert.ok(!readSrc("src/components/ranking/dual-ranking-panels.tsx").includes("Disputes"));
assert.ok(!readSrc("src/components/ranking/ranking-board.tsx").includes("Disputes"));
assert.ok(!readSrc("src/components/ranking/ranking-board.tsx").includes("Databron"));

// 11 Podium states (source contract)
const podium = readSrc("src/components/ranking/ranking-podium.tsx");
assert.ok(podium.includes("md:order-1"));
assert.ok(podium.includes("md:order-2"));
assert.ok(podium.includes("md:order-3"));
assert.ok(podium.includes("place === 1"));
assert.ok(readSrc("src/app/(site)/dev/ranking-podium-fixture/page.tsx").includes("TESTFIXTURE"));
assert.ok(
  readSrc("src/app/(site)/dev/ranking-podium-fixture/page.tsx").includes(
    'process.env.NODE_ENV === "production"',
  ),
);

// 12–13 Fitheid
const fitheidPage = readSrc("src/app/(site)/fitheid/page.tsx");
assert.ok(fitheidPage.includes("Fitheid"));
assert.ok(fitheidPage.includes("geen nepresultaten") || fitheidPage.includes("geen metingen"));
assert.ok(fitheidPage.includes("30 meter sprint"));
assert.ok(fitheidPage.includes("Agility 10-20-10"));
assert.ok(fitheidPage.includes("Plank"));
assert.ok(fitheidPage.includes("Zes minuten looptest"));
assert.equal(FITNESS_COMPONENTS.length, 4);
assert.ok(!fitheidPage.includes("totalTime"));
assert.ok(!/\bPAC\b/.test(fitheidPage));

// 14–15 Profile completeness
const playerBase: Player = {
  id: "p1",
  full_name: "Test Speelster",
  photo_url: null,
  role_label: null,
  tagline: null,
  bio: null,
  card_note: null,
  initials: "TS",
  preferred_foot: null,
  is_guest: false,
  strengths: null,
};

const mem: PlayerSeasonMembership = {
  id: "m1",
  player_id: "p1",
  season_id: "s1",
  shirt_number: 3,
  position: "DEF",
  display_position: "CB",
  is_captain: false,
  is_vice_captain: false,
  is_guest: false,
};

const withPhotoMissing = evaluateProfileCompleteness(playerBase, mem);
assert.equal(withPhotoMissing.isIncomplete, false);
assert.ok(withPhotoMissing.recommendedMissing.some((i) => i.code === "photo"));
assert.ok(withPhotoMissing.recommendedMissing.some((i) => i.code === "birth_date"));
assert.equal(withPhotoMissing.summaryLabel, "2 punten aanvullen");

const photoOnlyMissing = evaluateProfileCompleteness(
  { ...playerBase, birth_date: "2002-04-05" },
  mem,
);
assert.ok(photoOnlyMissing.recommendedMissing.some((i) => i.code === "photo"));
assert.equal(photoOnlyMissing.summaryLabel, "Foto ontbreekt");

const missingPos = evaluateProfileCompleteness(playerBase, {
  ...mem,
  display_position: "",
  position: "" as never,
});
assert.equal(missingPos.isIncomplete, true);
assert.ok(missingPos.requiredMissing.some((i) => i.code === "position"));
assert.ok(missingPos.summaryLabel?.includes("Positie") || missingPos.requiredMissing[0]?.label.includes("Positie"));

const optionalInternalOk = evaluateProfileCompleteness(
  {
    ...playerBase,
    photo_url: "https://example.com/a.jpg",
    birth_date: "2002-04-05",
    role_label: null,
    tagline: null,
  },
  mem,
);
assert.equal(optionalInternalOk.isIncomplete, false);
assert.equal(optionalInternalOk.summaryLabel, null);

const beheerSpelers = readSrc("src/app/(site)/beheer/spelers/page.tsx");
assert.ok(beheerSpelers.includes("evaluateProfileCompleteness"));
assert.ok(!beheerSpelers.includes("!p.photo_url || !p.role_label || !p.tagline"));
assert.ok(beheerSpelers.includes("Foto ontbreekt") || beheerSpelers.includes("Foto toevoegen"));
assert.ok(beheerSpelers.includes("Geboortedatum ontbreekt"));

// 16 Ratings — no FIFA stats on public cards (comments may mention removal)
const playerCard = readSrc("src/components/players/player-card.tsx").replace(
  /\/\*[\s\S]*?\*\//g,
  "",
);
assert.ok(!/\bPAC\b/.test(playerCard));
assert.ok(!/\bSHO\b/.test(playerCard));
assert.ok(!/\bDRI\b/.test(playerCard));
assert.ok(!playerCard.includes("playerCardData"));
assert.ok(playerCard.includes("Doelpunten"));
assert.ok(readSrc("src/components/players/player-card.tsx").includes("verwijderd"));

// 17 Mobile overflow — responsive grids / min-w-0
assert.ok(rankingPage.includes("min-w-0") || fitheidPage.includes("sm:grid-cols-2"));
assert.ok(fitheidPage.includes("sm:grid-cols-2") || fitheidPage.includes("grid"));

console.log("public-football-product.test.ts: ok");
