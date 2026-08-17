/**
 * Four blockers — source + contract invariants.
 * Run: npm run test:four-blockers-real-browser
 * Playwright evidence: node scripts/four-blockers-reality-gate.mjs
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  SEASON_LEADERSHIP_CANON,
  leadershipBadgeShort,
  leadershipLabelNl,
  leadershipRoleFromFlags,
  expectedLeadershipRoleForName,
} from "@/lib/squad/season-leadership";
import { SEASON_2026_27_ID } from "@/lib/season/season-operations-2026-27";
import { FORMATION_4231_SLOTS } from "@/lib/match/formation-4231";

const root = process.cwd();
console.log("→ four-blockers-real-browser");

// A — Leadership contract
const canon = SEASON_LEADERSHIP_CANON[SEASON_2026_27_ID];
assert.ok(canon);
assert.equal(canon!.captainName, "Melissa Rietveld");
assert.equal(canon!.viceCaptainName, "Dionne van Dijk");
assert.equal(expectedLeadershipRoleForName(SEASON_2026_27_ID, "Melissa Rietveld"), "captain");
assert.equal(expectedLeadershipRoleForName(SEASON_2026_27_ID, "Dionne van Dijk"), "vice_captain");
assert.equal(expectedLeadershipRoleForName(SEASON_2026_27_ID, "Jelisa De Jonge"), null);
assert.equal(leadershipLabelNl("captain"), "Aanvoerder");
assert.equal(leadershipLabelNl("vice_captain"), "Vice-aanvoerder");
assert.equal(leadershipBadgeShort("captain"), "C");
assert.equal(leadershipBadgeShort("vice_captain"), "VC");
assert.equal(leadershipRoleFromFlags(true, false), "captain");
assert.equal(leadershipRoleFromFlags(false, true), "vice_captain");

const playerCard = readFileSync(join(root, "src/components/players/player-card.tsx"), "utf8");
assert.match(playerCard, /Aanvoerder/);
assert.match(playerCard, /Vice-aanvoerder/);
assert.match(playerCard, /leadershipLabelNl/);

const profile = readFileSync(join(root, "src/components/players/player-profile-hero.tsx"), "utf8");
assert.match(profile, /Vice-aanvoerder/);
assert.doesNotMatch(profile, />Assistent</);

// B — Fitness header non-sticky
const fitness = readFileSync(join(root, "src/components/admin/fitness/fitness-station-entry.tsx"), "utf8");
assert.match(fitness, /data-fitness-station-header/);
assert.doesNotMatch(fitness, /sticky top-0 z-20/);
assert.match(fitness, /data-fitness-column-header/);

// C — Lineup pitch fail-safe
const pitch = readFileSync(join(root, "src/components/match/formation-pitch.tsx"), "utf8");
assert.match(pitch, /clamp\(760px,\s*78vw,\s*960px\)/);
assert.match(pitch, /minHeight:\s*"760px"/);
assert.match(pitch, /data-testid=\"formation-pitch\"/);
assert.match(pitch, /is_captain/);
assert.match(pitch, /Kies speelster/);
assert.equal(FORMATION_4231_SLOTS.length, 11);

const editor = readFileSync(join(root, "src/components/admin/match-formation-editor.tsx"), "utf8");
assert.match(editor, /Op veld/);
assert.match(editor, /is_captain/);
assert.match(editor, /FormationPitch/);

const picker = readFileSync(join(root, "src/components/admin/match-player-picker.tsx"), "utf8");
assert.match(picker, /is_captain/);
assert.match(picker, /Vice-aanvoerder|Aanvoerder/);

// D — Participant gate + scorer contract
const adminForm = readFileSync(join(root, "src/components/admin/match-admin-form.tsx"), "utf8");
assert.match(adminForm, /lineup-selection-gate/);
assert.match(adminForm, /De wedstrijdselectie is nog niet compleet/);
assert.match(adminForm, /Ga naar Opstelling/);
assert.match(adminForm, /fromLineupParticipants|initialLineup\.starters/);
assert.match(adminForm, /doelpunten ingevoerd/);
assert.match(adminForm, /filter\(\(m\) => m\.player_id !== g\.scorer_player_id\)/);

const leadershipSrc = readFileSync(join(root, "src/lib/squad/season-leadership.ts"), "utf8");
assert.match(leadershipSrc, /Melissa Rietveld/);
assert.match(leadershipSrc, /Dionne van Dijk/);

const artDir = join(root, ".review-artifacts/four-blockers-real-browser-recovery");
assert.ok(existsSync(artDir), "artifacts dir verplicht");

console.log("four-blockers-real-browser.test.ts: ok");
