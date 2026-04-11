"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { refreshAfterAdminSave } from "@/lib/admin-refresh";
import { uploadPlayerPhoto, deletePlayerPhoto } from "@/actions/player";
import { isNextImageRemoteSrc, isValidImageUrl } from "@/components/media/photo-with-fallback";

export function PlayerPhotoUploadForm({
  playerId,
  currentUrl,
  onUploadSuccess,
  onPhotoCleared,
}: {
  playerId: string;
  currentUrl: string | null;
  onUploadSuccess?: (url: string) => void;
  onPhotoCleared?: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUploadError(null);
    setUploadSuccess(null);
    const f = e.target.files?.[0] ?? null;
    setSelectedFile(f);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return f ? URL.createObjectURL(f) : null;
    });
  }

  async function handleUpload() {
    if (!selectedFile) {
      setUploadError("Geen bestand gekozen.");
      return;
    }
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const fd = new FormData();
    fd.set("player_id", playerId);
    fd.set("player_photo", selectedFile);

    try {
      const result = await uploadPlayerPhoto(fd);
      if (!result.ok) {
        setUploadError(result.error);
        return;
      }

      setUploadSuccess("Foto geüpload en opgeslagen.");
      setSelectedFile(null);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      if (inputRef.current) inputRef.current.value = "";
      onUploadSuccess?.(result.url);
      refreshAfterAdminSave(router);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload mislukt.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    setDeleteSuccess(null);

    const fd = new FormData();
    fd.set("player_id", playerId);

    try {
      const result = await deletePlayerPhoto(fd);
      if (!result.ok) {
        setDeleteError(result.error);
        return;
      }
      setDeleteSuccess("Profielfoto verwijderd.");
      onPhotoCleared?.();
      refreshAfterAdminSave(router);
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Verwijderen mislukt.");
    } finally {
      setDeleting(false);
    }
  }

  const remoteRaw = currentUrl?.trim() || null;
  const safeRemote = remoteRaw && isValidImageUrl(remoteRaw) ? remoteRaw : null;
  const showBlobPreview = Boolean(previewUrl);
  const showRemote = Boolean(safeRemote) && !showBlobPreview;
  const showInvalidStoredUrl = Boolean(remoteRaw) && !safeRemote && !showBlobPreview;
  const canDelete = Boolean(remoteRaw) && !uploading && !deleting;

  return (
    <div className="space-y-3">
      {(showRemote || showBlobPreview || showInvalidStoredUrl) && (
        <div className="relative h-28 w-28 overflow-hidden rounded-xl border border-zvv-border bg-zvv-card-mid shadow-sm">
          {showBlobPreview ? (
            <img src={previewUrl!} alt="Voorbeeld" className="h-full w-full object-cover object-top" />
          ) : showRemote ? (
            isNextImageRemoteSrc(safeRemote!) ? (
              <Image
                key={safeRemote!}
                src={safeRemote!}
                alt="Huidige foto"
                fill
                className="object-cover object-top"
                sizes="112px"
                unoptimized={safeRemote!.includes("?") || safeRemote!.startsWith("/")}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={safeRemote!} alt="Huidige foto" className="h-full w-full object-cover object-top" />
            )
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-zvv-card-mid px-2 text-center">
              <span className="text-[9px] font-semibold leading-tight text-amber-800">Ongeldige foto-URL</span>
              <span className="text-[8px] leading-tight text-zvv-muted">Verwijder of upload opnieuw</span>
            </div>
          )}
          {showBlobPreview && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-zvv-ink/50 to-transparent px-2 py-1">
              <p className="text-[9px] font-medium text-white">Voorbeeld</p>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex min-h-[36px] cursor-pointer items-center justify-center rounded-lg border border-dashed border-zvv-border bg-white px-3 py-1.5 text-xs font-semibold text-zvv-ink transition hover:border-zvv-primary/40 hover:bg-zvv-primary-muted/30">
          <span>Kies foto…</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={onFileChange}
            disabled={uploading}
          />
        </label>
        <button
          type="button"
          disabled={uploading || !selectedFile}
          onClick={() => void handleUpload()}
          className="min-h-[36px] rounded-lg bg-zvv-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zvv-primary-hover disabled:opacity-40"
        >
          {uploading ? "Uploaden…" : "Upload"}
        </button>
      </div>

      <p className="text-[10px] text-zvv-muted">JPEG, PNG, WebP of GIF · max. 5 MB</p>

      {uploadError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800" role="alert">
          {uploadError}
        </p>
      ) : null}
      {uploadSuccess ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900" role="status">
          {uploadSuccess}
        </p>
      ) : null}

      {canDelete ? (
        <div className="pt-1">
          <button
            type="button"
            disabled={deleting}
            onClick={() => void handleDelete()}
            className="min-h-[36px] rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-800 transition hover:bg-red-50 disabled:opacity-40"
          >
            {deleting ? "Verwijderen…" : "Verwijder foto"}
          </button>
        </div>
      ) : null}

      {deleteError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800" role="alert">
          {deleteError}
        </p>
      ) : null}
      {deleteSuccess ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900" role="status">
          {deleteSuccess}
        </p>
      ) : null}
    </div>
  );
}
