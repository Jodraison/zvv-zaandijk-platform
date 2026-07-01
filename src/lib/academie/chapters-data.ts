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
      "Chapter 1 vormt de fundering van de Football Academy. In zes opeenvolgende lessen leer je wie ZVV Zaandijk VRZ1 is, hoe wij voetballen en welke mentaliteit wij verwachten — de basis voor alles wat daarna volgt.",
    lessons: [
      { topicId: "topic.voetbalvisie.identiteit", lessonNumber: 1, estimatedReadingTime: 3, lessonLevel: "intro" },
      { topicId: "topic.voetbalvisie.kernwaarden", lessonNumber: 2, estimatedReadingTime: 3, lessonLevel: "intro" },
      { topicId: "topic.voetbalvisie.teamafspraken", lessonNumber: 3, estimatedReadingTime: 3, lessonLevel: "intro" },
      { topicId: "topic.voetbalvisie.gedragsregels", lessonNumber: 4, estimatedReadingTime: 3, lessonLevel: "core" },
      { topicId: "topic.voetbalvisie.intensiteit", lessonNumber: 5, estimatedReadingTime: 3, lessonLevel: "core" },
      { topicId: "topic.voetbalvisie.mentaliteit", lessonNumber: 6, estimatedReadingTime: 3, lessonLevel: "core" },
    ],
  },
];
