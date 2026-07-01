/**
 * Academy Lesson Standards — centrale kwaliteitsconfiguratie voor alle lessen.
 * Enige bron voor aanbevolen/verplichte lesopbouw binnen de Football Academy.
 */

/** Intern kwaliteitsniveau — nog niet zichtbaar voor eindgebruikers. */
export type AcademyLessonQualityLevel = "foundation" | "complete" | "advanced";

/** Inhoudelijk niveau van een les (complexiteit/diepgang). */
export type AcademyLessonContentLevel = "intro" | "core" | "advanced";

/** Verwachte media-aantallen per les — voor validatie en toekomstige admin. */
export type AcademyLessonRequiredVisuals = {
  images?: number;
  videos?: number;
  tacticalIllustrations?: number;
};

export type AcademyLessonStandards = {
  /** Aanbevolen leestijd in minuten. */
  recommendedReadingTimeMinutes: number;
  /** Minimaal aantal ingevulde secties (exclusief titel). */
  minSections: number;
  /** Maximaal aanbevolen aantal secties — voorkomt lange documenten. */
  maxSections: number;
  /** Aanbevolen aantal afbeeldingen per les. */
  recommendedImageCount: number;
  /** Aanbevolen aantal video's per les. */
  recommendedVideoCount: number;
  /** Visual-first: elke les moet een primair visual-blok hebben. */
  visualFirstRequired: boolean;
  /** Quiz verplicht voor publicatie (structuur; logica volgt later). */
  quizRequired: boolean;
  /** Coach's notebook aanbevolen voor volledige lessen. */
  coachNotebookRecommended: boolean;
  /** Quick reference aanbevolen voor scanbare 30-seconden-start. */
  quickReferenceRecommended: boolean;
};

/** Canonieke Academy-lessenstandaard — geldt voor huidige én toekomstige lessen. */
export const ACADEMY_LESSON_STANDARDS: AcademyLessonStandards = {
  recommendedReadingTimeMinutes: 3,
  minSections: 4,
  maxSections: 12,
  recommendedImageCount: 1,
  recommendedVideoCount: 0,
  visualFirstRequired: true,
  quizRequired: false,
  coachNotebookRecommended: true,
  quickReferenceRecommended: true,
};

/** Interne kwaliteitslabels — voorbereid op admin/review workflows. */
export const ACADEMY_LESSON_QUALITY_LEVELS: AcademyLessonQualityLevel[] = ["foundation", "complete", "advanced"];

export const ACADEMY_LESSON_QUALITY_LABELS: Record<AcademyLessonQualityLevel, string> = {
  foundation: "Foundation",
  complete: "Complete",
  advanced: "Advanced",
};

export function getAcademyLessonStandards(): AcademyLessonStandards {
  return ACADEMY_LESSON_STANDARDS;
}
