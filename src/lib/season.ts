import type { ClubDatabase } from "@/types";
import { defaultSeasonId } from "@/lib/data/repository";

export function resolveSeasonId(db: ClubDatabase, cookieSeason: string | undefined): string {
  if (cookieSeason && db.seasons.some((s) => s.id === cookieSeason)) return cookieSeason;
  return defaultSeasonId(db);
}
