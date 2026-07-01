import type { ClubDatabase, MatchLineupRole } from "@/types";
import type { MatchLineupEntryInput } from "@/lib/validations/match-lineup";

export const MAX_LINEUP_STARTERS = 11;

export const LINEUP_ROLE_LABELS: Record<MatchLineupRole, string> = {
  starter: "Basis",
  bench: "Bank",
  absent: "Afwezig",
};

/** Actieve seizoensselectie: lidmaatschap in dit seizoen, geen gast-speelster. */
export function isSeasonSquadPlayer(db: ClubDatabase, seasonId: string, playerId: string): boolean {
  const p = db.players.find((x) => x.id === playerId);
  if (!p || p.is_guest) return false;
  return db.player_season_memberships.some((m) => m.player_id === playerId && m.season_id === seasonId);
}

export function seasonSquadPlayerIds(db: ClubDatabase, seasonId: string): string[] {
  const guestIds = new Set(db.players.filter((p) => p.is_guest).map((p) => p.id));
  return db.player_season_memberships
    .filter((m) => m.season_id === seasonId && !guestIds.has(m.player_id))
    .map((m) => m.player_id);
}

export function membershipPositionLabel(
  db: ClubDatabase,
  seasonId: string,
  playerId: string,
): string | null {
  const mem = db.player_season_memberships.find((m) => m.player_id === playerId && m.season_id === seasonId);
  if (!mem) return null;
  return mem.display_position?.trim() || mem.position || null;
}

export function validateMatchLineup(
  db: ClubDatabase,
  seasonId: string,
  entries: MatchLineupEntryInput[],
): { ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string[]> } {
  const seen = new Set<string>();
  let starterCount = 0;

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const path = `lineup.${i}`;

    if (!db.players.some((p) => p.id === e.player_id)) {
      return {
        ok: false,
        error: "Onbekende speelster in opstelling.",
        fieldErrors: { [path]: ["Speelster bestaat niet."] },
      };
    }

    if (!isSeasonSquadPlayer(db, seasonId, e.player_id)) {
      return {
        ok: false,
        error: "Opstelling mag alleen speelsters uit de seizoensselectie bevatten.",
        fieldErrors: { [path]: ["Geen actief seizoenslidmaatschap."] },
      };
    }

    if (seen.has(e.player_id)) {
      return {
        ok: false,
        error: "Elke speelster kan maar één keer in de opstelling voorkomen.",
        fieldErrors: { lineup: ["Dubbele speelster in opstelling."] },
      };
    }
    seen.add(e.player_id);

    if (e.role === "starter") starterCount += 1;
    if (e.role !== "absent" && e.absence_reason) {
      return {
        ok: false,
        error: "Afwezigheidsreden alleen toegestaan bij afwezige speelsters.",
        fieldErrors: { [path]: ["Verwijder de reden of kies ‘afwezig’."] },
      };
    }
  }

  if (starterCount > MAX_LINEUP_STARTERS) {
    return {
      ok: false,
      error: `Maximaal ${MAX_LINEUP_STARTERS} speelsters in de basis.`,
      fieldErrors: { lineup: [`Basis mag maximaal ${MAX_LINEUP_STARTERS} speelsters bevatten.`] },
    };
  }

  return { ok: true };
}
