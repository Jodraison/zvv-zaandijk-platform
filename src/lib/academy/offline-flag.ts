/**
 * Academy offline shell flag (T-01-05 / C-C25).
 * Forces OfflineBanner visibility for demo, QA and acceptance.
 * Not a full offline cache engine (T-S-01 / Phase F).
 */

function envFlag(name: string): boolean {
  const v = process.env[name]?.trim().toLowerCase();
  return v === "true" || v === "1";
}

/** `ACADEMY_OFFLINE=1|true` shows OfflineBanner under the Academy header. */
export function isAcademyOfflineFlagEnabled(): boolean {
  return envFlag("ACADEMY_OFFLINE");
}

/** Pure visibility rule for OfflineBanner (testable without DOM). */
export function shouldShowAcademyOfflineBanner(offlineFlag: boolean): boolean {
  return offlineFlag === true;
}

export const ACADEMY_OFFLINE_BANNER_COPY = "Offline · cached week" as const;
