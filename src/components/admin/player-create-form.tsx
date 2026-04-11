"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { refreshAfterAdminSave } from "@/lib/admin-refresh";
import { createPlayerFormAction } from "@/actions/players";
import { initialAdminFormState, fieldMessage } from "@/lib/forms/admin-action-state";
import { AdminFormBanner } from "@/components/admin/admin-form-message";

const inputCls =
  "min-h-[44px] w-full rounded-xl border border-zvv-border bg-white px-4 py-2.5 text-sm text-zvv-ink outline-none focus:border-zvv-primary/50 focus:ring-2 focus:ring-zvv-primary/15";

export function PlayerCreateForm({ seasonId }: { seasonId: string }) {
  const router = useRouter();
  const [formKey, setFormKey] = useState(0);
  const [state, formAction, pending] = useActionState(createPlayerFormAction, initialAdminFormState);

  useEffect(() => {
    if (state.status === "success") {
      setFormKey((k) => k + 1);
      refreshAfterAdminSave(router);
    }
  }, [state, router]);

  const fe = state.status === "error" ? state.fieldErrors : undefined;

  return (
    <form key={formKey} action={formAction} className="grid gap-4 md:grid-cols-2">
      <input type="hidden" name="season_id" value={seasonId} />
      {state.status !== "idle" ? (
        <div className="md:col-span-2">
          <AdminFormBanner state={state} />
        </div>
      ) : null}
      <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-zvv-muted md:col-span-2">
        Volledige naam
        <input name="full_name" required className={inputCls} />
        {fieldMessage(fe, "full_name") ? (
          <span className="block text-xs font-normal text-red-300">{fieldMessage(fe, "full_name")}</span>
        ) : null}
      </label>
      <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-zvv-muted">
        Rugnummer
        <input name="shirt_number" type="number" min={1} max={99} required className={inputCls} />
        {fieldMessage(fe, "shirt_number") ? (
          <span className="block text-xs font-normal text-red-300">{fieldMessage(fe, "shirt_number")}</span>
        ) : null}
      </label>
      <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-zvv-muted">
        Linie (enum)
        <select name="position" className={inputCls}>
          <option value="GK">GK — keeper</option>
          <option value="DEF">DEF — verdediging</option>
          <option value="MID">MID — middenveld</option>
          <option value="ATT">ATT — aanval</option>
        </select>
        {fieldMessage(fe, "position") ? (
          <span className="block text-xs font-normal text-red-300">{fieldMessage(fe, "position")}</span>
        ) : null}
      </label>
      <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-zvv-muted md:col-span-2">
        Positie (tekst op site)
        <textarea
          name="display_position"
          required
          rows={2}
          className={`${inputCls} min-h-[4.5rem] resize-y py-3`}
          placeholder="Bijv. Centrale verdediger"
        />
        {fieldMessage(fe, "display_position") ? (
          <span className="block text-xs font-normal text-red-300">{fieldMessage(fe, "display_position")}</span>
        ) : null}
      </label>
      <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-zvv-muted md:col-span-2">
        Foto-URL (optioneel)
        <input name="photo_url" type="url" className={inputCls} placeholder="https://…" />
        {fieldMessage(fe, "photo_url") ? (
          <span className="block text-xs font-normal text-red-300">{fieldMessage(fe, "photo_url")}</span>
        ) : null}
      </label>
      <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-zvv-muted">
        Initialen
        <input name="initials" className={inputCls} maxLength={8} />
      </label>
      <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-zvv-muted">
        Voorkeursvoet
        <input name="preferred_foot" className={inputCls} placeholder="Links / Rechts / Tweebenig" />
      </label>
      <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-zvv-muted">
        Rol label
        <input name="role_label" className={inputCls} placeholder="Bijv. Box-to-box" />
      </label>
      <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-zvv-muted">
        Tagline
        <input name="tagline" className={inputCls} placeholder="Korte spelers-tagline" />
      </label>
      <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-zvv-muted md:col-span-2">
        Sterktes
        <input name="strengths" className={inputCls} placeholder="Bijv. Diepte, pressing, passing" />
      </label>
      <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-zvv-muted md:col-span-2">
        Korte bio
        <textarea name="bio" rows={2} className={`${inputCls} min-h-[4.5rem] resize-y py-3`} />
      </label>
      <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-zvv-muted md:col-span-2">
        Card note
        <input name="card_note" className={inputCls} />
      </label>
      <div className="flex flex-col gap-3 md:col-span-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-zvv-muted">Gasten voeg je toe via Beheer → Wedstrijd (gespeeld).</p>
        <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-zvv-border bg-zvv-card-mid px-4 py-2">
          <input type="checkbox" name="is_captain" className="h-4 w-4 rounded border-zvv-border text-zvv-primary" />
          <span className="text-sm text-zvv-ink">Captain (C)</span>
        </label>
        <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-zvv-border bg-zvv-card-mid px-4 py-2">
          <input type="checkbox" name="is_vice_captain" className="h-4 w-4 rounded border-zvv-border text-zvv-primary" />
          <span className="text-sm text-zvv-ink">Vice-captain (VC)</span>
        </label>
      </div>
      <div className="md:col-span-2">
        <button type="submit" disabled={pending} className="club-btn-primary disabled:opacity-40">
          {pending ? "Bezig…" : "Toevoegen aan seizoen"}
        </button>
      </div>
    </form>
  );
}
