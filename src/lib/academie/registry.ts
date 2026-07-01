import { ACADEMY_CATEGORY_DEFINITIONS } from "@/lib/academie/categories-data";
import { ACADEMY_QUICK_ACCESS_DEFINITIONS, type AcademyQuickAccessDefinition } from "@/lib/academie/home-experience";
import type { AcademyCategory, AcademyCategoryRef, AcademySearchDocument } from "@/lib/academie/types";

type ListOptions = {
  /** Standaard alleen zichtbare categorieën; zet op true voor admin/zoek-index. */
  includeHidden?: boolean;
};

function sortByOrder(categories: AcademyCategory[]): AcademyCategory[] {
  return [...categories].sort((a, b) => a.order - b.order);
}

/** Alle gedefinieerde categorieën, gesorteerd op `order`. */
export function listAllAcademyCategories(): AcademyCategory[] {
  return sortByOrder(ACADEMY_CATEGORY_DEFINITIONS);
}

/** Categorieën voor publieke weergave — filtert op `visible` tenzij anders gevraagd. */
export function listAcademyCategories(options: ListOptions = {}): AcademyCategory[] {
  const sorted = listAllAcademyCategories();
  if (options.includeHidden) return sorted;
  return sorted.filter((c) => c.visible);
}

export function getAcademyCategory(slug: string): AcademyCategory | undefined {
  return ACADEMY_CATEGORY_DEFINITIONS.find((c) => c.slug === slug);
}

export function getAcademyCategoryById(id: string): AcademyCategory | undefined {
  return ACADEMY_CATEGORY_DEFINITIONS.find((c) => c.id === id);
}

export function toAcademyCategoryRef(category: AcademyCategory): AcademyCategoryRef {
  return { id: category.id, slug: category.slug, title: category.title };
}

export function academyCategoryHref(slug: string): string {
  return `/academie/${slug}`;
}

/**
 * Zoekindex op categorieniveau — uitbreidbaar met topics/artikelen
 * zonder de query-API te wijzigen.
 */
export function buildAcademyCategorySearchIndex(): AcademySearchDocument[] {
  return listAllAcademyCategories().map((c) => ({
    id: c.id,
    kind: "category" as const,
    slug: c.slug,
    title: c.title,
    description: c.description,
    categorySlug: c.slug,
  }));
}

export type AcademyQuickAccessItem = AcademyQuickAccessDefinition & {
  href: string;
};

/** Quick Access-items met opgeloste categorie-links, gesorteerd op `order`. */
export function listAcademyQuickAccess(): AcademyQuickAccessItem[] {
  return [...ACADEMY_QUICK_ACCESS_DEFINITIONS]
    .sort((a, b) => a.order - b.order)
    .map((item) => ({
      ...item,
      href: academyCategoryHref(item.categorySlug),
    }));
}
