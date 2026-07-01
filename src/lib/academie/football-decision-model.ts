import type { FootballDecisionModel } from "@/lib/academie/football-decision-model-types";

/**
 * Football Decision Model — universeel besluitvormingsproces ZVV Zaandijk VRZ1.
 *
 * GEEN voetbalinhoud. GEEN positie-specifieke logica.
 * Beschrijft HOE elke speelster denkt vóór, tijdens en na een actie.
 *
 * Relatie met Football Intelligence Framework:
 * - FI = inhoudelijke denk lagen (WÁÁR over nadenken)
 * - Decision Model = proces (HOE nadenken: scan → … → evalueer)
 *
 * Relatie met Module 2:
 * - Elke Module 2-situatie (S0–S6) doorloopt dezelfde 5 stappen per actiemoment.
 */
export const FOOTBALL_DECISION_MODEL: FootballDecisionModel = {
  version: "1.0.0",
  description:
    "Universeel denkproces dat elke speelster doorloopt vóór en na elke actie — ongeacht positie, linie of wedstrijdsituatie.",
  processOrder: ["scan", "recognize", "decide", "execute", "evaluate"],
  steps: [
    {
      id: "scan",
      order: 1,
      title: "Scan",
      guidingQuestion: "Wat zie je?",
      goal: "Waarnemen zonder oordeel — feitelijk vaststellen wat er op het veld gebeurt.",
      thinkingProcess:
        "Head up: bal, teamgenoten, tegenstanders, open ruimtes, druk. Geen keuze maken — alleen zien.",
      intelligenceDimensions: ["spaces"],
      module2SituationFocus: "all",
      relatedLessonSectionKeys: ["visual", "whenToUse"],
    },
    {
      id: "recognize",
      order: 2,
      title: "Herken",
      guidingQuestion: "Wat betekent dit?",
      goal: "Waarneming koppelen aan wedstrijdsituatie en verwachte taken op alle niveaus.",
      thinkingProcess:
        "Vertaal wat je ziet naar situatie en taak: wat gebeurt er, wat betekent dat voor mij, mijn linie en het team?",
      intelligenceDimensions: ["matchSituation", "individualTask", "lineTask", "teamTask"],
      module2SituationFocus: "primary-only",
      relatedLessonSectionKeys: ["whyLearning", "whyImportant", "whenToUse"],
    },
    {
      id: "decide",
      order: 3,
      title: "Beslis",
      guidingQuestion: "Welke keuzes heb je?",
      goal: "Opties benoemen vóór actie — geen impuls, wel overzicht.",
      thinkingProcess:
        "Op basis van herkenning: welke acties zijn mogelijk? Meerdere opties, nog geen uitvoering.",
      intelligenceDimensions: ["decisionMaking", "spaces"],
      module2SituationFocus: "all",
      relatedLessonSectionKeys: ["quickReference", "keyTakeaway"],
    },
    {
      id: "execute",
      order: 4,
      title: "Voer uit",
      guidingQuestion: "Welke keuze maken wij?",
      goal: "Clubkeuze uitvoeren — afgestemd op team en linie.",
      thinkingProcess:
        "Kies de optie die past bij ZVV-afspraken in deze situatie. Voer uit met intentie — niet automatisch.",
      intelligenceDimensions: ["decisionMaking", "individualTask", "lineTask", "teamTask"],
      module2SituationFocus: "primary-only",
      relatedLessonSectionKeys: ["quickReference", "practicalExplanation", "onThePitch", "trainerFocus"],
    },
    {
      id: "evaluate",
      order: 5,
      title: "Evalueer",
      guidingQuestion: "Was dit de juiste keuze? Wat had beter gekund?",
      goal: "Leren van het moment — zelfreflectie en correctie voor het volgende moment.",
      thinkingProcess:
        "Kort terugblik: werkte het? Waarom wel/niet? Wat doe je volgende keer? Geen schuld — wel leren.",
      intelligenceDimensions: ["decisionMaking", "commonMistakes", "coachVision"],
      module2SituationFocus: "all",
      relatedLessonSectionKeys: ["selfCheck", "commonMistakes", "coachNotebook"],
    },
  ],
};

/** Retourneert het canonieke Football Decision Model. */
export function getFootballDecisionModel(): FootballDecisionModel {
  return FOOTBALL_DECISION_MODEL;
}
