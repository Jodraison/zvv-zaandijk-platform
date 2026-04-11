export const CLUB_NAME = "ZVV Zaandijk";

/**
 * Canonical team string in domain logic (scores, imports). Do not change without data migration.
 */
export const TEAM_LABEL = "Zaandijk VR1";

/** All user-visible UI copy for our first team */
export const TEAM_DISPLAY_LABEL = "Zaandijk VRZ1";

export const TEAM_DISPLAY_LABEL_UPPER = "ZAANDIJK VRZ1";

/** Map internal score strings to display names (UI only). */
export function displayTeamLabel(internalName: string): string {
  return internalName === TEAM_LABEL ? TEAM_DISPLAY_LABEL : internalName;
}
