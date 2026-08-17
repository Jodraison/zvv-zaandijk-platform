/**
 * Single source for public site nav items (desktop + mobile share this list).
 * Academy visibility comes from central features — no scattered hardcodes.
 */

import { academyRoutes } from "@/lib/academy/routes";
import { ACADEMIE_PUBLIC_MOUNT_PATH } from "@/lib/features/academy-public-visibility";

export type SiteNavItem = { href: string; label: string };

/** Core club nav including Academie entry (filtered by `academyPublicVisible`). */
export const BASE_NAV_ITEMS: readonly SiteNavItem[] = [
  { href: "/", label: "Home" },
  { href: "/selectie", label: "Selectie" },
  { href: "/wedstrijden", label: "Wedstrijden" },
  { href: "/ranking", label: "Ranglijst" },
  { href: "/statistieken", label: "Statistieken" },
  { href: ACADEMIE_PUBLIC_MOUNT_PATH, label: "Academie" },
  { href: "/training", label: "Training" },
  { href: "/fitheid", label: "Fitheid" },
  { href: "/seizoenen", label: "Seizoenen" },
] as const;

export const ACADEMY_MVP_NAV_ITEM: SiteNavItem = {
  href: academyRoutes.root,
  label: "Academy",
};

export const BEHEER_NAV_ITEM: SiteNavItem = { href: "/beheer", label: "Beheer" };

export function buildSiteNavItems(options: {
  academyPublicVisible: boolean;
  academyEnabled: boolean;
  isAdmin: boolean;
}): SiteNavItem[] {
  const core = BASE_NAV_ITEMS.filter(
    (item) => item.href !== ACADEMIE_PUBLIC_MOUNT_PATH || options.academyPublicVisible,
  );
  const withMvp = options.academyEnabled ? [...core, ACADEMY_MVP_NAV_ITEM] : [...core];
  return options.isAdmin ? [...withMvp, BEHEER_NAV_ITEM] : withMvp;
}
