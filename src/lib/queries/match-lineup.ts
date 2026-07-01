import type { ClubDatabase, MatchLineupEntry, MatchLineupRole } from "@/types";
import { membershipPositionLabel } from "@/lib/match-lineup";

export type MatchLineupInitial = {
  starters: string[];
  bench: string[];
  absent: { player_id: string; absence_reason: string | null }[];
};

export function getMatchLineupInitial(db: ClubDatabase, matchId: string): MatchLineupInitial {
  const entries = db.match_lineup_entries.filter((e) => e.match_id === matchId);
  const byRole = (role: MatchLineupRole) =>
    entries
      .filter((e) => e.role === role)
      .sort((a, b) => a.sort_order - b.sort_order || a.player_id.localeCompare(b.player_id));

  return {
    starters: byRole("starter").map((e) => e.player_id),
    bench: byRole("bench").map((e) => e.player_id),
    absent: byRole("absent").map((e) => ({
      player_id: e.player_id,
      absence_reason: e.absence_reason,
    })),
  };
}

export type MatchLineupDisplayRow = {
  player_id: string;
  name: string;
  shirt_number: number | null;
  position_label: string | null;
};

export type MatchLineupDisplay = {
  starters: MatchLineupDisplayRow[];
  bench: MatchLineupDisplayRow[];
};

function resolveRow(
  db: ClubDatabase,
  seasonId: string,
  entry: MatchLineupEntry,
): MatchLineupDisplayRow | null {
  const p = db.players.find((x) => x.id === entry.player_id);
  if (!p) return null;
  const mem = db.player_season_memberships.find((m) => m.player_id === entry.player_id && m.season_id === seasonId);
  return {
    player_id: entry.player_id,
    name: p.full_name,
    shirt_number: mem?.shirt_number ?? null,
    position_label: entry.position?.trim() || membershipPositionLabel(db, seasonId, entry.player_id),
  };
}

export function buildMatchLineupDisplay(
  db: ClubDatabase,
  matchId: string,
  seasonId: string,
): MatchLineupDisplay {
  const entries = db.match_lineup_entries.filter((e) => e.match_id === matchId);
  const starters = entries
    .filter((e) => e.role === "starter")
    .sort((a, b) => a.sort_order - b.sort_order || a.player_id.localeCompare(b.player_id))
    .map((e) => resolveRow(db, seasonId, e))
    .filter((r): r is MatchLineupDisplayRow => !!r);
  const bench = entries
    .filter((e) => e.role === "bench")
    .sort((a, b) => a.sort_order - b.sort_order || a.player_id.localeCompare(b.player_id))
    .map((e) => resolveRow(db, seasonId, e))
    .filter((r): r is MatchLineupDisplayRow => !!r);
  return { starters, bench };
}
