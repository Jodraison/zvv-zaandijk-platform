/**
 * Centraal seizoencontract voor aanvoerderschap.
 * DB-bron: player_season_memberships.is_captain / is_vice_captain.
 * Canon 2026/27: Melissa Rietveld (C), Dionne van Dijk (VC).
 */
import { SEASON_2026_27_ID } from "@/lib/season/season-operations-2026-27";
import { normalizeNameKey } from "@/lib/squad/season-2026-27-positions";

export type LeadershipRole = "captain" | "vice_captain" | null;

export const SEASON_LEADERSHIP_CANON: Record<
  string,
  { captainName: string; viceCaptainName: string }
> = {
  [SEASON_2026_27_ID]: {
    captainName: "Melissa Rietveld",
    viceCaptainName: "Dionne van Dijk",
  },
};

export function leadershipRoleFromFlags(isCaptain: boolean, isViceCaptain: boolean): LeadershipRole {
  if (isCaptain) return "captain";
  if (isViceCaptain) return "vice_captain";
  return null;
}

/** Publiek Nederlands label. */
export function leadershipLabelNl(role: LeadershipRole): string | null {
  if (role === "captain") return "Aanvoerder";
  if (role === "vice_captain") return "Vice-aanvoerder";
  return null;
}

/** Compacte veldbadge. */
export function leadershipBadgeShort(role: LeadershipRole): string | null {
  if (role === "captain") return "C";
  if (role === "vice_captain") return "VC";
  return null;
}

export function expectedLeadershipRoleForName(seasonId: string, fullName: string): LeadershipRole {
  const canon = SEASON_LEADERSHIP_CANON[seasonId];
  if (!canon) return null;
  const key = normalizeNameKey(fullName);
  if (key === normalizeNameKey(canon.captainName)) return "captain";
  if (key === normalizeNameKey(canon.viceCaptainName)) return "vice_captain";
  return null;
}
