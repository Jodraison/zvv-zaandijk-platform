"use server";

import { mutateDb } from "@/lib/data/mutate";
import { assertAdminServerAction } from "@/lib/auth/require-admin";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { TEAM_PHOTO_BUCKET, TEAM_PHOTO_OBJECT_PATH } from "@/constants/storage";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export type TeamPhotoUploadState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; message: string };

/**
 * Admin-only: validates image, uploads to Storage (`team` / `team-photo.jpg`, upsert),
 * saves public URL (+ cache-bust query) on `club_profile.team_photo_url`, revalidates app data.
 */
export async function uploadTeamPhoto(_prev: TeamPhotoUploadState, formData: FormData): Promise<TeamPhotoUploadState> {
  await assertAdminServerAction();

  const file = formData.get("team_photo");
  if (!(file instanceof File)) {
    return { status: "error", message: "Geen bestand gekozen." };
  }
  if (file.size === 0) {
    return { status: "error", message: "Het bestand is leeg." };
  }
  if (file.size > MAX_BYTES) {
    return { status: "error", message: "Bestand te groot (max. 5 MB)." };
  }

  const mime = file.type.toLowerCase();
  if (!mime || !ALLOWED_TYPES.has(mime)) {
    return { status: "error", message: "Alleen JPEG, PNG, WebP of GIF is toegestaan." };
  }

  const service = createSupabaseServiceClient();

  let buffer: Buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch {
    return { status: "error", message: "Bestand kon niet worden gelezen." };
  }

  const { error: uploadError } = await service.storage.from(TEAM_PHOTO_BUCKET).upload(TEAM_PHOTO_OBJECT_PATH, buffer, {
    contentType: mime,
    upsert: true,
  });

  if (uploadError) {
    const hint =
      /bucket|not found|404/i.test(uploadError.message)
        ? " Controleer of migratie 004 (storage bucket `team`) in Supabase is uitgevoerd."
        : "";
    return { status: "error", message: `Opslag mislukt: ${uploadError.message}.${hint}` };
  }

  const {
    data: { publicUrl },
  } = service.storage.from(TEAM_PHOTO_BUCKET).getPublicUrl(TEAM_PHOTO_OBJECT_PATH);
  const urlWithV = `${publicUrl}?v=${Date.now()}`;

  try {
    await mutateDb(
      (db) => {
        db.team_photo_url = urlWithV;
      },
      { action: "club_team_photo_upload", entity: "club_profile", entity_id: "default" },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Database bijwerken mislukt.";
    return { status: "error", message: msg };
  }

  return { status: "success", message: "Teamfoto geüpload. De homepage is bijgewerkt." };
}
