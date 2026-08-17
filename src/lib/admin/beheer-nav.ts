/**
 * Beheer-navigatie — coach-first Nederlandse labels (Admin 2.0).
 */

export type BeheerNavItem = {
  href: string;
  label: string;
  description: string;
  icon: string;
  group: "primary" | "ops";
};

/** Sidebar group headings (coach-first, sentence case). */
export const BEHEER_NAV_GROUP_LABELS = {
  primary: "Teambeheer",
  ops: "Controle",
} as const;

export const BEHEER_PRIMARY_NAV: readonly BeheerNavItem[] = [
  { href: "/beheer", label: "Overzicht", description: "Overzicht en snelle acties", icon: "◆", group: "primary" },
  { href: "/beheer/wedstrijden", label: "Wedstrijden", description: "Plannen, uitslagen, gebeurtenissen", icon: "⚽", group: "primary" },
  { href: "/beheer/spelers", label: "Speelsters", description: "Selectie, gasten, foto’s", icon: "◎", group: "primary" },
  { href: "/beheer/training", label: "Training", description: "Aanwezigheid registreren", icon: "▣", group: "primary" },
  { href: "/beheer/fitheid", label: "Fitheid", description: "Testmomenten en historie", icon: "◇", group: "primary" },
  { href: "/beheer/seizoenen", label: "Seizoenen", description: "Seizoenen en koppelingen", icon: "◷", group: "primary" },
  { href: "/beheer/club", label: "Club", description: "Teamfoto en clubinstellingen", icon: "◈", group: "primary" },
];

export const BEHEER_OPS_NAV: readonly BeheerNavItem[] = [
  { href: "/beheer/data-integrity", label: "Datacontrole", description: "Controleer of alles klopt", icon: "✓", group: "ops" },
  { href: "/beheer/disputes", label: "Correcties", description: "Zoek en herstel fouten", icon: "↺", group: "ops" },
  { href: "/beheer/audit-log", label: "Wijzigingslog", description: "Wat is wanneer gewijzigd", icon: "☰", group: "ops" },
];

export function isBeheerNavActive(pathname: string, href: string): boolean {
  if (href === "/beheer") return pathname === "/beheer";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function withSeason(href: string, seasonId: string): string {
  if (!seasonId) return href;
  const join = href.includes("?") ? "&" : "?";
  return `${href}${join}season=${encodeURIComponent(seasonId)}`;
}
