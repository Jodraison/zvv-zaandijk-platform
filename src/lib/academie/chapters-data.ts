import type { AcademyChapter } from "@/lib/academie/chapter-types";

const VOETBALVISIE_CATEGORY_ID = "cat.voetbalvisie";

/**
 * Chapter 1 — Onze Voetbalvisie.
 * Zes lessen in vaste volgorde; inhoud via topics + lessons-data.
 */
export const ACADEMY_CHAPTER_DEFINITIONS: AcademyChapter[] = [
  {
    id: "chapter.voetbalvisie.1",
    categoryId: VOETBALVISIE_CATEGORY_ID,
    categorySlug: "onze-voetbalvisie",
    chapterNumber: 1,
    title: "Onze Voetbalvisie",
    intro:
      "Zes lessen, één speelwijze: wie wij zijn → hoe wij kiezen → hoe wij samen uitvoeren → hoe wij ons gedragen → wanneer wij tempo maken → hoe wij onder druk blijven kiezen.",
    lessons: [
      { topicId: "topic.voetbalvisie.identiteit", lessonNumber: 1, estimatedReadingTime: 2, lessonLevel: "intro" },
      { topicId: "topic.voetbalvisie.kernwaarden", lessonNumber: 2, estimatedReadingTime: 2, lessonLevel: "intro" },
      { topicId: "topic.voetbalvisie.teamafspraken", lessonNumber: 3, estimatedReadingTime: 2, lessonLevel: "intro" },
      { topicId: "topic.voetbalvisie.gedragsregels", lessonNumber: 4, estimatedReadingTime: 2, lessonLevel: "intro" },
      { topicId: "topic.voetbalvisie.intensiteit", lessonNumber: 5, estimatedReadingTime: 2, lessonLevel: "intro" },
      { topicId: "topic.voetbalvisie.mentaliteit", lessonNumber: 6, estimatedReadingTime: 2, lessonLevel: "intro" },
    ],
  },
];
