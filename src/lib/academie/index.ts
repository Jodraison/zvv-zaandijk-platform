/**
 * Football Academy — publieke API.
 * Importeer vanuit `@/lib/academie` i.p.v. losse modules.
 */

export type {
  AcademyArticle,
  AcademyCategory,
  AcademyCategoryRef,
  AcademyMediaItem,
  AcademySearchDocument,
  AcademyTag,
  AcademyTopic,
} from "@/lib/academie/types";

export { ACADEMY_CATEGORY_DEFINITIONS } from "@/lib/academie/categories-data";

export {
  ACADEMY_LEARNING_PATHS,
  listAcademyLearningPaths,
} from "@/lib/academie/learning-paths";
export type {
  AcademyLearningPath,
  LearningPathStatus,
} from "@/lib/academie/learning-paths";

export {
  getAcademyCategoryOverview,
  hasAcademyCategoryOverview,
} from "@/lib/academie/category-overviews";
export type { AcademyCategoryOverview } from "@/lib/academie/category-overviews";

export { ACADEMY_TOPIC_DEFINITIONS } from "@/lib/academie/topics-data";

export {
  ACADEMY_HOME_HERO,
  ACADEMY_HOME_INTRO,
  ACADEMY_QUICK_ACCESS_DEFINITIONS,
  ACADEMY_SEARCH_PLACEHOLDER_EXAMPLES,
} from "@/lib/academie/home-experience";
export type { AcademyQuickAccessDefinition } from "@/lib/academie/home-experience";

export {
  academyCategoryHref,
  buildAcademyCategorySearchIndex,
  getAcademyCategory,
  getAcademyCategoryById,
  listAcademyCategories,
  listAcademyQuickAccess,
  listAllAcademyCategories,
  toAcademyCategoryRef,
} from "@/lib/academie/registry";

export type { AcademyQuickAccessItem } from "@/lib/academie/registry";

export {
  academyTopicHref,
  buildAcademyTopicSearchIndex,
  getAcademyTopic,
  getAcademyTopicById,
  listAcademyTopicRoutes,
  listAcademyTopicsByCategorySlug,
  listAllAcademyTopics,
} from "@/lib/academie/topics-registry";

export type {
  AcademyLesson,
  AcademyLessonCoachNotebook,
  AcademyLessonContentAnchor,
  AcademyLessonContentAnchors,
  AcademyLessonPracticeExample,
  AcademyLessonQuickReference,
  AcademyLessonQuizSlot,
  AcademyLessonRelatedTopic,
  AcademyLessonSectionExtra,
  AcademyLessonSectionKey,
  AcademyLessonSelfCheck,
  AcademyLessonSelfCheckItem,
  AcademyLessonTrainerFocus,
  AcademyLessonVisual,
  AcademyLessonWhyLearning,
  AcademyLessonWhyLearningItem,
  AcademyLessonWhyLearningItemId,
  AcademyLessonOnThePitch,
  AcademyLessonPitchFormatId,
  AcademyLessonPitchSlot,
  AcademyLessonWhenToUse,
  AcademyLessonWhenToUseItem,
  AcademyLessonUsageContextId,
  AcademyLessonFieldSlot,
} from "@/lib/academie/lesson-types";

export {
  ACADEMY_LESSON_LEVEL_LABELS,
  ACADEMY_LESSON_POSITION_IDS,
  ACADEMY_LESSON_POSITION_LABELS,
} from "@/lib/academie/lesson-standard-v1";
export type {
  AcademyLessonAgreementCard,
  AcademyLessonChoiceCompare,
  AcademyLessonChoiceMoment,
  AcademyLessonCoachingChip,
  AcademyLessonDecisionBranch,
  AcademyLessonDecisionStep,
  AcademyLessonFieldLegendItem,
  AcademyLessonMatchMoment,
  AcademyLessonMistakePair,
  AcademyLessonMistakeVisual,
  AcademyLessonPositionCard,
  AcademyLessonPositionId,
  AcademyLessonStandardV1,
  AcademyLessonVideoSlot,
  AcademyLessonWhyCard,
} from "@/lib/academie/lesson-standard-v1";

