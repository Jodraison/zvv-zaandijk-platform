/**
 * Reconstructie van de twee 0-GA wedstrijden 2026/27 (WSV, Krommenie).
 * Run: npx tsx src/lib/statistics/clean-sheet-live-matches.test.ts
 */
import assert from "node:assert/strict";
import type { ClubDatabase, MatchLineupEntry, MatchPositionChange, MatchSubstitution } from "@/types";
import { computePlayerSlotIntervals } from "@/lib/match/match-shape";
import { isCleanSheetEligibleSlot, isPlayerCleanSheetEligibleInMatch } from "@/lib/statistics/clean-sheets";
import { aggregateSeasonMatchStats, playerTotalsFromAggregate } from "@/lib/queries/season-match-stats";
import { SEASON_2026_27_ID } from "@/lib/season/season-operations-2026-27";

const NAMES: Record<string, string> = {
  "f1000001-0000-4000-8000-000000000001": "Jelisa De Jonge",
  "f1000001-0000-4000-8000-000000000004": "Marisha Prins",
  "f1000001-0000-4000-8000-000000000005": "Anouk Aafjes",
  "f1000001-0000-4000-8000-000000000006": "Tess Luijting",
  "f1000001-0000-4000-8000-000000000007": "Lorelai Bakker",
  "f1000001-0000-4000-8000-00000000000a": "Mandy Kalmeijer",
  "f1000001-0000-4000-8000-00000000000c": "Dionne van Dijk",
  "f1000001-0000-4000-8000-000000000011": "Danique van Heeringen",
  "f1000001-0000-4000-8000-00000000000b": "Melissa Rietveld",
  "f1000001-0000-4000-8000-000000000010": "Andrada Timmer",
  "f1000001-0000-4000-8000-00000000000d": "Emma de Mie",
  "f1000001-0000-4000-8000-000000000009": "Renée Koopman",
  "f1000001-0000-4000-8000-00000000000f": "Nienke Hoffman",
  "4cdd7301-8ab1-4cdc-83bf-0c964ed55408": "Emie Agema",
};

const DIONNE = "f1000001-0000-4000-8000-00000000000c";
const RENEE = "f1000001-0000-4000-8000-000000000009";
const ANDRADA = "f1000001-0000-4000-8000-000000000010";
const WSV = "c1ccbec0-3619-4c5f-adb0-3111b6055a7e";
const KRO = "e616230f-af80-4a71-80e4-48e27a1df61c";

function minutesOf(
  hist: ReturnType<typeof computePlayerSlotIntervals>,
  playerId: string,
): number {
  return hist
    .filter((h) => h.player_id === playerId)
    .reduce((sum, h) => sum + Math.max(0, (h.to_minute ?? 90) - h.from_minute), 0);
}

function slotsOf(hist: ReturnType<typeof computePlayerSlotIntervals>, playerId: string): string[] {
  return hist.filter((h) => h.player_id === playerId).map((h) => h.slot);
}

function dbFor(
  matchId: string,
  opponent: string,
  lineup: MatchLineupEntry[],
  pos: MatchPositionChange[],
  subs: MatchSubstitution[],
): ClubDatabase {
  return {
    seasons: [
      {
        id: SEASON_2026_27_ID,
        name: "26/27",
        starts_on: "2026-08-01",
        ends_on: "2027-06-30",
        is_active: true,
      },
    ],
    players: Object.entries(NAMES).map(([id, full_name]) => ({
      id,
      full_name,
      photo_url: null,
      is_guest: false,
    })),
    player_season_memberships: Object.keys(NAMES).map((id, i) => ({
      id: `mem-${id}`,
      player_id: id,
      season_id: SEASON_2026_27_ID,
      shirt_number: i + 1,
      position: "MID",
      display_position: "CVM",
      is_captain: false,
      is_vice_captain: false,
      is_guest: false,
    })),
    matches: [
      {
        id: matchId,
        season_id: SEASON_2026_27_ID,
        opponent,
        kickoff_at: "2026-01-01T00:00:00Z",
        is_home: true,
        match_type: "competition",
        location: null,
        referee: null,
        notes: null,
        goals_for: 3,
        goals_against: 0,
        status: "played",
        wotm_player_id: null,
        integrity_state: "verified",
        data_scope: "production",
      },
    ],
    match_lineup_entries: lineup,
    match_position_changes: pos,
    match_substitutions: subs,
    match_goal_events: [],
    match_wotm_winners: [],
  } as unknown as ClubDatabase;
}

