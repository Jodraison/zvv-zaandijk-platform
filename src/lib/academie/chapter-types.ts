import type { AcademyCategory } from "@/lib/academie/types";
import type { AcademyLessonContentLevel } from "@/lib/academie/lesson-standards";

/** Lesstatus binnen een chapter — afgeleid uit topic + lesson data. */
export type AcademyChapterLessonStatus = "available" | "comingSoon";

/**
 * Les-slot binnen een chapter.
 * Koppelt aan bestaand topic via `topicId`; metadata vult aan wanneer les nog geen data heeft.
 */
export type AcademyChapterLessonSlot = {
  topicId: string;
  lessonNumber: number;
  /** Fallback leestijd wanneer les nog niet gedefinieerd is. */
  estimatedReadingTime?: number;
  /** Fallback moeilijkheid wanneer les nog niet gedefinieerd is. */
  lessonLevel?: AcademyLessonContentLevel;
};

/**
 * Chapter — leerpad binnen een categorie.
 * Eén categorie kan maximaal één chapter hebben (Chapter 1 = onze-voetbalvisie).
 */
export type AcademyChapter = {
  id: string;
  categoryId: AcademyCategory["id"];
  categorySlug: string;
  chapterNumber: number;
  title: string;
  intro: string;
  lessons: AcademyChapterLessonSlot[];
};

/** Opgeloste les voor UI — topic + lesson metadata samengevoegd. */
export type ResolvedAcademyChapterLesson = {
  lessonNumber: number;
  topicId: string;
  topicSlug: string;
  title: string;
  description: string;
  icon: string;
  status: AcademyChapterLessonStatus;
  estimatedReadingTime: number;
  lessonLevel: AcademyLessonContentLevel;
  href: string;
  isActive?: boolean;
};

/** Navigatie tussen opeenvolgende lessen binnen een chapter. */
export type AcademyChapterLessonNav = {
  chapterNumber: number;
  chapterTitle: string;
  current: number;
  total: number;
  previous?: { title: string; href: string; lessonNumber: number };
  next?: { title: string; href: string; lessonNumber: number };
};
