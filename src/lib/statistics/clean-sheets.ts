import type { ClubDatabase, PlayerPosition } from "@/types";
import { SEASON_2026_27_ID } from "@/lib/season/season-operations-2026-27";

/**
 * Speler-clean sheets vanaf seizoen 2026/27:
 * - speelster heeft meegespeeld (basis of inval)
 * - team kreeg geen tegendoelpunt
 * - speelster stond als keeper of verdediger (incl. centrale verdedigers)
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
 * Effective defensive/keeper role for clean-sheet eligibility in a match.
 * Prefer lineup/formation slot; fall back to season membership for subs without a slot.
 */
export function isPlayerCleanSheetEligibleInMatch(
  db: ClubDatabase,
  seasonId: string,
  matchId: string,
  playerId: string,
): boolean {
  if (!playerAppearedInMatch(db, matchId, playerId)) return false;

  const entry = db.match_lineup_entries.find((e) => e.match_id === matchId && e.player_id === playerId);
  if (entry && isCleanSheetEligibleSlot(entry.position)) return true;

  // Position change onto a clean-sheet slot (e.g. midfielder moved to CB).
  const changes = db.match_position_changes
    .filter((c) => c.match_id === matchId && c.player_id === playerId)
    .slice()
    .sort((a, b) => a.minute - b.minute || a.sort_order - b.sort_order);
  const lastChange = changes[changes.length - 1];
  if (lastChange && isCleanSheetEligibleSlot(lastChange.to_slot)) {
    return true;
  }

  const mem = db.player_season_memberships.find((m) => m.player_id === playerId && m.season_id === seasonId);
  if (!mem) return false;
  // Subs / incomplete lineup slots: membership line GK/DEF counts.
  if (entry?.role === "starter" && !entry.position) {
    return isCleanSheetEligibleMembership(mem.position, mem.display_position);
  }
  if (db.match_substitutions.some((s) => s.match_id === matchId && s.player_in_id === playerId)) {
    return isCleanSheetEligibleMembership(mem.position, mem.display_position);
  }
  return false;
}

/** Show clean-sheet stat on profile when player is GK/DEF or already has credits. */
export function shouldShowPlayerCleanSheetsStat(
  position: PlayerPosition | string | null | undefined,
  displayPosition: string | null | undefined,
  cleanSheetsTotal: number,
): boolean {
  return cleanSheetsTotal > 0 || isCleanSheetEligibleMembership(position, displayPosition);
}
