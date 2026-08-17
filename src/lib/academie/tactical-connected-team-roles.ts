/**
 * connected-team roles — delegates to Academy Tactical Film Standard V1.
 * Internal IDs stay us.L6 / us.R6 / us.SP / …; visible labels are 6 / 8 / ST / LCB / RCB.
 */

import {
  ACADEMY_DISPLAY_ROLE_BY_ID,
  ACADEMY_FORBIDDEN_DISPLAY_LABELS,
  academyDisplayRole,
} from "@/lib/academie/tactical-film-standard-v1";

export const CONNECTED_TEAM_ROLE_MAP = ACADEMY_DISPLAY_ROLE_BY_ID;

export type ConnectedTeamPlayerId = string;

/** Holding 6 (internal us.L6). */
export const CONNECTED_TEAM_SIX_ID = "us.L6" as const;
/** Connecting 8 (internal us.R6). */
export const CONNECTED_TEAM_EIGHT_ID = "us.R6" as const;
/** Striker (internal us.SP). */
export const CONNECTED_TEAM_ST_ID = "us.SP" as const;

export function connectedTeamDisplayLabel(playerId: string): string {
  return academyDisplayRole(playerId);
}

/** Forbidden visible tokens on connected-team markers. */
export const CONNECTED_TEAM_FORBIDDEN_LABELS = ACADEMY_FORBIDDEN_DISPLAY_LABELS;
