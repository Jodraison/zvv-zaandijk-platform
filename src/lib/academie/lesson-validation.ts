import type { AcademyLesson, AcademyLessonVisual } from "@/lib/academie/lesson-types";
import {
  ACADEMY_LESSON_STANDARDS,
  type AcademyLessonQualityLevel,
} from "@/lib/academie/lesson-standards";
import {
  hasCoachNotebook,
  hasLessonList,
  hasLessonText,
  hasQuickReference,
  lessonHasVisualBlock,
  normalizeLessonParagraphs,
  resolveLessonVisuals,
} from "@/lib/academie/lesson-utils";

export type AcademyLessonValidationCode =
  | "missing_visual"
  | "missing_summary"
  | "missing_quick_reference"
  | "missing_key_takeaway"
  | "missing_coach_notebook"
  | "missing_quiz"
  | "reading_time_below_recommended"
  | "section_count_below_minimum"
  | "section_count_above_maximum";

export type AcademyLessonValidationIssue = {
  code: AcademyLessonValidationCode;
  message: string;
};

export type AcademyLessonValidationResult = {
  lessonId: string;
  issues: AcademyLessonValidationIssue[];
  passed: boolean;
  computedQualityLevel: AcademyLessonQualityLevel;
};

export function lessonHasVisual(lesson: AcademyLesson): boolean {
  // Lesstandaard V1: situatiesectie met SVG-veld telt als visual-first.
  if (lesson.standard?.situation) return true;
  return lessonHasVisualBlock(lesson);
}

export function lessonMissingVisual(lesson: AcademyLesson): boolean {
  return !lessonHasVisual(lesson);
}

export function lessonMissingSummary(lesson: AcademyLesson): boolean {
  return !hasLessonText(lesson.summary);
}

export function lessonMissingQuickReference(lesson: AcademyLesson): boolean {
  return !hasQuickReference(lesson.quickReference);
}

export function lessonMissingKeyTakeaway(lesson: AcademyLesson): boolean {
  return !hasLessonText(lesson.keyTakeaway);
}

/** Telt ingevulde les-secties — gebruikt voor min/max-standaard. */
export function countLessonSections(lesson: AcademyLesson): number {
  const standard = lesson.standard;
  if (standard) {
    let count = 0;
    if (hasLessonText(lesson.summary)) count += 1;
    if (standard.learningOutcomes && standard.learningOutcomes.length > 0) count += 1;
    if (standard.situation) count += 1;
    if (standard.whyCards && standard.whyCards.length > 0) count += 1;
    if (standard.recognizeChecklist && standard.recognizeChecklist.length > 0) count += 1;
    if (standard.recognizeCompare) count += 1;
    if (standard.decisionBranch) count += 1;
    else if (standard.decisionTree && standard.decisionTree.length > 0) count += 1;
    if (standard.positions && standard.positions.length > 0) count += 1;
    if (standard.mistakes && standard.mistakes.length > 0) count += 1;
    if (standard.coachingChips && standard.coachingChips.length > 0) count += 1;
    if (standard.video && standard.video.placeholder !== true) count += 1;
    if (standard.summaryPoints && standard.summaryPoints.length > 0) count += 1;
    return count;
  }

  let count = 0;
  if (hasLessonText(lesson.summary)) count += 1;
  if (hasQuickReference(lesson.quickReference)) count += 1;
  if (hasLessonText(lesson.keyTakeaway)) count += 1;
  if (hasLessonText(lesson.whyImportant)) count += 1;
  if (lessonHasVisual(lesson)) count += 1;
  if (normalizeLessonParagraphs(lesson.practicalExplanation).length > 0) count += 1;
  if (hasLessonList(lesson.commonMistakes)) count += 1;
  if (hasCoachNotebook(lesson.coachNotebook)) count += 1;
  if (hasLessonText(lesson.coachTip)) count += 1;
  if (hasLessonList(lesson.keyPoints)) count += 1;
  if (lesson.relatedTopics && lesson.relatedTopics.length > 0) count += 1;
  if (lesson.quiz?.enabled) count += 1;
  return count;
}

export function countLessonVisuals(lesson: AcademyLesson): {
  images: number;
  videos: number;
  tacticalIllustrations: number;
  placeholders: number;
  total: number;
} {
  const visuals = resolveLessonVisuals(lesson);
  return visuals.reduce(
    (acc, visual) => {
      acc.total += 1;
      if (visual.kind === "image") acc.images += 1;
      if (visual.kind === "youtube") acc.videos += 1;
      if (visual.kind === "tactical") acc.tacticalIllustrations += 1;
      if (visual.kind === "placeholder") acc.placeholders += 1;
      return acc;
    },
    { images: 0, videos: 0, tacticalIllustrations: 0, placeholders: 0, total: 0 },
  );
}

function isRealVisual(visual: AcademyLessonVisual): boolean {
  return visual.kind !== "placeholder";
}

