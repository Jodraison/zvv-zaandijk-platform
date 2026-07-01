/**
 * Football Academy — canonieke datamodellen (statisch, fase 2 IA).
 *
 * Toekomstige lagen (artikelen, tags, media, zoek) hangen aan dezelfde ids/slugs
 * zonder dit categoriemodel te wijzigen.
 */

/** Hoofdcategorie binnen de Football Academy. */
export type AcademyCategory = {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  order: number;
  visible: boolean;
  comingSoon: boolean;
};

/** Lichte referentie voor koppelingen (topics, artikelen, tags). */
export type AcademyCategoryRef = Pick<AcademyCategory, "id" | "slug" | "title">;

/**
 * Onderwerp binnen een categorie (fase 3+).
 * Nog geen data — type staat klaar voor artikel- en topic-lagen.
 */
export type AcademyTopic = {
  id: string;
  categoryId: AcademyCategory["id"];
  slug: string;
  title: string;
  description: string;
  icon: string;
  order: number;
  visible: boolean;
  comingSoon: boolean;
  tagIds?: string[];
  articleIds?: string[];
  mediaIds?: string[];
};

/**
 * Artikel binnen een onderwerp (fase 4+).
 * Nog geen data — type staat klaar voor CMS/admin-koppeling.
 */
export type AcademyArticle = {
  id: string;
  topicId: AcademyTopic["id"];
  categoryId: AcademyCategory["id"];
  slug: string;
  title: string;
  summary: string;
  order: number;
  visible: boolean;
  publishedAt?: string;
  tagIds?: string[];
  mediaIds?: string[];
};

/** Tag voor cross-cutting filtering en zoek (fase 5+). */
export type AcademyTag = {
  id: string;
  slug: string;
  label: string;
};

/** Media-item gekoppeld aan artikel of categorie (fase 5+). */
export type AcademyMediaItem = {
  id: string;
  slug: string;
  title: string;
  kind: "video" | "image" | "document";
  url?: string;
};

/** Zoekindex-entry — afgeleid uit categorieën/topics/artikelen. */
export type AcademySearchDocument = {
  id: string;
  kind: "category" | "topic" | "article";
  slug: string;
  title: string;
  description: string;
  categorySlug?: string;
  topicSlug?: string;
  tagSlugs?: string[];
};
