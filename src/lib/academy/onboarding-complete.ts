/**
 * Academy onboarding completion flag (T-02-03).
 * Source of truth: Supabase Auth `user_metadata.onboarding_complete`
 * (existing session layer — no new table). Writer: T-04-01 “Start Academy” (S-11).
 */

/** Canonical key in `user.user_metadata`. */
export const ACADEMY_ONBOARDING_COMPLETE_KEY = "onboarding_complete" as const;

/**
 * Interpret metadata flag. Missing / invalid → incomplete (fail closed).
 * Accepts boolean true or string "true"|"1".
 */
export function isAcademyOnboardingComplete(
  metadata: Record<string, unknown> | null | undefined,
): boolean {
  if (!metadata || typeof metadata !== "object") return false;
  const raw = metadata[ACADEMY_ONBOARDING_COMPLETE_KEY];
  if (raw === true) return true;
  if (raw === false) return false;
  if (typeof raw === "string") {
    const t = raw.trim().toLowerCase();
    if (t === "true" || t === "1") return true;
    if (t === "false" || t === "0" || t === "") return false;
  }
  if (typeof raw === "number") {
    return raw === 1;
  }
  return false;
}
