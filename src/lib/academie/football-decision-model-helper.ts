import {
  FOOTBALL_DECISION_MODEL,
  getFootballDecisionModel,
} from "@/lib/academie/football-decision-model";
import type {
  FootballDecisionModelContext,
  FootballDecisionStep,
  FootballDecisionStepId,
} from "@/lib/academie/football-decision-model-types";
import type { FootballIntelligenceDimensionId } from "@/lib/academie/football-intelligence-types";
import {
  getFootballIntelligenceDimension,
  getMatchSituationSlot,
  listMatchSituationTaxonomy,
} from "@/lib/academie/football-intelligence-helper";

const stepById = new Map<FootballDecisionStepId, FootballDecisionStep>(
  FOOTBALL_DECISION_MODEL.steps.map((s) => [s.id, s]),
);

/** Alle besluitstappen in procesvolgorde. */
export function listFootballDecisionSteps(): FootballDecisionStep[] {
  const model = getFootballDecisionModel();
  return model.processOrder
    .map((id) => stepById.get(id))
    .filter((s): s is FootballDecisionStep => s !== undefined);
}

export function getFootballDecisionStep(id: FootballDecisionStepId): FootballDecisionStep | undefined {
  return stepById.get(id);
}

/** FI-dimensies gekoppeld aan een besluitstap. */
export function getIntelligenceDimensionsForDecisionStep(stepId: FootballDecisionStepId): FootballIntelligenceDimensionId[] {
  return getFootballDecisionStep(stepId)?.intelligenceDimensions ?? [];
}

/**
 * Omgekeerde mapping — welke besluitstappen raken een FI-dimensie.
 * `decisionMaking` dekt vooral decide + execute + evaluate (geen duplicaat proces).
 */
export function getDecisionStepsForIntelligenceDimension(dimensionId: FootballIntelligenceDimensionId): FootballDecisionStepId[] {
  return listFootballDecisionSteps()
    .filter((step) => step.intelligenceDimensions.includes(dimensionId))
    .map((step) => step.id);
}

/** Bestaande lesson-secties per besluitstap. */
export function getRelatedLessonSectionsForDecisionStep(stepId: FootballDecisionStepId) {
  return getFootballDecisionStep(stepId)?.relatedLessonSectionKeys ?? [];
}

/**
 * Resolveert het volledige denkproces voor een lescontext.
 * Combineert Decision Model + FI + Module 2-situatie zonder nieuwe UI.
 */
export function resolveFootballDecisionProcess(context: FootballDecisionModelContext = {}) {
  const model = getFootballDecisionModel();
  const steps = listFootballDecisionSteps();
  const primarySituation = context.primarySituationId
    ? getMatchSituationSlot(context.primarySituationId)
    : undefined;

  return {
    version: model.version,
    description: model.description,
    steps,
    primarySituation,
    allSituations: listMatchSituationTaxonomy(),
    binding: context.decisionBinding,
    intelligenceBinding: context.intelligenceBinding,
  };
}

/** Stabiel anchor-prefix per les + besluitstap (content-auteurs). */
export function buildDecisionAnchorPrefix(lessonId: string, stepId: FootballDecisionStepId): string {
  return `decision.${lessonId}.${stepId}`;
}

/**
 * Overlapcontrole — documenteert integratie met Football Intelligence Framework.
 * Returns mapping notes for authors; geen runtime validatie vereist.
 */
export function getDecisionModelIntegrationNotes(): {
  footballIntelligence: string;
  module2: string;
  contentBlueprint: string;
  lessonSections: string;
} {
  return {
    footballIntelligence:
      "FI-dimensies zijn inhoudelijke lenses; Decision Model is het proces dat er doorheen loopt. " +
      "Dimensie `decisionMaking` uitdrukkelijk gekoppeld aan stappen decide, execute en evaluate — niet als zesde parallel proces.",
    module2:
      "Module 2-situaties (S0–S6) zijn het WHAT/WHEN; elke situatieles doorloopt scan→evaluate per actiemoment. " +
      "Stap `recognize` en `execute` zijn situation-primary; overige stappen gelden in alle situaties.",
    contentBlueprint:
      "Content Blueprint regelt kwantiteit (woorden, visuals); Decision Model regelt denkvolgorde. Geen overlap.",
    lessonSections:
      "Bestaande lesson-secties mappen op stappen via relatedLessonSectionKeys — geen nieuwe layout-componenten.",
  };
}

/** Controleert of een FI-dimension primair proces of inhoud is. */
export function isIntelligenceDimensionProcessOverlap(dimensionId: FootballIntelligenceDimensionId): boolean {
  if (dimensionId !== "decisionMaking") return false;
  return !!getFootballIntelligenceDimension("decisionMaking");
}

export {
  getFootballDecisionModel,
  FOOTBALL_DECISION_MODEL,
};
