/** Categorie-specifieke introductieteksten voor overzichtspagina's. */
export type AcademyCategoryOverview = {
  categorySlug: string;
  intro: string;
};

export const ACADEMY_CATEGORY_OVERVIEWS: AcademyCategoryOverview[] = [
  {
    categorySlug: "onze-voetbalvisie",
    intro:
      "Onze Voetbalvisie vormt de basis van alles wat binnen de Football Academy wordt geleerd. Van hieruit bouwen alle andere categorieën en onderwerpen verder — identiteit, waarden en afspraken komen samen op één plek.",
  },
];

export function getAcademyCategoryOverview(categorySlug: string): AcademyCategoryOverview | undefined {
  return ACADEMY_CATEGORY_OVERVIEWS.find((o) => o.categorySlug === categorySlug);
}

export function hasAcademyCategoryOverview(categorySlug: string): boolean {
  return getAcademyCategoryOverview(categorySlug) !== undefined;
}
