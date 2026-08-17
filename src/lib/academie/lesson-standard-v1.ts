/**
 * Academy Lesstandaard V2 — visual-first coachkaarten.
 * Contentmodel blijft achterwaarts compatibel met V1-velden.
 */

/** Vaste positie-kaarten — altijd in deze volgorde. */
export const ACADEMY_LESSON_POSITION_IDS = [
  "keeper",
  "lb",
  "lcv",
  "rcv",
  "rb",
  "l6",
  "r6",
  "10",
  "lw",
  "rw",
  "spits",
] as const;

export type AcademyLessonPositionId = (typeof ACADEMY_LESSON_POSITION_IDS)[number];

export const ACADEMY_LESSON_POSITION_LABELS: Record<AcademyLessonPositionId, string> = {
  keeper: "Keeper",
  lb: "LB",
  lcv: "LCV",
  rcv: "RCV",
  rb: "RB",
  l6: "L6",
  r6: "R6",
  "10": "10",
  lw: "LW",
  rw: "RW",
  spits: "Spits",
};

export type AcademyLessonWhyCard = {
  icon?: "target" | "eye" | "bolt" | "users" | "shield" | "whistle";
  title: string;
  body: string;
};

/** Legacy lineaire stappen — optioneel; V2 gebruikt bij voorkeur `decisionBranch`. */
export type AcademyLessonDecisionStep = {
  kind: "start" | "if" | "then" | "end";
  label: string;
};

/** Echte ja/nee-beslisboom (V2). Optioneel: vervolgvragen bij JA en/of NEE. */
export type AcademyLessonDecisionBranch = {
  start: string;
  question: string;
  yes: { label: string; result: string };
  no: { label: string; result: string };
  /** Extra check wanneer JA (bijv. ruimte + aansluiting). */
  yesFollowUp?: {
    question: string;
    yes: { label: string; result: string };
    no: { label: string; result: string };
  };
  /** Vervolg wanneer NEE. */
  followUp?: {
    question: string;
    yes: { label: string; result: string };
    no: { label: string; result: string };
  };
  end?: string;
};

/** Visuele keuze-vergelijking (niet altijd “goed/fout”). */
export type AcademyLessonChoiceCompare = {
  left: { title: string; text: string; situationId: string };
  right: { title: string; text: string; situationId: string };
  nuance?: string;
};

/** Compacte teamafspraak- of gedragsregel-kaart (max ~20 woorden). */
export type AcademyLessonAgreementCard = {
  title: string;
  body: string;
};

/** Compact keuzemoment met visual + beste keuze. */
export type AcademyLessonChoiceMoment = {
  title: string;
  situation: string;
  choiceA: string;
  choiceB: string;
  best: string;
  why: string;
  situationId: string;
};

/** Wedstrijdmoment: afspraak → actie (geen A/B-keuze). */
export type AcademyLessonMatchMoment = {
  title: string;
  situation: string;
  agreement: string;
  action: string;
  why: string;
  situationId: string;
  /** Optionele goede zijde — wanneer gezet: volledige Fout/Beter visual pair. */
  goodSituationId?: string;
  /** Default: Afspraak */
  agreementLabel?: string;
  /** Default: Wat jij doet */
  actionLabel?: string;
  badTitle?: string;
  goodTitle?: string;
  badConsequence?: string;
  goodConsequence?: string;
};

export type AcademyLessonPositionCard = {
  id: AcademyLessonPositionId;
  role?: string;
  mainTask: string;
  watchFor: string[];
};

/** Visuele foutkaart — max 3 per les. */
export type AcademyLessonMistakeVisual = "solo" | "blind-run" | "always-forward" | "freeze" | "silent";

/** Één zijde van een tactische Fout/Beter-vergelijking. */
export type AcademyLessonComparisonSide = {
  label: "FOUT" | "NIET GOED" | "VERKEERD" | "GOED" | "BETER" | "GEWENST";
  title: string;
  description?: string;
  situationId: string;
  takeaway: string;
  consequence?: string;
};