/** Tactical Visual System V1 — canonieke illustratieregels. */
export {
  FORMATION_4231_US,
  FORMATION_4231_US_COMPACT,
  FORMATION_KW_R6,
  FORMATION_PRESS_BASE,
  KW_R6_OPPONENTS,
  PRESS_BALL,
  PRESS_OPPONENTS,
  TACTICAL_COLORS,
  TACTICAL_LEGEND_ITEMS,
  TACTICAL_VIEWBOX,
  ballBesideHolder,
  fieldPointToSvg,
  usPlayersFromFormation,
} from "@/lib/academie/tactical-visual-system";
export type {
  TacticalLine,
  TacticalLineKind,
  TacticalOurPosition,
  TacticalPlayerMarker,
  TacticalPoint,
  TacticalSituationDefinition,
  TacticalSituationId,
  TacticalTeam,
  TacticalTitleEyebrow,
  TacticalZone,
} from "@/lib/academie/tactical-visual-system";

export { evaluateTacticalAnimation, lerpPoint } from "@/lib/academie/tactical-animation-engine";
export { getTacticalAnimation, listAnimatedSituationIds } from "@/lib/academie/tactical-animation-registry";
export {
  createCurvedRun,
  createPressingArc,
  avoidPlayerCollision,
  createSafeCurvedRun,
} from "@/lib/academie/tactical-animation-collision";
export type { TacticalPhaseState, TacticalSequenceBrief } from "@/lib/academie/tactical-animation-v4-state";
export { canLastLineStepUp, PRESS_GOOD_BRIEF, PRESS_BAD_BRIEF, CONNECTED_TEAM_BRIEF } from "@/lib/academie/tactical-animation-v4-state";
export {
  validateAnimationV4,
  validateAnimationCollision,
  validateDefensiveSpacing,
  validatePressingChain,
  validateLocalNumbers,
  validateRoleIntegrity,
} from "@/lib/academie/tactical-animation-v4-validators";
export type {
  CollectiveTeamState,
  CollectiveSequenceBrief,
  LastLineAction,
  RestDefenseStructure,
  OpponentTacticalBrief,
  CollectiveFrameAudit,
} from "@/lib/academie/tactical-collective";
export {
  applyCollectiveShift,
  evaluateLastLineAction,
  usCollectiveShape,
  opponentCollectiveShape,
  measureTeamLength,
  measureLineGapsUs,
  auditCollectiveFrame,
  TEAM_LENGTH_GUIDE,
  LINE_GAP_GUIDE,
} from "@/lib/academie/tactical-collective";
export {
  getCollectiveBrief,
  COLLECTIVE_PILOT_IDS,
  KW_R6_COLLECTIVE_BRIEF,
  CONNECTED_TEAM_COLLECTIVE_BRIEF,
} from "@/lib/academie/tactical-collective-briefs";
export {
  validateCollectiveAnimation,
  validateAllCollective,
} from "@/lib/academie/tactical-collective-validate";
export type { CollectiveValidationIssue } from "@/lib/academie/tactical-collective-validate";
export type {
  TacticalAnimationDefinition,
  TacticalAnimationFrame,
  TacticalAnimationPhase,
} from "@/lib/academie/tactical-animation-types";
export { TACTICAL_ANIMATION_PREF_KEY } from "@/lib/academie/tactical-animation-types";

export { ACADEMY_LESSON_DEFINITIONS } from "@/lib/academie/lessons-data";

export {
  buildAcademyLessonSearchIndex,
  getAcademyLesson,
  getAcademyLessonById,
  getAcademyLessonByTopicId,
  hasAcademyLesson,
  listAcademyLessonRoutes,
  listAllAcademyLessons,
} from "@/lib/academie/lessons-registry";

export {
  getLessonSectionAnchor,
  getSectionPracticeExample,
  hasCoachNotebook,
  hasFieldSlots,
  hasLessonList,
  hasLessonText,
  hasOnThePitch,
  hasPracticeExample,
  hasQuickReference,
  hasSelfCheck,
  hasTrainerFocus,
  hasWhenToUse,
  hasWhyLearning,
  lessonHasVisualBlock,
  lessonSectionIsAnchored,
  normalizeLessonParagraphs,
  resolveFieldSlotAnchor,
  resolveLessonVisuals,
  shouldRenderFieldBlock,
  shouldRenderLessonSection,
} from "@/lib/academie/lesson-utils";

export {
  ACADEMY_LESSON_QUALITY_LABELS,
  ACADEMY_LESSON_QUALITY_LEVELS,
  ACADEMY_LESSON_STANDARDS,
  getAcademyLessonStandards,
} from "@/lib/academie/lesson-standards";
export type {
  AcademyLessonContentLevel,
  AcademyLessonQualityLevel,
  AcademyLessonRequiredVisuals,
  AcademyLessonStandards,
} from "@/lib/academie/lesson-standards";

