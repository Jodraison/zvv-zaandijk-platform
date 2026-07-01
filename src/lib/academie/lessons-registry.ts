import { ACADEMY_LESSON_DEFINITIONS } from "@/lib/academie/lessons-data";
import { getAcademyCategoryById } from "@/lib/academie/registry";
import { getAcademyTopic, getAcademyTopicById } from "@/lib/academie/topics-registry";
import type { AcademyLesson } from "@/lib/academie/lesson-types";

export function listAllAcademyLessons(): AcademyLesson[] {
  return [...ACADEMY_LESSON_DEFINITIONS];
}

export function getAcademyLessonById(id: string): AcademyLesson | undefined {
  return ACADEMY_LESSON_DEFINITIONS.find((l) => l.id === id);
}

export function getAcademyLessonByTopicId(topicId: string): AcademyLesson | undefined {
  return ACADEMY_LESSON_DEFINITIONS.find((l) => l.topicId === topicId);
}

export function getAcademyLesson(categorySlug: string, topicSlug: string): AcademyLesson | undefined {
  const topic = getAcademyTopic(categorySlug, topicSlug);
  if (!topic) return undefined;
  return getAcademyLessonByTopicId(topic.id);
}

export function hasAcademyLesson(categorySlug: string, topicSlug: string): boolean {
  return getAcademyLesson(categorySlug, topicSlug) !== undefined;
}

/** Routes voor statische generatie van les-pagina's (topic-pagina's met les). */
export function listAcademyLessonRoutes(): Array<{ category: string; topic: string }> {
  return ACADEMY_LESSON_DEFINITIONS.flatMap((lesson) => {
    const category = getAcademyCategoryById(lesson.categoryId);
    const topic = getAcademyTopicById(lesson.topicId);
    if (!category || !topic) return [];
    return [{ category: category.slug, topic: topic.slug }];
  });
}

export function buildAcademyLessonSearchIndex() {
  return listAllAcademyLessons().map((lesson) => {
    const category = getAcademyCategoryById(lesson.categoryId);
    const topic = getAcademyTopicById(lesson.topicId);
    return {
      id: lesson.id,
      kind: "article" as const,
      slug: lesson.slug,
      title: lesson.title,
      description: lesson.summary ?? "",
      categorySlug: category?.slug,
      topicSlug: topic?.slug,
    };
  });
}
