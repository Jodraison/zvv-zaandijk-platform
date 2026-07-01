import type { ClubDatabase } from "@/types";
import { defaultSeasonId } from "@/lib/data/repository";

/**
 * Bepaalt het te tonen seizoen.
 * Volgorde: geldige `?season=` URL → cookie (alleen actief) → actief DB-seizoen.
 */
export function resolveSeasonId(
  db: ClubDatabase,
  cookieSeason: string | undefined,
  urlSeason?: string | null,
): string {
  const activeId = defaultSeasonId(db);
  const url = urlSeason?.trim();
  if (url && db.seasons.some((s) => s.id === url)) return url;

  if (!cookieSeason) return activeId;

  const season = db.seasons.find((s) => s.id === cookieSeason);
  if (!season) return activeId;

  if (!season.is_active) return activeId;

  return cookieSeason;
}

/** Cookie bijwerken wanneer ontbreekt, ongeldig, of naar een gearchiveerd seizoen wijst. */
export function shouldWriteSeasonCookie(
  cookieSeason: string | undefined,
  resolvedSeasonId: string,
  urlSeason?: string | null,
): boolean {
  if (urlSeason?.trim()) return false;
  if (!cookieSeason) return true;
  if (cookieSeason !== resolvedSeasonId) return true;
  return false;
}
