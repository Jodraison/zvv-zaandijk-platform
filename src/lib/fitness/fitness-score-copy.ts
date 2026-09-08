/**
 * Publieke puntentelling-copy — moet 1-op-1 overeenkomen met
 * `rankFitnessTotal` / `normalizeByPlayer` in session-ranking.ts.
 *
 * Schaal: 0–100 per onderdeel onder complete deelnemers van deze test.
 * Totaal: gemiddelde van de vier onderdelen (25% elk).
 * NULL: geen onderdeelscore, geen totaalscore.
 */
export const FITNESS_SCORE_LEGEND_SUMMARY = "Hoe werkt de puntentelling?";

export const FITNESS_SCORE_LEGEND_TITLE = "Hoe worden de punten berekend?";

export const FITNESS_SCORE_LEGEND_BULLETS = [
  "6 min loop: meer meters = meer punten",
  "Sprint: snellere tijd = meer punten",
  "Agility: snellere tijd = meer punten",
  "Plank: langere tijd = meer punten",
  "Elk onderdeel telt voor 25% mee",
  "Alleen speelsters met alle 4 onderdelen krijgen een totaalscore",
] as const;

/** Exact: min–max 0–100 binnen complete deelnemers; gemiddelde = totaal. */
export const FITNESS_SCORE_LEGEND_NORMALIZATION =
  "Per onderdeel wordt de beste prestatie van de complete deelnemers naar 100 punten en de laagste naar 0 punten omgerekend. De vier onderdelen tellen ieder voor 25% mee.";
