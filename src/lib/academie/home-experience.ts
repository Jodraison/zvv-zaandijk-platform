/** Hero-copy voor de Academy-home — enige bron voor titel en subtitel. */
export const ACADEMY_HOME_HERO = {
  eyebrow: "Academy",
  title: "Football Academy",
  subtitle:
    "Het centrale kennisplatform van ZVV Zaandijk VRZ1. Ontdek onze speelwijze, leer jouw positie beter begrijpen en ontwikkel jezelf stap voor stap.",
} as const;

export const ACADEMY_HOME_INTRO =
  "De Academy is ontworpen zodat iedere speelster binnen enkele seconden antwoord kan vinden op haar vraag.";

/** Voorbeeldzoektermen — UI-copy voor toekomstige zoekfunctie. */
export const ACADEMY_SEARCH_PLACEHOLDER_EXAMPLES = [
  "Rechtsback",
  "Pressing",
  "Opbouwen",
  "Looplijnen",
] as const;

export type AcademyQuickAccessDefinition = {
  id: string;
  label: string;
  subtitle: string;
  icon: string;
  categorySlug: string;
  order: number;
};

/** Snel naar — verwijst naar bestaande categorie-slugs. */
export const ACADEMY_QUICK_ACCESS_DEFINITIONS: AcademyQuickAccessDefinition[] = [
  {
    id: "qa.mijn-positie",
    label: "Mijn positie",
    subtitle: "Rol, taken en verwachtingen",
    icon: "📍",
    categorySlug: "posities",
    order: 1,
  },
  {
    id: "qa.speelwijze",
    label: "Onze speelwijze",
    subtitle: "Tactische en technische lijn",
    icon: "⚽",
    categorySlug: "speelwijze",
    order: 2,
  },
  {
    id: "qa.teamprincipes",
    label: "Teamprincipes",
    subtitle: "Afspraken en waarden",
    icon: "🤝",
    categorySlug: "teamprincipes",
    order: 3,
  },
  {
    id: "qa.trainingen",
    label: "Trainingen",
    subtitle: "Opbouw en werkvormen",
    icon: "📋",
    categorySlug: "trainingen",
    order: 4,
  },
];
