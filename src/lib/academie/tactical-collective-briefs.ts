/**
 * Collective sequence briefs — verplicht voor hoofdsequences (UEFA Pro audit).
 */

import type { CollectiveSequenceBrief } from "@/lib/academie/tactical-collective";

export const KW_R6_COLLECTIVE_BRIEF: CollectiveSequenceBrief = {
  situationId: "kw-r6-ball",
  ourFormation: "4-2-3-1",
  opponentFormation: "4-2-3-1",
  possessionPhase: "progression",
  ballZone: "middle-third → right-flank → final-third",
  ourIntendedStructure: "4-2-3-1 bezit → 2-3-2-3 / 3-2-4-1 rest 2+1 of 3+1",
  opponentIntendedStructure: "4-2-3-1 mid/laag blok — compacte linies",
  primaryAdvantage: "Verplaatsing R6→10→RW creëert steunruimte terug naar 10",
  primaryThreat: "opp.st + snelle omschakeling via opp.lw/rw",
  restDefensePlan: "2 CV’s + 1×6 onder bal; verre back knijpt; GK ondersteunt",
  lastLineRule: "STEP bij gecontroleerde druk + geen diepteloop; HOLD bij limited threat; DROP bij open body",
  expectedOpponentReaction: "Near DM stapt; far DM dekt; balzijde back stapt op RW; verre back knijpt; lijn schuift",
  endStructure: "Compact bezit, rest 2+1/3+1, meerdere vervolgopties, opponent blok intact",
  transitionThreatPlayerIds: ["opp.st", "opp.lw", "opp.rw"],
  opponentBrief: {
    formation: "4-2-3-1",
    block: "mid",
    pressingIntent: "protect-center",
    transitionThreats: ["opp.st", "opp.lw", "opp.rw"],
    keyMarkers: {
      "opp.ldm": "near/far DM shift",
      "opp.rdm": "cover / screen terugleg",
      "opp.lb": "stapt op RW bij flank",
      "opp.st": "omschakeloptie",
    },
  },
};

export const CONNECTED_TEAM_COLLECTIVE_BRIEF: CollectiveSequenceBrief = {
  situationId: "connected-team",
  ourFormation: "4-2-3-1",
  opponentFormation: "4-4-2",
  possessionPhase: "progression",
  ballZone: "middle-third → final-third → right-flank",
  ourIntendedStructure: "Verbonden 4-2-3-1 → rest 2+1 met aangesloten linies",
  opponentIntendedStructure: "4-4-2 mid-block collectief herstel",
  primaryAdvantage: "Linies schuiven als één bij iedere pass",
  primaryThreat: "opp.lst / opp.rst omschakeling",
  restDefensePlan: "CV’s volgen middenveld; één 6 centrum; verre back knijpt",
  lastLineRule: "STEP wanneer middenveld aansluit en depthThreat limited/none",
  expectedOpponentReaction: "Blok schuift mee; CB stapt op SP; RM bewaakt flank",
  endStructure: "Verbonden blok, teamlengte 30–45, meerdere opties",
  transitionThreatPlayerIds: ["opp.lst", "opp.rst"],
  opponentBrief: {
    formation: "4-4-2",
    block: "mid",
    pressingIntent: "protect-center",
    transitionThreats: ["opp.lst", "opp.rst"],
    keyMarkers: {
      "opp.lcb": "stapt op SP",
      "opp.rcm": "dekt kaats",
      "opp.rm": "flank",
    },
  },
};

