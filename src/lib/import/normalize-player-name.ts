/**
 * Normalisatie voor match-import: trim, spaties, MVP-prefix strippen.
 * Gebruik daarna `resolvePlayerId` om naar een bestaande DB-speelster te mappen.
 */

export function normalizePlayerName(input: string): string {
  let s = input.trim().replace(/\s+/g, " ");
  s = s.replace(/^mvp\s*:\s*/i, "").trim();
  return s;
}

export type ImportPlayerRow = { id: string; full_name: string; is_guest?: boolean };

function firstToken(full: string): string {
  const t = full.trim().split(/\s+/)[0];
  return t ?? "";
}

/**
 * Exacte volledige naam (case-insensitive), anders unieke voornaam, anders unieke achternaam.
 * Geen nieuwe speelsters — alleen bestaande club (geen gasten).
 */
export function resolvePlayerId(
  rawName: string,
  players: ImportPlayerRow[],
): { id: string; matchedAs: string } | null {
  const cleaned = normalizePlayerName(rawName).toLowerCase();
  if (!cleaned) return null;

  const roster = players.filter((p) => !p.is_guest);

  const exact = roster.find((p) => p.full_name.trim().toLowerCase() === cleaned);
  if (exact) return { id: exact.id, matchedAs: exact.full_name };

  const byFirst = roster.filter((p) => firstToken(p.full_name).toLowerCase() === cleaned);
  if (byFirst.length === 1) return { id: byFirst[0].id, matchedAs: byFirst[0].full_name };

  const byLast = roster.filter((p) => {
    const parts = p.full_name.trim().split(/\s+/);
    const last = parts[parts.length - 1]?.toLowerCase();
    return last === cleaned;
  });
  if (byLast.length === 1) return { id: byLast[0].id, matchedAs: byLast[0].full_name };

  return null;
}

/** Verwijdert "(guest)" uit importtekst; scorer blijft bv. "Esmee". */
export function stripGuestAnnotation(raw: string): string {
  return raw.replace(/\s*\(guest\)\s*/gi, "").trim();
}

/**
 * Zelfde als `resolvePlayerId`, maar exacte match ook op gasten;
 * fuzzy (voornaam/achternaam) alleen bij unieke hit in heel `players`.
 */
export function resolvePlayerIdIncludingGuests(
  rawName: string,
  players: ImportPlayerRow[],
): { id: string; matchedAs: string } | null {
  const cleaned = normalizePlayerName(rawName).toLowerCase();
  if (!cleaned) return null;

  const exact = players.find((p) => p.full_name.trim().toLowerCase() === cleaned);
  if (exact) return { id: exact.id, matchedAs: exact.full_name };

  const byFirst = players.filter((p) => firstToken(p.full_name).toLowerCase() === cleaned);
  if (byFirst.length === 1) return { id: byFirst[0].id, matchedAs: byFirst[0].full_name };

  const byLast = players.filter((p) => {
    const parts = p.full_name.trim().split(/\s+/);
    const last = parts[parts.length - 1]?.toLowerCase();
    return last === cleaned;
  });
  if (byLast.length === 1) return { id: byLast[0].id, matchedAs: byLast[0].full_name };

  return null;
}

/** MVP-regel: "shared: …", "Mandy en Anouk" → eerste naam; log via callback. */
export function parseMvpPrimaryName(mvpLine: string, onWarning?: (msg: string) => void): string {
  let n = normalizePlayerName(mvpLine);
  n = n.replace(/^shared\s*:\s*/i, "").trim();
  if (!n) return "";

  const parts = n
    .split(/\s+(?:en|and|,|;)\s+/i)
    .map((x) => normalizePlayerName(x))
    .filter(Boolean);
  if (parts.length > 1) {
    onWarning?.(
      `Gedeelde MVP (${mvpLine.trim()}). Opgeslagen als eerste: "${parts[0]}"; voeg eventueel notitie toe in import-log.`,
    );
  }
  return parts[0] ?? "";
}
