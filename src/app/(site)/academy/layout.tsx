import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireAcademyAccess } from "@/lib/academy/require-academy-access";
import { resolveAcademyRoleGrants } from "@/lib/academy/academy-role-grants";
import {
  isAcademyOfflineFlagEnabled,
  shouldShowAcademyOfflineBanner,
} from "@/lib/academy/offline-flag";
import { isAcademyOnboardingComplete } from "@/lib/academy/onboarding-complete";
import { resolveAcademyOnboardingGate } from "@/lib/academy/onboarding-gate";
import { academyRoutes } from "@/lib/academy/routes";
import { AcademyAppHeader } from "@/components/academy/academy-app-header";
import { AcademyBottomTabBar } from "@/components/academy/academy-bottom-tab-bar";
import { AcademyOfflineBanner } from "@/components/academy/academy-offline-banner";
import { AcademyShellMain } from "@/components/academy/academy-shell-main";

/**
 * Academy shell: auth · onboarding gate (T-02-03) · header · tabs · offline banner.
 * Gate also runs in middleware; layout re-checks with x-pathname (defense in depth).
 */
export default async function AcademyMountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAcademyAccess();
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? academyRoutes.root;
  const gate = resolveAcademyOnboardingGate({
    onboardingComplete: isAcademyOnboardingComplete(user.user_metadata),
    pathname,
  });
  if (gate.action === "redirect") {
    redirect(gate.to);
  }

  const roleGrants = resolveAcademyRoleGrants({
    email: user.email,
    displayName:
      typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : typeof user.user_metadata?.name === "string"
          ? user.user_metadata.name
          : null,
  });
  const showOfflineBanner = shouldShowAcademyOfflineBanner(isAcademyOfflineFlagEnabled());

  return (
    <div className="relative flex min-h-[50vh] flex-col">
      <div className="sticky top-0 z-40">
        <AcademyAppHeader
          positionAbbrev="—"
          positionNameNl="Positie nog niet gekozen"
          roleGrants={roleGrants}
        />
        {showOfflineBanner ? <AcademyOfflineBanner /> : null}
      </div>
      <AcademyShellMain>{children}</AcademyShellMain>
      <AcademyBottomTabBar />
    </div>
  );
}
