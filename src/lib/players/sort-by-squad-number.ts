/**
 * Centrale sortering voor trainers-UI: rugnummer eerst, dan naam, gasten na vaste selectie.
 */

export type SquadSortable = {
  player_id?: string;
  id?: string;
  shirt_number?: number | null;
  match_shirt_number?: number | null;
  name?: string;
  full_name?: string;
  fullName?: string;
  is_guest?: boolean;
  isGuest?: boolean;
};

function shirtOf(p: SquadSortable): number | null {
  const n = p.shirt_number ?? p.match_shirt_number;
  if (n == null || !Number.isFinite(Number(n))) return null;
  return Number(n);
}

function nameOf(p: SquadSortable): string {
  return (p.name ?? p.full_name ?? p.fullName ?? "").trim();
}

function isGuestOf(p: SquadSortable): boolean {
  return !!(p.is_guest ?? p.isGuest);
}

/**
 * 1. Vaste selectie met rugnummer (numeriek: #9 vóór #10)
 * 2. Vaste selectie zonder rugnummer (alfabetisch)
 * 3. Match-gasten met rugnummer
 * 4. Match-gasten zonder rugnummer
 */
export function sortPlayersBySquadNumber<T extends SquadSortable>(players: readonly T[]): T[] {
  return [...players].sort((a, b) => {
    const ga = isGuestOf(a) ? 1 : 0;
    const gb = isGuestOf(b) ? 1 : 0;
    if (ga !== gb) return ga - gb;

    const sa = shirtOf(a);
    const sb = shirtOf(b);
    const aHas = sa != null;
    const bHas = sb != null;
    if (aHas && bHas && sa !== sb) return sa! - sb!;
    if (aHas !== bHas) return aHas ? -1 : 1;
    return nameOf(a).localeCompare(nameOf(b), "nl");
  });
}

export function formatPlayerOptionLabel(p: SquadSortable): string {
  const shirt = shirtOf(p);
  const name = nameOf(p) || "—";
  return shirt != null ? `#${shirt} ${name}` : name;
}