export const PRESS_GOOD_COLLECTIVE_BRIEF: CollectiveSequenceBrief = {
  situationId: "press-good",
  ourFormation: "4-2-3-1",
  opponentFormation: "4-3-3",
  possessionPhase: "high-press",
  ballZone: "final-third (opp build-up)",
  ourIntendedStructure: "Hoge drukketen SP→10→LW met aangesloten last line",
  opponentIntendedStructure: "4-3-3 opbouw onder druk",
  primaryAdvantage: "Gesloten lichaam + cover → last line STEP",
  primaryThreat: "Lange bal achter lijn / opp.st",
  restDefensePlan: "Lijn hoog maar georganiseerd; R6 2e bal; RB knijpt",
  lastLineRule: "STEP bij effectieve drukketen + gesloten diepte",
  expectedOpponentReaction: "Gedwongen breed; poging lijn",
  endStructure: "Compact hoog blok",
  transitionThreatPlayerIds: ["opp.st", "opp.lw", "opp.rw"],
  opponentBrief: {
    formation: "4-3-3",
    block: "low",
    pressingIntent: "delay",
    transitionThreats: ["opp.st", "opp.lw"],
    keyMarkers: { "opp.cbL": "ball carrier", "opp.6": "uitweg" },
  },
};

export const PRESS_BAD_COLLECTIVE_BRIEF: CollectiveSequenceBrief = {
  situationId: "press-bad",
  ourFormation: "4-2-3-1",
  opponentFormation: "4-3-3",
  possessionPhase: "high-press",
  ballZone: "final-third (opp build-up)",
  ourIntendedStructure: "Solo jacht — bewust NIET aangesloten (negatief voorbeeld)",
  opponentIntendedStructure: "4-3-3 speelt uit via vrije 6",
  primaryAdvantage: "n.v.t. — toont fout",
  primaryThreat: "Uitgespeelde SP; open midden",
  restDefensePlan: "Lijn blijft diep (terecht: geen drukketen)",
  lastLineRule: "HOLD/DROP — geen STEP zonder drukketen",
  expectedOpponentReaction: "Pass naar vrije 6; draai open",
  endStructure: "Geforceerd herstel, gat mid–back",
  transitionThreatPlayerIds: ["opp.st", "opp.lw"],
  opponentBrief: {
    formation: "4-3-3",
    block: "low",
    pressingIntent: "delay",
    transitionThreats: ["opp.st"],
    keyMarkers: { "opp.6": "vrije uitweg" },
  },
};

export const KW_CHOICE_FORCE_BRIEF: CollectiveSequenceBrief = {
  situationId: "kw-choice-force",
  ourFormation: "4-2-3-1",
  opponentFormation: "4-2-3-1",
  possessionPhase: "progression",
  ballZone: "middle-third",
  ourIntendedStructure: "Forceer centrale lijn — negatief",
  opponentIntendedStructure: "Blok beschermt centrum",
  primaryAdvantage: "n.v.t.",
  primaryThreat: "Overspeelde 10",
  restDefensePlan: "Blijft verbonden achter mislukte actie",
  lastLineRule: "HOLD",
  expectedOpponentReaction: "DM/CB sluiten centrale corridor",
  endStructure: "Balverliesdruk / herstel",
  transitionThreatPlayerIds: ["opp.st"],
  opponentBrief: {
    formation: "4-2-3-1",
    block: "mid",
    pressingIntent: "protect-center",
    transitionThreats: ["opp.st"],
    keyMarkers: {},
  },
};

export const KW_CHOICE_RELOCATE_BRIEF: CollectiveSequenceBrief = {
  situationId: "kw-choice-relocate",
  ourFormation: "4-2-3-1",
  opponentFormation: "4-2-3-1",
  possessionPhase: "progression",
  ballZone: "middle-third → right-flank",
  ourIntendedStructure: "Verplaatsen naar vrije flank + collectieve shift",
  opponentIntendedStructure: "Blok schuift mee",
  primaryAdvantage: "Ruimte op RW door eerdere shift",
  primaryThreat: "opp.st",
  restDefensePlan: "3+1 / 2+1 onder flankactie",
  lastLineRule: "STEP met middenveld",
  expectedOpponentReaction: "Balzijde compressie; verre knijp",
  endStructure: "Verplaatst voordeel",
  transitionThreatPlayerIds: ["opp.st", "opp.lw"],
  opponentBrief: {
    formation: "4-2-3-1",
    block: "mid",
    pressingIntent: "force-wide",
    transitionThreats: ["opp.st"],
    keyMarkers: {},
  },
};

