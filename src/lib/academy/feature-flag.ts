/**
 * Academy MVP mount flag (T-01-01).
 * Server-only env — pass into client via layout props (same pattern as maintenance).
 * Default OFF: flag unset/false → Academy hidden and routes blocked.
 */

function envFlag(name: string): boolean {
  const v = process.env[name]?.trim().toLowerCase();
  return v === "true" || v === "1";
}

/** `ACADEMY_ENABLED=1|true` enables the Football Academy MVP mount at `/academy`. */
export function isAcademyEnabled(): boolean {
  return envFlag("ACADEMY_ENABLED");
}

/** Physical mount prefix for the Football Academy MVP (distinct from legacy `/academie`). */
export const ACADEMY_MOUNT_PATH = "/academy" as const;

export function isAcademyPath(pathname: string): boolean {
  return pathname === ACADEMY_MOUNT_PATH || pathname.startsWith(`${ACADEMY_MOUNT_PATH}/`);
}
