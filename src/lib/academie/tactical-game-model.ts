/**
 * Official ZVV Zaandijk VRZ1 Chapter-1 game model.
 * Source of truth for authored scenarios — animations follow this doctrine.
 */

export type OpponentDefensiveModel =
  | "HIGH_PRESS_MAN_ORIENTED"
  | "HIGH_PRESS_ZONE"
  | "MID_BLOCK_4_4_2_ZONE"
  | "MID_BLOCK_4_2_3_1_ZONE"
  | "LOW_BLOCK_4_4_2_ZONE"
  | "LOW_BLOCK_4_5_1_ZONE"
  | "DEFENSIVE_TRANSITION";

export type AttackStructure = "4-2-3-1" | "3-2-4-1" | "3-1-5-1" | "3-2-5";
export type RestDefenseShape = "3+1" | "3+2" | "2+1";
export type BlockHeight = "high" | "mid" | "low";

/** Aanvallende doctrine — georganiseerd balbezit. */
export const DOCTRINE_ATTACK = {
  baseFormation: "4-2-3-1",
  possessionShapes: ["3-2-4-1", "3-1-5-1"] as const,
  primaryPossessionShape: "3-2-4-1" as AttackStructure,
  rules: [
    "Eén back valt mee aan; de andere knijpt en vormt met LCV/RCV de achterste drie.",
    "L6 en R6: één onder de bal, één balans/centrum (3+2) of één centrale 6 (3+1).",
    "LW/RW bezetten buitenbanen of halfspaces; nooit langdurigzelfde hoogte als steunback.",
    "10 tussen linies; SP bindt laatste lijn — verschillende hoogte.",
    "Veld groot: beide touchlines bezet; diepte via SP + dreiging achter/naast lijn.",
    "Minimaal twee oplossingen rond de bal (vooruit + veilig/zijwaarts) + steun onder.",
  ],
  restDefenseRightAttack: {
    backThree: ["us.LB", "us.LCV", "us.RCV"] as const,
    attackingBack: "us.RB" as const,
    balanceSix: "us.L6" as const,
    supportSix: "us.R6" as const,
    shape: "3+1" as RestDefenseShape,
  },
  restDefenseLeftAttack: {
    backThree: ["us.RB", "us.RCV", "us.LCV"] as const,
    attackingBack: "us.LB" as const,
    balanceSix: "us.R6" as const,
    supportSix: "us.L6" as const,
    shape: "3+1" as RestDefenseShape,
  },
} as const;

/** Verdedigende doctrine — geen bal. */
export const DOCTRINE_DEFEND = {
  shape: "4-4-2",
  from4231: [
    "SP blijft eerste lijn",
    "10 sluit naast SP",
    "LW en RW zakken in middenveldlijn",
    "L6 en R6 blijven centraal",
    "backs in verdedigingslijn",
    "compact tussen verdediging en middenveld",
  ],
  lines: {
    first: ["us.SP", "us.10"],
    mid: ["us.LW", "us.L6", "us.R6", "us.RW"],
    back: ["us.LB", "us.LCV", "us.RCV", "us.RB"],
  },
} as const;

/** Omschakeling na balverlies. */
export const DOCTRINE_TRANSITION_LOSS = {
  chain: [
    "BALVERLIES",
    "DIRECTE DRUK",
    "CENTRUM SLUITEN",
    "VERTRAGEN",
    "WINGERS ZAKKEN",
    "BACK HERSTELT",
    "4-4-2 HERSTELD",
  ] as const,
  rules: [
    "Dichtstbijzijnde spelers zetten 5s druk of vertragen.",
    "Pass naar centrum wordt gesloten; restverdediging bewaakt eerste vooruitpass.",
    "SP+10 eerste lijn; LW/RW zakken; L6/R6 centrum; backs herstellen.",
  ],
} as const;

/** Pressingketen wanneer tegenstander opbouwt (ons 4-4-2). */
export const DOCTRINE_PRESSING_CHAIN = {
  ourShape: "4-4-2",
  steps: [
    "SP stuurt drukrichting",
    "10 sluit hun 6",
    "Balzijde winger sluit back",
    "Balzijde 6 dekt binnenruimte",
    "Back schuift achter winger",
    "Verdediging sluit door",
    "Verre winger knijpt",
    "Verre back bewaakt winger",
    "Keeper ondersteunt diepte",
    "Tweede drukactie volgt",
  ] as const,
} as const;

export const OPPONENT_MODEL_442_MID_ZONE = {
  id: "MID_BLOCK_4_4_2_ZONE" as OpponentDefensiveModel,
  formation: "4-4-2",
  blockHeight: "mid" as BlockHeight,
  pressingTrigger: "10 of hogere middenvelder ontvangt tussen linies",
  pressingDirection: "balzijde — stuur naar flank, bescherm centrum",
  markingPrinciple: "zone — balzijde stapt, naastliggende dekt binnenkant, verre knijpt",
  rules: [
    "Spitsen schermen passes naar onze 6’en.",
    "Middenveldlijn beschermt centrum; balzijde CM stapt; andere CM dekt.",
    "Backlijn houdt eerst positie; back stapt pas bij bal naar winger.",
    "CV geeft rugdekking; verre back knijpt; blok schuift als geheel.",
  ],
} as const;

export const OPPONENT_MODEL_4231_MID_ZONE = {
  id: "MID_BLOCK_4_2_3_1_ZONE" as OpponentDefensiveModel,
  formation: "4-2-3-1",
  blockHeight: "mid" as BlockHeight,
  pressingTrigger: "pass naar 10 of breedte naar RW/LW",
  pressingDirection: "balzijde knijpen; 6’en screenen centrale corridor",
  markingPrinciple: "zone — 10/DM’s screenen, backs gekoppeld aan wingers, CV’s aan SP",
  rules: [
    "Dubbele 6 beschermt as; 10 zet druk op ontvanger tussen linies.",
    "Laatste lijn blijft georganiseerd; één CV stapt, andere dekt diepte.",
    "Balzijde back reageert op winger; verre zijde knijpt.",
    "Geen pass door bezette corridor toestaan zonder interceptie/fout.",
  ],
} as const;
