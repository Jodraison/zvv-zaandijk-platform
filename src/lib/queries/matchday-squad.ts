import type { ClubDatabase } from "@/types";
import { buildMatchSelectablePlayers, isPlayerSelectable } from "@/lib/queries/match-selectable-players";

/** Lijst voor wedstrijdbeheer: seizoen-leden + alle gasten + reeds gebruikte spelers in deze match. */
export function buildMatchdaySquadForAdmin(
  db: ClubDatabase,
  matchId: string,
  seasonId: string,
): {
  player_id: string;
  name: string;
  shirt_number: number | null;
  is_guest: boolean;
  position_label: string | null;
}[] {
  return buildMatchSelectablePlayers(db, seasonId, matchId).map((row) => ({
    player_id: row.playerId,
    name: row.fullName,
    shirt_number: row.shirtNumber,
    is_guest: row.isGuest,
    position_label: row.positionLabel,
  }));
}

export function matchdayShirtForPlayer(
  db: ClubDatabase,
  matchId: string,
  seasonId: string,
  playerId: string,
): number | null {
  const mem = db.player_season_memberships.find((m) => m.player_id === playerId && m.season_id === seasonId);
  if (mem) return mem.shirt_number;
  const roster = db.match_matchday_roster.find((r) => r.match_id === matchId && r.player_id === playerId);
  return roster?.match_shirt_number ?? null;
}

export function isPlayerAllowedOnMatchday(
  db: ClubDatabase,
  matchId: string,
  seasonId: string,
  playerId: string,
): boolean {
  return isPlayerSelectable(db, seasonId, matchId, playerId);
}
