/**
 * Real workflow integration recovery — regressies.
 * Run: npm run test:real-workflow-integration
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  activeSeasonMemberCount,
  catalogGuestPlayers,
  isGuestPlayer,
} from "@/lib/players/season-squad";
import { buildMatchSelectablePlayers } from "@/lib/queries/match-selectable-players";
import {
  computeParticipationIntervals,
  deriveCameOnAsSub,
  deriveStarterIds,
  getMatchShapeAtMinute,
  sumPlayingMinutes,
  validateConfirmedFormation,
} from "@/lib/match/match-shape";
import { FORMATION_SLOT_CODES, type FormationSlotCode } from "@/lib/match/formation-4231";
import { parsePlankToSeconds } from "@/lib/fitness/parse-values";
import type { ClubDatabase, MatchLineupEntry, MatchPositionChange, MatchSubstitution } from "@/types";

const root = process.cwd();

// --- Guests ---
const dbGuests = {
  players: [
    { id: "p1", full_name: "Naomi", photo_url: null, is_guest: false },
    { id: "g1", full_name: "Esmee", photo_url: null, is_guest: true },
    { id: "g2", full_name: "Micah", photo_url: null, is_guest: true },
    { id: "g3", full_name: "Nolita van Nieuwpoort", photo_url: null, is_guest: true },
  ],
  player_season_memberships: [
    {
      id: "m1",
      player_id: "p1",
      season_id: "s1",
      shirt_number: 3,
      position: "DEF",
      display_position: "CB",
      is_captain: false,
      is_vice_captain: false,
      is_guest: false,
    },
  ],
  match_matchday_roster: [],
  match_goal_events: [],
  match_player_stats: [],
  match_lineup_entries: [],
  matches: [],
} as unknown as ClubDatabase;

assert.equal(activeSeasonMemberCount(dbGuests, "s1"), 1);
assert.equal(catalogGuestPlayers(dbGuests).length, 3);
assert.equal(isGuestPlayer(dbGuests, "g1", "s1"), true);

const selectableDefault = buildMatchSelectablePlayers(dbGuests, "s1");
assert.equal(selectableDefault.length, 1);
assert.ok(!selectableDefault.some((p) => p.isGuest));
assert.ok(!selectableDefault.some((p) => /Esmee|Micah|Nolita/i.test(p.fullName)));

const withGuestRoster = {
  ...dbGuests,
  match_matchday_roster: [{ match_id: "m1", player_id: "g1", match_shirt_number: 99, position_label: "MID" }],
} as unknown as ClubDatabase;
const selectableMatch = buildMatchSelectablePlayers(withGuestRoster, "s1", "m1");
assert.equal(selectableMatch.length, 2);
assert.ok(selectableMatch.some((p) => p.playerId === "g1" && p.isGuest));

// Source: match-selectable no longer unions all guests
const selSrc = readFileSync(join(root, "src/lib/queries/match-selectable-players.ts"), "utf8");
assert.ok(!/for \(const guest of db\.players\.filter/.test(selSrc));
assert.ok(selSrc.includes("activeSeasonMembers"));

// --- Formation ---
const slots = Object.fromEntries(FORMATION_SLOT_CODES.map((c, i) => [c, `p${i}`])) as Record<
  FormationSlotCode,
  string
>;
assert.equal(validateConfirmedFormation(slots, ["bench"]).ok, true);
assert.equal(validateConfirmedFormation({ ...slots, GK: null }, []).ok, false);

// --- Rolling substitutions ---
const matchId = "rm1";
const ids = {
  emma: "emma",
  demi: "demi",
  nienke: "nienke",
  sp: "sp-start",
};
const startSlots: Record<FormationSlotCode, string> = {
  GK: "x-GK",
  LB: "x-LB",
  LCB: "x-LCB",
  RCB: "x-RCB",
  RB: "x-RB",
  LCVM: "x-LCVM",
  RCVM: "x-RCVM",
  LM: ids.emma,
  CAM: "x-CAM",
  RM: "x-RM",
  SP: ids.sp,
};
const lineup: MatchLineupEntry[] = [
  ...Object.entries(startSlots).map(([position, player_id], i) => ({
    id: `l${i}`,
    match_id: matchId,
    player_id,
    role: "starter" as const,
    position,
    absence_reason: null,
    sort_order: i,
  })),
  {
    id: "lb",
    match_id: matchId,
    player_id: ids.demi,
    role: "bench",
    position: null,
    absence_reason: null,
    sort_order: 20,
  },
  {
    id: "ln",
    match_id: matchId,
    player_id: ids.nienke,
    role: "bench",
    position: null,
    absence_reason: null,
    sort_order: 21,
  },
];
const subs: MatchSubstitution[] = [
  {
    id: "s1",
    match_id: matchId,
    player_out_id: ids.emma,
    player_in_id: ids.demi,
    minute: 48,
    to_slot: "LM",
    sort_order: 0,
  },
  {
    id: "s2",
    match_id: matchId,
    player_out_id: ids.demi,
    player_in_id: ids.emma,
    minute: 64,
    to_slot: "LM",
    sort_order: 0,
  },
  {
    id: "s3",
    match_id: matchId,
    player_out_id: ids.emma,
    player_in_id: ids.nienke,
    minute: 80,
    to_slot: "SP",
    sort_order: 0,
  },
];
const pos: MatchPositionChange[] = [
  {
    id: "pc1",
    match_id: matchId,
    player_id: ids.emma,
    minute: 72,
    stoppage_time: 0,
    from_slot: "LM",
    to_slot: "SP",
    change_group_id: "g",
    notes: null,
    sort_order: 0,
  },
];
const dbMatch = {
  match_lineup_entries: lineup,
  match_substitutions: subs,
  match_position_changes: pos,
} as unknown as ClubDatabase;

const at0 = getMatchShapeAtMinute(dbMatch, matchId, 0);
assert.equal(at0.slots.LM, ids.emma);
assert.ok(deriveStarterIds(dbMatch, matchId).has(ids.emma));
assert.equal(deriveCameOnAsSub(dbMatch, matchId, ids.demi), true);
assert.equal(deriveCameOnAsSub(dbMatch, matchId, ids.emma), true); // re-entry still counts as came on

const at48 = getMatchShapeAtMinute(dbMatch, matchId, 48);
assert.equal(at48.slots.LM, ids.demi);
assert.ok(at48.substitutedOut.includes(ids.emma));

const at64 = getMatchShapeAtMinute(dbMatch, matchId, 64);
assert.equal(at64.slots.LM, ids.emma); // re-entry

const at72 = getMatchShapeAtMinute(dbMatch, matchId, 72);
assert.equal(at72.slots.SP, ids.emma);
assert.equal(at72.slots.LM, ids.sp); // swap left SP occupant on LM? pos change swaps

const at80 = getMatchShapeAtMinute(dbMatch, matchId, 80);
assert.equal(at80.slots.SP, ids.nienke);

const intervals = computeParticipationIntervals(dbMatch, matchId, 90);
const emmaIv = intervals.filter((x) => x.player_id === ids.emma);
assert.ok(emmaIv.length >= 2);
assert.equal(emmaIv[0].from_minute, 0);
assert.equal(emmaIv[0].to_minute, 48);
assert.equal(emmaIv[1].from_minute, 64);
assert.equal(emmaIv[1].to_minute, 80);
assert.equal(sumPlayingMinutes(intervals, ids.emma, 90), 48 + 16);

// No double occupancy at end
const onPitch = at80.onPitch;
assert.equal(new Set(onPitch).size, onPitch.length);

// --- Fitness parse ---
assert.equal(parsePlankToSeconds("1:30").ok && parsePlankToSeconds("1:30").ok ? (parsePlankToSeconds("1:30") as { value: number }).value : null, 90);
const plank = parsePlankToSeconds("1:30");
assert.ok(plank.ok);
if (plank.ok) assert.equal(plank.value, 90);

// Product routes exist
const nieuw = readFileSync(join(root, "src/app/(site)/beheer/wedstrijden/nieuw/page.tsx"), "utf8");
assert.ok(nieuw.includes("MATCH_WORKFLOW_STEPS"));
assert.ok(nieuw.includes("activeSeasonMemberCount"));

const edit = readFileSync(join(root, "src/app/(site)/beheer/wedstrijden/[matchId]/page.tsx"), "utf8");
assert.ok(edit.includes("MatchWorkflowNav"));
assert.ok(edit.includes("MatchFormationEditor"));
assert.ok(edit.includes("MatchShapeEventsEditor") || edit.includes("na-de-wedstrijd"));
assert.ok(edit.includes("parseMatchWorkflowStep") || edit.includes("opstelling"));

const fitNew = readFileSync(join(root, "src/components/admin/fitness/fitness-new-session-form.tsx"), "utf8");
assert.ok(fitNew.includes("/station/") && (fitNew.includes("startStation") || fitNew.includes("sprint")));

const toevoegen = readFileSync(join(root, "src/app/(site)/beheer/wedstrijd-toevoegen/page.tsx"), "utf8");
assert.ok(!toevoegen.includes("guestPlayers"));
assert.ok(toevoegen.includes("buildMatchSelectablePlayers"));

console.log("real-workflow-integration: OK");
