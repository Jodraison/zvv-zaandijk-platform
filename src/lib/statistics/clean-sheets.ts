import type { ClubDatabase, PlayerPosition } from "@/types";
import { SEASON_2026_27_ID } from "@/lib/season/season-operations-2026-27";
import { computePlayerSlotIntervals, matchHasReconstructableSlots } from "@/lib/match/match-shape";

/**
 * Speler-clean sheets vanaf seizoen 2026/27:
 * - Zaandijk kreeg 0 tegendoelpunten
 * - speelster heeft daadwerkelijk minuten gespeeld (basis of inval)
 * - zij heeft in DÍE wedstrijd een defensieve rol gespeeld (niet haar profielpositie)
 *
 * Canonical regel (geen extra minuutdrempel — die bestond niet):
 * "daadwerkelijk gespeeld in een defensieve rol tijdens de clean-sheetwedstrijd".
 * Elke reconstructeerbare interval op GK/LB/LCB/CB/RCB/RB/LWB/RWB telt.
 * Start als RB en later RM telt dus wél; start als SP telt niet.
 *
 * Team-clean sheets (wedstrijden met goals_against === 0) blijven apart in team-season-summary.
 */

/** Formation / display codes die clean sheets mogen ontvangen. */
export const CLEAN_SHEET_ELIGIBLE_SLOTS = new Set([
  "GK",
  "CB",
  "LCB",
  "RCB",
  "LB",
  "RB",
  "LWB",
  "RWB",
]);

export function isCleanSheetEligibleSlot(position: string | null | undefined): boolean {
  if (!position) return false;
  return CLEAN_SHEET_ELIGIBLE_SLOTS.has(position.trim().toUpperCase());
}

export function isCleanSheetEligibleMembership(
  position: PlayerPosition | string | null | undefined,
  displayPosition?: string | null,
): boolean {
  const line = String(position ?? "")
    .trim()
    .toUpperCase();
  if (line === "GK" || line === "DEF") return true;
  return isCleanSheetEligibleSlot(displayPosition);
}

/** Player clean-sheet counting starts with season 2026/27 (and later). */
export function isPlayerCleanSheetSeason(db: ClubDatabase, seasonId: string): boolean {
  if (!seasonId) return false;
  if (seasonId === SEASON_2026_27_ID) return true;
  const season = db.seasons.find((s) => s.id === seasonId);
  if (!season?.starts_on) return false;
  return season.starts_on >= "2026-08-01";
}

/**
 * Did this player appear in the match (starter or substituted in)?
 */
export function playerAppearedInMatch(db: ClubDatabase, matchId: string, playerId: string): boolean {
  const entry = db.match_lineup_entries.find((e) => e.match_id === matchId && e.player_id === playerId);
  if (entry?.role === "starter") return true;
  if (db.match_substitutions.some((s) => s.match_id === matchId && s.player_in_id === playerId)) {
    return true;
  }
  return false;
}

/**
 * Effectieve defensieve/keeper-rol in deze wedstrijd.
 * Heeft de wedstrijd reconstructeerbare match-slots, dan telt ALLEEN die historie —
 * nooit de profielpositie als vervanging.
 */
export function isPlayerCleanSheetEligibleInMatch(
  db: ClubDatabase,
  seasonId: string,
  matchId: string,
  playerId: string,
): boolean {
  if (!playerAppearedInMatch(db, matchId, playerId)) return false;

  const intervals = computePlayerSlotIntervals(db, matchId, 90).filter((iv) => iv.player_id === playerId);
  if (intervals.length > 0) {
    return intervals.some((iv) => isCleanSheetEligibleSlot(iv.slot));
  }

  // Geen profielfallback. Zonder reconstructeerbaar defensief interval: geen credit.
  void seasonId;
  return false;
}

export type CleanSheetAmbiguity = {
  matchId: string;
  playerId: string;
  reason: "appeared_without_slot_while_match_has_slots" | "no_reconstructable_slots";
};

/** Rapportage: geen fictieve posities schrijven; wel markeren wat ambigu is. Geen credit-fallback. */
export function listCleanSheetAmbiguities(
  db: ClubDatabase,
  seasonId: string,
  matchId: string,
): CleanSheetAmbiguity[] {
  const out: CleanSheetAmbiguity[] = [];
  const hasSlots = matchHasReconstructableSlots(db, matchId);
  const appeared = new Set<string>();
  for (const e of db.match_lineup_entries.filter((row) => row.match_id === matchId && row.role === "starter")) {
    appeared.add(e.player_id);
  }
  for (const s of db.match_substitutions.filter((row) => row.match_id === matchId)) {
    appeared.add(s.player_in_id);
  }
  const intervalPlayers = new Set(computePlayerSlotIntervals(db, matchId, 90).map((iv) => iv.player_id));
  for (const playerId of appeared) {
    if (hasSlots && !intervalPlayers.has(playerId)) {
      out.push({ matchId, playerId, reason: "appeared_without_slot_while_match_has_slots" });
    } else if (!hasSlots && playerAppearedInMatch(db, matchId, playerId)) {
      out.push({ matchId, playerId, reason: "no_reconstructable_slots" });
    }
  }
  void seasonId;
  return out;
}

/** Show clean-sheet stat on profile when player is GK/DEF or already has credits. */
export function shouldShowPlayerCleanSheetsStat(
  position: PlayerPosition | string | null | undefined,
  displayPosition: string | null | undefined,
  cleanSheetsTotal: number,
): boolean {
  return cleanSheetsTotal > 0 || isCleanSheetEligibleMembership(position, displayPosition);
}
