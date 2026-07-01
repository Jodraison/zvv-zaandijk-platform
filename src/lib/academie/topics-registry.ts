import { ACADEMY_TOPIC_DEFINITIONS } from "@/lib/academie/topics-data";
import { getAcademyCategory, getAcademyCategoryById } from "@/lib/academie/registry";
import type { AcademySearchDocument, AcademyTopic } from "@/lib/academie/types";

type ListTopicOptions = {
  includeHidden?: boolean;
};

function sortByOrder(topics: AcademyTopic[]): AcademyTopic[] {
  return [...topics].sort((a, b) => a.order - b.order);
}

export function listAllAcademyTopics(): AcademyTopic[] {
  return sortByOrder(ACADEMY_TOPIC_DEFINITIONS);
}

export function listAcademyTopicsByCategoryId(categoryId: string, options: ListTopicOptions = {}): AcademyTopic[] {
  const topics = sortByOrder(ACADEMY_TOPIC_DEFINITIONS.filter((t) => t.categoryId === categoryId));
  if (options.includeHidden) return topics;
  return topics.filter((t) => t.visible);
}

export function listAcademyTopicsByCategorySlug(categorySlug: string, options: ListTopicOptions = {}): AcademyTopic[] {
  const category = getAcademyCategory(categorySlug);
  if (!category) return [];
  return listAcademyTopicsByCategoryId(category.id, options);
}

export function getAcademyTopic(categorySlug: string, topicSlug: string): AcademyTopic | undefined {
  const category = getAcademyCategory(categorySlug);
  if (!category) return undefined;
  return ACADEMY_TOPIC_DEFINITIONS.find((t) => t.categoryId === category.id && t.slug === topicSlug);
}

export function getAcademyTopicById(id: string): AcademyTopic | undefined {
  return ACADEMY_TOPIC_DEFINITIONS.find((t) => t.id === id);
}

export function academyTopicHref(categorySlug: string, topicSlug: string): string {
  return `/academie/${categorySlug}/${topicSlug}`;
}

export function buildAcademyTopicSearchIndex(): AcademySearchDocument[] {
  return listAllAcademyTopics().map((t) => {
    const category = getAcademyCategoryById(t.categoryId);
    return {
      id: t.id,
      kind: "topic" as const,
      slug: t.slug,
      title: t.title,
      description: t.description,
      categorySlug: category?.slug,
      topicSlug: t.slug,
    };
  });
}

/** Alle category/topic-combinaties voor statische route-generatie. */
export function listAcademyTopicRoutes(): Array<{ category: string; topic: string }> {
  return listAllAcademyTopics().flatMap((t) => {
    const category = getAcademyCategoryById(t.categoryId);
    if (!category) return [];
    return [{ category: category.slug, topic: t.slug }];
  });
}
