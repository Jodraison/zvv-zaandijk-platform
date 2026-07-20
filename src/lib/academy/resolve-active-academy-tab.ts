/**
 * Central active-tab resolver for BottomTabBar (T-01-03).
 * Prefix-match per domain; content/zoek/onboarding/team → no tab.
 */
import { ACADEMY_MOUNT_PATH } from "@/lib/academy/feature-flag";
import { ACADEMY_BOTTOM_TABS, type AcademyTabId } from "@/lib/academy/academy-bottom-tabs";
import { academyRoutes } from "@/lib/academy/routes";

function matchesTabRoot(pathname: string, tabHref: string): boolean {
  return pathname === tabHref || pathname.startsWith(`${tabHref}/`);
}

/**
 * Returns the active bottom-tab id, or `null` when no tab should appear selected
 * (e.g. `/academy/content/...`, `/academy/zoek`, team/onboarding).
 */
export function resolveActiveAcademyTab(pathname: string): AcademyTabId | null {
  if (!pathname.startsWith(ACADEMY_MOUNT_PATH)) {
    return null;
  }

  for (const tab of ACADEMY_BOTTOM_TABS) {
    if (matchesTabRoot(pathname, tab.href)) {
      return tab.id;
    }
  }

  return null;
}

/**
 * BottomTabBar visibility — frozen shell rule:
 * hide during onboarding (S-10/S-11); show on speelster Academy surfaces.
 * Desktop hide is CSS (mobile-only component until SidebarNav).
 */
export function shouldShowAcademyBottomTabBar(pathname: string): boolean {
  if (!pathname.startsWith(ACADEMY_MOUNT_PATH)) {
    return false;
  }
  if (
    pathname === academyRoutes.onboardingPositie ||
    pathname.startsWith(`${academyRoutes.onboardingPositie}/`) ||
    pathname === academyRoutes.onboardingProblemen ||
    pathname.startsWith(`${academyRoutes.onboardingProblemen}/`) ||
    pathname.startsWith(`${ACADEMY_MOUNT_PATH}/onboarding`)
  ) {
    return false;
  }
  return true;
}
