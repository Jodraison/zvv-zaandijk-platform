import type { ClubDatabase } from "@/types";
import { activeSeasonMembers, catalogGuestPlayers, isGuestPlayer } from "@/lib/players/season-squad";

export type MatchSelectablePlayer = {
  playerId: string;
  fullName: string;
  shirtNumber: number | null;
  positionLabel: string | null;
  isGuest: boolean;
  hasSeasonMembership: boolean;
  isAlreadyInMatch: boolean;
  sourceTags: Array<"season" | "guest" | "roster" | "event" | "stats" | "mvp">;
};

/**
 * Standaard: alleen actieve seizoensleden (geen gasten).
 * Gasten verschijnen uitsluitend wanneer zij via match_matchday_roster
 * of bestaande match-events aan deze wedstrijd gekoppeld zijn.
 */
export function buildMatchSelectablePlayers(
  db: ClubDatabase,
  seasonId: string,
  matchId?: string,
): MatchSelectablePlayer[] {
  const out = new Map<string, MatchSelectablePlayer>();
  const addTag = (playerId: string, tag: MatchSelectablePlayer["sourceTags"][number]) => {
    const row = out.get(playerId);
    if (!row) return;
    if (!row.sourceTags.includes(tag)) row.sourceTags.push(tag);
  };
  const ensure = (playerId: string) => {
    if (out.has(playerId)) return out.get(playerId)!;
    const p = db.players.find((x) => x.id === playerId);
    if (!p) return null;
    const mem = db.player_season_memberships.find((m) => m.player_id === playerId && m.season_id === seasonId);
    const roster = matchId
      ? db.match_matchday_roster.find((r) => r.match_id === matchId && r.player_id === playerId)
      : null;
    const row: MatchSelectablePlayer = {
      playerId,
      fullName: p.full_name,
      shirtNumber: roster?.match_shirt_number ?? mem?.shirt_number ?? null,
      positionLabel: roster?.position_label?.trim() || mem?.display_position?.trim() || mem?.position || null,
      isGuest: isGuestPlayer(db, playerId, seasonId),
      hasSeasonMembership: !!mem && !mem.is_guest && !p.is_guest,
      isAlreadyInMatch: false,
      sourceTags: [],
    };
    out.set(playerId, row);
    return row;
  };

  for (const { player, membership } of activeSeasonMembers(db, seasonId)) {
    if (!ensure(player.id)) continue;
    addTag(player.id, "season");
    void membership;
  }

  if (matchId) {
    for (const r of db.match_matchday_roster.filter((x) => x.match_id === matchId)) {
      const row = ensure(r.player_id);
      if (!row) continue;
      row.isAlreadyInMatch = true;
      if (r.match_shirt_number != null) row.shirtNumber = r.match_shirt_number;
      if (r.position_label?.trim()) row.positionLabel = r.position_label.trim();
      addTag(r.player_id, row.isGuest ? "guest" : "roster");
    }
    for (const e of db.match_goal_events.filter((x) => x.match_id === matchId)) {
      for (const pid of [e.scorer_player_id, e.assist_player_id].filter(Boolean) as string[]) {
        const row = ensure(pid);
        if (!row) continue;
        row.isAlreadyInMatch = true;
        addTag(pid, "event");
      }
    }
    for (const s of db.match_player_stats.filter((x) => x.match_id === matchId)) {
      const row = ensure(s.player_id);
      if (!row) continue;
      row.isAlreadyInMatch = true;
      addTag(s.player_id, "stats");
    }
    const m = db.matches.find((x) => x.id === matchId);
    if (m?.wotm_player_id) {
      const row = ensure(m.wotm_player_id);
      if (row) {
        row.isAlreadyInMatch = true;
        addTag(m.wotm_player_id, "mvp");
      }
    }
    for (const e of db.match_lineup_entries.filter((x) => x.match_id === matchId)) {
      const row = ensure(e.player_id);
      if (!row) continue;
      row.isAlreadyInMatch = true;
      addTag(e.player_id, row.isGuest ? "guest" : "roster");
    }
  }

  const bucket = (p: MatchSelectablePlayer) => {
    if (p.hasSeasonMembership && !p.isGuest) return 0;
    if (p.isGuest) return 2;
    return 1;
  };
  return [...out.values()].sort((a, b) => {
    const ba = bucket(a);
    const bb = bucket(b);
    if (ba !== bb) return ba - bb;
    return a.fullName.localeCompare(b.fullName, "nl");
  });
}

/** Gasten die nog niet aan deze wedstrijd hangen — voor expliciete “+ Gastspeelster”. */
export function buildAvailableGuestsForMatch(
  db: ClubDatabase,
  matchId: string,
): { playerId: string; fullName: string }[] {
  const already = new Set(
    db.match_matchday_roster.filter((r) => r.match_id === matchId).map((r) => r.player_id),
  );
  return catalogGuestPlayers(db)
    .filter((p) => !already.has(p.id))
    .map((p) => ({ playerId: p.id, fullName: p.full_name }));
}

export function isPlayerSelectable(
  db: ClubDatabase,
  seasonId: string,
  matchId: string,
  playerId: string,
): boolean {
  return buildMatchSelectablePlayers(db, seasonId, matchId).some((p) => p.playerId === playerId);
}
