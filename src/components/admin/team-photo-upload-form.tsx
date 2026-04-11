"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { refreshAfterAdminSave } from "@/lib/admin-refresh";
import { uploadTeamPhoto, type TeamPhotoUploadState } from "@/actions/club-settings";
import { isSafePlayerImageUrl } from "@/lib/media/safe-player-image-url";

const initial: TeamPhotoUploadState = { status: "idle" };

export function TeamPhotoUploadForm({ currentUrl }: { currentUrl: string | null }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(uploadTeamPhoto, initial);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  useEffect(() => {
    if (state.status !== "success") return;
    setPreview((p) => {
      if (p) URL.revokeObjectURL(p);
      return null;
    });
    if (inputRef.current) inputRef.current.value = "";
    refreshAfterAdminSave(router);
  }, [state.status, router]);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return f ? URL.createObjectURL(f) : null;
    });
  }

  const rawCurrent = currentUrl?.trim() || null;
  const safeCurrent = rawCurrent && isSafePlayerImageUrl(rawCurrent) ? rawCurrent : null;
  const showPreview = preview;
  const showCurrent = Boolean(safeCurrent) && !showPreview;
  const showInvalidStoredUrl = Boolean(rawCurrent) && !safeCurrent && !showPreview;

  return (
    <form action={formAction} className="space-y-5">
      <p className="text-sm text-zvv-muted">
        JPEG, PNG, WebP of GIF · max. 5 MB · wordt opgeslagen als openbare teamfoto (één bestand, vorige versie wordt
        overschreven).
      </p>

      {(showCurrent || showPreview || showInvalidStoredUrl) && (
        <div className="relative aspect-video w-full max-w-xl overflow-hidden rounded-xl border border-zvv-border bg-zvv-card-mid shadow-sm">
          {showPreview ? (
            <img src={preview!} alt="Voorbeeld" className="h-full w-full object-cover object-center" />
          ) : showCurrent ? (
            <Image
              key={safeCurrent!}
              src={safeCurrent!}
              alt="Huidige teamfoto"
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 640px"
              unoptimized={safeCurrent!.includes("?") || safeCurrent!.startsWith("/")}
            />
          ) : (
            <div className="flex min-h-[12rem] w-full flex-col items-center justify-center gap-2 bg-zvv-card-mid px-4 text-center">
              <span className="text-sm font-semibold text-amber-800">Ongeldige teamfoto-URL opgeslagen</span>
              <span className="text-xs text-zvv-muted">Upload een nieuwe foto om te herstellen</span>
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-zvv-ink/50 to-transparent px-3 py-2">
            <p className="text-xs font-medium text-white">
              {showPreview ? "Voorbeeld — nog niet opgeslagen" : "Huidige publieke foto"}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <label className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-zvv-border bg-white px-4 py-2.5 text-sm font-semibold text-zvv-ink transition hover:border-zvv-primary/40 hover:bg-zvv-primary-muted/30">
          <span>Kies afbeelding…</span>
          <input
            ref={inputRef}
            type="file"
            name="team_photo"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={onFileChange}
            disabled={pending}
          />
        </label>
        <button type="submit" disabled={pending} className="club-btn-primary min-h-[44px] disabled:opacity-50">
          {pending ? "Bezig met uploaden…" : "Uploaden en opslaan"}
        </button>
      </div>

      {state.status === "error" ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {state.message}
        </p>
      ) : null}
      {state.status === "success" ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900" role="status">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
