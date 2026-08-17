/**
 * Canonieke scheiding: actieve seizoensleden vs match-scoped gasten.
 */
import type { ClubDatabase, Player, PlayerSeasonMembership } from "@/types";
import { sortPlayersBySquadNumber } from "@/lib/players/sort-by-squad-number";

export type SeasonMemberRow = {
  player: Player;
  membership: PlayerSeasonMembership;
};

/** Speelster is gast wanneer player-flag of membership-flag dat zegt. */
export function isGuestPlayer(
  db: ClubDatabase,
  playerId: string,
  seasonId?: string,
): boolean {
  const p = db.players.find((x) => x.id === playerId);
  if (!p) return false;
  if (p.is_guest) return true;
  if (seasonId) {
    const m = db.player_season_memberships.find(
      (x) => x.player_id === playerId && x.season_id === seasonId,
    );
    if (m?.is_guest) return true;
  }
  return false;
}

/** Vaste actieve selectie — nooit gasten. */
export function activeSeasonMembers(db: ClubDatabase, seasonId: string): SeasonMemberRow[] {
  const rows: SeasonMemberRow[] = [];
  for (const membership of db.player_season_memberships.filter((m) => m.season_id === seasonId)) {
    if (membership.is_guest) continue;
    const player = db.players.find((p) => p.id === membership.player_id);
    if (!player || player.is_guest) continue;
    rows.push({ player, membership });
  }
  return sortPlayersBySquadNumber(
    rows.map((r) => ({
      ...r,
      shirt_number: r.membership.shirt_number,
      name: r.player.full_name,
      is_guest: false,
    })),
  ).map(({ player, membership }) => ({ player, membership }));
}

export function activeSeasonMemberCount(db: ClubDatabase, seasonId: string): number {
  return activeSeasonMembers(db, seasonId).length;
}

export function activeSeasonMemberIds(db: ClubDatabase, seasonId: string): Set<string> {
  return new Set(activeSeasonMembers(db, seasonId).map((r) => r.player.id));
}

/** Alle gastspelers in het systeem (niet standaard tonen). */
export function catalogGuestPlayers(db: ClubDatabase): Player[] {
  return db.players
    .filter((p) => p.is_guest)
    .sort((a, b) => a.full_name.localeCompare(b.full_name, "nl"));
}

/** Gasten gekoppeld aan één wedstrijd via matchday roster. */
export function matchScopedGuestIds(db: ClubDatabase, matchId: string): Set<string> {
  const ids = new Set<string>();
  for (const r of db.match_matchday_roster.filter((x) => x.match_id === matchId)) {
    const p = db.players.find((x) => x.id === r.player_id);
    if (p?.is_guest) ids.add(r.player_id);
  }
  return ids;
}
