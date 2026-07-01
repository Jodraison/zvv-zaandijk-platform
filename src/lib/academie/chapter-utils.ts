import type {
  AcademyChapter,
  AcademyChapterLessonNav,
  AcademyChapterLessonStatus,
  ResolvedAcademyChapterLesson,
} from "@/lib/academie/chapter-types";
import { ACADEMY_LESSON_STANDARDS, type AcademyLessonContentLevel } from "@/lib/academie/lesson-standards";
import type { AcademyLesson } from "@/lib/academie/lesson-types";
import type { AcademyTopic } from "@/lib/academie/types";
import { academyTopicHref } from "@/lib/academie/topics-registry";
import { getAcademyLessonByTopicId } from "@/lib/academie/lessons-registry";

export const ACADEMY_LESSON_CONTENT_LEVEL_LABELS: Record<AcademyLessonContentLevel, string> = {
  intro: "Intro",
  core: "Basis",
  advanced: "Gevorderd",
};

export const ACADEMY_CHAPTER_LESSON_STATUS_LABELS: Record<AcademyChapterLessonStatus, string> = {
  available: "Beschikbaar",
  comingSoon: "Binnenkort",
};

function resolveLessonStatus(topic: AcademyTopic, lesson?: AcademyLesson): AcademyChapterLessonStatus {
  if (topic.comingSoon) return "comingSoon";
  if (lesson) return "available";
  return "comingSoon";
}

function resolveReadingTime(slot: { estimatedReadingTime?: number }, lesson?: AcademyLesson): number {
  return (
    lesson?.estimatedReadingTime ??
    lesson?.quickReference?.readingTimeMinutes ??
    slot.estimatedReadingTime ??
    ACADEMY_LESSON_STANDARDS.recommendedReadingTimeMinutes
  );
}

function resolveLessonLevel(slot: { lessonLevel?: AcademyLessonContentLevel }, lesson?: AcademyLesson): AcademyLessonContentLevel {
  return lesson?.lessonLevel ?? slot.lessonLevel ?? "intro";
}

export function resolveAcademyChapterLessons(
  chapter: AcademyChapter,
  topics: AcademyTopic[],
  options?: { activeTopicSlug?: string },
): ResolvedAcademyChapterLesson[] {
  const topicById = new Map(topics.map((t) => [t.id, t]));

  return chapter.lessons.flatMap((slot) => {
    const topic = topicById.get(slot.topicId);
    if (!topic) return [];

    const lesson = getAcademyLessonByTopicId(topic.id);

    return [
      {
        lessonNumber: slot.lessonNumber,
        topicId: topic.id,
        topicSlug: topic.slug,
        title: lesson?.title ?? topic.title,
        description: topic.description,
        icon: topic.icon,
        status: resolveLessonStatus(topic, lesson),
        estimatedReadingTime: resolveReadingTime(slot, lesson),
        lessonLevel: resolveLessonLevel(slot, lesson),
        href: academyTopicHref(chapter.categorySlug, topic.slug),
        isActive: options?.activeTopicSlug === topic.slug,
      },
    ];
  });
}

export function countChapterLessons(chapter: AcademyChapter, topics: AcademyTopic[]): number {
  return resolveAcademyChapterLessons(chapter, topics).length;
}

export function countAvailableChapterLessons(chapter: AcademyChapter, topics: AcademyTopic[]): number {
  return resolveAcademyChapterLessons(chapter, topics).filter((l) => l.status === "available").length;
}

/** Voortgang — voorbereid voor toekomstige interactieve tracking; nu statisch 0 voltooid. */
export function getChapterProgressPlaceholder(chapter: AcademyChapter, topics: AcademyTopic[]) {
  const total = countChapterLessons(chapter, topics);
  const available = countAvailableChapterLessons(chapter, topics);
  return {
    completed: 0,
    total,
    available,
    percentComplete: 0,
  };
}

export function getChapterLessonNavigation(
  chapter: AcademyChapter,
  topics: AcademyTopic[],
  activeTopicSlug: string,
): AcademyChapterLessonNav | undefined {
  const lessons = resolveAcademyChapterLessons(chapter, topics);
  const index = lessons.findIndex((l) => l.topicSlug === activeTopicSlug);
  if (index === -1) return undefined;

  const current = lessons[index];
  const previous = index > 0 ? lessons[index - 1] : undefined;
  const next = index < lessons.length - 1 ? lessons[index + 1] : undefined;

  return {
    chapterNumber: chapter.chapterNumber,
    chapterTitle: chapter.title,
    current: current.lessonNumber,
    total: lessons.length,
    previous: previous
      ? { title: previous.title, href: previous.href, lessonNumber: previous.lessonNumber }
      : undefined,
    next: next ? { title: next.title, href: next.href, lessonNumber: next.lessonNumber } : undefined,
  };
}
