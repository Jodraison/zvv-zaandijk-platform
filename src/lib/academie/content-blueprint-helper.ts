import {
  ACADEMY_CONTENT_BLUEPRINT,
  type AcademyContentBlueprint,
  type AcademyContentBlueprintContext,
  type AcademyContentBlueprintListCounts,
  type AcademyContentBlueprintReading,
  type AcademyContentBlueprintVisuals,
  type AcademyContentRequirementRule,
  getAcademyContentBlueprint,
} from "@/lib/academie/content-blueprint";
import type { AcademyLessonContentLevel } from "@/lib/academie/lesson-standards";

const LESSON_LEVEL_ORDER: AcademyLessonContentLevel[] = ["intro", "core", "advanced"];

function lessonLevelMeetsThreshold(current: AcademyLessonContentLevel | undefined, required: AcademyLessonContentLevel[]): boolean {
  if (!current) return false;
  const currentIndex = LESSON_LEVEL_ORDER.indexOf(current);
  const minRequired = Math.min(...required.map((level) => LESSON_LEVEL_ORDER.indexOf(level)));
  return currentIndex >= minRequired;
}

function qualityLevelMeetsThreshold(
  current: AcademyContentBlueprintContext["qualityLevel"],
  required: NonNullable<AcademyContentRequirementRule["fromQualityLevel"]>,
): boolean {
  if (!current) return false;
  const order = ["foundation", "complete", "advanced"] as const;
  const currentIndex = order.indexOf(current);
  const minRequired = Math.min(...required.map((level) => order.indexOf(level)));
  return currentIndex >= minRequired;
}

/** Bepaalt of een blueprint-regel van toepassing is in de gegeven lescontext. */
export function isContentRequirementActive(rule: AcademyContentRequirementRule, context: AcademyContentBlueprintContext = {}): boolean {
  if (rule.always) return true;
  if (rule.fromLessonLevel?.length && lessonLevelMeetsThreshold(context.lessonLevel, rule.fromLessonLevel)) return true;
  if (rule.fromQualityLevel?.length && qualityLevelMeetsThreshold(context.qualityLevel, rule.fromQualityLevel)) return true;
  return false;
}

export function isTacticalIllustrationRequired(context: AcademyContentBlueprintContext = {}): boolean {
  return isContentRequirementActive(ACADEMY_CONTENT_BLUEPRINT.tacticalIllustration.required, context);
}

export function isPracticeExampleRequired(context: AcademyContentBlueprintContext = {}): boolean {
  return isContentRequirementActive(ACADEMY_CONTENT_BLUEPRINT.practiceExample.required, context);
}

export function isTrainingLinkRequired(context: AcademyContentBlueprintContext = {}): boolean {
  return isContentRequirementActive(ACADEMY_CONTENT_BLUEPRINT.trainingLink.required, context);
}

export function getBlueprintReadingGuidelines(context: AcademyContentBlueprintContext = {}): AcademyContentBlueprintReading & {
  estimatedMinutesFromWords: (wordCount: number) => number;
} {
  const reading = getAcademyContentBlueprint().reading;
  return {
    ...reading,
    estimatedMinutesFromWords: (wordCount: number) => Math.ceil(wordCount / reading.wordsPerMinute),
  };
}

export function getBlueprintVisualGuidelines(context: AcademyContentBlueprintContext = {}): AcademyContentBlueprintVisuals & {
  tacticalIllustrationRequired: boolean;
  minTacticalWhenRequired: number;
} {
  const blueprint = getAcademyContentBlueprint();
  return {
    ...blueprint.visuals,
    tacticalIllustrationRequired: isTacticalIllustrationRequired(context),
    minTacticalWhenRequired: blueprint.tacticalIllustration.minCountWhenRequired,
  };
}

export type AcademyContentGuidelines = {
  reading: AcademyContentBlueprintReading;
  visuals: AcademyContentBlueprintVisuals;
  tacticalIllustrationRequired: boolean;
  practiceExampleRequired: boolean;
  trainingLinkRequired: boolean;
  practiceExamples: { recommended: number; max: number };
  trainingLink: { recommendedPitchSlots: number; recommendedUsageContexts: number };
  keyPoints: AcademyContentBlueprintListCounts;
  commonMistakes: AcademyContentBlueprintListCounts;
  coachTips: AcademyContentBlueprintListCounts;
  relatedLessons: AcademyContentBlueprintListCounts;
};

/**
 * Hoofd-helper — leest alle didactische richtlijnen uit voor een lescontext.
 * Gebruik bij het opstellen van nieuwe lessen in `lessons-data.ts` of toekomstige CMS/admin.
 */
export function getContentGuidelinesForLesson(context: AcademyContentBlueprintContext = {}): AcademyContentGuidelines {
  const blueprint: AcademyContentBlueprint = getAcademyContentBlueprint();

  return {
    reading: blueprint.reading,
    visuals: blueprint.visuals,
    tacticalIllustrationRequired: isTacticalIllustrationRequired(context),
    practiceExampleRequired: isPracticeExampleRequired(context),
    trainingLinkRequired: isTrainingLinkRequired(context),
    practiceExamples: {
      recommended: blueprint.practiceExample.recommendedPerLesson,
      max: blueprint.practiceExample.maxPerLesson,
    },
    trainingLink: {
      recommendedPitchSlots: blueprint.trainingLink.recommendedPitchSlots,
      recommendedUsageContexts: blueprint.trainingLink.recommendedUsageContexts,
    },
    keyPoints: blueprint.keyPoints,
    commonMistakes: blueprint.commonMistakes,
    coachTips: blueprint.coachTips,
    relatedLessons: blueprint.relatedLessons,
  };
}

/** Schat leestijd in minuten op basis van woordenaantal — binnen blueprint-limieten. */
export function estimateReadingMinutesFromWordCount(wordCount: number): number {
  const { wordsPerMinute, maxMinutes } = getAcademyContentBlueprint().reading;
  return Math.min(maxMinutes, Math.ceil(wordCount / wordsPerMinute));
}

/** Controleert of woordenaantal binnen blueprint-limieten valt. */
export function isWordCountWithinBlueprint(wordCount: number): boolean {
  const { recommendedWordCount, maxWordCount } = getAcademyContentBlueprint().reading;
  return wordCount <= maxWordCount;
}

/** Controleert of geschatte leestijd binnen blueprint-limieten valt. */
export function isReadingTimeWithinBlueprint(minutes: number): boolean {
  const { maxMinutes } = getAcademyContentBlueprint().reading;
  return minutes > 0 && minutes <= maxMinutes;
}

export {
  getAcademyContentBlueprint,
  ACADEMY_CONTENT_BLUEPRINT,
};
