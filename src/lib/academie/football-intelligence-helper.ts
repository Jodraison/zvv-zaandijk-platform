import {
  FOOTBALL_INTELLIGENCE_FRAMEWORK,
  getFootballIntelligenceFramework,
} from "@/lib/academie/football-intelligence-framework";
import type {
  AcademyLessonIntelligenceBinding,
  FootballIntelligenceAspect,
  FootballIntelligenceDimension,
  FootballIntelligenceDimensionId,
  FootballIntelligenceTaxonomySlot,
} from "@/lib/academie/football-intelligence-types";

const dimensionById = new Map<FootballIntelligenceDimensionId, FootballIntelligenceDimension>(
  FOOTBALL_INTELLIGENCE_FRAMEWORK.dimensions.map((d) => [d.id, d]),
);

/** Alle denk lagen in framework-volgorde. */
export function listFootballIntelligenceDimensions(): FootballIntelligenceDimension[] {
  return [...getFootballIntelligenceFramework().dimensions].sort((a, b) => a.order - b.order);
}

/** Denk lagen in aanbevolen lesopbouw-volgorde. */
export function listFootballIntelligenceThinkingOrder(): FootballIntelligenceDimension[] {
  const framework = getFootballIntelligenceFramework();
  return framework.thinkingOrder
    .map((id) => dimensionById.get(id))
    .filter((d): d is FootballIntelligenceDimension => d !== undefined);
}

export function getFootballIntelligenceDimension(id: FootballIntelligenceDimensionId): FootballIntelligenceDimension | undefined {
  return dimensionById.get(id);
}

export function getFootballIntelligenceCentralQuestion(): string {
  return getFootballIntelligenceFramework().centralQuestion;
}

/** Taxonomie-slots voor wedstrijdsituaties. */
export function listMatchSituationTaxonomy(): FootballIntelligenceTaxonomySlot[] {
  const dimension = getFootballIntelligenceDimension("matchSituation");
  return dimension?.taxonomySlots ? [...dimension.taxonomySlots].sort((a, b) => a.order - b.order) : [];
}

export function getMatchSituationSlot(situationId: string): FootballIntelligenceTaxonomySlot | undefined {
  return listMatchSituationTaxonomy().find((slot) => slot.id === situationId);
}

/** Sub-aspecten per denklaag — bijv. linietaak, ruimtes, besluitvorming. */
export function listFootballIntelligenceAspects(dimensionId: FootballIntelligenceDimensionId): FootballIntelligenceAspect[] {
  const dimension = getFootballIntelligenceDimension(dimensionId);
  return dimension?.aspects ? [...dimension.aspects].sort((a, b) => a.order - b.order) : [];
}

export function getFootballIntelligenceAspect(
  dimensionId: FootballIntelligenceDimensionId,
  aspectId: string,
): FootballIntelligenceAspect | undefined {
  return listFootballIntelligenceAspects(dimensionId).find((aspect) => aspect.id === aspectId);
}

/** Bestaande lesson-secties die aan een denklaag kunnen koppelen. */
export function getRelatedLessonSectionsForDimension(dimensionId: FootballIntelligenceDimensionId) {
  return getFootballIntelligenceDimension(dimensionId)?.relatedLessonSectionKeys ?? [];
}

export type FootballIntelligenceLessonContext = {
  binding?: AcademyLessonIntelligenceBinding;
};

/**
 * Resolveert actieve denk lagen voor een les — op basis van optionele binding.
 * Zonder binding: volledige framework-volgorde (auteur-template).
 */
export function resolveFootballIntelligenceContext(context: FootballIntelligenceLessonContext = {}) {
  const framework = getFootballIntelligenceFramework();
  const ordered = listFootballIntelligenceThinkingOrder();

  const primarySituation = context.binding?.primarySituationId
    ? getMatchSituationSlot(context.binding.primarySituationId)
    : undefined;

  return {
    version: framework.version,
    centralQuestion: framework.centralQuestion,
    dimensions: ordered,
    primarySituation,
    binding: context.binding,
  };
}

/** Genereert een stabiel anchor-prefix voor een les + denklaag (content-auteurs). */
export function buildIntelligenceAnchorPrefix(lessonId: string, dimensionId: FootballIntelligenceDimensionId): string {
  return `intelligence.${lessonId}.${dimensionId}`;
}

export {
  getFootballIntelligenceFramework,
  FOOTBALL_INTELLIGENCE_FRAMEWORK,
};
