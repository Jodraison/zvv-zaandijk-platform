/**
 * Bindende Nederlandse terminologie — ZVV Zaandijk VRZ1 (dameselftal).
 * Gebruik deze labels in UI; vermijd Engelse of verouderde synoniemen.
 */
export const NL = {
  speelster: "Speelster",
  speelsters: "Speelsters",
  gastspeelster: "Gastspeelster",
  gastspeelsters: "Gastspeelsters",
  aanvoerder: "Aanvoerder",
  viceAanvoerder: "Vice-aanvoerder",
  doelpunt: "Doelpunt",
  doelpunten: "Doelpunten",
  doelpuntenVoor: "Doelpunten voor",
  doelpuntenTegen: "Doelpunten tegen",
  assist: "Assist",
  assists: "Assists",
  assistgever: "Assistgever",
  scorer: "Scorer",
  mvp: "MVP",
  speelsterVanDeWedstrijd: "Speelster van de wedstrijd",
  bank: "Bank",
  bankspeelsters: "Bankspeelsters",
  afwezig: "Afwezig",
  fitheid: "Fitheid",
  ranglijst: "Ranglijst",
  statistiekcentrum: "Statistiekcentrum",
  opstelling: "Opstelling",
  wedstrijd: "Wedstrijd",
  wedstrijdenZonderTegengoals: "Wedstrijden zonder tegengoals",
} as const;

/** Verboden / te vermijden zichtbare synoniemen in product-UI. */
export const NL_AVOID = [
  "Captain",
  "Vice-captain",
  "Assistent", // verwarrend: niet gebruiken voor vice of assist
  "WOTM",
  "MOTM",
  "Player of the match",
  "Statistics Center",
  "Gastspeler",
  "Goals voor",
  "Goals tegen",
  "Validatie OK",
] as const;
