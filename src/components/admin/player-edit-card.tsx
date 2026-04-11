"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { refreshAfterAdminSave } from "@/lib/admin-refresh";
import { updatePlayerFormAction } from "@/actions/players";
import { DeletePlayerButton } from "@/components/admin/delete-player-button";
import { initialAdminFormState, fieldMessage } from "@/lib/forms/admin-action-state";
import { AdminFormBanner } from "@/components/admin/admin-form-message";
import { PlayerPhotoUploadForm } from "@/components/admin/player-photo-upload-form";

const inputCls =
  "min-h-[44px] w-full rounded-xl border border-zvv-border bg-white px-4 py-2.5 text-sm text-zvv-ink outline-none focus:border-zvv-primary/50 focus:ring-2 focus:ring-zvv-primary/15";

export function PlayerEditCard({
  seasonId,
  playerId,
  fullName,
  photoUrl,
  shirtNumber,
  position,
  displayPosition,
  isCaptain,
  isViceCaptain,
  initials,
  preferredFoot,
  roleLabel,
  tagline,
  strengths,
  bio,
  cardNote,
  isGuest = false,
}: {
  seasonId: string;
  playerId: string;
  fullName: string;
  photoUrl: string | null;
  shirtNumber: number;
  position: string;
  displayPosition: string;
  isCaptain: boolean;
  isViceCaptain: boolean;
  initials?: string | null;
  preferredFoot?: string | null;
  roleLabel?: string | null;
  tagline?: string | null;
  strengths?: string | null;
  bio?: string | null;
  cardNote?: string | null;
  isGuest?: boolean;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updatePlayerFormAction, initialAdminFormState);
  // Track current photo URL so an upload success immediately updates the hidden field,
  // preventing the main form from overwriting a freshly uploaded photo on save.
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(photoUrl);

  useEffect(() => {
    setCurrentPhotoUrl(photoUrl);
  }, [photoUrl]);

  useEffect(() => {
    if (state.status === "success") {
      refreshAfterAdminSave(router);
    }
  }, [state, router]);

  const fe = state.status === "error" ? state.fieldErrors : undefined;

  return (
    <div className="rounded-2xl border border-zvv-border bg-zvv-card-mid/60 p-5 md:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {isCaptain ? (
          <span className="rounded-full border border-amber-400/35 bg-amber-500/15 px-2.5 py-1 text-[10px] font-black tracking-wider text-amber-100">
            C
          </span>
        ) : null}
        {isViceCaptain ? (
          <span className="rounded-full border border-zvv-border bg-white px-2.5 py-1 text-[10px] font-black tracking-wider text-zvv-muted">
            VC
          </span>
        ) : null}
        {isGuest ? <span className="rounded-full border border-zvv-primary/30 bg-zvv-primary-muted px-2.5 py-1 text-[10px] font-black tracking-wider text-zvv-primary">GAST</span> : null}
        <Link
          href={`/beheer/disputes?season=${encodeURIComponent(seasonId)}&player=${encodeURIComponent(playerId)}`}
          className="rounded-full border border-zvv-border bg-white px-2.5 py-1 text-[10px] font-black tracking-wider text-zvv-muted hover:text-zvv-primary"
        >
          DISPUTE BREAKDOWN
        </Link>
      </div>
      {state.status !== "idle" ? (
        <div className="mb-4">
          <AdminFormBanner state={state} />
        </div>
      ) : null}
      <form action={formAction} className="grid gap-4 md:grid-cols-2 lg:grid-cols-[1fr_100px_120px_1fr_auto]">
        <input type="hidden" name="id" value={playerId} />
        <input type="hidden" name="season_id" value={seasonId} />
        <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-zvv-muted lg:col-span-1">
          Naam
          <input name="full_name" required defaultValue={fullName} className={inputCls} />
          {fieldMessage(fe, "full_name") ? (
            <span className="block text-xs font-normal text-red-300">{fieldMessage(fe, "full_name")}</span>
          ) : null}
        </label>
        <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-zvv-muted">
          Initialen
          <input name="initials" defaultValue={initials ?? ""} className={inputCls} />
        </label>
        <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-zvv-muted">
          Voorkeursvoet
          <input name="preferred_foot" defaultValue={preferredFoot ?? ""} className={inputCls} />
        </label>
        <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-zvv-muted">
          Rol label
          <input name="role_label" defaultValue={roleLabel ?? ""} className={inputCls} />
        </label>
        <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-zvv-muted md:col-span-2 lg:col-span-full">
          Tagline
          <input name="tagline" defaultValue={tagline ?? ""} className={inputCls} />
        </label>
        <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-zvv-muted md:col-span-2 lg:col-span-full">
          Sterktes
          <input name="strengths" defaultValue={strengths ?? ""} className={inputCls} />
        </label>
        <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-zvv-muted md:col-span-2 lg:col-span-full">
          Bio
          <textarea name="bio" rows={2} defaultValue={bio ?? ""} className={`${inputCls} min-h-[4.5rem] resize-y py-3`} />
        </label>
        <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-zvv-muted md:col-span-2 lg:col-span-full">
          Card note
          <input name="card_note" defaultValue={cardNote ?? ""} className={inputCls} />
        </label>
        <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-zvv-muted">
          #
          <input name="shirt_number" type="number" min={1} max={99} required defaultValue={shirtNumber} className={inputCls} />
          {fieldMessage(fe, "shirt_number") ? (
            <span className="block text-xs font-normal text-red-300">{fieldMessage(fe, "shirt_number")}</span>
          ) : null}
        </label>
        <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-zvv-muted">
          Linie (enum)
          <select name="position" defaultValue={position} className={inputCls}>
            <option value="GK">GK — keeper</option>
            <option value="DEF">DEF — verdediging</option>
            <option value="MID">MID — middenveld</option>
            <option value="ATT">ATT — aanval</option>
          </select>
          {fieldMessage(fe, "position") ? (
            <span className="block text-xs font-normal text-red-300">{fieldMessage(fe, "position")}</span>
          ) : null}
        </label>
        <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-zvv-muted md:col-span-2 lg:col-span-full">
          Positie (tekst op site)
          <textarea
            name="display_position"
            required
            rows={2}
            defaultValue={displayPosition}
            className={`${inputCls} min-h-[4.5rem] resize-y py-3`}
          />
          {fieldMessage(fe, "display_position") ? (
            <span className="block text-xs font-normal text-red-300">{fieldMessage(fe, "display_position")}</span>
          ) : null}
        </label>
        <div className="space-y-2 text-xs font-semibold uppercase tracking-wider text-zvv-muted lg:col-span-1">
          Profielfoto
          <div className="mt-2 font-normal normal-case tracking-normal">
            <PlayerPhotoUploadForm
              key={playerId}
              playerId={playerId}
              currentUrl={currentPhotoUrl}
              onUploadSuccess={(url) => setCurrentPhotoUrl(url)}
              onPhotoCleared={() => setCurrentPhotoUrl(null)}
            />
          </div>
          {/* Hidden field is immediately updated when upload succeeds via onUploadSuccess */}
          <input type="hidden" name="photo_url" value={currentPhotoUrl ?? ""} />
        </div>
        <div className="flex flex-col gap-2 lg:items-end">
          <button type="submit" disabled={pending} className="club-btn-secondary club-btn-primary-sm w-full lg:w-auto disabled:opacity-40">
            {pending ? "…" : "Opslaan"}
          </button>
          <DeletePlayerButton playerId={playerId} seasonId={seasonId} />
        </div>
        <div className="md:col-span-2 lg:col-span-full flex flex-col gap-2 border-t border-zvv-border pt-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zvv-muted">Aanvoering (één C en één VC per seizoen)</p>
          <label className="flex min-h-[44px] cursor-pointer items-center gap-3">
            <input type="checkbox" name="is_captain" defaultChecked={isCaptain} className="h-4 w-4 rounded border-zvv-border text-zvv-primary" />
            <span className="text-sm text-zvv-ink">Captain (C) — zet bij anderen uit</span>
          </label>
          <label className="flex min-h-[44px] cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              name="is_vice_captain"
              defaultChecked={isViceCaptain}
              className="h-4 w-4 rounded border-zvv-border text-zvv-primary"
            />
            <span className="text-sm text-zvv-ink">Vice-captain (VC) — zet bij anderen uit</span>
          </label>
        </div>
      </form>
    </div>
  );
}
