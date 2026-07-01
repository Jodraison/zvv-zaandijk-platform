import type { FootballIntelligenceFramework } from "@/lib/academie/football-intelligence-types";

/**
 * Football Intelligence Framework — centraal denkraam ZVV Zaandijk VRZ1.
 *
 * GEEN voetbalinhoud. GEEN tactische oplossingen.
 * Beschrijft HOE speelsters moeten denken: WAAROM · WANNEER · WAAR · MET WIE · WELKE KEUZES.
 */
export const FOOTBALL_INTELLIGENCE_FRAMEWORK: FootballIntelligenceFramework = {
  version: "1.0.0",
  centralQuestion: "Wat gebeurt er nu in de wedstrijd?",
  thinkingOrder: [
    "matchSituation",
    "individualTask",
    "lineTask",
    "teamTask",
    "spaces",
    "decisionMaking",
    "commonMistakes",
    "coachVision",
  ],
  dimensions: [
    {
      id: "matchSituation",
      order: 1,
      title: "Wedstrijdsituatie",
      guidingQuestion: "Wat is de spelsituatie op dit moment?",
      description: "Startpunt van elke les — wat gebeurt er nu met en zonder bal?",
      taxonomySlots: [
        { id: "in-possession", order: 1, title: "Wij hebben de bal", description: "Balbezit — organisatie met de bal." },
        { id: "losing-possession", order: 2, title: "Wij verliezen de bal", description: "Moment van balverlies — directe reactie." },
        { id: "out-of-possession", order: 3, title: "Tegenstander heeft de bal", description: "Verdedigend organiseren zonder bal." },
        { id: "regaining-possession", order: 4, title: "Wij veroveren de bal", description: "Omschakeling na balverovering." },
        { id: "dead-ball", order: 5, title: "Dode spelmomenten", description: "Standards, ingooi, aftrap — organisatie en afspraken." },
      ],
      relatedLessonSectionKeys: ["whenToUse", "whyLearning"],
    },
    {
      id: "individualTask",
      order: 2,
      title: "Individuele taak",
      guidingQuestion: "Wat wordt van jouw positie verwacht in deze situatie?",
      description: "Persoonlijke rol en verantwoordelijkheid — niet generiek 'hoe speelt een positie'.",
      relatedLessonSectionKeys: ["quickReference", "practicalExplanation", "trainerFocus"],
    },
    {
      id: "lineTask",
      order: 3,
      title: "Linietaak",
      guidingQuestion: "Wat doet jouw linie als geheel?",
      description: "Collectieve taak per linie — afgestemd op de wedstrijdsituatie.",
      aspects: [
        { id: "defense", order: 1, title: "Verdediging", guidingQuestion: "Wat doet de verdedigingslinie?" },
        { id: "midfield", order: 2, title: "Middenveld", guidingQuestion: "Wat doet het middenveld?" },
        { id: "attack", order: 3, title: "Aanval", guidingQuestion: "Wat doet de aanvallingslinie?" },
      ],
      relatedLessonSectionKeys: ["practicalExplanation", "visual"],
    },
    {
      id: "teamTask",
      order: 4,
      title: "Teamtaak",
      guidingQuestion: "Wat doet het hele team in deze situatie?",
      description: "Collectief gedrag — afspraken, compactheid, omschakelen als één eenheid.",
      relatedLessonSectionKeys: ["whyImportant", "keyTakeaway", "whyLearning"],
    },
    {
      id: "spaces",
      order: 5,
      title: "Ruimtes",
      guidingQuestion: "Welke ruimtes spelen een rol — en wat doen wij ermee?",
      description: "Zones op het veld: beschermen, benutten, of bewust open laten.",
      aspects: [
        { id: "important-zones", order: 1, title: "Belangrijke zones", guidingQuestion: "Welke zones zijn nu het belangrijkst?" },
        { id: "emerging-spaces", order: 2, title: "Ontstaande ruimtes", guidingQuestion: "Welke ruimtes ontstaan door de situatie?" },
        { id: "spaces-to-defend", order: 3, title: "Ruimtes verdedigen", guidingQuestion: "Welke ruimtes moeten wij dichten?" },
        { id: "spaces-to-exploit", order: 4, title: "Ruimtes benutten", guidingQuestion: "Welke ruimtes willen wij juist bespelen?" },
      ],
      relatedLessonSectionKeys: ["visual", "onThePitch"],
    },
    {
      id: "decisionMaking",
      order: 6,
      title: "Besluitvorming",
      guidingQuestion: "Welke keuze maak jij — en waarom?",
      description: "Keuzes, voorkeursoptie en onderbouwing — het voetbalbrein in actie.",
      aspects: [
        { id: "available-choices", order: 1, title: "Beschikbare keuzes", guidingQuestion: "Welke opties heeft de speelster?" },
        { id: "preferred-choice", order: 2, title: "Onze keuze", guidingQuestion: "Welke keuze maken wij binnen ZVV?" },
        { id: "choice-rationale", order: 3, title: "Waarom", guidingQuestion: "Waarom is dit de juiste keuze in deze situatie?" },
      ],
      relatedLessonSectionKeys: ["keyTakeaway", "selfCheck", "quickReference"],
    },
    {
      id: "commonMistakes",
      order: 7,
      title: "Veelgemaakte fouten",
      guidingQuestion: "Wat gaat er in de praktijk vaak mis?",
      description: "Herkenbare fouten in wedstrijd en training — wat te vermijden.",
      relatedLessonSectionKeys: ["commonMistakes", "selfCheck"],
    },
    {
      id: "coachVision",
      order: 8,
      title: "Coachvisie",
      guidingQuestion: "Wat is het perspectief van de hoofdtrainer?",
      description: "Ruimte voor visie, accent en clubfilosofie — boven individuele instructie.",
      relatedLessonSectionKeys: ["coachNotebook", "trainerFocus"],
    },
  ],
};

/** Retourneert het canonieke Football Intelligence Framework. */
export function getFootballIntelligenceFramework(): FootballIntelligenceFramework {
  return FOOTBALL_INTELLIGENCE_FRAMEWORK;
}
