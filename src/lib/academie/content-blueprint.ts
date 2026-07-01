import type { AcademyLessonContentLevel, AcademyLessonQualityLevel } from "@/lib/academie/lesson-standards";

/**
 * Context voor het uitlezen van blueprint-regels per les.
 * `lessonLevel` = didactische diepgang; `qualityLevel` = publicatiestatus.
 */
export type AcademyContentBlueprintContext = {
  lessonLevel?: AcademyLessonContentLevel;
  qualityLevel?: AcademyLessonQualityLevel;
};

/** Wanneer een didactisch element verplicht is. */
export type AcademyContentRequirementRule = {
  /** Altijd verplicht bij publicatie. */
  always: boolean;
  /** Verplicht vanaf deze lesniveaus (intro / core / advanced). */
  fromLessonLevel?: AcademyLessonContentLevel[];
  /** Verplicht vanaf deze kwaliteitsniveaus (foundation / complete / advanced). */
  fromQualityLevel?: AcademyLessonQualityLevel[];
};

export type AcademyContentBlueprintReading = {
  /** Aanbevolen leestijd in minuten — scan-first les. */
  recommendedMinutes: number;
  /** Maximale leestijd — voorkomt lange documenten. */
  maxMinutes: number;
  /** Aanbevolen woordenaantal (totale lopende tekst). */
  recommendedWordCount: number;
  /** Maximaal woordenaantal. */
  maxWordCount: number;
  /** Schatting woorden per minuut voor jeugd-/sportcontent. */
  wordsPerMinute: number;
};

export type AcademyContentBlueprintVisuals = {
  /** Aanbevolen totaal aantal media-items (afbeelding + tactisch + video). */
  recommendedTotal: number;
  /** Maximaal aanbevolen media-items. */
  maxTotal: number;
  recommendedImages: number;
  recommendedVideos: number;
  recommendedTacticalIllustrations: number;
};

export type AcademyContentBlueprintListCounts = {
  recommended: number;
  min: number;
  max: number;
};

/**
 * Academy Content Blueprint — canonieke didactische kwaliteitsregels.
 *
 * Beschrijft HOE elke les inhoudelijk wordt opgebouwd, niet WAT erin staat.
 * Enige bron voor content-richtlijnen; `lesson-standards` blijft technische validatie.
 */
export type AcademyContentBlueprint = {
  reading: AcademyContentBlueprintReading;
  visuals: AcademyContentBlueprintVisuals;
  /** Wanneer minimaal één tactische illustratie verplicht is. */
  tacticalIllustration: {
    required: AcademyContentRequirementRule;
    minCountWhenRequired: number;
  };
  /** Wanneer minimaal één praktijkvoorbeeld verplicht is. */
  practiceExample: {
    required: AcademyContentRequirementRule;
    recommendedPerLesson: number;
    maxPerLesson: number;
  };
  /** Wanneer veld-koppeling (trainingsveld-blok) verplicht is. */
  trainingLink: {
    required: AcademyContentRequirementRule;
    recommendedPitchSlots: number;
    recommendedUsageContexts: number;
  };
  keyPoints: AcademyContentBlueprintListCounts;
  commonMistakes: AcademyContentBlueprintListCounts;
  /** Coach-tip + Coach's notebook samen — max één primair accent per les. */
  coachTips: AcademyContentBlueprintListCounts;
  relatedLessons: AcademyContentBlueprintListCounts;
};

/** Canonieke Academy Content Blueprint — geldt voor alle huidige én toekomstige lessen. */
export const ACADEMY_CONTENT_BLUEPRINT: AcademyContentBlueprint = {
  reading: {
    recommendedMinutes: 3,
    maxMinutes: 5,
    recommendedWordCount: 450,
    maxWordCount: 750,
    wordsPerMinute: 150,
  },
  visuals: {
    recommendedTotal: 2,
    maxTotal: 4,
    recommendedImages: 1,
    recommendedVideos: 0,
    recommendedTacticalIllustrations: 1,
  },
  tacticalIllustration: {
    required: {
      always: false,
      fromLessonLevel: ["core", "advanced"],
      fromQualityLevel: ["complete", "advanced"],
    },
    minCountWhenRequired: 1,
  },
  practiceExample: {
    required: {
      always: false,
      fromLessonLevel: ["intro", "core", "advanced"],
      fromQualityLevel: ["complete", "advanced"],
    },
    recommendedPerLesson: 2,
    maxPerLesson: 6,
  },
  trainingLink: {
    required: {
      always: false,
      fromLessonLevel: ["intro", "core", "advanced"],
      fromQualityLevel: ["complete", "advanced"],
    },
    recommendedPitchSlots: 3,
    recommendedUsageContexts: 3,
  },
  keyPoints: {
    recommended: 4,
    min: 2,
    max: 6,
  },
  commonMistakes: {
    recommended: 3,
    min: 2,
    max: 5,
  },
  coachTips: {
    recommended: 1,
    min: 0,
    max: 2,
  },
  relatedLessons: {
    recommended: 2,
    min: 1,
    max: 4,
  },
};

/** Retourneert het canonieke content blueprint (readonly kopie van config). */
export function getAcademyContentBlueprint(): AcademyContentBlueprint {
  return ACADEMY_CONTENT_BLUEPRINT;
}