/** Volledige symmetrische vergelijking. */
export type AcademyLessonTacticalComparison = {
  id: string;
  title?: string;
  bad: AcademyLessonComparisonSide;
  good: AcademyLessonComparisonSide;
};

export type AcademyLessonMistakePair = {
  wrong: string;
  better: string;
  visual?: AcademyLessonMistakeVisual;
  /** V4: volledige bad/good situations (verplicht voor tactische lessen). */
  badSituationId?: string;
  goodSituationId?: string;
  badTitle?: string;
  goodTitle?: string;
  badConsequence?: string;
  goodConsequence?: string;
  badTakeaway?: string;
  goodTakeaway?: string;
};

export type AcademyLessonCoachingChip = {
  label: string;
  meaning: string;
};

export type AcademyLessonVideoSlot = {
  provider: "youtube" | "vimeo";
  placeholder?: boolean;
  title?: string;
  caption?: string;
};

export type AcademyLessonFieldLegendItem = {
  label: string;
  tone: "distance" | "support" | "direction";
};

/**
 * Lesstandaard contentblok — V2 visual-first.
 * Optionele V1-velden blijven ondersteund maar worden spaarzaam gerenderd.
 */
export type AcademyLessonStandardV1 = {
  updatedAt?: string;
  levelLabel?: string;
  traitChips?: string[];
  /** Max 3 leerdoelen (V2). */
  learningOutcomes?: string[];
  situation?: {
    title?: string;
    explanation?: string;
    note?: string;
    fieldPreset?: "default" | "connected-team" | "buildup-gk" | "press-good" | "press-bad" | "kw-r6-ball";
    /** Voorkeur boven fieldPreset wanneer gezet. */
    situationId?: string;
    legend?: AcademyLessonFieldLegendItem[];
  };
  /** V2: meestal weggelaten. */
  whyCards?: AcademyLessonWhyCard[];
  /** V2: meestal weggelaten; gebruik recognizeCompare. */
  recognizeChecklist?: string[];
  recognizeTitle?: string;
  recognizeCompare?: {
    good: string;
    bad: string;
    goodSituationId?: string;
    badSituationId?: string;
    goodTitle?: string;
    badTitle?: string;
    goodConsequence?: string;
    badConsequence?: string;
  };
  /** Keuze A/B met dezelfde uitgangssituatie. */
  choiceCompare?: AcademyLessonChoiceCompare;
  choiceCompareTitle?: string;
  /** Max 5 compacte teamafspraken / gedragsregels. */
  agreements?: AcademyLessonAgreementCard[];
  agreementsTitle?: string;
  /** Label op kaarten — default “Afspraak”. */
  agreementsCardLabel?: string;
  /** V2 primaire beslisboom. */
  decisionBranch?: AcademyLessonDecisionBranch;
  /** Legacy fallback. */
  decisionTree?: AcademyLessonDecisionStep[];
  decisionTreeTitle?: string;
  positions?: AcademyLessonPositionCard[];
  /** Compacte note i.p.v. positie-picker. */
  positionNote?: string;
  /** Max 3 keuzemomenten (V2). */
  choiceMoments?: AcademyLessonChoiceMoment[];
  choiceMomentsTitle?: string;
  /** Max 3 wedstrijdmomenten (afspraak → actie). */
  matchMoments?: AcademyLessonMatchMoment[];
  matchMomentsTitle?: string;
  /** Max 3 fouten (V2). */
  mistakes?: AcademyLessonMistakePair[];
  coachingChips?: AcademyLessonCoachingChip[];
  video?: AcademyLessonVideoSlot;
  /** Max 3 samenvattingspunten (V2). */
  summaryPoints?: string[];
  closingNote?: string;
};

export const ACADEMY_LESSON_LEVEL_LABELS = {
  intro: "Intro",
  core: "Core",
  advanced: "Advanced",
} as const;
