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

/**
 * When an explicit season preference should be persisted to the cookie.
 * Used by selection Server Actions only — never during Server Component render.
 * (Missing/invalid cookie → render with active-season fallback; write on user select.)
 */
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
