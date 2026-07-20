/**
 * Pure server-side validation for Academy onboarding writes (T-04-01 closure).
 * No I/O — callers pass registry ID sets from loaders.
 */
import {
  ACADEMY_ALLOWED_EXPERIENCES,
  ACADEMY_DEFAULT_EXPERIENCE,
  type AcademyExperience,
} from "@/lib/academy/onboarding-metadata";

export type AcademyOnboardingValidationOk<T> = { ok: true; value: T };
export type AcademyOnboardingValidationErr = { ok: false; error: string };
export type AcademyOnboardingValidationResult<T> =
  | AcademyOnboardingValidationOk<T>
  | AcademyOnboardingValidationErr;

export type ValidatedPositieStep = {
  primaryPositionId: string;
  secondaryPositionId: string | null;
  experience: AcademyExperience;
};

export type ValidatedStartAcademy = {
  primaryPositionId: string;
  secondaryPositionId: string | null;
  experience: AcademyExperience;
  problemIds: string[];
};

function isAllowedExperience(raw: string): raw is AcademyExperience {
  return (ACADEMY_ALLOWED_EXPERIENCES as readonly string[]).includes(raw);
}

export function validateAcademyPositieStepInput(input: {
  primaryPositionId: string;
  secondaryPositionId?: string | null;
  experience?: string | null;
  allowedPositionIds: ReadonlySet<string>;
}): AcademyOnboardingValidationResult<ValidatedPositieStep> {
  const primary = typeof input.primaryPositionId === "string" ? input.primaryPositionId.trim() : "";
  if (!primary || !input.allowedPositionIds.has(primary)) {
    return { ok: false, error: "Kies een geldige primaire positie." };
  }

  let secondary: string | null = null;
  if (input.secondaryPositionId != null && String(input.secondaryPositionId).trim() !== "") {
    secondary = String(input.secondaryPositionId).trim();
    if (!input.allowedPositionIds.has(secondary)) {
      return { ok: false, error: "Secondary positie is ongeldig." };
    }
    if (secondary === primary) {
      return { ok: false, error: "Secondary positie moet anders zijn dan primary." };
    }
  }

  const experienceRaw =
    input.experience == null || String(input.experience).trim() === ""
      ? ACADEMY_DEFAULT_EXPERIENCE
      : String(input.experience).trim();
  if (!isAllowedExperience(experienceRaw)) {
    return { ok: false, error: "Ervaring is ongeldig." };
  }

  return {
    ok: true,
    value: {
      primaryPositionId: primary,
      secondaryPositionId: secondary,
      experience: experienceRaw,
    },
  };
}

/**
 * Validates Start Academy problem selection + requires prior S-10 draft fields.
 * Duplicates fail (not silently collapsed). Non-MVP IDs fail via mvpProblemIds set.
 */
export function validateAcademyStartAcademyInput(input: {
  problemIds: unknown;
  draftPrimaryPosition: string | null;
  draftSecondaryPosition: string | null;
  draftExperience: string | null;
  mvpProblemIds: ReadonlySet<string>;
  allowedPositionIds: ReadonlySet<string>;
}): AcademyOnboardingValidationResult<ValidatedStartAcademy> {
  if (!input.draftPrimaryPosition || !input.allowedPositionIds.has(input.draftPrimaryPosition)) {
    return { ok: false, error: "Kies eerst je positie (vorige stap)." };
  }

  if (
    input.draftSecondaryPosition &&
    (!input.allowedPositionIds.has(input.draftSecondaryPosition) ||
      input.draftSecondaryPosition === input.draftPrimaryPosition)
  ) {
    return { ok: false, error: "Secondary positie is ongeldig. Ga terug naar positie." };
  }

  const experienceRaw = input.draftExperience?.trim() || ACADEMY_DEFAULT_EXPERIENCE;
  if (!isAllowedExperience(experienceRaw)) {
    return { ok: false, error: "Ervaring is ongeldig. Ga terug naar positie." };
  }

  if (!Array.isArray(input.problemIds)) {
    return { ok: false, error: "Kies minstens 1 probleem." };
  }

  const rawIds = input.problemIds.filter((p): p is string => typeof p === "string" && p.trim() !== "");
  if (rawIds.length < 1) {
    return { ok: false, error: "Kies minstens 1 probleem." };
  }
  if (rawIds.length > 2) {
    return { ok: false, error: "Kies maximaal 2 problemen." };
  }

  const unique = new Set(rawIds);
  if (unique.size !== rawIds.length) {
    return { ok: false, error: "Dubbele problemen zijn niet toegestaan." };
  }

  for (const id of rawIds) {
    if (!input.mvpProblemIds.has(id)) {
      return { ok: false, error: "Een gekozen probleem is ongeldig." };
    }
  }

  return {
    ok: true,
    value: {
      primaryPositionId: input.draftPrimaryPosition,
      secondaryPositionId: input.draftSecondaryPosition,
      experience: experienceRaw,
      problemIds: rawIds,
    },
  };
}
