import type { ClubDatabase } from "@/types";

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
    const roster = matchId ? db.match_matchday_roster.find((r) => r.match_id === matchId && r.player_id === playerId) : null;
    const row: MatchSelectablePlayer = {
      playerId,
      fullName: p.full_name,
      shirtNumber: roster?.match_shirt_number ?? mem?.shirt_number ?? null,
      positionLabel: roster?.position_label?.trim() || mem?.display_position?.trim() || mem?.position || null,
      isGuest: !!p.is_guest,
      hasSeasonMembership: !!mem,
      isAlreadyInMatch: false,
      sourceTags: [],
    };
    out.set(playerId, row);
    return row;
  };

  for (const mem of db.player_season_memberships.filter((m) => m.season_id === seasonId)) {
    if (!ensure(mem.player_id)) continue;
    addTag(mem.player_id, "season");
  }
  for (const guest of db.players.filter((p) => p.is_guest)) {
    if (!ensure(guest.id)) continue;
    addTag(guest.id, "guest");
  }

  if (matchId) {
    for (const r of db.match_matchday_roster.filter((x) => x.match_id === matchId)) {
      const row = ensure(r.player_id);
      if (!row) continue;
      row.isAlreadyInMatch = true;
      if (r.match_shirt_number != null) row.shirtNumber = r.match_shirt_number;
      if (r.position_label?.trim()) row.positionLabel = r.position_label.trim();
      addTag(r.player_id, "roster");
    }
    for (const e of db.match_goal_events.filter((x) => x.match_id === matchId)) {
      const scorer = ensure(e.scorer_player_id);
      if (scorer) {
        scorer.isAlreadyInMatch = true;
        addTag(e.scorer_player_id, "event");
      }
      if (e.assist_player_id) {
        const assist = ensure(e.assist_player_id);
        if (assist) {
          assist.isAlreadyInMatch = true;
          addTag(e.assist_player_id, "event");
        }
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
  }

  const bucket = (p: MatchSelectablePlayer) => {
    if (p.hasSeasonMembership) return 0;
    if (!p.isGuest) return 1;
    return 2;
  };
  return [...out.values()].sort((a, b) => {
    const ba = bucket(a);
    const bb = bucket(b);
    if (ba !== bb) return ba - bb;
    return a.fullName.localeCompare(b.fullName, "nl");
  });
}

export function isPlayerSelectable(
  db: ClubDatabase,
  seasonId: string,
  matchId: string,
  playerId: string,
): boolean {
  return buildMatchSelectablePlayers(db, seasonId, matchId).some((p) => p.playerId === playerId);
}