const wsv = dbFor(
  WSV,
  "WSV",
  [
    { id: "1", match_id: WSV, player_id: "f1000001-0000-4000-8000-000000000001", role: "starter", position: "GK", absence_reason: null, sort_order: 0 },
    { id: "2", match_id: WSV, player_id: "f1000001-0000-4000-8000-000000000004", role: "starter", position: "LB", absence_reason: null, sort_order: 1 },
    { id: "3", match_id: WSV, player_id: "f1000001-0000-4000-8000-000000000005", role: "starter", position: "LCB", absence_reason: null, sort_order: 2 },
    { id: "4", match_id: WSV, player_id: "f1000001-0000-4000-8000-000000000006", role: "starter", position: "RCB", absence_reason: null, sort_order: 3 },
    { id: "5", match_id: WSV, player_id: "f1000001-0000-4000-8000-000000000007", role: "starter", position: "RB", absence_reason: null, sort_order: 4 },
    { id: "6", match_id: WSV, player_id: "f1000001-0000-4000-8000-00000000000a", role: "starter", position: "LCVM", absence_reason: null, sort_order: 5 },
    { id: "7", match_id: WSV, player_id: DIONNE, role: "starter", position: "RCVM", absence_reason: null, sort_order: 6 },
    { id: "8", match_id: WSV, player_id: "f1000001-0000-4000-8000-000000000011", role: "starter", position: "LM", absence_reason: null, sort_order: 7 },
    { id: "9", match_id: WSV, player_id: "f1000001-0000-4000-8000-00000000000b", role: "starter", position: "CAM", absence_reason: null, sort_order: 8 },
    { id: "10", match_id: WSV, player_id: ANDRADA, role: "starter", position: "RM", absence_reason: null, sort_order: 9 },
    { id: "11", match_id: WSV, player_id: "f1000001-0000-4000-8000-00000000000d", role: "starter", position: "SP", absence_reason: null, sort_order: 10 },
    { id: "12", match_id: WSV, player_id: RENEE, role: "bench", position: null, absence_reason: null, sort_order: 11 },
    { id: "13", match_id: WSV, player_id: "f1000001-0000-4000-8000-00000000000f", role: "bench", position: null, absence_reason: null, sort_order: 12 },
  ],
  [
    { id: "p1", match_id: WSV, player_id: RENEE, minute: 45, stoppage_time: 0, from_slot: "RB", to_slot: "RCVM", change_group_id: "1741239c-1771-406f-aa58-d83be12dd241", notes: null, sort_order: 0 },
    { id: "p2", match_id: WSV, player_id: DIONNE, minute: 45, stoppage_time: 0, from_slot: "RCVM", to_slot: "RM", change_group_id: "1741239c-1771-406f-aa58-d83be12dd241", notes: null, sort_order: 1 },
    { id: "p3", match_id: WSV, player_id: ANDRADA, minute: 45, stoppage_time: 0, from_slot: "RM", to_slot: "RB", change_group_id: "1741239c-1771-406f-aa58-d83be12dd241", notes: null, sort_order: 2 },
  ],
  [
    { id: "s1", match_id: WSV, player_in_id: RENEE, player_out_id: "f1000001-0000-4000-8000-000000000007", minute: 25, to_slot: null, stoppage_time: 0, sort_order: 0, change_group_id: null, notes: null },
    { id: "s2", match_id: WSV, player_in_id: "f1000001-0000-4000-8000-00000000000f", player_out_id: "f1000001-0000-4000-8000-000000000011", minute: 60, to_slot: null, stoppage_time: 0, sort_order: 1, change_group_id: null, notes: null },
  ],
);

const kro = dbFor(
  KRO,
  "Krommenie",
  [
    { id: "1", match_id: KRO, player_id: "f1000001-0000-4000-8000-000000000001", role: "starter", position: "GK", absence_reason: null, sort_order: 0 },
    { id: "2", match_id: KRO, player_id: "f1000001-0000-4000-8000-000000000004", role: "starter", position: "LB", absence_reason: null, sort_order: 1 },
    { id: "3", match_id: KRO, player_id: "f1000001-0000-4000-8000-000000000005", role: "starter", position: "LCB", absence_reason: null, sort_order: 2 },
    { id: "4", match_id: KRO, player_id: "f1000001-0000-4000-8000-000000000006", role: "starter", position: "RCB", absence_reason: null, sort_order: 3 },
    { id: "5", match_id: KRO, player_id: ANDRADA, role: "starter", position: "RB", absence_reason: null, sort_order: 4 },
    { id: "6", match_id: KRO, player_id: "f1000001-0000-4000-8000-00000000000a", role: "starter", position: "LCVM", absence_reason: null, sort_order: 5 },
    { id: "7", match_id: KRO, player_id: RENEE, role: "starter", position: "RCVM", absence_reason: null, sort_order: 6 },
    { id: "8", match_id: KRO, player_id: "f1000001-0000-4000-8000-000000000011", role: "starter", position: "LM", absence_reason: null, sort_order: 7 },
    { id: "9", match_id: KRO, player_id: "f1000001-0000-4000-8000-00000000000b", role: "starter", position: "CAM", absence_reason: null, sort_order: 8 },
    { id: "10", match_id: KRO, player_id: DIONNE, role: "starter", position: "RM", absence_reason: null, sort_order: 9 },
    { id: "11", match_id: KRO, player_id: "f1000001-0000-4000-8000-00000000000d", role: "starter", position: "SP", absence_reason: null, sort_order: 10 },
    { id: "12", match_id: KRO, player_id: "4cdd7301-8ab1-4cdc-83bf-0c964ed55408", role: "bench", position: null, absence_reason: null, sort_order: 11 },
    { id: "13", match_id: KRO, player_id: "f1000001-0000-4000-8000-000000000007", role: "bench", position: null, absence_reason: null, sort_order: 12 },
    { id: "14", match_id: KRO, player_id: "f1000001-0000-4000-8000-00000000000f", role: "bench", position: null, absence_reason: null, sort_order: 13 },
  ],
  [
    { id: "k1", match_id: KRO, player_id: DIONNE, minute: 75, stoppage_time: 0, from_slot: "RM", to_slot: "RCVM", change_group_id: null, notes: null, sort_order: 0 },
    { id: "k2", match_id: KRO, player_id: ANDRADA, minute: 74, stoppage_time: 0, from_slot: "RB", to_slot: "RM", change_group_id: null, notes: null, sort_order: 1 },
  ],
  [
    { id: "ks1", match_id: KRO, player_in_id: "4cdd7301-8ab1-4cdc-83bf-0c964ed55408", player_out_id: "f1000001-0000-4000-8000-00000000000d", minute: 60, to_slot: null, stoppage_time: 0, sort_order: 0, change_group_id: null, notes: null },
    { id: "ks2", match_id: KRO, player_in_id: "f1000001-0000-4000-8000-000000000007", player_out_id: RENEE, minute: 75, to_slot: "RB", stoppage_time: 0, sort_order: 1, change_group_id: null, notes: null },
    { id: "ks3", match_id: KRO, player_in_id: "f1000001-0000-4000-8000-00000000000f", player_out_id: "f1000001-0000-4000-8000-000000000011", minute: 85, to_slot: null, stoppage_time: 0, sort_order: 2, change_group_id: null, notes: null },
  ],
);