export {
  countLessonSections,
  countLessonVisuals,
  lessonHasVisual,
  lessonMissingKeyTakeaway,
  lessonMissingQuickReference,
  lessonMissingSummary,
  lessonMissingVisual,
  resolveLessonQualityLevel,
  validateAcademyLesson,
  validateAllAcademyLessons,
} from "@/lib/academie/lesson-validation";
export type {
  AcademyLessonValidationCode,
  AcademyLessonValidationIssue,
  AcademyLessonValidationResult,
} from "@/lib/academie/lesson-validation";

export type {
  AcademyChapter,
  AcademyChapterLessonNav,
  AcademyChapterLessonSlot,
  AcademyChapterLessonStatus,
  ResolvedAcademyChapterLesson,
} from "@/lib/academie/chapter-types";

export { ACADEMY_CHAPTER_DEFINITIONS } from "@/lib/academie/chapters-data";

export {
  getAcademyChapterByCategoryId,
  getAcademyChapterByCategorySlug,
  getAcademyChapterLessonNav,
  hasAcademyChapter,
  listAllAcademyChapters,
} from "@/lib/academie/chapters-registry";

export {
  ACADEMY_CHAPTER_LESSON_STATUS_LABELS,
  ACADEMY_LESSON_CONTENT_LEVEL_LABELS,
  countAvailableChapterLessons,
  countChapterLessons,
  getChapterLessonNavigation,
  getChapterProgressPlaceholder,
  resolveAcademyChapterLessons,
} from "@/lib/academie/chapter-utils";

export {
  ACADEMY_CONTENT_BLUEPRINT,
  getAcademyContentBlueprint,
} from "@/lib/academie/content-blueprint";
export type {
  AcademyContentBlueprint,
  AcademyContentBlueprintContext,
  AcademyContentBlueprintListCounts,
  AcademyContentBlueprintReading,
  AcademyContentBlueprintVisuals,
  AcademyContentRequirementRule,
} from "@/lib/academie/content-blueprint";

export {
  estimateReadingMinutesFromWordCount,
  getBlueprintReadingGuidelines,
  getBlueprintVisualGuidelines,
  getContentGuidelinesForLesson,
  isContentRequirementActive,
  isPracticeExampleRequired,
  isReadingTimeWithinBlueprint,
  isTacticalIllustrationRequired,
  isTrainingLinkRequired,
  isWordCountWithinBlueprint,
} from "@/lib/academie/content-blueprint-helper";
export type { AcademyContentGuidelines } from "@/lib/academie/content-blueprint-helper";

export {
  FOOTBALL_INTELLIGENCE_FRAMEWORK,
  getFootballIntelligenceFramework,
} from "@/lib/academie/football-intelligence-framework";

export type {
  AcademyLessonIntelligenceBinding,
  FootballIntelligenceAspect,
  FootballIntelligenceAspectId,
  FootballIntelligenceDimension,
  FootballIntelligenceDimensionId,
  FootballIntelligenceFramework,
  FootballIntelligenceTaxonomySlot,
} from "@/lib/academie/football-intelligence-types";

export {
  buildIntelligenceAnchorPrefix,
  getFootballIntelligenceAspect,
  getFootballIntelligenceCentralQuestion,
  getFootballIntelligenceDimension,
  getMatchSituationSlot,
  getRelatedLessonSectionsForDimension,
  listFootballIntelligenceAspects,
  listFootballIntelligenceDimensions,
  listFootballIntelligenceThinkingOrder,
  listMatchSituationTaxonomy,
  resolveFootballIntelligenceContext,
} from "@/lib/academie/football-intelligence-helper";
export type { FootballIntelligenceLessonContext } from "@/lib/academie/football-intelligence-helper";

export {
  FOOTBALL_DECISION_MODEL,
  getFootballDecisionModel,
} from "@/lib/academie/football-decision-model";

export type {
  AcademyLessonDecisionBinding,
  FootballDecisionModel,
  FootballDecisionModelContext,
  FootballDecisionStep,
  FootballDecisionStepId,
} from "@/lib/academie/football-decision-model-types";

export {
  buildDecisionAnchorPrefix,
  getDecisionModelIntegrationNotes,
  getDecisionStepsForIntelligenceDimension,
  getFootballDecisionStep,
  getIntelligenceDimensionsForDecisionStep,
  getRelatedLessonSectionsForDecisionStep,
  isIntelligenceDimensionProcessOverlap,
  listFootballDecisionSteps,
  resolveFootballDecisionProcess,
} from "@/lib/academie/football-decision-model-helper";
