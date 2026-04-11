/** Supabase Storage bucket for the official team photo (single canonical object). */
export const TEAM_PHOTO_BUCKET = "team";
/** Object key inside the bucket; overwritten on each upload. */
export const TEAM_PHOTO_OBJECT_PATH = "team-photo.jpg";

/**
 * Bucket for player profile photos. Uses the same `team` bucket under a `players/` prefix
 * so no additional bucket migration is required.
 */
export const PLAYER_PHOTO_BUCKET = "team";
/** Storage path for a player photo — one file per player, upserted on each upload. */
export function playerPhotoObjectPath(playerId: string, ext: string): string {
  return `players/${playerId}.${ext}`;
}
