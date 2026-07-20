import { AcademyOnboardingProblemenForm } from "@/components/academy/academy-onboarding-problemen-form";
import { requireAcademyAccess } from "@/lib/academy/require-academy-access";
import { readAcademyOnboardingDraft } from "@/lib/academy/onboarding-metadata";
import { listMvpProblems } from "@/lib/academy/registry/loaders";

/**
 * S-11 Onboarding Problemen (T-04-01).
 * Start Academy → onboarding_complete + S-20.
 */
export default async function AcademyOnboardingProblemenPage() {
  const user = await requireAcademyAccess();
  const draft = readAcademyOnboardingDraft(user.user_metadata);
  const problems = listMvpProblems().map((p) => ({
    id: p.id,
    slug: p.slug,
    labelPlayer: p.label_player,
  }));

  return (
    <AcademyOnboardingProblemenForm
      problems={problems}
      hasPrimaryPosition={Boolean(draft.primaryPosition)}
    />
  );
}
