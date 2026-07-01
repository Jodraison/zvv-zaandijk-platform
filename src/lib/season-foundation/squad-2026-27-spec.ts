/**
 * Phase 2 — Season Foundation (Stap 3): selectie 2026/27.
 * Bron: 2025/26-lidmaatschappen (datagedreven clone) + handmatige mutaties hieronder.
 */

/** Canoniek 2025/26-seizoen (`seed:club`). */
export const SEASON_2025_26_ID = "c0ffee00-0001-4000-8000-000000000001";

/** Canoniek 2026/27-seizoen (`season:foundation`). */
export const SEASON_2026_27_ID = "c0ffee00-0002-4000-8000-000000000001";

/** Exacte volledige namen die niet meegaan naar 2026/27 (geen membership = archief in UI). */
export const DEPARTING_PLAYER_NAMES_EXACT = ["Yente Oud"] as const;

/** Naamfragmenten voor vertrekkende speelsters (case-insensitive substring). */
export const DEPARTING_PLAYER_NAME_FRAGMENTS = ["Isabel"] as const;

export type NewPlayerConcept = {
  id: string;
  full_name: string;
  role_label?: string | null;
  card_note?: string | null;
  /** Alleen membership als alle verplichte seizoensvelden bekend zijn. */
  membership?: {
    position: "GK" | "DEF" | "MID" | "ATT";
    display_position: string;
    shirt_number: number;
  } | null;
};

/** Nieuwe speelsters — geen verzonnen rugnummers of posities. */
export const NEW_PLAYERS_2026_27: NewPlayerConcept[] = [
  {
    id: "f1000002-0000-4000-8000-000000000001",
    full_name: "Evy",
    role_label: "Keeper",
    card_note: "Rugnummer seizoen 2026/27: nog te bepalen. Lidmaatschap volgt na bevestiging rugnummer.",
    membership: null,
  },
  {
    id: "f1000002-0000-4000-8000-000000000002",
    full_name: "Naomi",
    card_note: "Positie en rugnummer seizoen 2026/27: nog te bepalen. Lidmaatschap volgt na bevestiging.",
    membership: null,
  },
];

/** Openstaande gegevens na Stap 3 (voor rapportage). */
export const SQUAD_2026_27_DATA_GAPS = [
  "Evy: achternaam niet vastgelegd; rugnummer 2026/27 ontbreekt → nog geen player_season_membership.",
  "Naomi: achternaam niet vastgelegd; positie en rugnummer 2026/27 ontbreken → nog geen player_season_membership.",
  "Aanvoerder / assistent 2026/27: niet toegewezen in dit script (is_captain / is_vice_captain = false).",
] as const;

export function isDepartingPlayerName(fullName: string): boolean {
  const trimmed = fullName.trim();
  if (!trimmed) return false;
  if ((DEPARTING_PLAYER_NAMES_EXACT as readonly string[]).includes(trimmed)) return true;
  const lower = trimmed.toLowerCase();
  return DEPARTING_PLAYER_NAME_FRAGMENTS.some((frag) => lower.includes(frag.toLowerCase()));
}
