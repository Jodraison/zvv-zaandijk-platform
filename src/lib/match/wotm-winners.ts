/**
 * Canonical Player of the Match (MVP / WOTM) — 0..n winnaars per wedstrijd.
 * Elke winnaar-relatie telt als één volledige award. Geen halve punten.
 */
import type { ClubDatabase, Match, MatchWotmWinner } from "@/types";

export function wotmIdsFromAdminPayload(data: {
  wotm_player_ids?: readonly (string | null | undefined)[];
  wotm_player_id?: string | null;
}): string[] {
  return uniquePlayerIds([...(data.wotm_player_ids ?? []), data.wotm_player_id]);
}

export function uniquePlayerIds(ids: readonly (string | null | undefined)[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of ids) {
    const id = typeof raw === "string" ? raw.trim() : "";
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

/** Enige product-read voor POTM-winnaars van een wedstrijd. */
export function wotmPlayerIdsOf(match: Pick<Match, "wotm_player_id" | "wotm_player_ids">): string[] {
  const fromArray = uniquePlayerIds(match.wotm_player_ids ?? []);
  if (fromArray.length > 0) return fromArray;
  return uniquePlayerIds([match.wotm_player_id]);
}

export function matchHasWotm(match: Pick<Match, "wotm_player_id" | "wotm_player_ids">, playerId: string): boolean {
  return wotmPlayerIdsOf(match).includes(playerId);
}

export function primaryWotmPlayerId(match: Pick<Match, "wotm_player_id" | "wotm_player_ids">): string | null {
  return wotmPlayerIdsOf(match)[0] ?? null;
}

export function applyWotmPlayerIds<T extends Pick<Match, "wotm_player_id" | "wotm_player_ids">>(
  match: T,
  ids: readonly (string | null | undefined)[],
): T {
  const next = uniquePlayerIds(ids);
  match.wotm_player_ids = next;
  match.wotm_player_id = next[0] ?? null;
  return match;
}

export function wotmWinnersOf(db: Pick<ClubDatabase, "match_wotm_winners"> | null | undefined): MatchWotmWinner[] {
  return db?.match_wotm_winners ?? [];
}

export function wotmPlayerIdsForMatch(
  db: Pick<ClubDatabase, "match_wotm_winners">,
  match: Pick<Match, "id" | "wotm_player_id" | "wotm_player_ids">,
): string[] {
  const fromTable = uniquePlayerIds(
    wotmWinnersOf(db)
      .filter((row) => row.match_id === match.id)
      .map((row) => row.player_id),
  );
  if (fromTable.length > 0) return fromTable;
  return wotmPlayerIdsOf(match);
}

export function replaceMatchWotmWinners(
  db: ClubDatabase,
  matchId: string,
  playerIds: readonly (string | null | undefined)[],
): string[] {
  const ids = uniquePlayerIds(playerIds);
  db.match_wotm_winners = wotmWinnersOf(db).filter((row) => row.match_id !== matchId);
  for (const player_id of ids) {
    db.match_wotm_winners.push({ match_id: matchId, player_id });
  }
  const match = db.matches.find((m) => m.id === matchId);
  if (match) applyWotmPlayerIds(match, ids);
  return ids;
}

export function formatWotmNamesNl(names: readonly string[]): string {
  const clean = names.map((n) => n.trim()).filter(Boolean);
  if (clean.length === 0) return "";
  if (clean.length === 1) return clean[0]!;
  if (clean.length === 2) return `${clean[0]} & ${clean[1]}`;
  return `${clean.slice(0, -1).join(", ")} en ${clean[clean.length - 1]}`;
}

export function wotmHeadingNl(count: number): string {
  return count > 1 ? "Speelsters van de wedstrijd" : "Speelster van de wedstrijd";
}

export function hydrateMatchWotmFromTable(db: ClubDatabase): void {
  const grouped = new Map<string, string[]>();
  for (const row of wotmWinnersOf(db)) {
    const list = grouped.get(row.match_id) ?? [];
    if (!list.includes(row.player_id)) list.push(row.player_id);
    grouped.set(row.match_id, list);
  }
  for (const match of db.matches) {
    const fromTable = grouped.get(match.id) ?? [];
    applyWotmPlayerIds(match, fromTable.length > 0 ? fromTable : wotmPlayerIdsOf(match));
  }
  const rebuilt: MatchWotmWinner[] = [];
  for (const match of db.matches) {
    for (const player_id of wotmPlayerIdsOf(match)) {
      rebuilt.push({ match_id: match.id, player_id });
    }
  }
  db.match_wotm_winners = rebuilt;
}
