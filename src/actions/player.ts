"use server";

import { readDb } from "@/lib/data/repository";
import { mutateDb } from "@/lib/data/mutate";
import { assertAdminServerAction } from "@/lib/auth/require-admin";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { PLAYER_PHOTO_BUCKET, playerPhotoObjectPath } from "@/constants/storage";

const PLAYER_PHOTO_EXTS = ["jpg", "png", "webp", "gif"] as const;

function storageObjectPathsForPlayerPhoto(playerId: string, photoUrl: string | null | undefined): string[] {
  const paths = new Set<string>();
  for (const ext of PLAYER_PHOTO_EXTS) {
    paths.add(playerPhotoObjectPath(playerId, ext));
  }
  if (photoUrl) {
    try {
      const base = photoUrl.split("?")[0] ?? "";
      const u = new URL(base);
      const marker = "/object/public/team/";
      const i = u.pathname.indexOf(marker);
      if (i !== -1) {
        const p = decodeURIComponent(u.pathname.slice(i + marker.length));
        if (p.startsWith("players/")) paths.add(p);
      }
    } catch {
      /* ignore malformed URL */
    }
  }
  return [...paths];
}

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export type UploadPlayerPhotoResult = { ok: true; url: string } | { ok: false; error: string };
export type DeletePlayerPhotoResult = { ok: true } | { ok: false; error: string };

export async function uploadPlayerPhoto(formData: FormData): Promise<UploadPlayerPhotoResult> {
  await assertAdminServerAction();

  const playerId = String(formData.get("player_id") ?? "").trim();
  if (!playerId) {
    return { ok: false, error: "Geen speler-ID opgegeven." };
  }

  const file = formData.get("player_photo");
  if (!(file instanceof File)) {
    return { ok: false, error: "Geen bestand gekozen." };
  }
  if (file.size === 0) {
    return { ok: false, error: "Het bestand is leeg." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Bestand te groot (max. 5 MB)." };
  }

  const mime = file.type.toLowerCase();
  if (!mime.startsWith("image/")) {
    return { ok: false, error: "Alleen afbeeldingen zijn toegestaan." };
  }
  if (!ALLOWED_TYPES.has(mime)) {
    return { ok: false, error: "Alleen JPEG, PNG, WebP of GIF is toegestaan." };
  }

  const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : mime === "image/gif" ? "gif" : "jpg";
  const objectPath = playerPhotoObjectPath(playerId, ext);

  const service = createSupabaseServiceClient();

  let buffer: Buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch {
    return { ok: false, error: "Bestand kon niet worden gelezen." };
  }

  const { error: uploadError } = await service.storage.from(PLAYER_PHOTO_BUCKET).upload(objectPath, buffer, {
    contentType: mime,
    upsert: true,
  });

  if (uploadError) {
    const hint =
      /bucket|not found|404/i.test(uploadError.message)
        ? " Controleer of de `team` bucket in Supabase Storage bestaat (migratie 004)."
        : "";
    return { ok: false, error: `Opslag mislukt: ${uploadError.message}.${hint}` };
  }

  const {
    data: { publicUrl },
  } = service.storage.from(PLAYER_PHOTO_BUCKET).getPublicUrl(objectPath);
  const urlWithV = `${publicUrl}?v=${Date.now()}`;

  try {
    await mutateDb(
      (db) => {
        const pl = db.players.find((p) => p.id === playerId);
        if (!pl) throw new Error("Speelster niet gevonden.");
        pl.photo_url = urlWithV;
      },
      { action: "player_photo_upload", entity: "player", entity_id: playerId },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Database bijwerken mislukt.";
    return { ok: false, error: msg };
  }

  return { ok: true, url: urlWithV };
}

export async function deletePlayerPhoto(formData: FormData): Promise<DeletePlayerPhotoResult> {
  await assertAdminServerAction();

  const playerId = String(formData.get("player_id") ?? "").trim();
  if (!playerId) {
    return { ok: false, error: "Geen speler-ID opgegeven." };
  }

  const db = await readDb();
  const pl = db.players.find((p) => p.id === playerId);
  if (!pl) {
    return { ok: false, error: "Speelster niet gevonden." };
  }

  const service = createSupabaseServiceClient();
  const paths = storageObjectPathsForPlayerPhoto(playerId, pl.photo_url);
  if (paths.length > 0) {
    const { error } = await service.storage.from(PLAYER_PHOTO_BUCKET).remove(paths);
    if (error) {
      console.warn("deletePlayerPhoto storage remove:", error.message);
    }
  }

  try {
    await mutateDb(
      (draft) => {
        const p = draft.players.find((x) => x.id === playerId);
        if (!p) throw new Error("Speelster niet gevonden.");
        p.photo_url = null;
      },
      { action: "player_photo_delete", entity: "player", entity_id: playerId },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Database bijwerken mislukt.";
    return { ok: false, error: msg };
  }

  return { ok: true };
}
