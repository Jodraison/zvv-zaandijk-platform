/**
 * Bindende actuele posities seizoen 2026/27.
 * display_position = voetbalcode; position = linie GK|DEF|MID|ATT.
 */
import type { PlayerPosition } from "@/types";
import { SEASON_2026_27_ID } from "@/lib/season/season-operations-2026-27";

export type SquadPositionBinding = {
  full_name: string;
  display_position: string;
  line: PlayerPosition;
};

function lineFromCode(code: string): PlayerPosition {
  const c = code.toUpperCase();
  if (c === "GK") return "GK";
  if (["CB", "LB", "RB", "LWB", "RWB"].includes(c)) return "DEF";
  if (["SP", "ST", "CF", "LW", "RW"].some((x) => c === x || c.startsWith(`${x}-`) || c.endsWith(`-${x}`))) {
    // LM-SP → ATT; pure wing mid codes stay MID unless SP is primary
    if (c.includes("SP") || c === "ST" || c === "CF") return "ATT";
  }
  if (["CVM", "CDM", "CAM", "CM", "RM", "LM", "AM"].some((x) => c === x || c.includes(x))) return "MID";
  if (c.includes("SP")) return "ATT";
  return "MID";
}

const RAW: { full_name: string; display_position: string }[] = [
  { full_name: "Jelisa De Jonge", display_position: "GK" },
  { full_name: "Mandy Kalmeijer", display_position: "CVM" },
  { full_name: "Naomi Lattig", display_position: "CB" },
  { full_name: "Tess Luijting", display_position: "CB" },
  { full_name: "Marisha Prins", display_position: "LB" },
  { full_name: "Isa Oosterhoorn", display_position: "RM" },
  { full_name: "Danique van Heeringen", display_position: "LM" },
  { full_name: "Renée Koopman", display_position: "RM" },
  { full_name: "Melissa Rietveld", display_position: "CAM" },
  { full_name: "Dionne van Dijk", display_position: "CVM" },
  { full_name: "Nienke Hoffman", display_position: "SP" },
  { full_name: "Andrada Timmer", display_position: "LM-RM" },
  { full_name: "Maura Hoffman", display_position: "LB" },
  { full_name: "Melissa Donkers", display_position: "RB" },
  { full_name: "Evy Nibbering", display_position: "GK" },
  { full_name: "Mariska Oosterhuis", display_position: "CB" },
  { full_name: "Lorelai Bakker", display_position: "RB" },
  { full_name: "Anouk Aafjes", display_position: "CB" },
  { full_name: "Emma de Mie", display_position: "LM-SP" },
  { full_name: "Demi Luijting", display_position: "LM" },
];

export const SEASON_2026_27_SQUAD_POSITIONS: readonly SquadPositionBinding[] = RAW.map((r) => ({
  ...r,
  line: lineFromCode(r.display_position),
}));

export { SEASON_2026_27_ID };

export function normalizeNameKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function bindingByName(fullName: string): SquadPositionBinding | null {
  const key = normalizeNameKey(fullName);
  return SEASON_2026_27_SQUAD_POSITIONS.find((b) => normalizeNameKey(b.full_name) === key) ?? null;
}

/** Human-readable label for display codes (optional polish). */
export function formatSquadPositionLabel(code: string): string {
  const map: Record<string, string> = {
    GK: "GK",
    CVM: "CVM",
    CB: "CB",
    LB: "LB",
    RB: "RB",
    RM: "RM",
    LM: "LM",
    CAM: "CAM",
    SP: "SP",
    "LM-RM": "LM-RM",
    "LM-SP": "LM-SP",
  };
  return map[code] ?? code;
}
