import { AcademyOnboardingPositieForm } from "@/components/academy/academy-onboarding-positie-form";
import { requireAcademyAccess } from "@/lib/academy/require-academy-access";
import { readAcademyOnboardingDraft } from "@/lib/academy/onboarding-metadata";
import { loadPositions } from "@/lib/academy/registry/loaders";

/**
 * S-10 Onboarding Positie (T-04-01).
 * Gate: incomplete only (T-02-03). UI + persist draft → S-11.
 */
export default async function AcademyOnboardingPositiePage() {
  const user = await requireAcademyAccess();
  const draft = readAcademyOnboardingDraft(user.user_metadata);
  const positions = loadPositions()
    .slice()
    .sort((a, b) => (a.sort_order ?? 99) - (b.sort_order ?? 99))
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      nameNl: p.name_nl,
      abbrev: p.abbrev,
    }));

  return (
    <AcademyOnboardingPositieForm
      positions={positions}
      initialPrimaryId={draft.primaryPosition}
      initialSecondaryId={draft.secondaryPosition}
    />
  );
}
