/**
 * Score in importtekst: "X-Y" met eerst thuisploeg in het wedstrijdformulier (tegenstander bij uit, Zaandijk bij thuis).
 * Dus: bij thuis = Zaandijk–tegenstander → X = goals Zaandijk, Y = tegen.
 * Bij uit = tegenstander–Zaandijk → X = tegen, Y = goals Zaandijk.
 */
export function parseScoreForZaandijk(
  raw: string,
  isHome: boolean,
): { goalsFor: number; goalsAgainst: number } | null {
  const m = raw.trim().match(/^(\d+)\s*[-:]\s*(\d+)$/);
  if (!m) return null;
  const a = Number(m[1]);
  const b = Number(m[2]);
  if (!Number.isFinite(a) || !Number.isFinite(b) || a < 0 || b < 0) return null;
  if (isHome) {
    return { goalsFor: a, goalsAgainst: b };
  }
  return { goalsFor: b, goalsAgainst: a };
}
