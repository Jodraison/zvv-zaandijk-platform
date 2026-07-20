"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAcademyEnabled } from "@/lib/academy/feature-flag";
import {
  assertCanonicalOnboardingKeysOnly,
  assertNoRoleKeysInOnboardingPayload,
  buildAcademyPositieStepMetadata,
  buildAcademyStartAcademyMetadata,
  readAcademyOnboardingDraft,
} from "@/lib/academy/onboarding-metadata";
import {
  validateAcademyPositieStepInput,
  validateAcademyStartAcademyInput,
} from "@/lib/academy/onboarding-validate";
import { listMvpProblems, loadPositions } from "@/lib/academy/registry/loaders";
import { academyRoutes } from "@/lib/academy/routes";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AcademyOnboardingActionResult =
  | { ok: true }
  | { ok: false; error: string };

function positionIdSet(): Set<string> {
  return new Set(loadPositions().map((p) => p.id));
}

function mvpProblemIdSet(): Set<string> {
  return new Set(listMvpProblems().map((p) => p.id));
}

async function requireAcademyUser() {
  if (!isAcademyEnabled()) {
    return { ok: false as const, error: "Academy is niet beschikbaar." };
  }
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return { ok: false as const, error: "Je bent niet ingelogd." };
  }
  return { ok: true as const, supabase, user };
}

/**
 * S-10 “Volgende” — persist primary (+ optional secondary) + experience.
 * Does not set onboarding_complete. Invalid input → no updateUser, no redirect.
 */
export async function saveAcademyOnboardingPositieAction(input: {
  primaryPositionId: string;
  secondaryPositionId?: string | null;
  experience?: string;
}): Promise<AcademyOnboardingActionResult> {
  const auth = await requireAcademyUser();
  if (!auth.ok) return auth;

  const validated = validateAcademyPositieStepInput({
    primaryPositionId: input.primaryPositionId,
    secondaryPositionId: input.secondaryPositionId,
    experience: input.experience,
    allowedPositionIds: positionIdSet(),
  });
  if (!validated.ok) {
    return { ok: false, error: validated.error };
  }

  const data = buildAcademyPositieStepMetadata(validated.value);
  if (!assertNoRoleKeysInOnboardingPayload(data) || !assertCanonicalOnboardingKeysOnly(data)) {
    return { ok: false, error: "Ongeldige metadata." };
  }

  const { error } = await auth.supabase.auth.updateUser({ data });
  if (error) {
    return { ok: false, error: "Opslaan mislukt. Probeer opnieuw." };
  }

  revalidatePath(academyRoutes.onboardingPositie);
  revalidatePath(academyRoutes.onboardingProblemen);
  redirect(academyRoutes.onboardingProblemen);
}

/**
 * S-11 “Start Academy” — problems + onboarding_complete from server draft + MVP registry.
 * Invalid input → no updateUser, no redirect to S-20.
 * Position/experience re-read from session metadata (not client) to avoid overwrite with stale client data.
 */
export async function completeAcademyOnboardingAction(input: {
  problemIds: string[];
}): Promise<AcademyOnboardingActionResult> {
  const auth = await requireAcademyUser();
  if (!auth.ok) return auth;

  const draft = readAcademyOnboardingDraft(
    (auth.user.user_metadata ?? {}) as Record<string, unknown>,
  );

  const validated = validateAcademyStartAcademyInput({
    problemIds: input.problemIds,
    draftPrimaryPosition: draft.primaryPosition,
    draftSecondaryPosition: draft.secondaryPosition,
    draftExperience: draft.experience,
    mvpProblemIds: mvpProblemIdSet(),
    allowedPositionIds: positionIdSet(),
  });
  if (!validated.ok) {
    return { ok: false, error: validated.error };
  }

  const data = buildAcademyStartAcademyMetadata(validated.value);
  if (!assertNoRoleKeysInOnboardingPayload(data) || !assertCanonicalOnboardingKeysOnly(data)) {
    return { ok: false, error: "Ongeldige metadata." };
  }

  const { error } = await auth.supabase.auth.updateUser({ data });
  if (error) {
    return { ok: false, error: "Start mislukt. Probeer opnieuw." };
  }

  revalidatePath(academyRoutes.root);
  revalidatePath(academyRoutes.positie);
  revalidatePath(academyRoutes.onboardingPositie);
  revalidatePath(academyRoutes.onboardingProblemen);
  redirect(academyRoutes.positie);
}