export const TA_LCV_BRIEF: CollectiveSequenceBrief = {
  situationId: "ta-lcv-buildup",
  ourFormation: "4-2-3-1",
  opponentFormation: "4-4-2",
  possessionPhase: "build-up",
  ballZone: "own-third / middle",
  ourIntendedStructure: "Opbouw via LCV met aangesloten linies",
  opponentIntendedStructure: "Mid-block druk op opbouw",
  primaryAdvantage: "LCV speelt vooruit onder dekking",
  primaryThreat: "Hoge pressing striker",
  restDefensePlan: "RCV cover; GK aanspeelbaar",
  lastLineRule: "HOLD in opbouw tenzij druk gecontroleerd",
  expectedOpponentReaction: "Striker/midden druk",
  endStructure: "Progressie",
  transitionThreatPlayerIds: ["opp.lst", "opp.rst"],
  opponentBrief: {
    formation: "4-4-2",
    block: "mid",
    pressingIntent: "press-forward",
    transitionThreats: ["opp.lst"],
    keyMarkers: {},
  },
};

export const SOLO_SUPPORT_BRIEF: CollectiveSequenceBrief = {
  situationId: "solo-support",
  ourFormation: "4-2-3-1",
  opponentFormation: "4-4-2",
  possessionPhase: "progression",
  ballZone: "middle-third",
  ourIntendedStructure: "Steun i.p.v. solo-oplossing",
  opponentIntendedStructure: "Blok",
  primaryAdvantage: "Derde man / steundriehoek",
  primaryThreat: "Counter",
  restDefensePlan: "2+1",
  lastLineRule: "STEP bij controle",
  expectedOpponentReaction: "Schuift mee",
  endStructure: "Verbonden steun",
  transitionThreatPlayerIds: ["opp.lst"],
  opponentBrief: {
    formation: "4-4-2",
    block: "mid",
    pressingIntent: "protect-center",
    transitionThreats: ["opp.lst"],
    keyMarkers: {},
  },
};

export const IN_R6_WIN_BRIEF: CollectiveSequenceBrief = {
  situationId: "in-r6-win",
  ourFormation: "4-2-3-1",
  opponentFormation: "4-3-3",
  possessionPhase: "attacking-transition",
  ballZone: "middle → final-third",
  ourIntendedStructure: "R6 wint — snelle progressie met rest defense",
  opponentIntendedStructure: "Herstel laag",
  primaryAdvantage: "Tweede bal + doorcombinatie",
  primaryThreat: "Counter na verlies",
  restDefensePlan: "3+1 tijdens aanval",
  lastLineRule: "STEP na balwinst met controle",
  expectedOpponentReaction: "Zakt + schuift",
  endStructure: "Aanvallende structuur met rest",
  transitionThreatPlayerIds: ["opp.st"],
  opponentBrief: {
    formation: "4-3-3",
    block: "low",
    pressingIntent: "delay",
    transitionThreats: ["opp.st"],
    keyMarkers: {},
  },
};

export const IN_MOMENT_REST_BRIEF: CollectiveSequenceBrief = {
  situationId: "in-moment-rest",
  ourFormation: "4-2-3-1",
  opponentFormation: "4-4-2",
  possessionPhase: "final-third",
  ballZone: "final-third",
  ourIntendedStructure: "Restverdediging 2+1/3+1 zichtbaar onder aanval",
  opponentIntendedStructure: "Laag blok + omschakelspits",
  primaryAdvantage: "Aanval mét georganiseerde rest",
  primaryThreat: "Directe diepte op ST",
  restDefensePlan: "Expliciet 2+1 of 3+1 — niet vier diep",
  lastLineRule: "HOLD/STEP afhankelijk van druk op tweede bal",
  expectedOpponentReaction: "ST blijft hoog als threat",
  endStructure: "Rest intact + aanvalopties",
  transitionThreatPlayerIds: ["opp.lst", "opp.rst"],
  opponentBrief: {
    formation: "4-4-2",
    block: "low",
    pressingIntent: "delay",
    transitionThreats: ["opp.lst", "opp.rst"],
    keyMarkers: {},
  },
};

