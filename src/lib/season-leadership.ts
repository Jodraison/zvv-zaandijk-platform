import type { ClubDatabase } from "@/types";

/** Na wijzigingen aan aanvoerdersvlaggen: max. één C en één VC per seizoen, nooit dezelfde speelster. */
export function assertSeasonLeadershipValid(db: ClubDatabase, seasonId: string): void {
  const rows = db.player_season_memberships.filter((m) => m.season_id === seasonId);
  const caps = rows.filter((m) => m.is_captain);
  const vices = rows.filter((m) => m.is_vice_captain);
  if (caps.length > 1) {
    throw new Error("Er mag maar één aanvoerder per seizoen zijn.");
  }
  if (vices.length > 1) {
    throw new Error("Er mag maar één assistent-aanvoerder per seizoen zijn.");
  }
  const capId = caps[0]?.player_id;
  const viceId = vices[0]?.player_id;
  if (capId && viceId && capId === viceId) {
    throw new Error("Aanvoerder en assistent-aanvoerder mogen niet dezelfde speelster zijn.");
  }
}
