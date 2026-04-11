import type { PlayerPosition } from "@/types";

const ENUM_SHORT: Record<PlayerPosition, string> = {
  GK: "Keeper",
  DEF: "Verdediging",
  MID: "Middenveld",
  ATT: "Aanval",
};

/** Toon `display_position` als die gezet is; anders korte enum-label. */
export function membershipPositionLabel(displayPosition: string | null | undefined, enumPosition: PlayerPosition): string {
  const t = displayPosition?.trim();
  if (t) return t;
  return ENUM_SHORT[enumPosition];
}

export function membershipPositionShort(enumPosition: PlayerPosition): string {
  return ENUM_SHORT[enumPosition];
}
