/**
 * Frozen speelster bottom tabs (T-01-03 / ARCH v1.1).
 * Exactly five — Zoek/rollen blijven header.
 */
import { academyRoutes, type AcademyTabRoute } from "@/lib/academy/routes";

export type AcademyTabId = "positie" | "situatie" | "probleem" | "wedstrijd" | "seizoen";

export type AcademyTabDefinition = {
  id: AcademyTabId;
  label: string;
  href: AcademyTabRoute;
};

export const ACADEMY_BOTTOM_TABS: readonly AcademyTabDefinition[] = [
  { id: "positie", label: "Positie", href: academyRoutes.positie },
  { id: "situatie", label: "Situatie", href: academyRoutes.situatie },
  { id: "probleem", label: "Probleem", href: academyRoutes.probleem },
  { id: "wedstrijd", label: "Wedstrijd", href: academyRoutes.wedstrijd },
  { id: "seizoen", label: "Seizoen", href: academyRoutes.seizoen },
] as const;

export const ACADEMY_BOTTOM_TAB_COUNT = ACADEMY_BOTTOM_TABS.length;
