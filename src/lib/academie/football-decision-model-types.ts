import type { AcademyLessonSectionKey } from "@/lib/academie/lesson-types";
import type { FootballIntelligenceDimensionId } from "@/lib/academie/football-intelligence-types";

/**
 * Canonieke stappen van het Football Decision Model.
 * Universeel proces — geen positie- of situatie-afhankelijke logica.
 */
export type FootballDecisionStepId = "scan" | "recognize" | "decide" | "execute" | "evaluate";

/** Eén stap in het besluitvormingsproces. */
export type FootballDecisionStep = {
  id: FootballDecisionStepId;
  order: number;
  title: string;
  /** Leidende vraag — didactisch kader per stap. */
  guidingQuestion: string;
  /** Doel van deze stap in het denkproces. */
  goal: string;
  /** Beschrijving van het denkproces — geen voetbalinhoud. */
  thinkingProcess: string;
  /**
   * Koppeling naar Football Intelligence-dimensies.
   * FI beschrijft WÁÁR over nagedacht wordt; dit model beschrijft HOE.
   */
  intelligenceDimensions: FootballIntelligenceDimensionId[];
  /**
   * Module 2 — welke wedstrijdsituatie-taxonomie primair relevant is.
   * Leeg = alle situaties (stap geldt overal).
   */
  module2SituationFocus?: "all" | "primary-only";
  /** Bestaande lesson-secties waar deze stap inhoudelijk landt — geen layout-wijziging. */
  relatedLessonSectionKeys?: AcademyLessonSectionKey[];
};

/** Volledige Football Decision Model-configuratie. */
export type FootballDecisionModel = {
  version: string;
  /** Overkoepelende beschrijving van het denkproces. */
  description: string;
  steps: FootballDecisionStep[];
  /** Aanbevolen volgorde — altijd lineair per actiemoment. */
  processOrder: FootballDecisionStepId[];
};

/**
 * Toekomstige les-koppeling — type-only voor content-auteurs.
 * Nog geen veld op `AcademyLesson`; geen breaking changes.
 */
export type AcademyLessonDecisionBinding = {
  /** Anchor per besluitstap — invullen in `lessons-data`. */
  stepAnchors?: Partial<Record<FootballDecisionStepId, string>>;
};

/** Context voor het uitlezen van het model in combinatie met andere frameworks. */
export type FootballDecisionModelContext = {
  /** Primaire wedstrijdsituatie (Module 2 / FI-taxonomie). */
  primarySituationId?: string;
  intelligenceBinding?: import("@/lib/academie/football-intelligence-types").AcademyLessonIntelligenceBinding;
  decisionBinding?: AcademyLessonDecisionBinding;
};