const both = {
  ...wsv,
  matches: [...wsv.matches, ...kro.matches],
  match_lineup_entries: [...wsv.match_lineup_entries, ...kro.match_lineup_entries],
  match_position_changes: [...wsv.match_position_changes, ...kro.match_position_changes],
  match_substitutions: [...wsv.match_substitutions, ...kro.match_substitutions],
} as ClubDatabase;

const wsvHist = computePlayerSlotIntervals(wsv, WSV, 90);
const kroHist = computePlayerSlotIntervals(kro, KRO, 90);

assert.deepEqual(slotsOf(wsvHist, DIONNE), ["RCVM", "RM"]);
assert.equal(wsvHist.some((h) => h.player_id === DIONNE && isCleanSheetEligibleSlot(h.slot)), false);
assert.equal(isPlayerCleanSheetEligibleInMatch(wsv, SEASON_2026_27_ID, WSV, DIONNE), false);
assert.equal(minutesOf(wsvHist, DIONNE), 90);

assert.deepEqual(slotsOf(kroHist, DIONNE), ["RM", "RCVM"]);
assert.equal(kroHist.some((h) => h.player_id === DIONNE && h.slot === "RB"), false);
assert.equal(isPlayerCleanSheetEligibleInMatch(kro, SEASON_2026_27_ID, KRO, DIONNE), false);

assert.ok(wsvHist.some((h) => h.player_id === RENEE && h.slot === "RB" && h.from_minute === 25 && h.to_minute === 45));
assert.equal(isPlayerCleanSheetEligibleInMatch(wsv, SEASON_2026_27_ID, WSV, RENEE), true);
assert.equal(isPlayerCleanSheetEligibleInMatch(kro, SEASON_2026_27_ID, KRO, RENEE), false);

assert.ok(wsvHist.some((h) => h.player_id === ANDRADA && h.slot === "RB"));
assert.ok(kroHist.some((h) => h.player_id === ANDRADA && h.slot === "RB"));
assert.equal(isPlayerCleanSheetEligibleInMatch(wsv, SEASON_2026_27_ID, WSV, ANDRADA), true);
assert.equal(isPlayerCleanSheetEligibleInMatch(kro, SEASON_2026_27_ID, KRO, ANDRADA), true);

const totals = playerTotalsFromAggregate(aggregateSeasonMatchStats(both, SEASON_2026_27_ID), DIONNE);
assert.equal(totals.clean_sheets_total, 0);
assert.equal(playerTotalsFromAggregate(aggregateSeasonMatchStats(both, SEASON_2026_27_ID), RENEE).clean_sheets_total, 1);
assert.equal(playerTotalsFromAggregate(aggregateSeasonMatchStats(both, SEASON_2026_27_ID), ANDRADA).clean_sheets_total, 2);

const watch = [
  ["Jelisa De Jonge", "f1000001-0000-4000-8000-000000000001", 2],
  ["Anouk Aafjes", "f1000001-0000-4000-8000-000000000005", 2],
  ["Tess Luijting", "f1000001-0000-4000-8000-000000000006", 2],
  ["Marisha Prins", "f1000001-0000-4000-8000-000000000004", 2],
  ["Lorelai Bakker", "f1000001-0000-4000-8000-000000000007", 2],
] as const;
for (const [label, id, expected] of watch) {
  assert.equal(
    playerTotalsFromAggregate(aggregateSeasonMatchStats(both, SEASON_2026_27_ID), id).clean_sheets_total,
    expected,
    label,
  );
}

console.log("clean-sheet-live-matches.test.ts: ok");
