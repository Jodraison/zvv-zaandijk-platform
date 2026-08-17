/** Football Decision Lab — product lesson model (certified session content only). */

export type DecisionLabWave =
  | "pressing"
  | "omschakeling"
  | "opbouw"
  | "balbezit"
  | "verdedigen"
  | "aanvallen";

export type DecisionLabDifficulty = "Basis" | "Midden" | "Hoog";

export type DecisionChoiceId = "A" | "B" | "C";

export type DecisionChoice = {
  id: DecisionChoiceId;
  label: string;
  correct: boolean;
  consequence: string;
  explanation: string;
  errorFix?: string;
};

export type DecisionLabSession = {
  id: string;
  order: number;
  slug: string;
  title: string;
  playerTitle: string;
  subtitle: string;
  wave: DecisionLabWave;
  difficulty: DecisionLabDifficulty;
  durationMin: number;
  durationMax: number;
  primaryRole: string;
  cue: string;
  lp: string;
  whyItMatters: string;
  learningGoals: string[];
  scanPrompt: string;
  scanHints: string[];
  decisionPrompt: string;
  choices: DecisionChoice[];
  tree: { question: string; branches: { label: string; result: string; tone: "good" | "bad" }[] };
  executionSteps: string[];
  coaching: string[];
  summary: string;
  takeaway: string;
  /** Tactical situation IDs from existing academie registry */
  pitch: {
    liveSituationId: string;
    badSituationId: string;
    goodSituationId: string;
    badTitle: string;
    goodTitle: string;
    badConsequence: string;
    goodConsequence: string;
  };
  nextSessionId: string | null;
  prevSessionId: string | null;
};