export function resolveLessonQualityLevel(lesson: AcademyLesson): AcademyLessonQualityLevel {
  if (lesson.qualityLevel) return lesson.qualityLevel;

  const sectionCount = countLessonSections(lesson);
  const hasCore =
    hasLessonText(lesson.summary) &&
    lessonHasVisual(lesson) &&
    hasQuickReference(lesson.quickReference) &&
    hasLessonText(lesson.keyTakeaway);

  const hasAdvanced =
    hasCore &&
    hasCoachNotebook(lesson.coachNotebook) &&
    normalizeLessonParagraphs(lesson.practicalExplanation).length > 0 &&
    hasLessonList(lesson.keyPoints) &&
    sectionCount >= ACADEMY_LESSON_STANDARDS.minSections + 2;

  if (hasAdvanced) return "advanced";
  if (hasCore) return "complete";
  return "foundation";
}

/** Valideert een les tegen Academy Lesson Standards — geen UI-output. */
export function validateAcademyLesson(lesson: AcademyLesson): AcademyLessonValidationResult {
  const standards = ACADEMY_LESSON_STANDARDS;
  const issues: AcademyLessonValidationIssue[] = [];
  const usesStandardV1 = !!lesson.standard;

  if (standards.visualFirstRequired && lessonMissingVisual(lesson)) {
    issues.push({ code: "missing_visual", message: "Visual-first: primair visual-blok ontbreekt." });
  }

  if (lessonMissingSummary(lesson)) {
    issues.push({ code: "missing_summary", message: "Samenvatting ontbreekt." });
  }

  // Legacy scan-secties alleen afdwingen buiten Lesstandaard V1.
  if (!usesStandardV1 && standards.quickReferenceRecommended && lessonMissingQuickReference(lesson)) {
    issues.push({ code: "missing_quick_reference", message: "Quick reference ontbreekt (aanbevolen)." });
  }

  if (!usesStandardV1 && lessonMissingKeyTakeaway(lesson)) {
    issues.push({ code: "missing_key_takeaway", message: "Key takeaway ontbreekt." });
  }

  if (!usesStandardV1 && standards.coachNotebookRecommended && !hasCoachNotebook(lesson.coachNotebook)) {
    issues.push({ code: "missing_coach_notebook", message: "Coach's notebook ontbreekt (aanbevolen)." });
  }

  if (standards.quizRequired && !lesson.quiz?.enabled) {
    issues.push({ code: "missing_quiz", message: "Quiz-slot vereist maar niet ingeschakeld." });
  }

  const readingTime = lesson.estimatedReadingTime ?? lesson.quickReference?.readingTimeMinutes;
  const recommendedMinutes = usesStandardV1 ? 2 : standards.recommendedReadingTimeMinutes;
  if (typeof readingTime === "number" && readingTime < recommendedMinutes) {
    issues.push({
      code: "reading_time_below_recommended",
      message: `Leestijd (${readingTime} min) onder aanbevolen ${recommendedMinutes} min.`,
    });
  }

  const sectionCount = countLessonSections(lesson);
  if (sectionCount < standards.minSections) {
    issues.push({
      code: "section_count_below_minimum",
      message: `Sectietelling (${sectionCount}) onder minimum (${standards.minSections}).`,
    });
  }
  if (sectionCount > standards.maxSections) {
    issues.push({
      code: "section_count_above_maximum",
      message: `Sectietelling (${sectionCount}) boven maximum (${standards.maxSections}).`,
    });
  }

  const visualCounts = countLessonVisuals(lesson);
  const required = lesson.requiredVisuals;
  if (required?.images && visualCounts.images < required.images) {
    issues.push({
      code: "missing_visual",
      message: `Verwacht minimaal ${required.images} afbeelding(en); ${visualCounts.images} aanwezig.`,
    });
  }
  if (required?.videos && visualCounts.videos < required.videos) {
    issues.push({
      code: "missing_visual",
      message: `Verwacht minimaal ${required.videos} video('s); ${visualCounts.videos} aanwezig.`,
    });
  }
  if (required?.tacticalIllustrations && visualCounts.tacticalIllustrations < required.tacticalIllustrations) {
    issues.push({
      code: "missing_visual",
      message: `Verwacht minimaal ${required.tacticalIllustrations} tactische illustratie(s); ${visualCounts.tacticalIllustrations} aanwezig.`,
    });
  }

  // Placeholder visual telt mee voor layout-test maar niet als definitieve media.
  if (lesson.visual && !isRealVisual(lesson.visual) && (required?.images ?? standards.recommendedImageCount) > 0) {
    // Geen issue — placeholder is toegestaan tijdens opbouw.
  }

  return {
    lessonId: lesson.id,
    issues,
    passed: issues.length === 0,
    computedQualityLevel: resolveLessonQualityLevel(lesson),
  };
}

export function validateAllAcademyLessons(lessons: AcademyLesson[]): AcademyLessonValidationResult[] {
  return lessons.map(validateAcademyLesson);
}