export const ME_SPITS_BRIEF: CollectiveSequenceBrief = {
  situationId: "me-spits-miss",
  ourFormation: "4-2-3-1",
  opponentFormation: "4-4-2",
  possessionPhase: "defensive-transition",
  ballZone: "middle-third",
  ourIntendedStructure: "Herstel na gemiste actie SP",
  opponentIntendedStructure: "Counter",
  primaryAdvantage: "n.v.t. — herstelmoment",
  primaryThreat: "Directe omschakeling",
  restDefensePlan: "Directe rest + cover diepte",
  lastLineRule: "DROP/TRACK bij active depth threat",
  expectedOpponentReaction: "Speelt in diepte",
  endStructure: "Hersteld blok",
  transitionThreatPlayerIds: ["opp.lst", "opp.rst"],
  opponentBrief: {
    formation: "4-4-2",
    block: "high",
    pressingIntent: "press-forward",
    transitionThreats: ["opp.lst"],
    keyMarkers: {},
  },
};

const BRIEF_BY_ID: Record<string, CollectiveSequenceBrief> = {
  "kw-r6-ball": KW_R6_COLLECTIVE_BRIEF,
  "connected-team": CONNECTED_TEAM_COLLECTIVE_BRIEF,
  "press-good": PRESS_GOOD_COLLECTIVE_BRIEF,
  "press-bad": PRESS_BAD_COLLECTIVE_BRIEF,
  "kw-choice-force": KW_CHOICE_FORCE_BRIEF,
  "kw-choice-relocate": KW_CHOICE_RELOCATE_BRIEF,
  "ta-lcv-buildup": TA_LCV_BRIEF,
  "solo-support": SOLO_SUPPORT_BRIEF,
  "in-r6-win": IN_R6_WIN_BRIEF,
  "in-moment-rest": IN_MOMENT_REST_BRIEF,
  "me-spits-miss": ME_SPITS_BRIEF,
};

/** Generic brief for remaining sequences — still required for validation. */
function genericBrief(situationId: string): CollectiveSequenceBrief {
  return {
    situationId,
    ourFormation: "4-2-3-1",
    opponentFormation: "4-4-2",
    possessionPhase: "progression",
    ballZone: "match-context",
    ourIntendedStructure: "4-2-3-1 collectief",
    opponentIntendedStructure: "Herkenbaar blok",
    primaryAdvantage: "Lesmoment",
    primaryThreat: "Omschakeling",
    restDefensePlan: "2+1 / 3+1 achter bal",
    lastLineRule: "evaluateLastLineAction per fase",
    expectedOpponentReaction: "Collectieve shift",
    endStructure: "Verbonden eindstructuur",
    transitionThreatPlayerIds: [],
    opponentBrief: {
      formation: "4-4-2",
      block: "mid",
      pressingIntent: "protect-center",
      transitionThreats: [],
      keyMarkers: {},
    },
  };
}

export function getCollectiveBrief(situationId: string): CollectiveSequenceBrief {
  return BRIEF_BY_ID[situationId] ?? genericBrief(situationId);
}

export function hasDedicatedCollectiveBrief(situationId: string): boolean {
  return situationId in BRIEF_BY_ID;
}

export const COLLECTIVE_PILOT_IDS = [
  "kw-r6-ball",
  "connected-team",
  "press-good",
  "press-bad",
  "kw-choice-force",
  "kw-choice-relocate",
  "ta-lcv-buildup",
  "solo-support",
  "in-r6-win",
  "in-moment-rest",
  "me-spits-miss",
] as const;
