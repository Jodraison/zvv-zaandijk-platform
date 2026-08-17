import type { AcademyCategory, AcademyTopic } from "@/lib/academie/types";
import type { AcademyLessonContentLevel, AcademyLessonQualityLevel, AcademyLessonRequiredVisuals } from "@/lib/academie/lesson-standards";
import type { AcademyLessonStandardV1 } from "@/lib/academie/lesson-standard-v1";

/** Visueel mediablok — ondersteunt meerdere typen; sectie verborgen bij ontbreken. */
export type AcademyLessonVisual =
  | {
      kind: "placeholder";
      caption?: string;
    }
  | {
      kind: "image";
      src: string;
      alt: string;
      caption?: string;
    }
  | {
      kind: "tactical";
      src: string;
      alt: string;
      caption?: string;
    }
  | {
      kind: "youtube";
      videoId: string;
      title?: string;
      caption?: string;
    };

export type AcademyLessonRelatedTopic = {
  categorySlug: string;
  topicSlug: string;
  title: string;
};

/** Snelle scan-sectie direct onder de titel — alles optioneel. */
export type AcademyLessonQuickReference = {
  mainTask?: string;
  doThis?: string | string[];
  doNot?: string | string[];
  keyFocus?: string;
  /** Geschatte leestijd in minuten. */
  readingTimeMinutes?: number;
};

/** Opvallend coachblok — extra coaching, accent of aandachtspunt. */
export type AcademyLessonCoachNotebook = {
  title?: string;
  accent?: "coaching" | "attention" | "training" | "match";
  body: string;
};

/** Quiz-slot — structuur only; geen logica in fase 5. */
export type AcademyLessonQuizSlot = {
  enabled: boolean;
  label?: string;
  description?: string;
};

/** Sectiesleutels voor content anchors — koppelpunten voor latere inhoud. */
export type AcademyLessonSectionKey =
  | "summary"
  | "quickReference"
  | "visual"
  | "keyTakeaway"
  | "whyImportant"
  | "practicalExplanation"
  | "commonMistakes"
  | "coachNotebook"
  | "trainerFocus"
  | "selfCheck"
  | "relatedTopics"
  | "whyLearning"
  | "onThePitch"
  | "whenToUse";

/** Content anchor — uniek id per sectie; invullen via `lessons-data` zonder componentwijziging. */
export type AcademyLessonContentAnchor = {
  id: string;
};

export type AcademyLessonContentAnchors = Partial<Record<AcademyLessonSectionKey, AcademyLessonContentAnchor>>;

/** Optioneel praktijkvoorbeeld onder een hoofdsectie. */
export type AcademyLessonPracticeExample = {
  anchorId?: string;
  body?: string;
};

export type AcademyLessonSectionExtra = {
  practiceExample?: AcademyLessonPracticeExample;
};

/** Observatiepunt voor trainer — los van Coach's Notebook. */
export type AcademyLessonTrainerFocus = {
  anchorId?: string;
  body?: string;
};

/** Zelfcontrole-item — label invullen via data; checkbox is visueel only. */
export type AcademyLessonSelfCheckItem = {
  id: string;
  label?: string;
};

export type AcademyLessonSelfCheck = {
  anchorId?: string;
  items?: AcademyLessonSelfCheckItem[];
};

/** Sub-item voor veld-koppelingsblokken — tekst of anchor. */
export type AcademyLessonFieldSlot = {
  id: string;
  label?: string;
  body?: string;
  anchorId?: string;
};

/** Waarom-leer-ik-dit subthema's. */
export type AcademyLessonWhyLearningItemId = "why-important" | "delivers" | "helps-team" | "wins-matches";

export type AcademyLessonWhyLearningItem = AcademyLessonFieldSlot & {
  id: AcademyLessonWhyLearningItemId | string;
};

/** Koppeling les → waarom (training + wedstrijd). */
export type AcademyLessonWhyLearning = {
  anchorId?: string;
  items?: AcademyLessonWhyLearningItem[];
};

