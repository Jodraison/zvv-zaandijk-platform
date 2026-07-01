import type { AcademyLessonSectionKey } from "@/lib/academie/lesson-types";

/**
 * Canonieke denklaag-identifiers — stabiel over alle Academy-lessen.
 * Uitbreidbaar via framework-config; geen hardcoded leslogica.
 */
export type FootballIntelligenceDimensionId =
  | "matchSituation"
  | "individualTask"
  | "lineTask"
  | "teamTask"
  | "spaces"
  | "decisionMaking"
  | "commonMistakes"
  | "coachVision";

/** Sub-aspect binnen een denklaag — bijv. linietaak → verdediging. */
export type FootballIntelligenceAspectId = string;

export type FootballIntelligenceAspect = {
  id: FootballIntelligenceAspectId;
  order: number;
  title: string;
  /** Leidende vraag per aspect — didactisch kader, geen tactic-inhoud. */
  guidingQuestion: string;
};

/**
 * Taxonomie-slot — categorie waar lessen en content aan kunnen koppelen.
 * Labels beschrijven het denkraam, geen club-specifieke oplossingen.
 */
export type FootballIntelligenceTaxonomySlot = {
  id: string;
  order: number;
  title: string;
  description?: string;
};

/** Eén denklaag binnen het Football Intelligence Framework. */
export type FootballIntelligenceDimension = {
  id: FootballIntelligenceDimensionId;
  order: number;
  title: string;
  /** Centrale vraag voor deze laag — antwoord invullen in lesdata, niet hier. */
  guidingQuestion: string;
  description: string;
  /** Optionele sub-aspecten (linietaak, ruimtes, besluitvorming). */
  aspects?: FootballIntelligenceAspect[];
  /** Optionele taxonomie (wedstrijdsituaties). */
  taxonomySlots?: FootballIntelligenceTaxonomySlot[];
  /** Koppeling naar bestaande lesson-secties — zonder layout-wijziging. */
  relatedLessonSectionKeys?: AcademyLessonSectionKey[];
};

/** Volledige Football Intelligence Framework-configuratie. */
export type FootballIntelligenceFramework = {
  version: string;
  /** Overkoepelende wedstrijdvraag — leidend voor alle lessen. */
  centralQuestion: string;
  dimensions: FootballIntelligenceDimension[];
  /** Aanbevolen denkvolgorde bij lesopbouw. */
  thinkingOrder: FootballIntelligenceDimensionId[];
};

/**
 * Toekomstige les-koppeling — type-only voor content-auteurs.
 * Nog geen veld op `AcademyLesson`; geen breaking changes.
 */
export type AcademyLessonIntelligenceBinding = {
  /** Primaire wedstrijdsituatie-taxonomie-id. */
  primarySituationId?: string;
  /** Anchor per denklaag — koppel aan `contentAnchors` of dedicated slots. */
  dimensionAnchors?: Partial<Record<FootballIntelligenceDimensionId, string>>;
  /** Actieve aspect-ids per denklaag. */
  aspectIds?: Partial<Record<FootballIntelligenceDimensionId, FootballIntelligenceAspectId[]>>;
};
