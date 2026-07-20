/**
 * Academy onboarding user_metadata contract (T-04-01 certification).
 *
 * Canonical storage keys = Journey Freeze §1 data table:
 *   user.primary_position · secondary_position · onboarding_problems · experience
 * Completion key = T-02-03 / backlog: onboarding_complete
 *
 * Abbreviations elsewhere (NOT storage keys):
 *   backlog DoD “primary_pos” · ARCH entity table “primary_pos”
 *   content-schema “primary_position_id” (entity field, not auth metadata)
 */
import { ACADEMY_ONBOARDING_COMPLETE_KEY } from "@/lib/academy/onboarding-complete";

export { ACADEMY_ONBOARDING_COMPLETE_KEY };

/** Journey: `user.primary_position` — NOT backlog shorthand `primary_pos`. */
export const ACADEMY_PRIMARY_POSITION_KEY = "primary_position" as const;
/** Journey: `user.secondary_position` — NOT ARCH shorthand `secondary_pos`. */
export const ACADEMY_SECONDARY_POSITION_KEY = "secondary_position" as const;
/** Journey: `user.onboarding_problems` — NOT backlog shorthand `problems`. */
export const ACADEMY_ONBOARDING_PROBLEMS_KEY = "onboarding_problems" as const;
/** Journey: `user.experience` */
export const ACADEMY_EXPERIENCE_KEY = "experience" as const;

/** Frozen experience values (Journey scenario 1). */
export const ACADEMY_ALLOWED_EXPERIENCES = ["4e-klasse"] as const;
export type AcademyExperience = (typeof ACADEMY_ALLOWED_EXPERIENCES)[number];
export const ACADEMY_DEFAULT_EXPERIENCE: AcademyExperience = "4e-klasse";

/** Keys that must never appear in onboarding update payloads. */
export const ACADEMY_ONBOARDING_FORBIDDEN_PAYLOAD_KEYS = [
  "role",
  "is_admin",
  "admin",
  "captain",
  "trainer",
  "permissions",
  "app_metadata",
] as const;

export type AcademyOnboardingDraft = {
  primaryPosition: string | null;
  secondaryPosition: string | null;
  experience: string | null;
  problemIds: string[];
  complete: boolean;
};

export function readAcademyOnboardingDraft(
  metadata: Record<string, unknown> | null | undefined,
): AcademyOnboardingDraft {
  const primary = metadata?.[ACADEMY_PRIMARY_POSITION_KEY];
  const secondary = metadata?.[ACADEMY_SECONDARY_POSITION_KEY];
  const experience = metadata?.[ACADEMY_EXPERIENCE_KEY];
  const problems = metadata?.[ACADEMY_ONBOARDING_PROBLEMS_KEY];

  return {
    primaryPosition: typeof primary === "string" && primary.length > 0 ? primary : null,
    secondaryPosition:
      typeof secondary === "string" && secondary.length > 0 ? secondary : null,
    experience: typeof experience === "string" && experience.length > 0 ? experience : null,
    problemIds: Array.isArray(problems)
      ? problems.filter((p): p is string => typeof p === "string" && p.length > 0)
      : [],
    complete: metadata?.[ACADEMY_ONBOARDING_COMPLETE_KEY] === true,
  };
}

/** Payload for S-10 “Volgende” — does NOT set onboarding_complete. */
export function buildAcademyPositieStepMetadata(input: {
  primaryPositionId: string;
  secondaryPositionId: string | null;
  experience: AcademyExperience;
}): Record<string, string | null> {
  return {
    [ACADEMY_PRIMARY_POSITION_KEY]: input.primaryPositionId,
    [ACADEMY_SECONDARY_POSITION_KEY]: input.secondaryPositionId,
    [ACADEMY_EXPERIENCE_KEY]: input.experience,
  };
}

/**
 * Payload for S-11 “Start Academy”.
 * Only onboarding keys — never role/admin fields.
 *
 * Supabase Auth `updateUser({ data })` **merges** `data` into existing
 * `user_metadata` server-side (does not replace the whole object).
 */
export function buildAcademyStartAcademyMetadata(input: {
  primaryPositionId: string;
  secondaryPositionId: string | null;
  experience: AcademyExperience;
  problemIds: string[];
}): Record<string, string | null | boolean | string[]> {
  return {
    ...buildAcademyPositieStepMetadata({
      primaryPositionId: input.primaryPositionId,
      secondaryPositionId: input.secondaryPositionId,
      experience: input.experience,
    }),
    [ACADEMY_ONBOARDING_PROBLEMS_KEY]: input.problemIds,
    [ACADEMY_ONBOARDING_COMPLETE_KEY]: true,
  };
}

export function assertNoRoleKeysInOnboardingPayload(payload: Record<string, unknown>): boolean {
  const forbidden = new Set(
    ACADEMY_ONBOARDING_FORBIDDEN_PAYLOAD_KEYS.map((k) => k.toLowerCase()),
  );
  return !Object.keys(payload).some((k) => forbidden.has(k.toLowerCase()));
}

/** True when payload uses Journey keys and never backlog/ARCH shorthand aliases. */
export function assertCanonicalOnboardingKeysOnly(payload: Record<string, unknown>): boolean {
  const bannedAliases = ["primary_pos", "secondary_pos", "problems", "primary_position_id"];
  if (Object.keys(payload).some((k) => bannedAliases.includes(k))) return false;
  const allowed = new Set<string>([
    ACADEMY_PRIMARY_POSITION_KEY,
    ACADEMY_SECONDARY_POSITION_KEY,
    ACADEMY_EXPERIENCE_KEY,
    ACADEMY_ONBOARDING_PROBLEMS_KEY,
    ACADEMY_ONBOARDING_COMPLETE_KEY,
  ]);
  return Object.keys(payload).every((k) => allowed.has(k));
}
