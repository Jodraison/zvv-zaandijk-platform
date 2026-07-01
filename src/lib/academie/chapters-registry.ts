import { ACADEMY_CHAPTER_DEFINITIONS } from "@/lib/academie/chapters-data";
import type { AcademyChapter, AcademyChapterLessonNav } from "@/lib/academie/chapter-types";
import { getChapterLessonNavigation } from "@/lib/academie/chapter-utils";
import { getAcademyCategoryById } from "@/lib/academie/registry";
import { listAcademyTopicsByCategorySlug } from "@/lib/academie/topics-registry";

export function listAllAcademyChapters(): AcademyChapter[] {
  return [...ACADEMY_CHAPTER_DEFINITIONS];
}

export function getAcademyChapterByCategorySlug(categorySlug: string): AcademyChapter | undefined {
  return ACADEMY_CHAPTER_DEFINITIONS.find((c) => c.categorySlug === categorySlug);
}

export function getAcademyChapterByCategoryId(categoryId: string): AcademyChapter | undefined {
  return ACADEMY_CHAPTER_DEFINITIONS.find((c) => c.categoryId === categoryId);
}

export function hasAcademyChapter(categorySlug: string): boolean {
  return getAcademyChapterByCategorySlug(categorySlug) !== undefined;
}

export function getAcademyChapterLessonNav(categorySlug: string, topicSlug: string): AcademyChapterLessonNav | undefined {
  const chapter = getAcademyChapterByCategorySlug(categorySlug);
  if (!chapter) return undefined;

  const topics = listAcademyTopicsByCategorySlug(categorySlug);
  return getChapterLessonNavigation(chapter, topics, topicSlug);
}

/** Valideer chapter-definitie tegen bestaande categorie. */
export function validateAcademyChapter(chapter: AcademyChapter): boolean {
  const category = getAcademyCategoryById(chapter.categoryId);
  return category?.slug === chapter.categorySlug;
}
