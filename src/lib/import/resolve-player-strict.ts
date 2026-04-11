import type { ImportPlayerRow } from "@/lib/import/normalize-player-name";

/**
 * Canonieke selectie (niet-gast) — exacte `players.full_name` (trim alleen bij invoer).
 * Alias `CANONICAL_PLAYERS` voor migratiescripts.
 */
export const CANONICAL_NON_GUEST_PLAYERS: readonly string[] = [
  "Andrada Timmer",
  "Anouk Aafjes",
  "Danique van Heeringen",
  "Demi Luijting",
  "Dionne van Dijk",
  "Emma de Mie",
  "Isa Oosterhoorn",
  "Jelisa De Jonge",
  "Kyra De Bakker",
  "Lorelai Bakker",
  "Mandy Kalmeijer",
  "Marisha Prins",
  "Mariska Oosterhuis",
  "Maura Hoffman",
  "Melissa Donkers",
  "Melissa Rietveld",
  "Nienke Hoffman",
  "Pitou Ludding",
  "Renée Koopman",
  "Shura Nieboer",
  "Tess Luijting",
  "Yente Oud",
] as const;

export const CANONICAL_PLAYERS = CANONICAL_NON_GUEST_PLAYERS;

/** Alleen deze korte namen als gast toegestaan (exact, na trim). */
export const GUEST_FULL_NAMES: readonly string[] = ["Esmee", "Micah"] as const;

const CANON_SET = new Set(CANONICAL_NON_GUEST_PLAYERS);
const GUEST_SET = new Set(GUEST_FULL_NAMES);

/**
 * Trim alleen — geen andere normalisatie.
 * Exacte match op `full_name` (case-sensitive zoals in DB).
 * 0 of >1 match → throw.
 */
export function resolvePlayerStrict(players: ImportPlayerRow[], fullNameRaw: string): { id: string; full_name: string; isGuest: boolean } {
  const name = fullNameRaw.trim();
  if (!name) {
    throw new Error("[resolvePlayerStrict] Lege speelsternaam.");
  }

  if (GUEST_SET.has(name)) {
    const guests = players.filter((p) => p.is_guest === true && p.full_name === name);
    if (guests.length === 0) {
      throw new Error(`[resolvePlayerStrict] Onbekende gast of nog niet aangemaakt: "${name}" (alleen Esmee, Micah).`);
    }
    if (guests.length > 1) {
      throw new Error(`[resolvePlayerStrict] Meerdere gast-rijen voor "${name}" — datafout.`);
    }
    return { id: guests[0].id, full_name: guests[0].full_name, isGuest: true };
  }

  if (!CANON_SET.has(name)) {
    throw new Error(
      `[resolvePlayerStrict] Naam niet in canonieke selectie en geen toegestane gast: "${name}". ` +
        `Gebruik exact de volledige naam zoals in de clublijst.`,
    );
  }

  const roster = players.filter((p) => !p.is_guest);
  const hits = roster.filter((p) => p.full_name === name);
  if (hits.length === 0) {
    throw new Error(`[resolvePlayerStrict] Geen speler in DB met exacte naam: "${name}".`);
  }
  if (hits.length > 1) {
    throw new Error(`[resolvePlayerStrict] Meerdere rijen voor "${name}" — duplicaat in database.`);
  }
  return { id: hits[0].id, full_name: hits[0].full_name, isGuest: false };
}

export type RosterValidation = { ok: true } | { ok: false; errors: string[] };

/**
 * Precies 22 niet-gast spelers, exact de canonieke namen, geen duplicaten op full_name.
 */
export function validateCanonicalRoster(players: ImportPlayerRow[]): RosterValidation {
  const errors: string[] = [];
  const nonGuest = players.filter((p) => !p.is_guest);
  const names = nonGuest.map((p) => p.full_name);

  if (names.length !== 22) {
    errors.push(`Verwacht exact 22 niet-gast spelers, gevonden: ${names.length}.`);
  }

  const seen = new Map<string, number>();
  for (const n of names) {
    seen.set(n, (seen.get(n) ?? 0) + 1);
  }
  for (const [n, c] of seen) {
    if (c > 1) errors.push(`Dubbele full_name in players: "${n}" (${c}×).`);
  }

  const setDb = new Set(names);
  for (const c of CANONICAL_NON_GUEST_PLAYERS) {
    if (!setDb.has(c)) errors.push(`Ontbreekt in DB (canoniek): "${c}".`);
  }
  for (const n of names) {
    if (!CANON_SET.has(n)) errors.push(`Onbekend in canonieke lijst (verwijder of hernoem): "${n}".`);
  }

  return errors.length ? { ok: false, errors } : { ok: true };
}
