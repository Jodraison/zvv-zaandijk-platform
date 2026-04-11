import type { ClubDatabase, PlayerSeasonRankingRow, PlayerPosition } from "@/types";
import { aggregateSeasonMatchStats, playerTotalsFromAggregate } from "@/lib/queries/season-match-stats";

/**
 * Ranking = query-laag: totalen komen uitsluitend uit `aggregateSeasonMatchStats`
 * (match_goal_events + matches.wotm voor geverifieerde gespeelde wedstrijden).
 */
export function computeRanking(db: ClubDatabase, seasonId: string): PlayerSeasonRankingRow[] {
  if (!seasonId) return [];
  const members = db.player_season_memberships.filter((m) => {
    if (m.season_id !== seasonId) return false;
    const pl = db.players.find((p) => p.id === m.player_id);
    if (pl?.is_guest) return false;
    if (m.is_guest) return false;
    return true;
  });
  const agg = aggregateSeasonMatchStats(db, seasonId);

  const rows: PlayerSeasonRankingRow[] = members.map((mem) => {
    const player = db.players.find((p) => p.id === mem.player_id);
    const name = player?.full_name ?? "Onbekend";
    const photo = player?.photo_url ?? null;
    const t = playerTotalsFromAggregate(agg, mem.player_id);
    const rawShirt = Number(mem.shirt_number);
    const shirt_number =
      Number.isFinite(rawShirt) && rawShirt >= 1 && rawShirt <= 99 ? Math.floor(rawShirt) : 99;

    return {
      player_id: mem.player_id,
      season_id: seasonId,
      full_name: name,
      photo_url: photo,
      shirt_number,
      position: mem.position as PlayerPosition,
      display_position: mem.display_position,
      is_captain: mem.is_captain,
      is_vice_captain: mem.is_vice_captain,
      goals_total: t.goals_total,
      assists_total: t.assists_total,
      wotm_total: t.wotm_total,
      matches_played: t.matches_played,
    };
  });

  rows.sort((a, b) => {
    if (b.goals_total !== a.goals_total) return b.goals_total - a.goals_total;
    if (b.assists_total !== a.assists_total) return b.assists_total - a.assists_total;
    if (b.wotm_total !== a.wotm_total) return b.wotm_total - a.wotm_total;
    if (a.shirt_number !== b.shirt_number) return a.shirt_number - b.shirt_number;
    return a.full_name.localeCompare(b.full_name, "nl");
  });

  return rows;
}