/** Trainingsvormen op het veld — voorbereid op video/oefenvorm-koppeling. */
export type AcademyLessonPitchFormatId =
  | "warming-up"
  | "positiespel"
  | "partijvorm"
  | "omschakelvorm"
  | "afwerkvorm"
  | "wedstrijd";

export type AcademyLessonPitchSlot = {
  id: AcademyLessonPitchFormatId | string;
  label?: string;
  body?: string;
  anchorId?: string;
  /** Toekomstige video-koppeling. */
  videoAnchorId?: string;
  /** Toekomstige oefenvorm-koppeling. */
  drillAnchorId?: string;
};

export type AcademyLessonOnThePitch = {
  anchorId?: string;
  slots?: AcademyLessonPitchSlot[];
};

/** Wedstrijd-/trainingssituaties — wanneer past deze les? */
export type AcademyLessonUsageContextId = "balbezit" | "balverlies" | "omschakeling" | "standaardsituaties" | "coaching";

export type AcademyLessonWhenToUseItem = AcademyLessonFieldSlot & {
  id: AcademyLessonUsageContextId | string;
};

export type AcademyLessonWhenToUse = {
  anchorId?: string;
  items?: AcademyLessonWhenToUseItem[];
};

/**
 * Canoniek Academy-lesmodel — één les per onderwerp (uitbreidbaar naar meerdere).
 * Alle secties zijn optioneel; lege velden worden niet getoond tenzij `contentAnchors` actief is.
 */
export type AcademyLesson = {
  id: string;
  topicId: AcademyTopic["id"];
  categoryId: AcademyCategory["id"];
  slug: string;
  title: string;
  /** Inhoudelijk niveau van de les. */
  lessonLevel?: AcademyLessonContentLevel;
  /** Geschatte leestijd in minuten (lesniveau; los van quickReference). */
  estimatedReadingTime?: number;
  /** Intern kwaliteitsniveau — optioneel expliciet; anders berekend via validation. */
  qualityLevel?: AcademyLessonQualityLevel;
  /** Verwachte media-aantallen voor kwaliteitscontrole. */
  requiredVisuals?: AcademyLessonRequiredVisuals;
  /** Content anchors — definieert lege sectiestructuur vóór invulling. */
  contentAnchors?: AcademyLessonContentAnchors;
  /** Optionele praktijkvoorbeelden gekoppeld aan hoofdsecties. */
  sectionExtras?: Partial<Record<AcademyLessonSectionKey, AcademyLessonSectionExtra>>;
  summary?: string;
  quickReference?: AcademyLessonQuickReference;
  keyTakeaway?: string;
  whyImportant?: string;
  /** Enkel visual — backward compatible. */
  visual?: AcademyLessonVisual;
  /** Meerdere visuals (afbeelding, tactisch, video) — heeft voorrang op `visual`. */
  visuals?: AcademyLessonVisual[];
  practicalExplanation?: string | string[];
  commonMistakes?: string[];
  coachNotebook?: AcademyLessonCoachNotebook;
  /** Observatiepunt trainer tijdens training/wedstrijd. */
  trainerFocus?: AcademyLessonTrainerFocus;
  /** Zelfcontrole voor speelsters — geen interactieve logica. */
  selfCheck?: AcademyLessonSelfCheck;
  /** Waarom leer ik dit? — koppeling les ↔ motivatie & teamresultaat. */
  whyLearning?: AcademyLessonWhyLearning;
  /** Op het trainingsveld — koppeling met trainingsvormen. */
  onThePitch?: AcademyLessonOnThePitch;
  /** Wanneer gebruik je dit? — balbezit, omschakeling, etc. */
  whenToUse?: AcademyLessonWhenToUse;
  coachTip?: string;
  keyPoints?: string[];
  relatedTopics?: AcademyLessonRelatedTopic[];
  quiz?: AcademyLessonQuizSlot;
  /**
   * Lesstandaard V1 — canonieke content-layout voor alle lessen.
   * Primair renderpad in `AcademyLessonLayout`.
   */
  standard?: AcademyLessonStandardV1;
};
