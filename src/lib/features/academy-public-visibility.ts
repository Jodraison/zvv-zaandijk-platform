/**
 * Central Academy public-visibility config (WP-1).
 *
 * Controls the legacy public Football Academy mount at `/academie`
 * (Decision Lab + category learn paths). Distinct from:
 * - `ACADEMY_ENABLED` → MVP mount `/academy` (`src/lib/academy/feature-flag.ts`)
 * - `ACADEMY_OFFLINE` → offline banner under `/academy` only
 *
 * Server-only env — pass booleans into client via layout props (same pattern as
 * maintenance / ACADEMY_ENABLED). Fail closed: unset or invalid → hidden.
 */

function envFlag(name: string): boolean {
  const v = process.env[name]?.trim().toLowerCase();
  return v === "true" || v === "1";
}

/** Physical mount for the public Football Academy (legacy `/academie`). */
export const ACADEMIE_PUBLIC_MOUNT_PATH = "/academie" as const;

/**
 * Env: `ACADEMY_PUBLIC_VISIBLE=1|true` shows `/academie` in public nav and allows
 * direct routes. Default / unset / any other value → false (fail closed).
 */
export const ACADEMY_PUBLIC_VISIBLE_ENV = "ACADEMY_PUBLIC_VISIBLE" as const;

/** Whether `/academie` is publicly discoverable and reachable. */
export function isAcademiePublicVisible(): boolean {
  return envFlag(ACADEMY_PUBLIC_VISIBLE_ENV);
}

export function isAcademiePublicPath(pathname: string): boolean {
  return (
    pathname === ACADEMIE_PUBLIC_MOUNT_PATH ||
    pathname.startsWith(`${ACADEMIE_PUBLIC_MOUNT_PATH}/`)
  );
}

/**
 * Middleware / layout guard helper.
 * Returns true when the request must be redirected away from `/academie`.
 */
export function shouldBlockAcademiePublicAccess(
  pathname: string,
  publicVisible: boolean = isAcademiePublicVisible(),
): boolean {
  return isAcademiePublicPath(pathname) && !publicVisible;
}

/**
 * Typed central feature surface for Academy visibility.
 * - `publicVisible` — `/academie` nav + direct routes
 * - `adminVisible` — reserved; no Academy admin UI/CTA exists today (always true)
 *
 * Does not merge or replace `ACADEMY_ENABLED` / `ACADEMY_OFFLINE`.
 */
export function getAcademyFeatures() {
  return {
    academy: {
      publicVisible: isAcademiePublicVisible(),
      adminVisible: true as const,
    },
  } as const;
}

export type AcademyFeatures = ReturnType<typeof getAcademyFeatures>;
